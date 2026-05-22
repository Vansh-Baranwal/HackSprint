"""
api.py — FastAPI Async Backend for the 3-Model Athlete Performance Engine
==========================================================================
Exposes prediction endpoints backed by three specialist engines.

Run locally:
    uvicorn api:app --reload --port 8000

Endpoints:
    POST /predict/injury-risk           -> AcuteInjuryRiskEngine
    POST /predict/cns-fatigue           -> CNSFatigueEngine
    POST /predict/metabolic             -> MetabolicRegulatorEngine
    POST /predict/all                   -> All three engines in parallel
    POST /predict/stream-csv            -> Chunked CSV streaming endpoint
                                           (stays under Render 512 MB RAM cap)
    GET  /health                        -> Service health check

Render / cloud deployment:
    Set environment variable WEARABLE_DATA_URL to a direct download link
    (e.g. a public Google Drive or Dropbox URL) to auto-fetch the CSV at
    container startup. The file is written to DATA_PATH on disk and never
    loaded fully into RAM — instead it is streamed in 10,000-row chunks.
"""

import asyncio
import json
import logging
import os
import urllib.request
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Dict, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from models import AcuteInjuryRiskEngine, CNSFatigueEngine, MetabolicRegulatorEngine
from weekly_wrapped import BodyWrappedEngine

logger = logging.getLogger("screensense")
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")


# ─── Render / Cloud Data Bootstrap ────────────────────────────────────────────
# Wearable CSV is too large to commit to Git and exceeds Render's ephemeral
# disk at cold-boot. At startup we pull it from a public URL (if provided)
# and cache it locally so chunked readers can stream it on-demand.

DATA_PATH = os.environ.get("WEARABLE_DATA_PATH", "data/wearable_data.csv")
CHUNK_SIZE = int(os.environ.get("CSV_CHUNK_SIZE", 10_000))   # rows per streaming batch


def _bootstrap_data_file() -> None:
    """
    Downloads the wearable CSV from WEARABLE_DATA_URL at container startup if:
        1. The file does not already exist on disk (cold start or ephemeral fs).
        2. The env var WEARABLE_DATA_URL is configured.

    On Render free-tier the container is recreated on every deploy, so this
    runs on every cold boot but is skipped on warm restarts.
    """
    url = os.environ.get("WEARABLE_DATA_URL", "")
    if not url:
        logger.info("WEARABLE_DATA_URL not set — skipping data bootstrap.")
        return

    if os.path.exists(DATA_PATH):
        logger.info("Data file already present at %s — skipping download.", DATA_PATH)
        return

    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    logger.info("Downloading synthetic dataset from remote URL...")
    try:
        urllib.request.urlretrieve(url, DATA_PATH)
        size_mb = os.path.getsize(DATA_PATH) / (1024 ** 2)
        logger.info("Download complete. File size: %.2f MB  Path: %s", size_mb, DATA_PATH)
    except Exception as exc:
        logger.error("Failed to download wearable data: %s", exc)
        raise RuntimeError(f"Data bootstrap failed: {exc}") from exc


