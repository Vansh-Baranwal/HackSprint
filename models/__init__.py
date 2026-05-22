"""
models — Athlete Performance Prediction Engine
===============================================
Three-model suite for real-time athlete risk assessment:

    Model 1 · AcuteInjuryRiskEngine   (injury_risk_engine.py)
        Orthopedic soft-tissue / stress-fracture risk predictor.
        Core signal: ACWR, cadence, structural laxity, symptom score.

    Model 2 · CNSFatigueEngine         (cns_fatigue_engine.py)
        Nocturnal telemetry anomaly detector for CNS overreaching
        and early viral/illness onset.
        Core signal: HRV delta, RHR delta, skin temperature, respiratory rate.

    Model 3 · MetabolicRegulatorEngine (metabolic_regulator.py)
        Thermodynamic weight-trajectory projector and glycogen
        depletion estimator for weight-class safety and fueling.
        Core signal: net caloric balance, BMR, blood glucose, MET score.

Usage
-----
    from models import AcuteInjuryRiskEngine, CNSFatigueEngine, MetabolicRegulatorEngine

    injury_engine    = AcuteInjuryRiskEngine()
    cns_engine       = CNSFatigueEngine()
    metabolic_engine = MetabolicRegulatorEngine()

    result = injury_engine.predict_latest(athlete_df)
"""

from .injury_risk_engine import AcuteInjuryRiskEngine
from .cns_fatigue_engine import CNSFatigueEngine
from .metabolic_regulator import MetabolicRegulatorEngine

__all__ = [
    "AcuteInjuryRiskEngine",
    "CNSFatigueEngine",
    "MetabolicRegulatorEngine",
]
