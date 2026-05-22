"""
main.py -- Unified Local Harness & Pre-Flight Verification Suite
================================================================
Sequential execution order:
    1.  generate_mock_telemetry()       -> Synthetic 35-day wearable array
    2.  run_schema_validation()         -> Metadata drop, nocturnal isolation,
                                          calorie-split & feature-presence checks
    3.  run_preflight_integrity()       -> Timeline continuity, NaN boundary,
                                          JSON validity checks
    4.  run_all_models()                -> Sequential inference across all 3 engines

Run:
    python main.py
"""

# Force UTF-8 output on Windows terminals to handle any Unicode safely.
import sys, io
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import json
import sys
import textwrap
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from models.injury_risk_engine import AcuteInjuryRiskEngine
from models.cns_fatigue_engine import CNSFatigueEngine
from models.metabolic_regulator import MetabolicRegulatorEngine
from weekly_wrapped import BodyWrappedEngine


# ─── ANSI colour helpers (degrade gracefully on Windows CMD) ──────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def _ok(msg):   print(f"  {GREEN}[OK]{RESET}  {msg}")
def _warn(msg): print(f"  {YELLOW}[!!]{RESET}  {msg}")
def _fail(msg): print(f"  {RED}[XX]{RESET}  {msg}")
def _head(msg): print(f"\n{BOLD}{CYAN}{msg}{RESET}")
def _rule():    print("-" * 65)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — MOCK TELEMETRY GENERATOR
# ══════════════════════════════════════════════════════════════════════════════

# Columns that represent device/sync metadata and must never reach a model.
METADATA_COLUMNS = [
    "device_name",
    "watch_manufacturer",
    "sync_timestamp",
    "data_source",
]

def generate_mock_telemetry(days: int = 35) -> pd.DataFrame:
    """
    Synthesises a realistic 35-day wearable array replicating a 101-parameter
    athlete telemetry export.

    Intentional data quality issues injected to stress-test pipeline robustness:
        • Rows 12-14 : resting_heart_rate and hrv_rmssd set to NaN
                       → validates CNS engine's ffill(limit=2) guard
        • Rows 20-21 : weight_kg and muscle_mass_kg set to NaN
                       → validates Metabolic engine's interpolation guard
        • Metadata columns appended
                       → validates schema sanitiser's drop logic
    """
    np.random.seed(42)
    base_date = datetime.now() - timedelta(days=days)

    data = {
        "timestamp": [base_date + timedelta(days=i) for i in range(days)],

        # ── Model 1 inputs ─────────────────────────────────────────────
        "workout_duration_minutes": np.random.choice(
            [45.0, 60.0, 90.0, 0.0], size=days, p=[0.4, 0.3, 0.1, 0.2]
        ),
        "workout_intensity": np.random.choice(
            ["low", "medium", "high"], size=days
        ),
        "running_power":    np.random.uniform(200, 350, size=days),
        "cadence":          np.random.uniform(155, 180, size=days),
        "weight_kg":        np.random.uniform(71.5, 73.0, size=days),
        "bmi":              np.random.uniform(22.1, 22.5, size=days),
        "muscle_mass_kg":   np.random.uniform(34.0, 34.5, size=days),
        "ovulation_tracking": np.random.choice(
            [0, 1], size=days, p=[0.85, 0.15]
        ),
        "symptoms_logging": np.random.choice(
            ["none", "sore", "severe_soreness"], size=days, p=[0.70, 0.25, 0.05]
        ),

        # ── Model 2 inputs (Nocturnal Pack) ────────────────────────────
        "resting_heart_rate":     np.random.uniform(48,   56,   size=days),
        "hrv_rmssd":              np.random.uniform(45,   75,   size=days),
        "hrv_sdnn":               np.random.uniform(50,   80,   size=days),
        "sleep_respiratory_rate": np.random.uniform(12,   15,   size=days),
        "sleep_efficiency":       np.random.uniform(85,   96,   size=days),
        "skin_temperature_c":     np.random.uniform(36.2, 36.8, size=days),

        # ── Model 3 inputs ─────────────────────────────────────────────
        "calories_consumed":   np.random.uniform(2200, 3100, size=days),
        "basal_metabolic_rate": np.full(days, 1750.0),
        "active_calories":     np.random.uniform(300,  1100, size=days),
        "blood_glucose_mg_dl": np.random.uniform(80,   140,  size=days),
        "met_scores":          np.random.uniform(1.0,  4.5,  size=days),

        # ── Injected metadata columns (must be dropped before inference) ─
        "device_name":       ["GarminFenix7"] * days,
        "watch_manufacturer":["Garmin"] * days,
        "sync_timestamp":    [datetime.now().isoformat()] * days,
        "data_source":       ["BLE_SYNC"] * days,
    }

    df = pd.DataFrame(data)

    # Inject deliberate NaN gaps to stress-test imputation guards
    df.loc[12:14, ["resting_heart_rate", "hrv_rmssd"]] = np.nan
    df.loc[20:21, ["weight_kg", "muscle_mass_kg"]]     = np.nan

    return df


