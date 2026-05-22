import { WearablePayload, WorkoutMetrics, SleepMetrics, SleepStage } from '@/types/payload';

const PROVIDERS = [
  { id: 'fitbit', name: 'Fitbit', manufacturer: 'Fitbit Inc.', models: ['Fitbit Sense 2', 'Fitbit Charge 6', 'Fitbit Versa 4'] },
  { id: 'garmin', name: 'Garmin', manufacturer: 'Garmin Ltd.', models: ['Garmin Fenix 8', 'Garmin Venu 3', 'Garmin Forerunner 965'] },
  { id: 'oura', name: 'Oura', manufacturer: 'Oura Health', models: ['Oura Ring Gen 4', 'Oura Ring Gen 3'] },
  { id: 'whoop', name: 'WHOOP', manufacturer: 'WHOOP Inc.', models: ['WHOOP 4.0', 'WHOOP 5.0'] },
  { id: 'apple', name: 'Apple Watch', manufacturer: 'Apple Inc.', models: ['Apple Watch Series 10', 'Apple Watch Ultra 2'] },
  { id: 'samsung', name: 'Samsung Galaxy Watch', manufacturer: 'Samsung Electronics', models: ['Galaxy Watch 7', 'Galaxy Watch Ultra'] },
];

const WORKOUT_TYPES = ['running', 'cycling', 'swimming', 'strength_training', 'yoga', 'hiking', 'rowing', 'elliptical', 'tennis', 'basketball'];

// Persistent state across calls to simulate continuity
const state = {
  baseHeartRate: 68,
  baseHrv: 48,
  baseSpo2: 98,
  baseSteps: 0,
  lastWorkoutTime: 0,
  workoutActive: false,
  lastSleepTime: 0,
  sessionStart: Date.now(),
  providerIndex: 0,
  weightKg: 74.2,
  vo2max: 44.5,
  dayStart: Date.now() - (new Date().getHours() * 3600000),
};

function rand(min: number, max: number, decimals = 0): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function drift(base: number, maxDelta: number, min: number, max: number, decimals = 0): number {
  const delta = (Math.random() - 0.5) * 2 * maxDelta;
  return parseFloat(Math.min(max, Math.max(min, base + delta)).toFixed(decimals));
}

function spike(base: number, spikeChance = 0.05, spikeMultiplier = 1.3): number {
  if (Math.random() < spikeChance) return Math.round(base * spikeMultiplier);
  return base;
}

function generateSleepMetrics(hour: number): SleepMetrics | null {
  // Sleep data only if it's morning or the person just woke up (hours 5-9)
  const showSleep = hour >= 5 && hour <= 9;
  if (!showSleep && Math.random() > 0.15) return null;

  const totalMinutes = rand(360, 510);
  const remMinutes = Math.round(totalMinutes * rand(0.18, 0.25, 2));
  const deepMinutes = Math.round(totalMinutes * rand(0.12, 0.22, 2));
  const lightMinutes = Math.round(totalMinutes * rand(0.45, 0.55, 2));
  const awakeMinutes = totalMinutes - remMinutes - deepMinutes - lightMinutes;

  const stages: SleepStage[] = [
    { stage: 'light', start: '2026-05-22T22:30:00Z', duration_minutes: lightMinutes },
    { stage: 'deep', start: '2026-05-22T23:15:00Z', duration_minutes: deepMinutes },
    { stage: 'rem', start: '2026-05-23T01:30:00Z', duration_minutes: remMinutes },
    { stage: 'awake', start: '2026-05-23T05:45:00Z', duration_minutes: awakeMinutes },
  ];

  return {
    total_duration_minutes: totalMinutes,
    sleep_score: rand(62, 96),
    rem_minutes: remMinutes,
    deep_minutes: deepMinutes,
    light_minutes: lightMinutes,
    awake_minutes: Math.max(0, awakeMinutes),
    sleep_efficiency: rand(78, 97, 1),
    sleep_latency_minutes: rand(5, 28),
    stages,
  };
}

