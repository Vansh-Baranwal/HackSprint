'use client';

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
export const SAMPLE_RATE_HZ = 50;
const SAMPLE_INTERVAL_MS = 1000 / SAMPLE_RATE_HZ;
const TEST_DURATION_S = 20;
const TOTAL_SAMPLES = TEST_DURATION_S * SAMPLE_RATE_HZ; // 1000

export const THRESHOLDS = {
  normal: 0.8,
  high:   1.8,
};

const ABS_THRESHOLDS = {
  normal:     0.100,
  borderline: 1.500,
};

// ─── Types & Phase state machine ───────────────────────────────────────────────
export enum SwayPhase {
  IDLE = "idle",
  BASELINE_PROMPT = "baseline_prompt",
  COUNTDOWN = "countdown",
  RECORDING = "recording",
  PROCESSING = "processing",
  RESULT = "result",
  ERROR = "error",
}

export type SimMode = "healthy" | "borderline" | "high";

export interface SwaySample {
  ts: number;
  x: number;
  y: number;
  z: number;
}

export interface SwayResult {
  varX: number;
  varY: number;
  varZ: number;
  covXY: number;
  swayArea: number;
  pathLength: number;
  artifact: boolean;
  filteredX: number[];
  filteredY: number[];
  sampleCount: number;
  severity?: "normal" | "borderline" | "high";
  zScore?: number | null;
  raw?: SwaySample[];
  testedAt?: string;
}

export interface BaselineData {
  mean: number;
  std: number;
  sessions: number;
  savedAt: string;
}

// ─── Math helpers ──────────────────────────────────────────────────────────────
function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
}

function covariance(arrA: number[], arrB: number[]): number {
  if (arrA.length < 2 || arrA.length !== arrB.length) return 0;
  const mA = mean(arrA);
  const mB = mean(arrB);
  return arrA.reduce((s, v, i) => s + (v - mA) * (arrB[i] - mB), 0) / arrA.length;
}

function swayArea95(varX: number, varY: number, covXY: number): number {
  const discriminant = varX * varY - covXY ** 2;
  if (discriminant <= 0) return 0;
  return Math.PI * 2.448 * Math.sqrt(discriminant);
}