# ─── App Lifespan ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Runs once at startup (before first request) and once at shutdown.
    Downloads the wearable CSV if WEARABLE_DATA_URL is set, then yields
    control to the request loop.
    """
    await asyncio.to_thread(_bootstrap_data_file)
    yield
    logger.info("ScreenSense engine shutting down.")


# ─── App Bootstrap ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="ScreenSense Athlete Performance Engine",
    description=(
        "Production-grade 3-model prediction suite: "
        "Injury Risk · CNS Fatigue · Metabolic Regulation"
    ),
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows your frontend dev to call the endpoints from anywhere
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Singleton Engine Instances ────────────────────────────────────────────────
# Pass pre-trained model objects here when available; None -> heuristic fallback.
injury_engine    = AcuteInjuryRiskEngine(trained_model=None)
cns_engine       = CNSFatigueEngine(anomaly_detector=None)
metabolic_engine = MetabolicRegulatorEngine(weight_regressor=None)


# ─── Request / Response Schemas ───────────────────────────────────────────────

class AthleteLogEntry(BaseModel):
    """Single-row telemetry record. All fields default to None for sparse logs."""
    date:                     Optional[str]   = Field(None, example="2024-03-15")
    weight_kg:                Optional[float] = Field(None, example=72.4)
    bmi:                      Optional[float] = Field(None, example=22.1)
    muscle_mass_kg:           Optional[float] = Field(None, example=35.0)
    workout_duration_minutes: Optional[float] = Field(None, example=60.0)
    workout_intensity:        Optional[str]   = Field(None, example="high")
    running_power:            Optional[float] = Field(None, example=280.0)
    cadence:                  Optional[float] = Field(None, example=172.0)
    training_load:            Optional[float] = Field(None, example=0.0)
    resting_heart_rate:       Optional[float] = Field(None, example=52.0)
    hrv_rmssd:                Optional[float] = Field(None, example=68.0)
    hrv_sdnn:                 Optional[float] = Field(None, example=45.0)
    sleep_respiratory_rate:   Optional[float] = Field(None, example=14.2)
    sleep_efficiency:         Optional[float] = Field(None, example=0.88)
    skin_temperature_c:       Optional[float] = Field(None, example=36.5)
    calories_consumed:        Optional[float] = Field(None, example=2800.0)
    basal_metabolic_rate:     Optional[float] = Field(None, example=1750.0)
    active_calories:          Optional[float] = Field(None, example=620.0)
    blood_glucose_mg_dl:      Optional[float] = Field(None, example=92.0)
    met_scores:               Optional[float] = Field(None, example=6.5)
    ovulation_tracking:       Optional[int]   = Field(None, example=0)
    symptoms_logging:         Optional[str]   = Field(None, example="sore")


class AthleteHistoryRequest(BaseModel):
    """Sequential time-ordered log entries for a single athlete."""
    athlete_id: str = Field(..., example="athlete_42")
    logs: list[AthleteLogEntry] = Field(..., min_length=1)
    weight_category_floor_kg: Optional[float] = Field(70.0, example=70.0)


class TelemetryPayload(BaseModel):
    """Telemetry payload for weekly wrapped calculations."""
    athlete_id: Optional[str] = Field(None, example="athlete_42")
    history: list[AthleteLogEntry] = Field(..., min_length=1)


# ─── Internal Helpers ─────────────────────────────────────────────────────────

def _build_dataframe(request: AthleteHistoryRequest) -> pd.DataFrame:
    """Convert Pydantic log list to a pandas DataFrame for engine consumption."""
    records = [entry.model_dump() for entry in request.logs]
    df = pd.DataFrame(records)
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.sort_values("date").reset_index(drop=True)
    return df


def _parse_engine_output(raw: str, engine_name: str) -> Dict[str, Any]:
    """Safely parse engine JSON string; wraps errors for clean API response."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"error": f"{engine_name} returned malformed JSON", "raw": raw}


# Metadata columns that must never enter model feature space
_METADATA_COLS = {
    "device_name", "watch_manufacturer", "sync_timestamp", "data_source"
}

def _sanitise_chunk(chunk: pd.DataFrame) -> pd.DataFrame:
    """Drop device/metadata columns from a CSV chunk before inference."""
    return chunk.drop(columns=[c for c in _METADATA_COLS if c in chunk.columns])


def _run_all_engines_on_chunk(
    chunk: pd.DataFrame,
    weight_floor_kg: float,
) -> Dict[str, Any]:
    """
    Runs all three engines synchronously on a single dataframe chunk.
    Called inside asyncio.to_thread() so it never blocks the event loop.

    The ACWR and 21-day baseline calculations require sequential row context.
    For best accuracy, chunks should overlap by at least 28 rows with the
    previous chunk (pass carry_rows from the prior iteration).
    """
    result = {
        "rows_processed": len(chunk),
        "injury_risk":   _parse_engine_output(
            injury_engine.predict_latest(chunk), "AcuteInjuryRiskEngine"
        ),
        "cns_fatigue":   _parse_engine_output(
            cns_engine.predict_latest(chunk), "CNSFatigueEngine"
        ),
        "metabolic":     _parse_engine_output(
            metabolic_engine.predict_latest(chunk, weight_floor_kg),
            "MetabolicRegulatorEngine"
        ),
    }
    return result