function generateWorkout(): WorkoutMetrics | null {
  const now = Date.now();
  // Workout appears ~15% of the time, not too frequent
  if (now - state.lastWorkoutTime < 60000 || Math.random() > 0.12) return null;
  state.lastWorkoutTime = now;

  const type = WORKOUT_TYPES[Math.floor(Math.random() * WORKOUT_TYPES.length)];
  const duration = rand(20, 75);
  const intensity = (['low', 'moderate', 'high', 'max'] as const)[rand(0, 3)];
  const intensityHrFactor = { low: 0.65, moderate: 0.75, high: 0.85, max: 0.95 }[intensity];
  const maxHr = Math.round(state.baseHeartRate * (intensityHrFactor + 0.4));
  const avgHr = Math.round(maxHr * 0.88);

  const workout: WorkoutMetrics = {
    workout_type: type,
    duration_minutes: duration,
    intensity,
    avg_heart_rate: avgHr,
    max_heart_rate: maxHr,
    calories_burned: Math.round(duration * rand(7, 14, 1)),
    training_load: rand(40, 180),
  };

  if (type === 'running' || type === 'hiking') {
    const distance = parseFloat((duration * rand(0.08, 0.13, 3)).toFixed(2));
    workout.distance_km = distance;
    workout.pace_min_km = parseFloat((duration / distance).toFixed(2));
    workout.cadence = rand(155, 185);
    workout.gps_route = Array.from({ length: 5 }, (_, i) => ({
      lat: 12.9716 + (i * 0.001) + rand(-0.0005, 0.0005, 4),
      lng: 77.5946 + (i * 0.001) + rand(-0.0005, 0.0005, 4),
      altitude: rand(890, 920),
    }));
  }

  if (type === 'cycling') {
    workout.avg_speed_kmh = rand(22, 36, 1);
    workout.distance_km = parseFloat((duration * workout.avg_speed_kmh / 60).toFixed(2));
    workout.cadence = rand(75, 105);
  }

  if (type === 'swimming') {
    workout.strokes_per_minute = rand(25, 45);
    workout.laps = rand(20, 80);
  }

  return workout;
}

function getStressCategory(level: number): WearablePayload['stress_category'] {
  if (level < 25) return 'low';
  if (level < 50) return 'moderate';
  if (level < 75) return 'high';
  return 'very_high';
}

