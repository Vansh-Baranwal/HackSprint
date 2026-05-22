"""
generate_csv.py — Synthetic Wearable Dataset Generator
=======================================================
Generates a large, realistic multi-athlete CSV suitable for:
    1. Local pipeline testing (fed into main.py or the streaming endpoint)
    2. Uploading to Google Drive / Dropbox / Supabase as the WEARABLE_DATA_URL
       so Render can pull it at cold-boot

Run:
    python generate_csv.py                    # default: 3 athletes x 365 days
    python generate_csv.py --athletes 10 --days 730
    python generate_csv.py --output data/wearable_data.csv

Output: data/wearable_data.csv
        (excluded from Git via .gitignore — upload manually to your storage URL)
"""

import argparse
import os
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd


# ── Metadata columns injected to test sanitisation logic ─────────────────────
DEVICE_NAMES = ["GarminFenix7", "AppleWatchUltra2", "WHOOPBand4", "PolarVantageV3"]
MANUFACTURERS = ["Garmin", "Apple", "WHOOP", "Polar"]
DATA_SOURCES   = ["BLE_SYNC", "ANT+_SYNC", "WIFI_UPLOAD", "MANUAL_LOG"]


def _generate_athlete_days(
    athlete_id: str,
    days: int,
    base_date: datetime,
    rng: np.random.Generator,
) -> pd.DataFrame:
    """
    Generates a single athlete's sequential daily telemetry array.

    Injects:
        - Realistic week-level periodisation cycles (load/deload)
        - Random NaN gaps (3-5 day blocks) to stress-test imputation guards
        - Occasional outlier spikes to test anomaly detection sensitivity
    """
    # ── Periodisation: high load weeks 1-3, deload week 4 ────────────────────
    # Each element of the pattern represents one WEEK (7 days), so we need
    # ceil(days / 7) repetitions of the 4-element cycle, then slice to `days`.
    import math
    n_weeks = math.ceil(days / 7)
    weekly_pattern = np.tile([1.0, 1.1, 1.2, 0.7], math.ceil(n_weeks / 4))[:n_weeks]
    week_intensity = np.repeat(weekly_pattern, 7)[:days]

    duration_base = rng.choice([45.0, 60.0, 90.0, 0.0], size=days, p=[0.35, 0.30, 0.10, 0.25])
    intensity_opts = rng.choice(["low", "medium", "high"], size=days, p=[0.30, 0.45, 0.25])

    data = {
        "timestamp": [base_date + timedelta(days=i) for i in range(days)],
        "athlete_id": athlete_id,

        # Model 1 — Injury Risk inputs
        "workout_duration_minutes": duration_base * week_intensity,
        "workout_intensity":        intensity_opts,
        "running_power":            rng.uniform(200, 360, size=days) * week_intensity,
        "cadence":                  rng.uniform(152, 182, size=days),
        "weight_kg":                rng.uniform(70.0, 74.0, size=days),
        "bmi":                      rng.uniform(21.8, 23.0, size=days),
        "muscle_mass_kg":           rng.uniform(33.0, 36.0, size=days),
        "ovulation_tracking":       rng.choice([0, 1], size=days, p=[0.85, 0.15]),
        "symptoms_logging":         rng.choice(
            ["none", "sore", "severe_soreness"], size=days, p=[0.68, 0.27, 0.05]
        ),

        # Model 2 — CNS Fatigue inputs (nocturnal telemetry)
        "resting_heart_rate":       rng.uniform(46, 58, size=days),
        "hrv_rmssd":                rng.uniform(40, 78, size=days),
        "hrv_sdnn":                 rng.uniform(48, 82, size=days),
        "sleep_respiratory_rate":   rng.uniform(11.5, 15.5, size=days),
        "sleep_efficiency":         rng.uniform(83, 97, size=days),
        "skin_temperature_c":       rng.uniform(36.1, 36.9, size=days),

        # Model 3 — Metabolic inputs
        "calories_consumed":        rng.uniform(2100, 3200, size=days),
        "basal_metabolic_rate":     np.full(days, rng.uniform(1680, 1820)),
        "active_calories":          rng.uniform(250, 1200, size=days) * week_intensity,
        "blood_glucose_mg_dl":      rng.uniform(78, 145, size=days),
        "met_scores":               rng.uniform(1.0, 5.0, size=days) * week_intensity,

        # Device metadata (must be stripped by sanitise_dataframe before inference)
        "device_name":        rng.choice(DEVICE_NAMES, size=days),
        "watch_manufacturer": rng.choice(MANUFACTURERS, size=days),
        "sync_timestamp":     [datetime.now(timezone.utc).isoformat()] * days,
        "data_source":        rng.choice(DATA_SOURCES, size=days),
    }

    df = pd.DataFrame(data)

    # Inject realistic NaN gaps (illness/device sync failures)
    gap_starts = rng.integers(10, days - 10, size=3)
    for start in gap_starts:
        gap_len = int(rng.integers(2, 5))
        df.loc[start:start + gap_len, ["resting_heart_rate", "hrv_rmssd"]] = np.nan

    weight_gap = int(rng.integers(15, days - 5))
    df.loc[weight_gap:weight_gap + 2, ["weight_kg", "muscle_mass_kg"]] = np.nan

    # Inject high-acuity illness spike (days 45-48 of this athlete's timeline)
    if days > 52:
        df.loc[45:48, "resting_heart_rate"] += rng.uniform(6, 10, size=4)
        df.loc[45:48, "hrv_rmssd"] -= rng.uniform(12, 18, size=4)
        df.loc[45:48, "skin_temperature_c"] += rng.uniform(0.4, 0.8, size=4)

    return df


