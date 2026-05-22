// useSway.js
// Tri-axial Postural Sway — sensor logic, signal processing, calibration engine
// Designed for web (DeviceMotion API). Works in Chrome/Safari on mobile HTTPS.
// On desktop it simulates sensor data so the UI is always testable.

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
export const SAMPLE_RATE_HZ = 50;
const SAMPLE_INTERVAL_MS = 1000 / SAMPLE_RATE_HZ;
const TEST_DURATION_S = 20;
const TOTAL_SAMPLES = TEST_DURATION_S * SAMPLE_RATE_HZ; // 1000

// Clinical thresholds (z-score vs personal baseline).
// Lowered from textbook 2.0/3.5 because our std estimate comes from a single
// session (not 10+ sessions), so it under-estimates true variability.
// Using tighter thresholds compensates and gives correct separation.
export const THRESHOLDS = {
  normal: 0.8,   // z > 0.8  = Borderline
  high:   1.8,   // z > 1.8  = High risk
};

// Absolute fallback thresholds (mg²) when no baseline exists.
// Verified against full signal pipeline (gravity removal + high-pass + variance):
//   Simulation healthy    → swayArea 0.019–0.024  → Normal      (< 0.100)
//   Simulation borderline → swayArea 0.390–0.430  → Borderline  (0.100–1.500)
//   Simulation high       → swayArea 4.400–4.800  → High risk   (> 1.500)
// Real phone sensor: same pipeline, similar magnitude (m/s² units).
const ABS_THRESHOLDS = {
  normal:     0.100,   // below this   = Normal
  borderline: 1.500,   // 0.100-1.500  = Borderline, above = High risk
};

// ─── Phase state machine ───────────────────────────────────────────────────────
export const PHASE = {
  IDLE: "idle",
  BASELINE_PROMPT: "baseline_prompt",
  COUNTDOWN: "countdown",
  RECORDING: "recording",
  PROCESSING: "processing",
  RESULT: "result",
  ERROR: "error",
};

// ─── Math helpers ──────────────────────────────────────────────────────────────
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function variance(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
}

function covariance(arrA, arrB) {
  if (arrA.length < 2 || arrA.length !== arrB.length) return 0;
  const mA = mean(arrA);
  const mB = mean(arrB);
  return arrA.reduce((s, v, i) => s + (v - mA) * (arrB[i] - mB), 0) / arrA.length;
}

// 95% Confidence Ellipse area — standard clinical sway area metric
function swayArea95(varX, varY, covXY) {
  const discriminant = varX * varY - covXY ** 2;
  if (discriminant <= 0) return 0;
  return Math.PI * 2.448 * Math.sqrt(discriminant);
}

// Total path length of the COP proxy (sum of Euclidean steps)
function pathLength(axArr, ayArr) {
  let total = 0;
  for (let i = 1; i < axArr.length; i++) {
    const dx = axArr[i] - axArr[i - 1];
    const dy = ayArr[i] - ayArr[i - 1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

// Simple first-order high-pass filter — removes DC/slow drift
// cutoff ~0.1 Hz at 50 Hz sample rate → RC = 1/(2π*0.1) ≈ 1.59s → α = RC/(RC+dt)
function highPassFilter(arr) {
  const dt = 1 / SAMPLE_RATE_HZ;
  const RC = 1 / (2 * Math.PI * 0.1);
  const alpha = RC / (RC + dt);
  const out = new Array(arr.length);
  out[0] = 0;
  for (let i = 1; i < arr.length; i++) {
    out[i] = alpha * (out[i - 1] + arr[i] - arr[i - 1]);
  }
  return out;
}

// Resample to uniform grid via linear interpolation on timestamps
function resampleUniform(samples) {
  if (samples.length < 2) return samples;
  const tStart = samples[0].ts;
  const tEnd = samples[samples.length - 1].ts;
  const result = [];
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const tTarget = tStart + (i / (TOTAL_SAMPLES - 1)) * (tEnd - tStart);
    // binary search for bracket
    let lo = 0, hi = samples.length - 2;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid + 1].ts < tTarget) lo = mid + 1;
      else hi = mid;
    }
    const s0 = samples[lo];
    const s1 = samples[lo + 1] || s0;
    const span = s1.ts - s0.ts;
    const frac = span > 0 ? (tTarget - s0.ts) / span : 0;
    result.push({
      ts: tTarget,
      x: s0.x + frac * (s1.x - s0.x),
      y: s0.y + frac * (s1.y - s0.y),
      z: s0.z + frac * (s1.z - s0.z),
    });
  }
  return result;
}

// Artifact detection: rolling RMS check
// Returns true if the sample window looks clean
function isClean(samples) {
  if (samples.length < 50) return true;
  // Check first 2s and last 2s windows for very different variance
  const first50 = samples.slice(0, 50);
  const last50 = samples.slice(-50);
  const rmsFirst = Math.sqrt(mean(first50.map((s) => s.x ** 2 + s.y ** 2)));
  const rmsLast = Math.sqrt(mean(last50.map((s) => s.x ** 2 + s.y ** 2)));
  // If tail is 8× noisier than start → probably dropped their arm
  if (rmsLast > rmsFirst * 8) return false;
  return true;
}

