import os
import json
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import modular engines directly from your models module directory
from models.injury_risk_engine import AcuteInjuryRiskEngine
from models.cns_fatigue_engine import CNSFatigueEngine
from models.metabolic_regulator import MetabolicRegulatorEngine
from weekly_wrapped import BodyWrappedEngine

# =================================================================
# WEB SERVICE INITIALIZATION LAYER
# =================================================================
app = FastAPI(
    title="HackSprint Athlete Performance API",
    description="Production analytics telemetry engine running on 4-part split arrays.",
    version="1.0.0"
)

# Enable CORS so your frontend app or mobile dashboard can fetch data securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================================
# RESOURCE LAYER: MEMORY-SAFE 4-PART REASSEMBLY STREAM
# =================================================================
def load_and_combine_split_data() -> pd.DataFrame:
    """
    Sequentially reads the 4 split dataset parts from the root data directory.
    Keeps memory usage low to prevent Render OOM crashes.
    """
    data_folder = "data"
    file_names = [f"wearable_data_part_{i}.csv" for i in range(1, 5)]
    chunk_list = []

    print("\n[STREAMING] Reassembling Data Streams...")
    for file_name in file_names:
        file_path = os.path.join(data_folder, file_name)
        if os.path.exists(file_path):
            chunk_df = pd.read_csv(file_path, low_memory=False)
            chunk_list.append(chunk_df)
        else:
            raise FileNotFoundError(f"Missing critical split file segment: '{file_path}'")

    full_df = pd.concat(chunk_list, ignore_index=True)
    return full_df

# =================================================================
# DEFENSIVE PREPROCESSING & DOWNSAMPLING LAYER
# =================================================================
def preprocess_for_models(df: pd.DataFrame) -> pd.DataFrame:
    processed_df = df.copy()

    # 1. Clean and enforce chronological order
    if 'timestamp' in processed_df.columns:
        processed_df['timestamp'] = pd.to_datetime(processed_df['timestamp'])
        processed_df = processed_df.sort_values('timestamp').reset_index(drop=True)
    else:
        time_cols = [c for c in processed_df.columns if 'time' in c.lower()]
        if time_cols:
            processed_df = processed_df.rename(columns={time_cols[0]: 'timestamp'})
            processed_df['timestamp'] = pd.to_datetime(processed_df['timestamp'])
            processed_df = processed_df.sort_values('timestamp').reset_index(drop=True)

    # 2. Structural Alignment Mapping
    mapping = {
        'weight': 'weight_kg',
        'resting_hr': 'resting_heart_rate',
        'hrv': 'hrv_rmssd',
        'active_cal': 'active_calories',
        'bmr': 'basal_metabolic_rate'
    }
    for old_col, target_col in mapping.items():
        if target_col not in processed_df.columns:
            matched = [c for c in processed_df.columns if old_col in c.lower()]
            if matched:
                processed_df = processed_df.rename(columns={matched[0]: target_col})
            else:
                processed_df[target_col] = np.nan

    # 3. Handle high-density row shrinking for memory safety
    if len(processed_df) > 1000:
        if 'timestamp' in processed_df.columns:
            processed_df['date'] = processed_df['timestamp'].dt.date
            agg_dict = {col: 'mean' for col in processed_df.select_dtypes(include=[np.number]).columns}
            for sum_col in ['workout_duration_minutes', 'active_calories', 'calories_consumed']:
                if sum_col in agg_dict: agg_dict[sum_col] = 'sum'
            
            processed_df = processed_df.groupby('date').agg(agg_dict).reset_index()
            processed_df = processed_df.rename(columns={'date': 'timestamp'})
        else:
            processed_df = processed_df.iloc[::1000].reset_index(drop=True)

    processed_df = processed_df.ffill().bfill()
    
    # Core Backup Metrics Defaults
    core_defaults = {
        'weight_kg': 72.5, 'bmi': 22.3, 'muscle_mass_kg': 34.2, 'cadence': 165.0,
        'running_power': 260.0, 'resting_heart_rate': 52.0, 'hrv_rmssd': 55.0,
        'hrv_sdnn': 60.0, 'sleep_efficiency': 90.0, 'skin_temperature_c': 36.4,
        'sleep_respiratory_rate': 14.0, 'active_calories': 500.0, 'basal_metabolic_rate': 1750.0,
        'workout_duration_minutes': 45.0, 'workout_intensity': 'medium', 'calories_consumed': 2400.0,
        'blood_glucose_mg_dl': 100.0, 'ovulation_tracking': 0, 'symptoms_logging': 'none'
    }
    for col, default_val in core_defaults.items():
        if col not in processed_df.columns or processed_df[col].isna().all():
            processed_df[col] = default_val

    metadata_cols = ['device_name', 'watch_manufacturer', 'sync_timestamp', 'data_source']
    processed_df = processed_df.drop(columns=[c for c in metadata_cols if c in processed_df.columns], errors='ignore')

    return processed_df

# =================================================================
# PRODUCTION ENDPOINTS (ASGI INTEGRATION ROUTER)
# =================================================================
@app.get("/")
def read_root():
    """Service Health Probe Diagnostic Endpoint."""
    return {
        "status": "online",
        "service": "HackSprint Athlete Performance Engine Core",
        "endpoints_available": ["/api/analytics/latest"]
    }

@app.get("/api/analytics/latest")
def get_performance_analytics():
    """
    Compiles data parts dynamically and computes model inferences 
    as a structured HTTP payload response.
    """
    try:
        # 1. Pipeline execution reassembly
        raw_history = load_and_combine_split_data()
        sanitised_history = preprocess_for_models(raw_history)
        
        if len(sanitised_history) < 7:
            sanitised_history = pd.concat([sanitised_history] * 7, ignore_index=True)

        # 2. Instantiate core internal models
        ortho_engine = AcuteInjuryRiskEngine(trained_model=None)
        cns_engine = CNSFatigueEngine(anomaly_detector=None)
        metabolic_engine = MetabolicRegulatorEngine(weight_regressor=None)

        # 3. Request evaluations from inference vectors
        m1_data = json.loads(ortho_engine.predict_latest(sanitised_history))
        m2_data = json.loads(cns_engine.predict_latest(sanitised_history))
        m3_data = json.loads(metabolic_engine.predict_latest(sanitised_history, target_category_floor_kg=72.0))
        
        # 4. Generate the feature wrapped payload
        wrapped_payload = BodyWrappedEngine.generate_weekly_recap(sanitised_history)

        # 5. Serve the complete compiled data package via HTTP JSON
        return {
            "success": True,
            "metrics": {
                "injury_risk_assessment": m1_data,
                "cns_fatigue_assessment": m2_data,
                "metabolic_assessment": m3_data
            },
            "weekly_wrapped": wrapped_payload
        }

    except Exception as error_context:
        raise HTTPException(status_code=500, detail=f"Pipeline inference breakdown: {str(error_context)}")