function pathLength(axArr: number[], ayArr: number[]): number {
  let total = 0;
  for (let i = 1; i < axArr.length; i++) {
    const dx = axArr[i] - axArr[i - 1];
    const dy = ayArr[i] - ayArr[i - 1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

function highPassFilter(arr: number[]): number[] {
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

function resampleUniform(samples: SwaySample[]): SwaySample[] {
  if (samples.length < 2) return samples;
  const tStart = samples[0].ts;
  const tEnd = samples[samples.length - 1].ts;
  const result: SwaySample[] = [];
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const tTarget = tStart + (i / (TOTAL_SAMPLES - 1)) * (tEnd - tStart);
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

function isClean(samples: SwaySample[]): boolean {
  if (samples.length < 50) return true;
  const first50 = samples.slice(0, 50);
  const last50 = samples.slice(-50);
  const rmsFirst = Math.sqrt(mean(first50.map((s) => s.x ** 2 + s.y ** 2)));
  const rmsLast = Math.sqrt(mean(last50.map((s) => s.x ** 2 + s.y ** 2)));
  if (rmsLast > rmsFirst * 8) return false;
  return true;
}

export function processSamples(rawSamples: SwaySample[]): SwayResult | { error: string } {
  if (rawSamples.length < 100) {
    return { error: "Insufficient samples — test was too short." };
  }

  const resampled = resampleUniform(rawSamples);
  const axRaw = resampled.map((s) => s.x);
  const ayRaw = resampled.map((s) => s.y);
  const azRaw = resampled.map((s) => s.z);

  const axMean = mean(axRaw);
  const ayMean = mean(ayRaw);
  const azMean = mean(azRaw);
  const axDC = axRaw.map((v) => v - axMean);
  const ayDC = ayRaw.map((v) => v - ayMean);
  const azDC = azRaw.map((v) => v - azMean);

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

export function scoreAgainstBaseline(result: SwayResult, baseline: BaselineData | null, isSimulation = false) {
  const { swayArea } = result;

  if (isSimulation || !baseline || baseline.std === 0) {
    if (swayArea < ABS_THRESHOLDS.normal)     return { severity: "normal" as const,     zScore: null };
    if (swayArea < ABS_THRESHOLDS.borderline) return { severity: "borderline" as const, zScore: null };
    return { severity: "high" as const, zScore: null };
  }

  const z = (swayArea - baseline.mean) / baseline.std;
  const severity =
    z > THRESHOLDS.high   ? "high" as const       :
    z > THRESHOLDS.normal ? "borderline" as const : "normal" as const;
  return { severity, zScore: parseFloat(z.toFixed(2)) };
}

function detectRealSensor(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof (window as any).DeviceMotionEvent === "undefined") return false;
  if (typeof (window as any).DeviceMotionEvent.requestPermission === "function") return true;
  return navigator.maxTouchPoints > 0;
}

const HAS_REAL_SENSOR = detectRealSensor();

function simulateSample(t: number, mode: SimMode = "healthy"): Omit<SwaySample, "ts"> {
  const randn = () => {
    let u, v;
    do u = Math.random(); while (u === 0);
    do v = Math.random(); while (v === 0);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
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

export function useSway({ simMode = "healthy" }: { simMode?: SimMode } = {}) {
  const [phase, setPhase] = useState<SwayPhase>(SwayPhase.IDLE);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SwayResult | null>(null);
  const [baseline, setBaseline] = useState<BaselineData | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem("sway_baseline");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [liveSignal, setLiveSignal] = useState({ x: 0, y: 0, z: 0 });
  const [error, setError] = useState<string | null>(null);

  const samplesRef    = useRef<SwaySample[]>([]);
  const intervalRef   = useRef<NodeJS.Timeout | null>(null);
  const countdownRef  = useRef<NodeJS.Timeout | null>(null);
  const simTRef       = useRef(0);
  const hasSensorRef  = useRef(HAS_REAL_SENSOR);
  const listenerRef   = useRef<((e: any) => void) | null>(null);

  const stopAll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (listenerRef.current && typeof window !== 'undefined') {
      window.removeEventListener("devicemotion", listenerRef.current);
      listenerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    setPhase(SwayPhase.RECORDING);
    setProgress(0);
    samplesRef.current = [];
    const tStart = Date.now();

    if (hasSensorRef.current && typeof window !== 'undefined') {
      const handler = (e: any) => {
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
          if (intervalRef.current) clearInterval(intervalRef.current);
          finalize();
        }
      }, SAMPLE_INTERVAL_MS);
    }
  }, [simMode]);

  const startCountdown = useCallback(() => {
    setPhase(SwayPhase.COUNTDOWN);
    setCountdown(3);
    samplesRef.current = [];

    let c = 3;
    countdownRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        startRecording();
      }
    }, 1000);
  }, [startRecording]);

  const finalize = useCallback(() => {
    setPhase(SwayPhase.PROCESSING);
    setTimeout(() => {
      const raw = samplesRef.current;
      const processed = processSamples(raw);
      if ('error' in processed) {
        setError(processed.error);
        setPhase(SwayPhase.ERROR);
        return;
      }
      const baselineData = (() => {
        try {
          if (typeof window === 'undefined') return null;
          const stored = localStorage.getItem("sway_baseline");
          return stored ? JSON.parse(stored) : null;
        } catch {
          return null;
        }
      })();
      
      const score = scoreAgainstBaseline(processed, baselineData, !hasSensorRef.current);
      
      setResult({ ...processed, ...score, raw, testedAt: new Date().toISOString() });
      setPhase(SwayPhase.RESULT);
    }, 100);
  }, []);

  const requestAndStart = useCallback(async () => {
    setError(null);
    if (
      typeof window !== "undefined" &&
      typeof (window as any).DeviceMotionEvent !== "undefined" &&
      typeof (window as any).DeviceMotionEvent.requestPermission === "function"
    ) {
      try {
        const perm = await (window as any).DeviceMotionEvent.requestPermission();
        hasSensorRef.current = perm === "granted";
        if (!hasSensorRef.current) {
          setError("Motion sensor permission denied. Running in simulation mode.");
        }
      } catch {
        hasSensorRef.current = false;
      }
    }
    startCountdown();
  }, [startCountdown]);

  const saveAsBaseline = useCallback(() => {
    if (!result) return;
    const entry = {
      mean: result.swayArea,
      std: Math.max(result.swayArea * 0.30, 0.002),
      sessions: 1,
      savedAt: new Date().toISOString(),
    };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem("sway_baseline", JSON.stringify(entry));
      }
    } catch {}
    setBaseline(entry);
  }, [result]);

  const reset = useCallback(() => {
    stopAll();
    setPhase(SwayPhase.IDLE);
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
