// PosturalSway.jsx
// Tri-axial Postural Sway — complete UI component
// Uses useSway() hook for all sensor logic + signal processing
// No external UI libraries required — pure React + CSS

import { useState, useEffect, useRef, useCallback } from "react";
import { useSway, PHASE } from "./useSway";
import "./PosturalSway.css";

// ─── Sub-components ────────────────────────────────────────────────────────────

function PhoneIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 48 80" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="44" height="76" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <rect x="10" y="12" width="28" height="44" rx="3" fill="currentColor" opacity="0.12" />
      <circle cx="24" cy="68" r="4" fill="currentColor" opacity="0.5" />
      <rect x="16" y="5" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

// Live waveform canvas — draws last N samples of X and Y axes
function WaveformCanvas({ liveSignal }) {
  const canvasRef = useRef(null);
  const bufXRef = useRef([]);
  const bufYRef = useRef([]);
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
    const { width: W, height: H } = canvas;
    ctx.clearRect(0, 0, W, H);

    const draw = (buf, color) => {
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

    // Centre line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    draw(bufXRef.current, "#4EB8FF");
    draw(bufYRef.current, "#FF7B54");
  }, [liveSignal]);

  return (
    <canvas
      ref={canvasRef}
      className="ps-canvas"
      width={560}
      height={80}
      aria-label="Live accelerometer waveform"
    />
  );
}

// Stabilogram — COP path (X vs Y scatter)
function StabilogramCanvas({ filteredX, filteredY }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !filteredX?.length) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const maxVal = Math.max(...filteredX.map(Math.abs), ...filteredY.map(Math.abs), 0.01);
    const scale = Math.min(cx, cy) * 0.82 / maxVal;

    // Grid
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

    // Path
    ctx.beginPath();
    ctx.strokeStyle = "#A78BFA";
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.7;
    filteredX.forEach((x, i) => {
      const px = cx + x * scale;
      const py = cy - filteredY[i] * scale;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;

    // End dot
    const lx = cx + filteredX[filteredX.length - 1] * scale;
    const ly = cy - filteredY[filteredY.length - 1] * scale;
    ctx.beginPath();
    ctx.fillStyle = "#FF7B54";
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [filteredX, filteredY]);

  return (
    <canvas
      ref={canvasRef}
      className="ps-canvas ps-stab"
      width={220}
      height={220}
      aria-label="Sway path stabilogram"
    />
  );
}

// Severity badge
function SeverityBadge({ severity }) {
  const map = {
    normal: { label: "Normal", cls: "badge-ok" },
    borderline: { label: "Borderline", cls: "badge-warn" },
    high: { label: "High risk", cls: "badge-bad" },
  };
  const { label, cls } = map[severity] || map.normal;
  return <span className={`ps-badge ${cls}`}>{label}</span>;
}

// Metric tile
function MetricTile({ label, value, unit, highlight = false }) {
  return (
    <div className={`ps-metric-tile ${highlight ? "highlight" : ""}`}>
      <span className="ps-metric-val">
        {typeof value === "number" ? value.toFixed(4) : "—"}
        {unit && <span className="ps-metric-unit"> {unit}</span>}
      </span>
      <span className="ps-metric-lbl">{label}</span>
    </div>
  );
}