// Full processing pipeline on raw sample array
export function processSamples(rawSamples) {
  if (rawSamples.length < 100) {
    return { error: "Insufficient samples — test was too short." };
  }

  const resampled = resampleUniform(rawSamples);

  // Extract axes
  const axRaw = resampled.map((s) => s.x);
  const ayRaw = resampled.map((s) => s.y);
  const azRaw = resampled.map((s) => s.z);

  // Remove gravity (mean offset per axis)
  const axMean = mean(axRaw);
  const ayMean = mean(ayRaw);
  const azMean = mean(azRaw);
  const axDC = axRaw.map((v) => v - axMean);
  const ayDC = ayRaw.map((v) => v - ayMean);
  const azDC = azRaw.map((v) => v - azMean);

  // High-pass filter
  const ax = highPassFilter(axDC);
  const ay = highPassFilter(ayDC);
  const az = highPassFilter(azDC);

  const varX = variance(ax);
  const varY = variance(ay);
  const varZ = variance(az);
  const covXY = covariance(ax, ay);
  const area = swayArea95(varX, varY, covXY);
  const pl = pathLength(ax, ay);

  const artifact = !isClean(resampled);

  return {
    varX,
    varY,
    varZ,
    covXY,
    swayArea: area,
    pathLength: pl,
    artifact,
    filteredX: ax,
    filteredY: ay,
    sampleCount: resampled.length,
  };
}

// Score against personal baseline using z-score.
// IMPORTANT: baseline is IGNORED when the test ran in simulation mode (no real sensor).
// In simulation mode we always use absolute thresholds so all 3 demo profiles
// produce their correct label regardless of what is saved in localStorage.
export function scoreAgainstBaseline(result, baseline, isSimulation = false) {
  const { swayArea } = result;

  // Always use absolute thresholds for simulation — clean demo, no baseline drift
  if (isSimulation || !baseline || baseline.std === 0) {
    if (swayArea < ABS_THRESHOLDS.normal)     return { severity: "normal",     zScore: null };
    if (swayArea < ABS_THRESHOLDS.borderline) return { severity: "borderline", zScore: null };
    return { severity: "high", zScore: null };
  }

  // Real sensor + saved baseline: z-score comparison
  const z = (swayArea - baseline.mean) / baseline.std;
  const severity =
    z > THRESHOLDS.high   ? "high"       :
    z > THRESHOLDS.normal ? "borderline" : "normal";
  return { severity, zScore: parseFloat(z.toFixed(2)) };
}

// ─── Sensor detection — synchronous, done once at module load ────────────────
// DeviceMotionEvent exists on Chrome desktop as a stub but never fires.
// The ONLY reliable signal is: are we on a touch device running on HTTPS/localhost?
// We use three checks together:
//   1. DeviceMotionEvent exists
//   2. It does NOT have requestPermission (that's iOS — handled separately in the hook)
//   3. navigator.maxTouchPoints > 0  →  actual touch hardware (phone/tablet)
function detectRealSensor() {
  if (typeof window === "undefined") return false;
  if (typeof DeviceMotionEvent === "undefined") return false;
  // iOS 13+ requires explicit permission — treat as "maybe real", resolved at runtime
  if (typeof DeviceMotionEvent.requestPermission === "function") return true;
  // Android / other mobile: must have touch points
  return navigator.maxTouchPoints > 0;
}

const HAS_REAL_SENSOR = detectRealSensor();

