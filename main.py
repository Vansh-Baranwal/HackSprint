import os
import json
from typing import List, Optional
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Import modular engines directly from your models module directory
from models.injury_risk_engine import AcuteInjuryRiskEngine
from models.cns_fatigue_engine import CNSFatigueEngine
from models.metabolic_regulator import MetabolicRegulatorEngine
from weekly_wrapped import BodyWrappedEngine

# =================================================================
# PYDANTIC SCHEMAS FOR INPUT VALIDATION
# =================================================================
class TelemetryLog(BaseModel):
    date: Optional[str] = None
    workout_duration_minutes: Optional[float] = None
    workout_intensity: Optional[str] = None
    running_power: Optional[float] = None
    cadence: Optional[float] = None
    symptoms_logging: Optional[str] = None
    weight_kg: Optional[float] = None
    active_calories: Optional[float] = None
    calories_consumed: Optional[float] = None
    basal_metabolic_rate: Optional[float] = None
    blood_glucose_mg_dl: Optional[float] = None
    hrv_rmssd: Optional[float] = None
    sleep_efficiency: Optional[float] = None
    resting_heart_rate: Optional[float] = None

class StandardPredictionRequest(BaseModel):
    athlete_id: str
    logs: List[TelemetryLog]

class MetabolicPredictionRequest(BaseModel):
    athlete_id: str
    weight_category_floor_kg: Optional[float] = 70.0
    logs: List[TelemetryLog]

class WeeklyWrappedRequest(BaseModel):
    athlete_id: str
    history: List[TelemetryLog]