// Circular progress ring
function ProgressRing({ pct, children }) {
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - pct / 100);
  return (
    <div className="ps-ring-wrap">
      <svg className="ps-ring" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={R} className="ps-ring-track" />
        <circle
          cx="60" cy="60" r={R}
          className="ps-ring-fill"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s linear" }}
        />
      </svg>
      <div className="ps-ring-inner">{children}</div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PosturalSway({ onBack }) {
  // simMode controls the simulation profile on desktop (no real sensor)
  // "healthy" | "borderline" | "high"
  const [simMode, setSimMode] = useState("healthy");

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

  // When simMode changes mid-idle, do nothing — it only affects the next recording
  const isIdle = phase === PHASE.IDLE;

  const renderContent = () => {
    switch (phase) {
      case PHASE.IDLE:
        return (
          <IdleScreen
            onStart={start}
            baseline={baseline}
            hasSensor={hasSensor}
            simMode={simMode}
            onSimModeChange={setSimMode}
          />
        );
      case PHASE.COUNTDOWN:
        return <CountdownScreen count={countdown} />;
      case PHASE.RECORDING:
        return (
          <RecordingScreen
            progress={progress}
            liveSignal={liveSignal}
            simMode={simMode}
            hasSensor={hasSensor}
          />
        );
      case PHASE.PROCESSING:
        return <ProcessingScreen />;
      case PHASE.RESULT:
        return (
          <ResultScreen
            result={result}
            baseline={baseline}
            onReset={reset}
            onSaveBaseline={saveAsBaseline}
          />
        );
      case PHASE.ERROR:
        return <ErrorScreen message={error} onReset={reset} />;
      default:
        return null;
    }
  };

  return (
    <div className="ps-root">
      <header className="ps-header">
        <button className="ps-back-btn" onClick={onBack} aria-label="Back to menu">← Back</button>
        <div className="ps-logo">
          <span className="ps-logo-icon">⬡</span>
          <span className="ps-logo-text">AthleteShield</span>
        </div>
        <div className="ps-header-tag">Balance Analysis</div>
      </header>

      <main className="ps-main">
        <div className="ps-card">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function IdleScreen({ onStart, baseline, hasSensor, simMode, onSimModeChange }) {
  return (
    <div className="ps-screen ps-idle">
      <div className="ps-idle-hero">
        <PhoneIcon className="ps-phone-icon" />
        <div className="ps-idle-rings">
          <span /><span /><span />
        </div>
      </div>

      <div className="ps-idle-copy">
        <h1 className="ps-title">Postural Sway Test</h1>
        <p className="ps-subtitle">
          Tri-axial balance analysis using your device accelerometer.
          Detects vestibular impairment consistent with concussion.
        </p>
      </div>

      <div className="ps-instructions">
        <div className="ps-step">
          <span className="ps-step-num">1</span>
          <span>Hold phone flat against chest, both hands</span>
        </div>
        <div className="ps-step">
          <span className="ps-step-num">2</span>
          <span>Close eyes and stand on one leg</span>
        </div>
        <div className="ps-step">
          <span className="ps-step-num">3</span>
          <span>Stay still for 20 seconds when test begins</span>
        </div>
      </div>

      {!hasSensor && (
        <>
          <div className="ps-notice">
            <span className="ps-notice-icon">ℹ</span>
            No accelerometer detected — running simulated sensor data.
            Use on a mobile device for a live assessment.
          </div>

          {/* Demo mode switcher — lets you show judges all 3 severity outcomes */}
          <div className="ps-sim-switcher">
            <span className="ps-sim-label">Simulation profile</span>
            <div className="ps-sim-btns">
              {["healthy", "borderline", "high"].map((m) => (
                <button
                  key={m}
                  className={`ps-sim-btn ${simMode === m ? "ps-sim-active" : ""} ps-sim-${m}`}
                  onClick={() => onSimModeChange(m)}
                >
                  {m === "healthy" ? "Healthy" : m === "borderline" ? "Borderline" : "High risk"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {baseline && (
        <div className="ps-baseline-info">
          <span className="ps-baseline-dot" />
          Personal baseline on file — scored comparison enabled
        </div>
      )}

      <button className="ps-btn-primary" onClick={onStart}>
        Begin Test
      </button>
    </div>
  );
}

function CountdownScreen({ count }) {
  return (
    <div className="ps-screen ps-countdown">
      <p className="ps-countdown-label">Get in position</p>
      <div className="ps-countdown-num" key={count}>{count === 0 ? "GO" : count}</div>
      <p className="ps-countdown-sub">
        {count === 3 && "Press phone flat to chest"}
        {count === 2 && "Close your eyes"}
        {count === 1 && "Lift one leg"}
        {count === 0 && "Hold steady…"}
      </p>
    </div>
  );
}

function RecordingScreen({ progress, liveSignal, simMode, hasSensor }) {
  const elapsed = Math.round(progress * 0.2); // 0–20s
  return (
    <div className="ps-screen ps-recording">
      {/* Simulation badge — visible to judges so they know it's running */}
      {!hasSensor && (
        <div className={`ps-sim-badge ps-sim-${simMode}`}>
          SIM · {simMode === "healthy" ? "Healthy" : simMode === "borderline" ? "Borderline" : "High risk"}
        </div>
      )}

      <ProgressRing pct={progress}>
        <span className="ps-ring-time">{20 - elapsed}s</span>
        <span className="ps-ring-timelbl">remaining</span>
      </ProgressRing>

      <div className="ps-rec-signal">
        <p className="ps-signal-label">Live signal</p>
        <WaveformCanvas liveSignal={liveSignal} />
        <div className="ps-axis-legend">
          <span className="leg-x">X axis</span>
          <span className="leg-y">Y axis</span>
        </div>
      </div>

      <div className="ps-live-vals">
        {["x", "y", "z"].map((ax) => (
          <div key={ax} className="ps-live-val">
            <span className={`ps-axis-lbl ax-${ax}`}>{ax.toUpperCase()}</span>
            <span className="ps-axis-num">{liveSignal[ax]?.toFixed(3) ?? "—"}</span>
          </div>
        ))}
      </div>

      <p className="ps-rec-hint">Keep still — eyes closed — phone on chest</p>
    </div>
  );
}

function ProcessingScreen() {
  return (
    <div className="ps-screen ps-processing">
      <div className="ps-spinner" aria-label="Processing" />
      <p className="ps-proc-label">Analysing signal…</p>
      <p className="ps-proc-sub">Filtering · computing variance · scoring</p>
    </div>
  );
}

function ResultScreen({ result, baseline, onReset, onSaveBaseline }) {
  const hasBaseline = !!baseline;

  const recommendation = {
    normal: {
      text: "No flags detected. Safe to return to training.",
      cls: "rec-ok",
    },
    borderline: {
      text: "Elevated sway detected. Retest in 24 hours. Monitor for symptoms.",
      cls: "rec-warn",
    },
    high: {
      text: "High sway variance. Refer to medical staff before return to play.",
      cls: "rec-bad",
    },
  }[result.severity];

  return (
    <div className="ps-screen ps-result">
      <div className="ps-result-top">
        <SeverityBadge severity={result.severity} />
        {result.zScore !== null && (
          <span className="ps-zscore">z = {result.zScore}</span>
        )}
        {result.artifact && (
          <span className="ps-badge badge-warn" style={{ marginLeft: 8 }}>
            Movement detected
          </span>
        )}
      </div>

      <div className={`ps-recommendation ${recommendation.cls}`}>
        {recommendation.text}
      </div>

      <div className="ps-metrics-grid">
        <MetricTile label="Var X" value={result.varX} unit="mg²" />
        <MetricTile label="Var Y" value={result.varY} unit="mg²" />
        <MetricTile label="Var Z" value={result.varZ} unit="mg²" />
        <MetricTile label="Sway area (95% CE)" value={result.swayArea} unit="mg²" highlight />
        <MetricTile label="Path length" value={result.pathLength} unit="mg" />
        <MetricTile label="Samples" value={result.sampleCount} />
      </div>

      <div className="ps-stab-section">
        <p className="ps-stab-label">Stabilogram — COP path (X vs Y)</p>
        <StabilogramCanvas
          filteredX={result.filteredX}
          filteredY={result.filteredY}
        />
      </div>

      {!hasBaseline && (
        <div className="ps-baseline-prompt">
          <p>No baseline on file. If this is a healthy assessment, save it as your baseline for future scored comparisons.</p>
          <button className="ps-btn-secondary" onClick={onSaveBaseline}>
            Save as baseline
          </button>
        </div>
      )}

      <div className="ps-result-actions">
        <button className="ps-btn-primary" onClick={onReset}>
          New test
        </button>
        {hasBaseline && (
          <button className="ps-btn-secondary" onClick={onSaveBaseline}>
            Update baseline
          </button>
        )}
      </div>
    </div>
  );
}

function ErrorScreen({ message, onReset }) {
  return (
    <div className="ps-screen ps-error">
      <div className="ps-error-icon">!</div>
      <p className="ps-error-msg">{message || "An unexpected error occurred."}</p>
      <button className="ps-btn-primary" onClick={onReset}>Try again</button>
    </div>
  );
}