async def _stream_csv_predictions(
    file_path: str,
    chunk_size: int,
    weight_floor_kg: float,
    overlap_rows: int = 28,
) -> AsyncGenerator[str, None]:
    """
    Async generator that:
        1. Opens the CSV without loading it into RAM.
        2. Reads it in `chunk_size`-row pages via pandas chunksize iterator.
        3. Prepends `overlap_rows` from the previous chunk so rolling
           window calculations (ACWR, 21-day HRV baseline) have sufficient
           historical context at every page boundary.
        4. Runs all three model engines on the sanitised page.
        5. Yields each result as a newline-delimited JSON string
           (NDJSON format — compatible with fetch() ReadableStream on the client).

    RAM footprint at any moment:
        max(chunk_size + overlap_rows) rows × column_count × 8 bytes
        For chunk_size=10000, ~21 cols, ~8 bytes → ≈ 1.7 MB peak per chunk.
    """
    carry: pd.DataFrame = pd.DataFrame()   # overlap buffer from previous chunk
    chunk_index = 0

    try:
        reader = pd.read_csv(file_path, chunksize=chunk_size)
    except FileNotFoundError:
        yield json.dumps({"error": f"Data file not found: {file_path}"}) + "\n"
        return
    except Exception as exc:
        yield json.dumps({"error": f"Failed to open CSV: {exc}"}) + "\n"
        return

    for raw_chunk in reader:
        chunk_index += 1

        # Sanitise metadata columns
        raw_chunk = _sanitise_chunk(raw_chunk)

        # Prepend carry-over rows for rolling window continuity
        if not carry.empty:
            page = pd.concat([carry, raw_chunk], ignore_index=True)
        else:
            page = raw_chunk

        # Run inference in a thread pool to avoid blocking the event loop
        try:
            result = await asyncio.to_thread(
                _run_all_engines_on_chunk, page, weight_floor_kg
            )
        except Exception as exc:
            result = {"error": str(exc)}

        result["chunk_index"] = chunk_index
        result["chunk_row_start"] = (chunk_index - 1) * chunk_size
        result["chunk_row_end"]   = result["chunk_row_start"] + len(raw_chunk) - 1

        yield json.dumps(result) + "\n"

        # Keep the tail of this chunk as context for the next iteration.
        # 28 rows covers the maximum rolling window used (28-day chronic load).
        carry = raw_chunk.tail(overlap_rows).copy()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Utility"])
async def health_check():
    """Liveness probe for orchestration layers (k8s, Railway, Render)."""
    data_ready = os.path.exists(DATA_PATH)
    return {
        "status": "ok",
        "engines": ["injury_risk", "cns_fatigue", "metabolic"],
        "data_file_present": data_ready,
        "data_path": DATA_PATH,
        "chunk_size": CHUNK_SIZE,
    }


