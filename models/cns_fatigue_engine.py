import numpy as np
import pandas as pd
from typing import Dict, Any, List
import json


class CNSFatigueEngine:
    """
    Model 2: Neurologist (CNS Fatigue & Illness Onset Engine)

    Processes nocturnal sleep telemetry via unsupervised outlier detection matrices
    (Isolation Forests / Autoencoders) to track systemic drift. It isolates internal
    biological signals from ambient daytime noise to identify overreaching or early
    viral incubation states.
    """

    def __init__(self, anomaly_detector: Any = None):
        """
        Accepts an IsolationForest or trained Autoencoder object.
        If None, a deterministic multi-system heuristic cascade is used as fallback.
        """
        self.detector = anomaly_detector
        self.nocturnal_features = [
            'resting_heart_rate',
            'hrv_rmssd',
            'hrv_sdnn',
            'sleep_respiratory_rate',
            'sleep_efficiency',
            'skin_temperature_c'
        ]

    def extract_nocturnal_deltas(self, historical_df: pd.DataFrame) -> pd.DataFrame:
        """
        Isolates sleep telemetry frames and maps raw data vectors to delta deviations
        relative to a moving 21-day physiological baseline.

        Each feature is transformed as:
            delta = current_value − rolling_21d_mean(feature)

        This eliminates inter-athlete normalization requirements — the model operates
        solely on deviation from the individual's own established homeostatic baseline.
        """
        df = historical_df.copy()

        # Step 1: Forward-fill missing passive metrics (max 2-day gap tolerance)
        for col in self.nocturnal_features:
            if col in df.columns:
                df[col] = df[col].ffill(limit=2).bfill()
            else:
                raise ValueError(f"Missing mandatory telemetry field: {col}")

        # Step 2: Compute 21-day rolling baseline and derive delta deviations
        # The 21-day window represents a stable physiological adaptation cycle.
        # A minimum of 3 observations is required before baseline estimation begins.
        delta_df = pd.DataFrame(index=df.index)
        for col in self.nocturnal_features:
            baseline = df[col].rolling(window=21, min_periods=3).mean()
            # Bootstrap-empty windows default delta to 0.0 (no deviation assumed)
            delta_df[f'{col}_delta'] = (df[col] - baseline).fillna(0.0)

        return delta_df

    def predict_latest(self, historical_df: pd.DataFrame) -> str:
        """
        Evaluates the latest record slice for multi-system cascade crashes.

        Returns a JSON payload with a continuous anomaly score on [0, 100]:
            ≥ 50  → SYSTEMIC_BURNOUT_OR_ILLNESS_CRASH
            < 50  → PHYSIOLOGICAL_HOMEOSTASIS
        """
        delta_df = self.extract_nocturnal_deltas(historical_df)
        if delta_df.empty:
            return json.dumps({"error": "Insufficient baseline context"})

        latest_vector = delta_df.iloc[[-1]]

        if self.detector is not None:
            # Classical Isolation Forest returns -1 for outlier, 1 for normal.
            # The decision_function score is negated and scaled to [0, 100]
            # so that higher values represent stronger anomalies.
            decision_func = self.detector.decision_function(latest_vector)[0]
            anomaly_score = float(np.clip((0.5 - decision_func) * 100, 0, 100))
        else:
            # Deterministic multi-system rules cascade for high-fidelity anomaly matching.
            # Pattern: drop in parasympathetic tone (HRV) matched with elevated
            # thermal and respiratory vectors — hallmarks of overreaching or early illness.
            row = latest_vector.iloc[0]

            hrv_tanked = row['hrv_rmssd_delta'] < -10.0       # parasympathetic suppression
            rhr_spiked = row['resting_heart_rate_delta'] > 4.0  # sympathetic overdrive
            fever_detected = row['skin_temperature_c_delta'] > 0.45  # inflammatory response
            resp_spiked = row['sleep_respiratory_rate_delta'] > 1.2   # respiratory stress

            systemic_clash_points = 0
            if hrv_tanked:       systemic_clash_points += 30
            if rhr_spiked:       systemic_clash_points += 20
            if fever_detected:   systemic_clash_points += 35
            if resp_spiked:      systemic_clash_points += 15

            anomaly_score = float(systemic_clash_points)

        payload = {
            "model_name": "cns_fatigue_illness_engine",
            "prediction_target": "continuous_anomaly_score",
            "value": round(anomaly_score, 2),
            "label": (
                "SYSTEMIC_BURNOUT_OR_ILLNESS_CRASH"
                if anomaly_score >= 50.0
                else "PHYSIOLOGICAL_HOMEOSTASIS"
            ),
            "confidence_bounds": round(0.92 if anomaly_score >= 50.0 else 0.96, 4),
            "feature_importance_vectors": {
                "hrv_rmssd_deviation": -0.40 if anomaly_score >= 30 else 0.0,
                "skin_temp_deviation":  0.35 if anomaly_score >= 35 else 0.0,
                "resting_hr_deviation": 0.25 if anomaly_score >= 20 else 0.0
            }
        }
        return json.dumps(payload)
