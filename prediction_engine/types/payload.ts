export interface SleepStage {
  stage: 'awake' | 'light' | 'deep' | 'rem';
  start: string;
  duration_minutes: number;
}

export interface WorkoutMetrics {
  workout_type: string;
  duration_minutes: number;
  intensity: 'low' | 'moderate' | 'high' | 'max';
  avg_heart_rate: number;
  max_heart_rate: number;
  calories_burned: number;
  distance_km?: number;
  pace_min_km?: number;
  cadence?: number;
  avg_speed_kmh?: number;
  strokes_per_minute?: number;
  laps?: number;
  training_load: number;
  gps_route?: { lat: number; lng: number; altitude: number }[];
}

export interface SleepMetrics {
  total_duration_minutes: number;
  sleep_score: number;
  rem_minutes: number;
  deep_minutes: number;
  light_minutes: number;
  awake_minutes: number;
  sleep_efficiency: number;
  sleep_latency_minutes: number;
  stages: SleepStage[];
}

export interface WearablePayload {
  // Metadata
  provider: string;
  provider_full_name: string;
  watch_model: string;
  device_manufacturer: string;
  firmware_version: string;
  battery_status: number;
  sync_timestamp: string;
  user_id: string;
  session_id: string;

  // Cardiovascular
  heart_rate: number;
  resting_heart_rate: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  min_heart_rate: number;
  hrv_rmssd: number;
  hrv_sdnn: number;
  ecg_sample_rate?: number;
  afib_detected: boolean;
  recovery_score: number;
  strain_score: number;
  readiness_score: number;

  // Oxygen & Respiration
  spo2: number;
  oxygen_saturation_avg: number;
  respiratory_rate: number;
  breaths_per_minute: number;
  respiration_variability: number;
  snoring_minutes?: number;

  // Activity
  steps: number;
  calories_burned: number;
  active_calories: number;
  distance_km: number;
  cadence?: number;
  speed_kmh?: number;
  pace_min_km?: number;
  active_minutes: number;
  sedentary_minutes: number;
  floors_climbed: number;
  elevation_gain_m: number;
  vo2_max: number;

  // Sleep
  sleep: SleepMetrics | null;

  // Workout
  workout: WorkoutMetrics | null;

  // Body Metrics
  weight_kg: number;
  bmi: number;
  body_fat_percentage: number;
  lean_mass_kg: number;
  hydration_percentage: number;
  body_temperature_c: number;
  skin_temperature_c: number;

  // Biomarkers
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  blood_glucose_mg_dl?: number;
  ketones_mmol?: number;

  // Female Health (sometimes present)
  menstrual_cycle_day?: number;
  fertility_window?: boolean;

  // Nutrition
  calories_consumed?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  water_ml?: number;

  // Stress
  stress_level: number;
  stress_category: 'low' | 'moderate' | 'high' | 'very_high';
}