# =================================================================
# WEB SERVICE INITIALIZATION LAYER
# =================================================================
app = FastAPI(
    title="ScreenSense Athlete Performance API",
    description="Asynchronous analytics telemetry engine supporting explicit multi-model routing.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================================
# HELPER DATA CONVERSION CORES
# =================================================================
def logs_to_dataframe(logs: List[TelemetryLog]) -> pd.DataFrame:
    """Converts Pydantic request lists into a structurally aligned DataFrame."""
    # 1. Maintain complete schema positioning by allowing padded None elements
    raw_dicts = [log.model_dump() for log in logs]
    df = pd.DataFrame(raw_dicts)
    
    if df.empty:
        return preprocess_for_models(df)

    # 2. Bridge payload parameter names directly to what engines look for
    if 'date' in df.columns:
        df['timestamp'] = pd.to_datetime(df['date'])
        df = df.sort_values('timestamp').reset_index(drop=True)
    
    # 3. Explicitly check for specific parameters to feed core metrics
    mapping = {
        'resting_heart_rate': 'resting_heart_rate',
        'hrv_rmssd': 'hrv_rmssd'
    }
    for model_key, df_target in mapping.items():
        if model_key in df.columns and df_target not in df.columns:
            df[df_target] = df[model_key]

    return preprocess_for_models(df)

def load_and_combine_split_data() -> pd.DataFrame:
    """Sequentially reads 4 split dataset parts from the data directory."""
    data_folder = "data"
    file_names = [f"wearable_data_part_{i}.csv" for i in range(1, 5)]
    chunk_list = []

    for file_name in file_names:
        file_path = os.path.join(data_folder, file_name)
        if os.path.exists(file_path):
            chunk_df = pd.read_csv(file_path, low_memory=False)
            chunk_list.append(chunk_df)
        else:
            raise FileNotFoundError(f"Missing critical split file segment: '{file_path}'")

    return pd.concat(chunk_list, ignore_index=True)

def preprocess_for_models(df: pd.DataFrame) -> pd.DataFrame:
    processed_df = df.copy()
    
    # Fill structural payload gaps via directional backfill/forwardfill
    processed_df = processed_df.ffill().bfill()
    
    core_defaults = {
        'weight_kg': 72.5, 'resting_heart_rate': 52.0, 'hrv_rmssd': 55.0,
        'active_calories': 500.0, 'basal_metabolic_rate': 1750.0,
        'workout_duration_minutes': 45.0, 'calories_consumed': 2400.0
    }
    for col, default_val in core_defaults.items():
        if col not in processed_df.columns or processed_df[col].isna().all():
            processed_df[col] = default_val
        else:
            # Clean up lingering missing values within the column
            processed_df[col] = processed_df[col].fillna(default_val)
            
    return processed_df

# =================================================================
# PRODUCTION ENDPOINTS (THE 7 SPECIFIED ROUTES)
# =================================================================

# 1. Health Status Check
@app.get("/health")
def health_check():
    data_path = "data/wearable_data_part_1.csv"
    return {
        "status": "ok",
        "engines": ["injury_risk", "cns_fatigue", "metabolic"],
        "data_file_present": os.path.exists(data_path),
        "data_path": "data/wearable_data.csv",
        "chunk_size": 10000
    }

# 2. Acute Injury Risk Assessment
@app.post("/predict/injury-risk")
def predict_injury_risk(payload: StandardPredictionRequest):
    try:
        df = logs_to_dataframe(payload.logs)
        engine = AcuteInjuryRiskEngine(trained_model=None)
        prediction_json = json.loads(engine.predict_latest(df))
        prediction_json["athlete_id"] = payload.athlete_id
        return prediction_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. CNS Fatigue & Illness Onset Assessment
@app.post("/predict/cns-fatigue")
def predict_cns_fatigue(payload: StandardPredictionRequest):
    try:
        df = logs_to_dataframe(payload.logs)
        engine = CNSFatigueEngine(anomaly_detector=None)
        prediction_json = json.loads(engine.predict_latest(df))
        prediction_json["athlete_id"] = payload.athlete_id
        return prediction_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. Metabolic & Weight Regulation Assessment
@app.post("/predict/metabolic")
def predict_metabolic(payload: MetabolicPredictionRequest):
    try:
        df = logs_to_dataframe(payload.logs)
        engine = MetabolicRegulatorEngine(weight_regressor=None)
        prediction_json = json.loads(engine.predict_latest(df, target_category_floor_kg=payload.weight_category_floor_kg))
        prediction_json["athlete_id"] = payload.athlete_id
        return prediction_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5. Composite Parallel Assessment
@app.post("/predict/all")
def predict_all(payload: StandardPredictionRequest):
    try:
        df = logs_to_dataframe(payload.logs)
        
        ortho_engine = AcuteInjuryRiskEngine(trained_model=None)
        cns_engine = CNSFatigueEngine(anomaly_detector=None)
        metabolic_engine = MetabolicRegulatorEngine(weight_regressor=None)
        
        return {
            "athlete_id": payload.athlete_id,
            "injury_risk": json.loads(ortho_engine.predict_latest(df)),
            "cns_fatigue": json.loads(cns_engine.predict_latest(df)),
            "metabolic": json.loads(metabolic_engine.predict_latest(df, target_category_floor_kg=70.0))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. Memory-Efficient Chunked CSV Streaming (NDJSON Response)
@app.post("/predict/stream-csv")
def stream_csv_analysis(
    file_path: str = Query("data", description="Path to telemetry directory"),
    chunk_size: int = Query(10000, description="Rows per stream window"),
    weight_floor_kg: float = Query(70.0, description="Weight filter threshold")
):
    def generate_chunks():
        try:
            full_df = load_and_combine_split_data()
            total_rows = len(full_df)
            
            ortho_engine = AcuteInjuryRiskEngine(trained_model=None)
            cns_engine = CNSFatigueEngine(anomaly_detector=None)
            metabolic_engine = MetabolicRegulatorEngine(weight_regressor=None)
            
            idx = 1
            for start in range(0, total_rows, chunk_size):
                end = min(start + chunk_size, total_rows)
                chunk_df = full_df.iloc[start:end].copy()
                
                chunk_payload = {
                    "chunk_index": idx,
                    "chunk_row_start": start,
                    "chunk_row_end": end - 1,
                    "rows_processed": len(chunk_df),
                    "injury_risk": json.loads(ortho_engine.predict_latest(preprocess_for_models(chunk_df))),
                    "cns_fatigue": json.loads(cns_engine.predict_latest(preprocess_for_models(chunk_df))),
                    "metabolic": json.loads(metabolic_engine.predict_latest(preprocess_for_models(chunk_df), target_category_floor_kg=weight_floor_kg))
                }
                yield json.dumps(chunk_payload) + "\n"
                idx += 1
        except Exception as streaming_error:
            yield json.dumps({"error": f"Streaming pipeline disruption: {str(streaming_error)}"}) + "\n"

    return StreamingResponse(generate_chunks(), media_type="application/x-ndjson")

# 7. Weekly Body Wrapped
@app.post("/api/v1/analytics/wrapped")
def get_weekly_wrapped(payload: WeeklyWrappedRequest):
    if len(payload.history) < 7:
        raise HTTPException(
            status_code=422, 
            detail="Unprocessable Entity: Body Wrapped execution vector requires an absolute minimum history window of 7 telemetry log sequences."
        )
    try:
        df = logs_to_dataframe(payload.history)
        wrapped_payload = BodyWrappedEngine.generate_weekly_recap(df)
        return {"status": "success", "wrapped": wrapped_payload}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))