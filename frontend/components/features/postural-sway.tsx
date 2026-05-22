'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSway, SwayPhase } from '@/lib/hooks/use-sway';
import type { SimMode, SwayResult, BaselineData, SwaySample } from '@/lib/hooks/use-sway';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Smartphone, Activity, CheckCircle, Clock } from 'lucide-react';

// ─── Sub-components ────────────────────────────────────────────────────────────

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 80" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="44" height="76" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <rect x="10" y="12" width="28" height="44" rx="3" fill="currentColor" opacity="0.12" />
      <circle cx="24" cy="68" r="4" fill="currentColor" opacity="0.5" />
      <rect x="16" y="5" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function WaveformCanvas({ liveSignal }: { liveSignal: { x: number, y: number, z: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufXRef = useRef<number[]>([]);
  const bufYRef = useRef<number[]>([]);
  const BUF = 150;

  useEffect(() => {
    bufXRef.current.push(liveSignal.x);
    bufYRef.current.push(liveSignal.y);
    if (bufXRef.current.length > BUF) {
      bufXRef.current.shift();
      bufYRef.current.shift();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    ctx.clearRect(0, 0, W, H);

    const draw = (buf: number[], color: string) => {
      if (buf.length < 2) return;
      const maxVal = Math.max(...buf.map(Math.abs), 0.05);
      const scale = (H * 0.38) / maxVal;
      const step = W / BUF;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.9;
      buf.forEach((v, i) => {
        const x = i * step;
        const y = H / 2 - v * scale;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    draw(bufXRef.current, "#4EB8FF"); // blue for X
    draw(bufYRef.current, "#FF7B54"); // orange for Y
  }, [liveSignal]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-20 rounded-lg bg-black/50 border border-white/5"
      width={560}
      height={80}
      aria-label="Live accelerometer waveform"
    />
  );
}

function StabilogramCanvas({ filteredX, filteredY }: { filteredX: number[], filteredY: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !filteredX?.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const maxVal = Math.max(...filteredX.map(Math.abs), ...filteredY.map(Math.abs), 0.01);
    const scale = Math.min(cx, cy) * 0.82 / maxVal;

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (const r of [0.33, 0.66, 1]) {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(cx, cy) * 0.82 * r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx, 4); ctx.lineTo(cx, H - 4);
    ctx.moveTo(4, cy); ctx.lineTo(W - 4, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#A78BFA"; // purple
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.7;
    filteredX.forEach((x, i) => {
      const px = cx + x * scale;
      const py = cy - filteredY[i] * scale;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;

    const lx = cx + filteredX[filteredX.length - 1] * scale;
    const ly = cy - filteredY[filteredY.length - 1] * scale;
    ctx.beginPath();
    ctx.fillStyle = "#FF7B54"; // orange
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [filteredX, filteredY]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-[220px] aspect-square mx-auto rounded-full bg-black/50 border border-white/5"
      width={220}
      height={220}
      aria-label="Sway path stabilogram"
    />
  );
}

function ProgressRing({ pct, children }: { pct: number, children: React.ReactNode }) {
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - pct / 100);
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
        <circle
          cx="60" cy="60" r={R}
          fill="none"
          stroke="url(#gradientOrange)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-linear"
        />
        <defs>
          <linearGradient id="gradientOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        {children}
      </div>
    </div>
  );
}

function MetricTile({ label, value, unit, highlight = false }: { label: string, value: number | string, unit?: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'bg-neutral-900/50 border-white/5'} flex flex-col items-center justify-center text-center`}>
      <span className="text-lg font-bold text-white font-heading">
        {typeof value === "number" ? value.toFixed(4) : value}
        {unit && <span className="text-sm font-bank text-gray-400 ml-1">{unit}</span>}
      </span>
      <span className="text-xs font-bank tracking-widest text-gray-400 uppercase mt-1">{label}</span>
    </div>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function IdleScreen({ onStart, baseline, hasSensor, simMode, onSimModeChange }: { onStart: () => void, baseline: BaselineData | null, hasSensor: boolean, simMode: SimMode, onSimModeChange: (m: SimMode) => void }) {
  return (
    <div className="space-y-8 py-4">
      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24 flex items-center justify-center bg-orange-500/10 rounded-full border border-orange-500/30">
          <PhoneIcon className="w-10 h-10 text-orange-400" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-heading text-white tracking-widest uppercase">Tri-Axial Balance Analysis</h2>
        <p className="text-gray-400 font-bank max-w-md mx-auto text-sm leading-relaxed">
          Detects vestibular impairment consistent with concussion using high-frequency accelerometer telemetry.
        </p>
      </div>

      <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 space-y-4 max-w-md mx-auto">
        <h3 className="text-xs font-heading text-orange-400 uppercase tracking-widest mb-4">Instructions</h3>
        <div className="flex items-center gap-4">
          <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">1</span>
          <span className="text-sm text-gray-300 font-bank">Hold phone flat against chest, both hands</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">2</span>
          <span className="text-sm text-gray-300 font-bank">Close eyes and stand on one leg</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold">3</span>
          <span className="text-sm text-gray-300 font-bank">Stay still for 20 seconds when test begins</span>
        </div>
      </div>

      {!hasSensor && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-200/80 font-bank flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-yellow-400" />
            <p>No accelerometer detected. Running in desktop simulation mode.</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-bank uppercase tracking-widest">Simulation Profile</label>
            <div className="flex gap-2">
              {(["healthy", "borderline", "high"] as SimMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => onSimModeChange(m)}
                  className={`flex-1 py-2 text-xs font-bank uppercase tracking-wider rounded border transition-colors ${
                    simMode === m ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {m === "healthy" ? "Healthy" : m === "borderline" ? "Borderline" : "High Risk"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {baseline && (
        <div className="text-center text-sm text-green-400 font-bank flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Personal baseline on file — scored comparison enabled
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button onClick={onStart} size="lg" className="w-full max-w-sm font-bank uppercase tracking-widest">
          Begin Test
        </Button>
      </div>
    </div>
  );
}

function CountdownScreen({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-8">
      <p className="text-sm text-orange-400 font-heading uppercase tracking-widest">Get in position</p>
      <div className="text-8xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600 drop-shadow-[0_0_25px_rgba(249,115,22,0.5)]">
        {count === 0 ? "GO" : count}
      </div>
      <p className="text-sm text-gray-400 font-bank">
        {count === 3 && "Press phone flat to chest"}
        {count === 2 && "Close your eyes"}
        {count === 1 && "Lift one leg"}
        {count === 0 && "Hold steady…"}
      </p>
    </div>
  );
}

function RecordingScreen({ progress, liveSignal, simMode, hasSensor }: { progress: number, liveSignal: {x:number,y:number,z:number}, simMode: string, hasSensor: boolean }) {
  const elapsed = Math.round(progress * 0.2);
  
  return (
    <div className="space-y-8 py-4 text-center">
      {!hasSensor && (
        <Badge variant={simMode === 'healthy' ? 'success' : simMode === 'high' ? 'error' : 'warning'} className="absolute top-4 right-4">
          SIM · {simMode.toUpperCase()}
        </Badge>
      )}

      <ProgressRing pct={progress}>
        <span className="text-3xl font-bold font-heading">{20 - elapsed}s</span>
        <span className="text-xs text-gray-400 font-bank uppercase">remaining</span>
      </ProgressRing>

      <div className="space-y-4 max-w-md mx-auto bg-neutral-900/50 border border-white/5 p-4 rounded-xl">
        <p className="text-xs text-gray-400 font-bank uppercase tracking-widest text-left">Live Telemetry</p>
        <WaveformCanvas liveSignal={liveSignal} />
        <div className="flex justify-between text-[10px] font-bank uppercase tracking-widest px-2">
          <span className="text-[#4EB8FF]">X axis (ML)</span>
          <span className="text-[#FF7B54]">Y axis (AP)</span>
        </div>
      </div>

      <div className="flex justify-center gap-6">
        {["x", "y", "z"].map((ax) => (
          <div key={ax} className="text-center">
            <span className="text-xs text-gray-500 font-heading uppercase block">{ax}</span>
            <span className="text-sm font-bank text-gray-300">{(liveSignal as any)[ax]?.toFixed(3) ?? "—"}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-orange-400 font-bank tracking-widest uppercase animate-pulse">
        Keep still — eyes closed — phone on chest
      </p>
    </div>
  );
}

function ProcessingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6">
      <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-lg font-heading text-white uppercase tracking-widest">Analysing signal</p>
      <p className="text-xs text-gray-400 font-bank tracking-widest uppercase">Filtering · computing variance · scoring</p>
    </div>
  );
}

function ResultScreen({ result, baseline, onReset, onSaveBaseline }: { result: SwayResult, baseline: BaselineData | null, onReset: () => void, onSaveBaseline: () => void }) {
  const hasBaseline = !!baseline;

  const recommendation = {
    normal: { text: "No flags detected. Safe to return to training.", color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" },
    borderline: { text: "Elevated sway detected. Retest in 24 hours. Monitor for symptoms.", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
    high: { text: "High sway variance. Refer to medical staff before return to play.", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10" },
  }[result.severity || "normal"];

  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-3">
        <Badge variant={result.severity === 'high' ? 'error' : result.severity === 'borderline' ? 'warning' : 'success'} className="px-4 py-1 text-sm">
          {result.severity === 'high' ? 'HIGH RISK' : result.severity === 'borderline' ? 'BORDERLINE' : 'NORMAL'}
        </Badge>
        {result.zScore !== null && result.zScore !== undefined && (
          <p className="text-xs font-bank text-gray-400">Comparison z-score = {result.zScore}</p>
        )}
        {result.artifact && (
          <Badge variant="warning" className="ml-2">Movement Artifacts Detected</Badge>
        )}
      </div>

      <div className={`p-4 rounded-xl border ${recommendation.border} ${recommendation.bg} text-center`}>
        <p className={`text-sm font-bank ${recommendation.color}`}>{recommendation.text}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricTile label="Var X" value={result.varX} unit="mg²" />
        <MetricTile label="Var Y" value={result.varY} unit="mg²" />
        <MetricTile label="Var Z" value={result.varZ} unit="mg²" />
        <MetricTile label="Sway Area (95% CE)" value={result.swayArea} unit="mg²" highlight />
        <MetricTile label="Path length" value={result.pathLength} unit="mg" />
        <MetricTile label="Samples" value={result.sampleCount} />
      </div>

      <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 text-center space-y-4">
        <p className="text-xs text-gray-400 font-heading uppercase tracking-widest">Stabilogram (COP Path)</p>
        <StabilogramCanvas filteredX={result.filteredX} filteredY={result.filteredY} />
      </div>

      {!hasBaseline && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center space-y-3">
          <p className="text-xs text-blue-200 font-bank">No baseline on file. If this is a healthy assessment, save it as your baseline for future scored comparisons.</p>
          <Button variant="secondary" onClick={onSaveBaseline} className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/20 text-xs h-9">
            Save as Baseline
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button onClick={onReset} size="lg" className="font-bank uppercase tracking-widest w-full">
          New Test
        </Button>
        {hasBaseline && (
          <Button variant="secondary" onClick={onSaveBaseline} className="font-bank uppercase tracking-widest w-full">
            Update Baseline
          </Button>
        )}
      </div>
    </div>
  );
}

function ErrorScreen({ message, onReset }: { message: string, onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <span className="text-2xl font-bold text-red-500">!</span>
      </div>
      <p className="text-sm font-bank text-red-400 max-w-xs">{message || "An unexpected error occurred."}</p>
      <Button variant="secondary" onClick={onReset}>Try Again</Button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function PosturalSway() {
  const [simMode, setSimMode] = useState<SimMode>("healthy");

  const {
    phase,
    countdown,
    progress,
    result,
    baseline,
    liveSignal,
    error,
    hasSensor,
    start,
    reset,
    saveAsBaseline,
  } = useSway({ simMode });

  const renderContent = () => {
    switch (phase) {
      case SwayPhase.IDLE:
        return <IdleScreen onStart={start} baseline={baseline} hasSensor={hasSensor} simMode={simMode} onSimModeChange={setSimMode} />;
      case SwayPhase.COUNTDOWN:
        return <CountdownScreen count={countdown} />;
      case SwayPhase.RECORDING:
        return <RecordingScreen progress={progress} liveSignal={liveSignal} simMode={simMode} hasSensor={hasSensor} />;
      case SwayPhase.PROCESSING:
        return <ProcessingScreen />;
      case SwayPhase.RESULT:
        return result && <ResultScreen result={result} baseline={baseline} onReset={reset} onSaveBaseline={saveAsBaseline} />;
      case SwayPhase.ERROR:
        return <ErrorScreen message={error || ''} onReset={reset} />;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden shadow-2xl bg-neutral-900/40 backdrop-blur-xl border-white/10">
      <CardHeader className="border-b border-white/5 bg-black/40 px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-heading text-white uppercase tracking-widest m-0 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          Diagnostics
        </CardTitle>
        <span className="inline-flex items-center justify-center rounded-full border border-orange-500/30 text-orange-400 font-bank text-xs px-2 py-0.5">
          v1.0
        </span>
      </CardHeader>
      <CardBody className="p-6 md:p-8">
        {renderContent()}
      </CardBody>
    </Card>
  );
}