@app.post("/predict/injury-risk", tags=["Predictions"])
async def predict_injury_risk(request: AthleteHistoryRequest):
    """
    **Model 1 — Orthopedic Injury Risk**

    Returns a binary risk state (0 = NORMAL_STABLE, 1 = DANGER_ZONE_HIGH_RISK)
    derived from ACWR, cadence, structural laxity, and symptom telemetry.
    """
    try:
        df = await asyncio.to_thread(_build_dataframe, request)
        raw = await asyncio.to_thread(injury_engine.predict_latest, df)
        result = _parse_engine_output(raw, "AcuteInjuryRiskEngine")
        result["athlete_id"] = request.athlete_id
        return JSONResponse(content=result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Engine error: {exc}")


@app.post("/predict/cns-fatigue", tags=["Predictions"])
async def predict_cns_fatigue(request: AthleteHistoryRequest):
    """
    **Model 2 — CNS Fatigue & Illness Onset**

    Returns a continuous anomaly score [0-100] from nocturnal telemetry deltas.
    >= 50 -> SYSTEMIC_BURNOUT_OR_ILLNESS_CRASH.
    """
    try:
        df = await asyncio.to_thread(_build_dataframe, request)
        raw = await asyncio.to_thread(cns_engine.predict_latest, df)
        result = _parse_engine_output(raw, "CNSFatigueEngine")
        result["athlete_id"] = request.athlete_id
        return JSONResponse(content=result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Engine error: {exc}")


@app.post("/predict/metabolic", tags=["Predictions"])
async def predict_metabolic(request: AthleteHistoryRequest):
    """
    **Model 3 — Metabolic Regulation**

    Returns a 14-day weight trajectory projection and glycogen depletion window,
    plus fueling/gym intervention directives.
    """
    try:
        df = await asyncio.to_thread(_build_dataframe, request)
        raw = await asyncio.to_thread(
            metabolic_engine.predict_latest,
            df,
            request.weight_category_floor_kg,
        )
        result = _parse_engine_output(raw, "MetabolicRegulatorEngine")
        result["athlete_id"] = request.athlete_id
        return JSONResponse(content=result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Engine error: {exc}")


@app.post("/predict/all", tags=["Predictions"])
async def predict_all(request: AthleteHistoryRequest):
    """
    **All 3 Models — Parallel Execution**

    Runs all three engines concurrently via asyncio and returns a merged
    composite payload. Ideal for dashboard tiles and report generation.
    """
    try:
        df = await asyncio.to_thread(_build_dataframe, request)

        injury_task, cns_task, metabolic_task = await asyncio.gather(
            asyncio.to_thread(injury_engine.predict_latest, df),
            asyncio.to_thread(cns_engine.predict_latest, df),
            asyncio.to_thread(
                metabolic_engine.predict_latest,
                df,
                request.weight_category_floor_kg,
            ),
        )

        composite = {
            "athlete_id": request.athlete_id,
            "injury_risk": _parse_engine_output(injury_task,    "AcuteInjuryRiskEngine"),
            "cns_fatigue": _parse_engine_output(cns_task,       "CNSFatigueEngine"),
            "metabolic":   _parse_engine_output(metabolic_task, "MetabolicRegulatorEngine"),
        }
        return JSONResponse(content=composite)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Engine error: {exc}")


@app.post("/predict/stream-csv", tags=["Streaming"])
async def predict_stream_csv(
    file_path: str = Query(
        default=DATA_PATH,
        description="Absolute or relative path to the wearable CSV on server disk.",
    ),
    chunk_size: int = Query(
        default=CHUNK_SIZE,
        ge=100,
        le=100_000,
        description="Rows per streaming batch (default 10,000). Lower = less RAM.",
    ),
    weight_floor_kg: float = Query(
        default=70.0,
        description="Minimum weight-class floor in kg for metabolic engine.",
    ),
):
    """
    **Chunked CSV Streaming — RAM-safe large dataset inference**

    Opens `file_path` on server disk without loading it into RAM. Reads it
    in `chunk_size`-row pages, runs all three model engines on each page,
    and streams results back as **Newline-Delimited JSON (NDJSON)**.

    Each line in the response is a self-contained JSON object:
    ```json
    {"chunk_index": 1, "chunk_row_start": 0, "chunk_row_end": 9999,
     "rows_processed": 10000, "injury_risk": {...}, "cns_fatigue": {...},
     "metabolic": {...}}
    ```

    **Memory profile on Render free-tier (512 MB):**
    - chunk_size=10000, 21 cols, float64 -> ~1.7 MB active per chunk
    - Overlap carry buffer (28 rows)     -> ~0.04 MB
    - Engine feature frames              -> ~0.5 MB
    - Total peak                         -> **< 5 MB** regardless of file size

    **Client-side consumption (JavaScript fetch + ReadableStream):**
    ```js
    const response = await fetch('/predict/stream-csv', { method: 'POST' });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).trim().split('\\n');
      lines.forEach(line => console.log(JSON.parse(line)));
    }
    ```
    """
    return StreamingResponse(
        _stream_csv_predictions(file_path, chunk_size, weight_floor_kg),
        media_type="application/x-ndjson",
        headers={"X-Content-Type-Options": "nosniff"},
    )


@app.post("/api/v1/analytics/wrapped", tags=["Analytics"])
async def get_weekly_body_wrapped(payload: TelemetryPayload):
    """
    **Weekly Body Wrapped — Gamified recap summary**

    Generates a shareable, gamified 'Spotify Wrapped' summary payload
    of the user's weekly health, recovery, and energy metrics.
    """
    if len(payload.history) < 7:
        raise HTTPException(
            status_code=422,
            detail="Wrapped calculations require a minimum historical record span of 7 continuous tracking periods."
        )

    try:
        # Convert validation classes into an internal DataFrame frame
        raw_dicts = [row.model_dump() for row in payload.history]
        df = pd.DataFrame(raw_dicts)

        # Sync timestamp column with date if only date is provided
        if "timestamp" not in df.columns and "date" in df.columns:
            df["timestamp"] = df["date"]

        # Chronological sort guard
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df = df.sort_values("timestamp").reset_index(drop=True)

        wrapped_data = BodyWrappedEngine.generate_weekly_recap(df)
        if "error" in wrapped_data:
            raise HTTPException(status_code=422, detail=wrapped_data["error"])

        return {"status": "success", "wrapped": wrapped_data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate wrapped matrix: {str(e)}")

