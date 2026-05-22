"""
weekly_wrapped.py — "Spotify Wrapped for Your Body" Engine
===========================================================
Transforms multi-model physiological data matrices into a shareable,
gamified weekly summary payload with slide-based narrative cards.

Sits at the HackSprint backend root so it imports cleanly alongside
the models/ package without touching the Next.js prediction_engine/ dir.

Usage:
    from weekly_wrapped import BodyWrappedEngine
    payload = BodyWrappedEngine.generate_weekly_recap(athlete_df)
"""

import pandas as pd
import numpy as np
from typing import Any, Dict, List, Optional


class BodyWrappedEngine:
    """
    Parses chronological history blocks to build unique user archetypes,
    strain totals, and recovery metrics based on the last 7 days of records.

    All methods are static — the engine holds no mutable state and is safe
    for concurrent async invocations from FastAPI's thread pool.
    """

    # ── Archetype thresholds (tunable via environment config in future) ───────
    _HRV_HIGH_THRESHOLD:  float = 65.0   # ms RMSSD — parasympathetic dominance
    _HRV_LOW_THRESHOLD:   float = 45.0   # ms RMSSD — CNS suppression / overreach
    _SLEEP_EFF_THRESHOLD: float = 92.0   # % — deep restorative architecture

    @staticmethod
    def _safe_slice(df: pd.DataFrame, start: int, end: Optional[int]) -> pd.DataFrame:
        """Returns a safe iloc slice, clamping indices to frame bounds."""
        n = len(df)
        start_idx = max(0, n + start)
        end_idx = max(0, n + end) if end is not None else n
        return df.iloc[start_idx:end_idx].copy()

    @staticmethod
    def _pct_change(current: float, previous: float) -> int:
        """Week-over-week percentage change with zero-division guard."""
        return int(((current - previous) / (previous + 1e-5)) * 100)

    @staticmethod
    def _resolve_archetype(avg_hrv: float, avg_sleep_eff: float) -> Dict[str, Any]:
        """
        Maps HRV + sleep efficiency vectors to a named physiological archetype.

        Three tiers aligned to sports-science overreaching classifications:
            Tier 1 — Supercompensation State  (high HRV + deep sleep)
            Tier 2 — Functional Overreaching  (low HRV — caution zone)
            Tier 3 — Baseline Homeostasis     (everything else)
        """
        if avg_hrv >= BodyWrappedEngine._HRV_HIGH_THRESHOLD \
                and avg_sleep_eff >= BodyWrappedEngine._SLEEP_EFF_THRESHOLD:
            return {
                "vibe_title": "The Unstoppable Engine",
                "vibe_description": (
                    "Your parasympathetic nervous system is firing on all cylinders. "
                    "Perfect recovery architecture and deep sleep staging detected."
                ),
                "theme_colors": ["#00F2FE", "#4FACFE"],   # Neon Blue-Cyan
                "tier": "supercompensation",
            }
        elif avg_hrv < BodyWrappedEngine._HRV_LOW_THRESHOLD:
            return {
                "vibe_title": "The Red-Line Warrior",
                "vibe_description": (
                    "Massive training accumulation or baseline fatigue spotted. "
                    "Your CNS is calling for a strategic deload sequence."
                ),
                "theme_colors": ["#F43F5E", "#BE123C"],   # Aggressive Coral-Red
                "tier": "functional_overreaching",
            }
        else:
            return {
                "vibe_title": "The Steady Cruiser",
                "vibe_description": (
                    "Balanced recovery metrics paired with consistent daily energy outputs. "
                    "True homeostatic flow state."
                ),
                "theme_colors": ["#10B981", "#059669"],   # Emerald Green
                "tier": "homeostasis",
            }

    @staticmethod
    def generate_weekly_recap(historical_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Builds the full Wrapped payload from a chronological telemetry DataFrame.

        Args:
            historical_df: Time-ordered rows from the athlete's history.
                           Must contain at least 7 rows to build a valid window.

        Returns:
            Dict with 4 slide cards + a shareable_summary_card.
            On insufficient data, returns {"error": <message>}.
        """
        if len(historical_df) < 7:
            return {
                "error": (
                    "Insufficient telemetry history. "
                    "Need minimum 7 records to generate a Wrapped summary."
                )
            }

        # ── Segment into current and prior 7-day windows ─────────────────────
        weekly_slice   = BodyWrappedEngine._safe_slice(historical_df, -7,  None)
        previous_slice = (
            BodyWrappedEngine._safe_slice(historical_df, -14, -7)
            if len(historical_df) >= 14
            else weekly_slice
        )

        # ══════════════════════════════════════════════════════════════════════
        # CARD 1: EXERTION AUDIO STREAM — Total Volume Stats
        # ══════════════════════════════════════════════════════════════════════
        total_minutes_moving = int(
            weekly_slice.get("workout_duration_minutes", pd.Series([0])).fillna(0).sum()
        )
        total_active_burn = int(
            weekly_slice.get("active_calories", pd.Series([0])).fillna(0).sum()
        )
        prev_burn = previous_slice.get("active_calories", pd.Series([0])).fillna(0).sum()
        burn_velocity_pct = BodyWrappedEngine._pct_change(total_active_burn, float(prev_burn))

        # ══════════════════════════════════════════════════════════════════════
        # CARD 2: TOP WORKOUT ANTHEMS — Dominant Training Stimulus
        # ══════════════════════════════════════════════════════════════════════
        if "workout_intensity" in weekly_slice.columns:
            mode_series = weekly_slice["workout_intensity"].dropna().astype(str)
            top_intensity_mode = (
                mode_series.mode().iloc[0].upper()
                if not mode_series.empty else "HIGH INTENSITY"
            )
        else:
            top_intensity_mode = "HIGH INTENSITY"

        # Session count breakdown per intensity level
        intensity_counts: Dict[str, int] = {}
        if "workout_intensity" in weekly_slice.columns:
            counts = weekly_slice["workout_intensity"].dropna().str.lower().value_counts()
            intensity_counts = {k: int(v) for k, v in counts.items()}

        # ══════════════════════════════════════════════════════════════════════
        # CARD 3: THE PHYSIOLOGICAL VIBE CHECK — CNS Drift Archetype
        # ══════════════════════════════════════════════════════════════════════
        avg_hrv = float(
            weekly_slice.get("hrv_rmssd", pd.Series([55.0])).fillna(55.0).mean()
        )
        avg_sleep_eff = float(
            weekly_slice.get("sleep_efficiency", pd.Series([88.0])).fillna(88.0).mean()
        )
        avg_rhr = float(
            weekly_slice.get("resting_heart_rate", pd.Series([52.0])).fillna(52.0).mean()
        )
        archetype = BodyWrappedEngine._resolve_archetype(avg_hrv, avg_sleep_eff)

        # ══════════════════════════════════════════════════════════════════════
        # CARD 4: UNIQUE BODILY INSIGHT — Metabolic Peak Quirk
        # ══════════════════════════════════════════════════════════════════════
        glucose_series = weekly_slice.get("blood_glucose_mg_dl", pd.Series([90.0])).fillna(90.0)
        peak_glucose   = float(glucose_series.max())
        peak_day_name  = "Wednesday"   # safe fallback

        if not glucose_series.empty:
            peak_loc = glucose_series.idxmax()
            if "timestamp" in weekly_slice.columns:
                try:
                    peak_day_name = pd.to_datetime(
                        weekly_slice.loc[peak_loc, "timestamp"]
                    ).strftime("%A")
                except Exception:
                    pass   # if timestamp parsing fails, fallback is already set

        # Recovery trend: compare avg HRV this week vs prior week
        prev_hrv = float(
            previous_slice.get("hrv_rmssd", pd.Series([55.0])).fillna(55.0).mean()
        )
        hrv_trend_pct = BodyWrappedEngine._pct_change(avg_hrv, prev_hrv)

        # ══════════════════════════════════════════════════════════════════════
        # CONSOLIDATED SHAREABLE DATALAYER PAYLOAD
        # ══════════════════════════════════════════════════════════════════════
        return {
            "time_horizon": "Past 7 Days",
            "slides": [
                {
                    "slide_id": "total_minutes",
                    "header": "YOUR BODY WAS TUNED IN",
                    "primary_metric": f"{total_minutes_moving} mins",
                    "subtext": (
                        f"Spent in active training states. "
                        f"Moving {total_active_burn:,} active kilocalories total."
                    ),
                    "percentage_trend_label": (
                        f"{'+' if burn_velocity_pct >= 0 else ''}"
                        f"{burn_velocity_pct}% vs last week"
                    ),
                },
                {
                    "slide_id": "top_genre",
                    "header": "YOUR GO-TO STIMULUS",
                    "primary_metric": top_intensity_mode,
                    "subtext": (
                        "This training intensity single-handedly dominated your "
                        "neuromuscular profile this week."
                    ),
                    "percentage_trend_label": "Top Training Genre",
                    "intensity_breakdown": intensity_counts,
                },
                {
                    "slide_id": "cns_vibe",
                    "header": "YOUR PHYSIOLOGICAL VIBE TYPE",
                    "primary_metric": archetype["vibe_title"],
                    "subtext": archetype["vibe_description"],
                    "theme_colors": archetype["theme_colors"],
                    "recovery_metrics": {
                        "avg_hrv_rmssd_ms": round(avg_hrv, 1),
                        "avg_sleep_efficiency_pct": round(avg_sleep_eff, 1),
                        "avg_resting_hr_bpm": round(avg_rhr, 1),
                        "hrv_trend_vs_last_week": (
                            f"{'+' if hrv_trend_pct >= 0 else ''}{hrv_trend_pct}%"
                        ),
                    },
                },
                {
                    "slide_id": "body_quirk",
                    "header": "THE GLYCOGEN HIGH-POINT",
                    "primary_metric": f"{int(peak_glucose)} mg/dL",
                    "subtext": (
                        f"Your peak systemic fuel saturation window lit up the charts "
                        f"on {peak_day_name}!"
                    ),
                    "percentage_trend_label": "Metabolic Peak",
                },
            ],
            "shareable_summary_card": {
                "title": "ScreenSense Body Wrapped",
                "total_minutes_active": total_minutes_moving,
                "total_calories_burned": total_active_burn,
                "archetype": archetype["vibe_title"],
                "archetype_tier": archetype["tier"],
                "avg_sleep_efficiency": f"{int(avg_sleep_eff)}%",
                "avg_hrv_ms": round(avg_hrv, 1),
                "theme_colors": archetype["theme_colors"],
            },
        }