export function generatePayload(): WearablePayload {
  const now = new Date();
  const hour = now.getHours();
  const minuteOfDay = hour * 60 + now.getMinutes();
  const elapsed = (Date.now() - state.sessionStart) / 1000;

  // Drift persistent state
  state.baseHeartRate = drift(state.baseHeartRate, 4, 48, 105);
  state.baseHrv = drift(state.baseHrv, 3, 18, 95);
  state.baseSpo2 = drift(state.baseSpo2, 0.5, 94, 100, 1);
  state.baseSteps += rand(0, 350);

  // Pick provider round-robin with occasional random jumps
  if (Math.random() < 0.3) {
    state.providerIndex = (state.providerIndex + 1) % PROVIDERS.length;
  }
  const provider = PROVIDERS[state.providerIndex];
  const model = provider.models[Math.floor(Math.random() * provider.models.length)];

  const heartRate = spike(Math.round(state.baseHeartRate), 0.04, 1.25);
  const hrv_rmssd = spike(state.baseHrv, 0.03, 0.7);
  const spo2 = parseFloat(state.baseSpo2.toFixed(1));

  // Stress inversely correlated with HRV
  const stressBase = Math.max(5, Math.min(95, 100 - (state.baseHrv / 100 * 80)));
  const stressLevel = Math.round(drift(stressBase, 8, 5, 95));

  // Steps vary by time of day
  const stepsMultiplier = hour >= 7 && hour <= 21 ? 1.0 : 0.05;
  const steps = Math.round(state.baseSteps * stepsMultiplier);

  // Blood pressure varies with HR
  const sysBP = Math.round(115 + (heartRate - 65) * 0.4 + rand(-5, 5));
  const diaBP = Math.round(75 + (heartRate - 65) * 0.2 + rand(-3, 3));

  const includeNutrition = Math.random() > 0.4;
  const includeFemaleHealth = Math.random() > 0.75;
  const includeGlucose = Math.random() > 0.6;

  const payload: WearablePayload = {
    // Metadata
    provider: provider.id,
    provider_full_name: provider.name,
    watch_model: model,
    device_manufacturer: provider.manufacturer,
    firmware_version: `${rand(1, 4)}.${rand(0, 9)}.${rand(0, 99)}`,
    battery_status: rand(12, 100),
    sync_timestamp: now.toISOString(),
    user_id: `synthetic_user_${provider.id}_001`,
    session_id: `sess_${Math.random().toString(36).substring(2, 10)}`,

    // Cardiovascular
    heart_rate: heartRate,
    resting_heart_rate: Math.max(42, Math.round(state.baseHeartRate - rand(8, 18))),
    avg_heart_rate: Math.round(state.baseHeartRate + rand(-5, 5)),
    max_heart_rate: Math.round(state.baseHeartRate + rand(30, 60)),
    min_heart_rate: Math.max(40, Math.round(state.baseHeartRate - rand(15, 25))),
    hrv_rmssd: parseFloat(hrv_rmssd.toFixed(1)),
    hrv_sdnn: parseFloat((hrv_rmssd * rand(1.2, 1.8, 2)).toFixed(1)),
    ecg_sample_rate: Math.random() > 0.7 ? 500 : undefined,
    afib_detected: Math.random() < 0.008,
    recovery_score: rand(45, 98),
    strain_score: parseFloat(rand(4, 18, 1).toFixed(1)),
    readiness_score: rand(40, 100),

    // Oxygen & Respiration
    spo2,
    oxygen_saturation_avg: parseFloat((spo2 - rand(0, 0.5, 1)).toFixed(1)),
    respiratory_rate: rand(12, 20),
    breaths_per_minute: rand(12, 20),
    respiration_variability: parseFloat(rand(0.5, 3.5, 2).toFixed(2)),
    snoring_minutes: Math.random() > 0.5 ? rand(0, 45) : undefined,

    // Activity
    steps,
    calories_burned: Math.round(steps * 0.045 + rand(200, 500)),
    active_calories: Math.round(steps * 0.035 + rand(50, 200)),
    distance_km: parseFloat((steps * 0.00078).toFixed(3)),
    cadence: Math.random() > 0.5 ? rand(95, 125) : undefined,
    speed_kmh: Math.random() > 0.6 ? parseFloat(rand(0, 8, 1).toFixed(1)) : undefined,
    pace_min_km: Math.random() > 0.6 ? parseFloat(rand(5, 15, 2).toFixed(2)) : undefined,
    active_minutes: rand(0, Math.min(minuteOfDay, 180)),
    sedentary_minutes: rand(0, Math.min(minuteOfDay, 600)),
    floors_climbed: rand(0, 28),
    elevation_gain_m: rand(0, 180),
    vo2_max: parseFloat(drift(state.vo2max, 0.2, 28, 68, 1).toFixed(1)),

    // Sleep
    sleep: generateSleepMetrics(hour),

    // Workout
    workout: generateWorkout(),

    // Body Metrics
    weight_kg: parseFloat(drift(state.weightKg, 0.1, 50, 150, 1).toFixed(1)),
    bmi: parseFloat(rand(18.5, 32, 1).toFixed(1)),
    body_fat_percentage: parseFloat(rand(8, 35, 1).toFixed(1)),
    lean_mass_kg: parseFloat(rand(45, 85, 1).toFixed(1)),
    hydration_percentage: parseFloat(rand(48, 70, 1).toFixed(1)),
    body_temperature_c: parseFloat((36.5 + rand(-0.5, 1.0, 2)).toFixed(2)),
    skin_temperature_c: parseFloat((33.0 + rand(-1, 2, 2)).toFixed(2)),

    // Biomarkers
    blood_pressure_systolic: Math.min(sysBP, 180),
    blood_pressure_diastolic: Math.min(diaBP, 110),
    blood_glucose_mg_dl: includeGlucose ? rand(72, 145) : undefined,
    ketones_mmol: Math.random() > 0.85 ? parseFloat(rand(0.1, 2.5, 2).toFixed(2)) : undefined,

    // Female Health
    menstrual_cycle_day: includeFemaleHealth ? rand(1, 28) : undefined,
    fertility_window: includeFemaleHealth ? Math.random() > 0.7 : undefined,

    // Nutrition
    calories_consumed: includeNutrition ? rand(400, 2800) : undefined,
    protein_g: includeNutrition ? rand(20, 180) : undefined,
    carbs_g: includeNutrition ? rand(50, 350) : undefined,
    fat_g: includeNutrition ? rand(20, 120) : undefined,
    water_ml: includeNutrition ? rand(200, 2800) : undefined,

    // Stress
    stress_level: stressLevel,
    stress_category: getStressCategory(stressLevel),
  };

  return payload;
}