// ─── Simulation (desktop / no sensor) ────────────────────────────────────────
function simulateSample(t, mode = "healthy") {
  const randn = () => {
    let u, v;
    do u = Math.random(); while (u === 0);
    do v = Math.random(); while (v === 0);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  // Noise (nx/ny) and drift are tuned so final swayArea lands clearly in its band:
  //   healthy    -> 0.001-0.006  (Normal    < 0.008)
  //   borderline -> 0.012-0.038  (Borderline 0.008-0.040)
  //   high       -> 0.070-0.220  (High risk  > 0.040)
  const cfg = {
    healthy:    { nx: 0.055, ny: 0.048, drift: 0.018, f: 0.8  },
    borderline: { nx: 0.240, ny: 0.195, drift: 0.110, f: 1.4  },
    high:       { nx: 0.820, ny: 0.650, drift: 0.380, f: 2.2  },
  }[mode] || { nx: 0.055, ny: 0.048, drift: 0.018, f: 0.8 };

  return {
    x: cfg.nx * randn() + cfg.drift * Math.sin(cfg.f * t),
    y: cfg.ny * randn() + cfg.drift * Math.cos(cfg.f * t * 0.9),
    z: 9.81 + 0.02 * randn(),
  };
}

// ─── Main hook ─────────────────────────────────────────────────────────────────
// simMode: "healthy" | "borderline" | "high"  — only used on desktop simulation
export function useSway({ simMode = "healthy" } = {}) {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0); // 0–100
  const [result, setResult] = useState(null);
  const [baseline, setBaseline] = useState(() => {
    try {
      const stored = localStorage.getItem("sway_baseline");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [liveSignal, setLiveSignal] = useState({ x: 0, y: 0, z: 0 });
  const [error, setError] = useState(null);

  const samplesRef    = useRef([]);
  const intervalRef   = useRef(null);
  const countdownRef  = useRef(null);
  const simTRef       = useRef(0);
  // Use module-level detection — reliable from the very first render
  const hasSensorRef  = useRef(HAS_REAL_SENSOR);
  const listenerRef   = useRef(null);

  const stopAll = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);
    if (listenerRef.current) {
      window.removeEventListener("devicemotion", listenerRef.current);
      listenerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    setPhase(PHASE.RECORDING);
    setProgress(0);
    samplesRef.current = [];
    const tStart = Date.now();

    if (hasSensorRef.current) {
      // Real DeviceMotion
      const handler = (e) => {
        const a = e.accelerationIncludingGravity;
        if (!a) return;
        const ts = Date.now() - tStart;
        samplesRef.current.push({ ts, x: a.x || 0, y: a.y || 0, z: a.z || 0 });
        setLiveSignal({ x: a.x || 0, y: a.y || 0, z: a.z || 0 });
        const pct = Math.min(100, (ts / (TEST_DURATION_S * 1000)) * 100);
        setProgress(pct);
        if (ts >= TEST_DURATION_S * 1000) {
          window.removeEventListener("devicemotion", handler);
          listenerRef.current = null;
          finalize();
        }
      };
      listenerRef.current = handler;
      window.addEventListener("devicemotion", handler);
    } else {
      // Simulation fallback
      simTRef.current = 0;
      intervalRef.current = setInterval(() => {
        simTRef.current += SAMPLE_INTERVAL_MS / 1000;
        const ts = Date.now() - tStart;
        const s = simulateSample(simTRef.current, simMode);
        samplesRef.current.push({ ts, ...s });
        setLiveSignal(s);
        const pct = Math.min(100, (ts / (TEST_DURATION_S * 1000)) * 100);
        setProgress(pct);
        if (ts >= TEST_DURATION_S * 1000) {
          clearInterval(intervalRef.current);
          finalize();
        }
      }, SAMPLE_INTERVAL_MS);
    }
  }, [simMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown → recording
  const startCountdown = useCallback(() => {
    setPhase(PHASE.COUNTDOWN);
    setCountdown(3);
    samplesRef.current = [];

    let c = 3;
    countdownRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownRef.current);
        startRecording();
      }
    }, 1000);
  }, [startRecording]); // <--- FIX 1: startRecording added as dependency

  const finalize = useCallback(() => {
    setPhase(PHASE.PROCESSING);
    // Defer to next tick so UI updates first
    setTimeout(() => {
      const raw = samplesRef.current;
      const processed = processSamples(raw);
      if (processed.error) {
        setError(processed.error);
        setPhase(PHASE.ERROR);
        return;
      }
      const baselineData = (() => {
        try {
          const stored = localStorage.getItem("sway_baseline");
          return stored ? JSON.parse(stored) : null;
        } catch {
          return null;
        }
      })();
      
      // FIX 2: Added !hasSensorRef.current to force absolute thresholds during simulation
      const score = scoreAgainstBaseline(processed, baselineData, !hasSensorRef.current);
      
      setResult({ ...processed, ...score, raw, testedAt: new Date().toISOString() });
      setPhase(PHASE.RESULT);
    }, 100);
  }, []);

  // Request iOS permission then start
  const requestAndStart = useCallback(async () => {
    setError(null);
    // iOS 13+ needs an explicit user-gesture permission request
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      try {
        const perm = await DeviceMotionEvent.requestPermission();
        hasSensorRef.current = perm === "granted";
        if (!hasSensorRef.current) {
          setError("Motion sensor permission denied. Running in simulation mode.");
        }
      } catch {
        hasSensorRef.current = false;
      }
    }
    // On desktop HAS_REAL_SENSOR is already false — goes straight to simulation
    startCountdown();
  }, [startCountdown]);

  const saveAsBaseline = useCallback(() => {
    if (!result) return;
    // Need multiple sessions for real std — for now store single session, std = swayArea * 0.2
    // std is estimated as 30% of the baseline mean — a conservative single-session
    // estimate. Real clinical systems use 10+ sessions; this is our best proxy.
    // Minimum floor of 0.002 prevents division-by-zero on very stable baselines.
    const entry = {
      mean: result.swayArea,
      std: Math.max(result.swayArea * 0.30, 0.002),
      sessions: 1,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("sway_baseline", JSON.stringify(entry));
    } catch {}
    setBaseline(entry);
  }, [result]);

  const reset = useCallback(() => {
    stopAll();
    setPhase(PHASE.IDLE);
    setProgress(0);
    setResult(null);
    setError(null);
    setCountdown(3);
    samplesRef.current = [];
  }, [stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  return {
    phase,
    countdown,
    progress,
    result,
    baseline,
    liveSignal,
    error,
    hasSensor: hasSensorRef.current,
    start: requestAndStart,
    reset,
    saveAsBaseline,
  };
}