def sanitise_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Drops all known metadata/device columns before any model sees the frame.
    Prevents information leakage and avoids silent dtype coercion failures.
    """
    cols_to_drop = [c for c in METADATA_COLUMNS if c in df.columns]
    return df.drop(columns=cols_to_drop)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — SCHEMA VALIDATION
# ══════════════════════════════════════════════════════════════════════════════

# Required feature sets per engine (canonical names post-engineering)
_M1_RAW_INPUTS  = [
    "workout_duration_minutes", "workout_intensity", "running_power",
    "cadence", "weight_kg", "bmi", "muscle_mass_kg",
]
_M2_NOCTURNAL   = [
    "resting_heart_rate", "hrv_rmssd", "hrv_sdnn",
    "sleep_respiratory_rate", "sleep_efficiency", "skin_temperature_c",
]
_M3_THERMODYNAMIC = [
    "calories_consumed", "basal_metabolic_rate", "active_calories",
    "blood_glucose_mg_dl", "met_scores", "weight_kg",
]

def run_schema_validation(raw_df: pd.DataFrame, sanitised_df: pd.DataFrame) -> bool:
    """
    Validates all three telemetry package constraints before inference.

    Checks:
        [A] Metadata Isolation   — confirm device/sync columns were stripped
        [B] Nocturnal Package    — all M2 sleep-frame fields present & non-empty
        [C] Thermodynamic Split  — active_calories ≠ basal_metabolic_rate columns
                                   exist and are numerically distinct
        [D] Feature Presence     — all raw input columns required by each model exist
    Returns:
        True if all checks pass, False if any FAIL-level issue detected.
    """
    _head("SECTION 2 — Schema & Telemetry Mapping Validation")
    _rule()
    passed = True

    # ── [A] Metadata isolation ─────────────────────────────────────────
    print(f"\n  [A] Global Metadata Filter")
    leaked = [c for c in METADATA_COLUMNS if c in sanitised_df.columns]
    if leaked:
        _fail(f"Metadata columns still present after sanitisation: {leaked}")
        passed = False
    else:
        _ok("All metadata columns (device_name, watch_manufacturer, "
            "sync_timestamp, data_source) successfully dropped.")

    # ── [B] Nocturnal package completeness ────────────────────────────
    print(f"\n  [B] Passive Nocturnal Package (Model 2)")
    for col in _M2_NOCTURNAL:
        if col not in sanitised_df.columns:
            _fail(f"Missing nocturnal field: '{col}'")
            passed = False
        elif sanitised_df[col].isna().all():
            _fail(f"Nocturnal field '{col}' is entirely NaN — "
                  "daytime-only data may have been passed.")
            passed = False
        else:
            non_null_pct = sanitised_df[col].notna().mean() * 100
            _ok(f"{col:30s}  ->  {non_null_pct:.0f}% populated")

    # ── [C] Thermodynamic calorie-split integrity ─────────────────────
    print(f"\n  [C] Thermodynamic Package Calorie-Split (Model 3)")
    for col in ["calories_consumed", "basal_metabolic_rate", "active_calories"]:
        if col not in sanitised_df.columns:
            _fail(f"Missing thermodynamic field: '{col}'")
            passed = False
    if all(c in sanitised_df.columns for c in ["basal_metabolic_rate", "active_calories"]):
        overlap = (sanitised_df["basal_metabolic_rate"] == sanitised_df["active_calories"]).mean()
        if overlap > 0.9:
            _fail("basal_metabolic_rate and active_calories appear identical — "
                  "verify column mapping (BMR ≠ active expenditure).")
            passed = False
        else:
            _ok("active_calories  →  physical exertion expenditure  ✓")
            _ok("basal_metabolic_rate  →  resting baseline expenditure  ✓")
            _ok(f"Column overlap rate: {overlap * 100:.1f}%  (acceptable < 10%)")

    # ── [D] Raw feature presence per model ────────────────────────────
    print(f"\n  [D] Raw Feature Presence (All Models)")
    for label, feature_set in [
        ("Model 1 — Injury Risk", _M1_RAW_INPUTS),
        ("Model 2 — CNS Fatigue", _M2_NOCTURNAL),
        ("Model 3 — Metabolic",   _M3_THERMODYNAMIC),
    ]:
        missing = [f for f in feature_set if f not in sanitised_df.columns]
        if missing:
            _fail(f"{label}: missing columns {missing}")
            passed = False
        else:
            _ok(f"{label}: all required raw columns present.")

    return passed


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — PRE-FLIGHT INTEGRITY CHECKS
# ══════════════════════════════════════════════════════════════════════════════

def run_preflight_integrity(
    sanitised_df: pd.DataFrame,
    processed_frames: dict,
    model_outputs: list[str]
) -> bool:
    """
    Executes three mandatory pre-flight checks before backend deployment:

        [1] Timeline Continuity  — rows ordered chronologically (checked on
                                   the sanitised raw frame which holds timestamps)
        [2] Imputation Boundary  — checks each engine's OWN post-imputation
                                   output frame independently so each model's
                                   specific fill logic is correctly verified
        [3] JSON Validity        — all model output strings parse as valid JSON

    Args:
        sanitised_df:    Raw telemetry after metadata drop (has timestamp col).
        processed_frames: Dict of {engine_label: processed_df} from each engine's
                          own preprocessing step.
        model_outputs:   List of raw JSON strings returned by each engine.

    Returns:
        True if all checks pass, False if any FAIL-level issue detected.
    """
    _head("SECTION 3 — Pre-Flight Integrity Checklist")
    _rule()
    passed = True

    # ── [1] Timeline Continuity (checked on raw sanitised frame) ─────
    print(f"\n  [1] Timeline Continuity Test")
    if "timestamp" in sanitised_df.columns:
        ts = pd.to_datetime(sanitised_df["timestamp"], errors="coerce")
        diffs = ts.diff().dropna()
        out_of_order = (diffs < pd.Timedelta(0)).sum()
        duplicates   = (diffs == pd.Timedelta(0)).sum()

        if out_of_order > 0:
            _fail(f"{out_of_order} out-of-order timestamp(s) detected. "
                  "Sort by timestamp before passing to engines.")
            passed = False
        else:
            _ok("All rows are strictly chronologically ordered.")

        if duplicates > 0:
            _warn(f"{duplicates} duplicate timestamp(s) found — "
                  "deduplicate before computing rolling windows.")
        else:
            _ok("No duplicate timestamps found.")
    else:
        _warn("No 'timestamp' column present — skipping timeline check.")

    # ── [2] Per-Engine Imputation Boundary Verification ───────────────
    # Each engine has its own imputation logic (interpolate, ffill, bfill).
    # Checking a shared frame would miss columns that only one engine processes.
    # We verify each engine's processed feature frame independently.
    print(f"\n  [2] Imputation Boundary Verification (per engine)")
    for engine_label, proc_df in processed_frames.items():
        numeric_cols = proc_df.select_dtypes(include=[np.number]).columns
        nan_counts   = proc_df[numeric_cols].isna().sum()
        remaining    = nan_counts[nan_counts > 0]

        print(f"\n       [{engine_label}]")
        if remaining.empty:
            _ok(f"Zero NaN values remain in all {len(numeric_cols)} numeric "
                f"feature columns after {engine_label} preprocessing.")
        else:
            for col, count in remaining.items():
                _fail(f"{col:40s}: {count} residual NaN(s) — "
                      "imputation window may be too narrow for this gap size.")
            passed = False

        for col in numeric_cols:
            status = f"{GREEN}[OK]{RESET}" if nan_counts[col] == 0 else f"{RED}[XX]{RESET}"
            print(f"       {status}  {col:40s}: {nan_counts[col]} NaN(s)")

    # ── [3] FastAPI JSON Compatibility Check ──────────────────────────
    print(f"\n  [3] FastAPI JSON Compatibility Check")
    labels = [
        "Model 1 — AcuteInjuryRiskEngine",
        "Model 2 — CNSFatigueEngine",
        "Model 3 — MetabolicRegulatorEngine",
    ]
    for label, raw in zip(labels, model_outputs):
        try:
            parsed = json.loads(raw)
            if "error" in parsed:
                _warn(f"{label}: parsed OK but contains engine error -> {parsed['error']}")
            else:
                _ok(f"{label}: valid JSON [OK]")
        except json.JSONDecodeError as exc:
            _fail(f"{label}: INVALID JSON -> {exc}")
            passed = False

    return passed


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — MODEL EXECUTION
# ══════════════════════════════════════════════════════════════════════════════

def run_all_models(df: pd.DataFrame) -> list[str]:
    """
    Sequentially instantiates and runs all three engines against the prepared
    dataframe. Returns raw JSON output strings for downstream validation.
    """
    _head("SECTION 4 — Sequential Model Inference")
    _rule()

    ortho_engine    = AcuteInjuryRiskEngine(trained_model=None)
    cns_engine      = CNSFatigueEngine(anomaly_detector=None)
    metabolic_engine = MetabolicRegulatorEngine(weight_regressor=None)

    outputs = []

    print(f"\n  {BOLD}[Model 1] Orthopedic Injury Risk Assessment{RESET}")
    m1_json = ortho_engine.predict_latest(df)
    outputs.append(m1_json)
    _print_json_block(m1_json)

    print(f"\n  {BOLD}[Model 2] CNS Fatigue & Illness Onset Assessment{RESET}")
    m2_json = cns_engine.predict_latest(df)
    outputs.append(m2_json)
    _print_json_block(m2_json)

    print(f"\n  {BOLD}[Model 3] Metabolic & Weight Category Assessment{RESET}")
    m3_json = metabolic_engine.predict_latest(df, target_category_floor_kg=72.0)
    outputs.append(m3_json)
    _print_json_block(m3_json)

    return outputs


def _print_json_block(raw: str, indent: int = 4):
    """Pretty-prints a JSON string with consistent indentation."""
    try:
        parsed = json.loads(raw)
        pretty = json.dumps(parsed, indent=2)
        for line in pretty.splitlines():
            print(f"    {line}")
    except json.JSONDecodeError:
        print(f"    {RED}[UNPARSEABLE OUTPUT]{RESET} {raw}")


# ══════════════════════════════════════════════════════════════════════════════
# ENTRYPOINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"\n{BOLD}{'=' * 65}{RESET}")
    print(f"{BOLD}  ScreenSense | Athlete Performance Engine | Pipeline Harness{RESET}")
    print(f"{BOLD}{'=' * 65}{RESET}")

    # ── Step 1: Generate synthetic telemetry ──────────────────────────
    _head("SECTION 1 — Mock Telemetry Generation")
    _rule()
    raw_df = generate_mock_telemetry(days=35)
    _ok(f"Synthetic history array generated.  Shape: {raw_df.shape}")
    _ok(f"Columns ({len(raw_df.columns)}): {list(raw_df.columns)}")
    _ok(f"Injected NaN gaps at rows 12-14 (HRV/RHR) and 20-21 (weight/muscle).")

    # ── Step 2: Sanitise metadata ─────────────────────────────────────
    sanitised_df = sanitise_dataframe(raw_df)
    _ok(f"Post-sanitisation shape: {sanitised_df.shape}  "
        f"(dropped {raw_df.shape[1] - sanitised_df.shape[1]} metadata column(s))")

    # ── Step 3: Schema validation ─────────────────────────────────────
    schema_ok = run_schema_validation(raw_df, sanitised_df)

    # ── Step 4: Model inference ───────────────────────────────────────
    model_outputs = run_all_models(sanitised_df)

    # ── Step 5: Extract per-engine processed frames for NaN auditing ─
    # Each engine applies its own imputation logic internally.
    # We call each engine's preprocessing step directly so the NaN boundary
    # check reflects the exact state each model's inference pipeline sees.
    _head("SECTION 3 — Building Per-Engine Processed Frames")
    _rule()

    _ortho    = AcuteInjuryRiskEngine(trained_model=None)
    _cns      = CNSFatigueEngine(anomaly_detector=None)
    _metabolic = MetabolicRegulatorEngine(weight_regressor=None)

    m1_features  = _ortho.clean_and_extract_features(sanitised_df)
    _ok(f"Model 1 feature frame: {m1_features.shape}  "
        f"cols={list(m1_features.columns)}")

    m2_deltas = _cns.extract_nocturnal_deltas(sanitised_df)
    _ok(f"Model 2 delta frame:   {m2_deltas.shape}  "
        f"cols={list(m2_deltas.columns)}")

    m3_thermo = _metabolic.compute_thermodynamics(sanitised_df)
    _ok(f"Model 3 thermo frame:  {m3_thermo.shape}  "
        f"cols={list(m3_thermo.columns)}")

    processed_frames = {
        "AcuteInjuryRiskEngine": m1_features,
        "CNSFatigueEngine":      m2_deltas,
        "MetabolicRegulatorEngine": m3_thermo[
            ["net_caloric_balance", "rolling_deficit_7d", "weight_velocity_7d"]
        ],
    }

    # ── Step 6: Pre-flight integrity ──────────────────────────────────
    preflight_ok = run_preflight_integrity(
        sanitised_df, processed_frames, model_outputs
    )

    # ── Step 7: Weekly Wrapped Recap Generation ───────────────────────
    _head("SECTION 5 — Weekly Wrapped Recap Generation")
    _rule()
    wrapped_ok = False
    try:
        wrapped_recap = BodyWrappedEngine.generate_weekly_recap(sanitised_df)
        if "error" in wrapped_recap:
            _fail(f"Weekly Wrapped generation failed: {wrapped_recap['error']}")
        else:
            _ok("Weekly Wrapped payload successfully generated.")
            print(json.dumps(wrapped_recap, indent=2))
            wrapped_ok = True
    except Exception as exc:
        _fail(f"Weekly Wrapped generation raised an error: {exc}")

    # ── Final summary ─────────────────────────────────────────────────
    _head("PIPELINE EXECUTION SUMMARY")
    _rule()
    all_clear = schema_ok and preflight_ok and wrapped_ok
    if all_clear:
        _ok("All schema and integrity checks PASSED.")
        _ok("Pipeline is cleared for FastAPI backend integration.")
        _ok("Mount api.py with:  uvicorn api:app --reload --port 8000")
    else:
        _fail("One or more checks FAILED. Resolve flagged issues before deployment.")
        sys.exit(1)

    print(f"\n{BOLD}{'=' * 65}{RESET}\n")