def generate_dataset(
    n_athletes: int,
    days_per_athlete: int,
    output_path: str,
    seed: int = 42,
) -> None:
    """
    Generates a multi-athlete dataset and writes it to CSV without
    loading the full frame into RAM (writes athlete-by-athlete).

    For n=10 athletes × 365 days: ~3,650 rows × 25 cols ≈ 730 KB.
    For n=100 athletes × 730 days: ~73,000 rows ≈ 14 MB.
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    rng = np.random.default_rng(seed)
    base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    base_date -= timedelta(days=days_per_athlete)

    write_header = True
    total_rows = 0

    for i in range(1, n_athletes + 1):
        athlete_id = f"athlete_{i:04d}"
        df = _generate_athlete_days(athlete_id, days_per_athlete, base_date, rng)
        df.to_csv(output_path, mode="a", header=write_header, index=False)
        write_header = False
        total_rows += len(df)
        print(f"  Written: {athlete_id}  ({len(df)} rows)  cumulative: {total_rows}")

    size_kb = os.path.getsize(output_path) / 1024
    print(f"\nDataset ready: {output_path}")
    print(f"  Total rows  : {total_rows:,}")
    print(f"  File size   : {size_kb:.1f} KB  ({size_kb / 1024:.2f} MB)")
    print(f"\nNext steps:")
    print(f"  1. Upload {output_path} to Google Drive / Dropbox (set to 'Anyone with link')")
    print(f"  2. Get the direct download URL:")
    print(f"       Google Drive : https://drive.google.com/uc?export=download&id=FILE_ID")
    print(f"       Dropbox      : change ?dl=0 to ?dl=1 in the share link")
    print(f"  3. Set WEARABLE_DATA_URL in your Render dashboard Environment tab")
    print(f"  4. Test locally: POST http://localhost:8000/predict/stream-csv")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate synthetic wearable telemetry CSV for ScreenSense."
    )
    parser.add_argument("--athletes", type=int, default=3,
                        help="Number of athlete profiles to generate (default: 3)")
    parser.add_argument("--days", type=int, default=365,
                        help="Days of history per athlete (default: 365)")
    parser.add_argument("--output", type=str, default="data/wearable_data.csv",
                        help="Output CSV path (default: data/wearable_data.csv)")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for reproducibility (default: 42)")
    args = parser.parse_args()

    print(f"Generating {args.athletes} athlete(s) × {args.days} days "
          f"-> {args.output} ...")
    generate_dataset(args.athletes, args.days, args.output, args.seed)
