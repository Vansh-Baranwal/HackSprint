'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { highlightJson } from '@/lib/highlight';

interface PayloadEntry {
  id: string;
  provider: string;
  providerFull: string;
  model: string;
  timestamp: string;
  json: unknown;
  isNew?: boolean;
  byteSize: number;
  stored: boolean;
  source: 'generate' | 'drip';
}

const PROVIDER_COLORS: Record<string, string> = {
  fitbit: '#7dd3b0',
  garmin: '#4fc3f7',
  oura: '#ce93d8',
  whoop: '#f48fb1',
  apple: '#aeaeae',
  samsung: '#80cbc4',
};

function ProviderBadge({ provider, name }: { provider: string; name: string }) {
  const color = PROVIDER_COLORS[provider] || '#00ff41';
  return (
    <span style={{
      color,
      border: `1px solid ${color}40`,
      background: `${color}12`,
      textShadow: `0 0 8px ${color}80`,
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      padding: '1px 6px',
      borderRadius: '3px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    }}>
      {name}
    </span>
  );
}

function PayloadCard({ entry, index }: { entry: PayloadEntry; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const highlighted = highlightJson(entry.json);
  const p = entry.json as Record<string, unknown>;
  const providerName: string = (p.provider_full_name as string) || (p.provider as string) || entry.provider;

  return (
    <div
      className={entry.isNew ? 'new-payload' : 'payload-entry'}
      style={{ marginBottom: '12px', paddingLeft: '12px' }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer', userSelect: 'none', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ color: '#336633', fontSize: '10px' }}>{expanded ? '▼' : '▶'}</span>
        <span style={{ color: '#336633', fontSize: '10px', minWidth: '190px' }}>{entry.timestamp}</span>
        <ProviderBadge provider={entry.provider} name={providerName} />
        <span style={{ color: '#2a4a2a', fontSize: '10px' }}>{entry.model || '—'}</span>
        {entry.source === 'drip' && (
          <span style={{ color: '#4a6a4a', fontSize: '10px', border: '1px solid #2a4a2a', padding: '0 4px', borderRadius: '2px' }}>REPLAY</span>
        )}
        <span style={{ color: '#1a3a1a', fontSize: '10px', marginLeft: 'auto' }}>{(entry.byteSize / 1024).toFixed(1)}kb</span>
        {entry.stored
          ? <span style={{ color: '#1a5a1a', fontSize: '10px' }}>✓ stored</span>
          : <span style={{ color: '#3a1a1a', fontSize: '10px' }}>✗ local</span>
        }
      </div>
      {expanded && (
        <pre
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            lineHeight: '1.5',
            overflowX: 'auto',
            paddingBottom: '16px',
            paddingLeft: '8px',
            maxHeight: index === 0 ? 'none' : '350px',
            overflowY: index === 0 ? 'visible' : 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      )}
    </div>
  );
}

// ─── Boot sequence ───────────────────────────────────────────────────────────
const BOOT_SEQUENCE = [
  'PulseDump Synthetic v0.1.0',
  'Copyright (c) 2026 PulseDump Systems. All rights reserved.',
  '━'.repeat(52),
  '  [OK] Initializing synthetic data generator',
  '  [OK] Loading provider profiles: fitbit garmin oura whoop apple samsung',
  '  [OK] Connecting to Supabase realtime channel',
  '  [OK] Configuring biometric simulation engine (HRV/ECG/SpO2)',
  '  [OK] Drip-replay engine ready',
  '  [OK] Starting 5s ingestion loop',
  '━'.repeat(52),
  'SYSTEM READY. Streaming wearable payloads.',
  '',
];

type Mode = 'generate' | 'drip';

// ─── File uploader for drip mode ─────────────────────────────────────────────
function DripUploader({ onLoad }: { onLoad: (records: unknown[], filename: string) => void }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const records: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
      onLoad(records, file.name);
    } catch {
      alert('Invalid JSON file. Expected an array of payload objects.');
    }
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      style={{
        border: `1px dashed ${dragging ? 'var(--green)' : '#1a4a1a'}`,
        borderRadius: '4px',
        padding: '20px',
        textAlign: 'center',
        background: dragging ? 'rgba(0,255,65,0.03)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) handleFile(f);
        };
        input.click();
      }}
    >
      <div style={{ color: '#336633', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
        DROP JSON FILE HERE or click to browse
      </div>
      <div style={{ color: '#1a4a1a', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
        Format: JSON array of payload objects
      </div>
      <div style={{ color: '#1a3a1a', fontSize: '10px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
        [ {'{...}'}, {'{...}'}, {'{...}'} ]
      </div>
    </div>
  );
}

export default function Home() {
  const [payloads, setPayloads] = useState<PayloadEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [count, setCount] = useState(0);
  const [lastTs, setLastTs] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [booting, setBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>('generate');
  const [dripStatus, setDripStatus] = useState<{ queued: number; inserted: number; total: number; filename: string } | null>(null);
  const [dripLoaded, setDripLoaded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Boot animation
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_SEQUENCE.length) {
        const line = BOOT_SEQUENCE[i];
        setBootLines(prev => [...prev, line ?? '']);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBooting(false), 300);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Load drip records into server queue
  const loadDripRecords = useCallback(async (records: unknown[], filename: string) => {
    try {
      const res = await fetch('/api/drip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      setDripStatus({ queued: data.queued, inserted: 0, total: data.queued, filename });
      setDripLoaded(true);
      setMode('drip');
    } catch {
      alert('Failed to load records into drip queue');
    }
  }, []);

  // Fetch one drip record
  const fetchDrip = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch('/api/drip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!mountedRef.current) return;

      if (data.action === 'empty') {
        setConnected(false);
        setDripStatus(prev => prev ? { ...prev, queued: 0 } : null);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      if (data.payload) {
        const p = data.payload as Record<string, unknown>;
        const entry: PayloadEntry = {
          id: `drip-${Date.now()}-${Math.random()}`,
          provider: (p.provider as string) || 'unknown',
          providerFull: (p.provider_full_name as string) || (p.provider as string) || 'Unknown',
          model: (p.watch_model as string) || (p.model as string) || '—',
          timestamp: p.sync_timestamp
            ? new Date(p.sync_timestamp as string).toISOString()
            : new Date().toISOString(),
          json: data.payload,
          isNew: true,
          byteSize: JSON.stringify(data.payload).length,
          stored: data.stored === true,
          source: 'drip',
        };

        setPayloads(prev => {
          const updated = [entry, ...prev].slice(0, 100);
          setTimeout(() => {
            if (!mountedRef.current) return;
            setPayloads(p2 => p2.map(x => x.id === entry.id ? { ...x, isNew: false } : x));
          }, 2500);
          return updated;
        });

        setCount(c => c + 1);
        setLastTs(new Date().toLocaleTimeString());
        setConnected(true);
        setCountdown(5);
        setDripStatus(prev => prev
          ? { ...prev, queued: data.remaining, inserted: data.inserted }
          : null
        );
      }
    } catch {
      if (mountedRef.current) setConnected(false);
    }
  }, []);

  // Fetch generated payload
  const fetchGenerate = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch('/api/generate', { method: 'POST' });
      const data = await res.json();
      if (!mountedRef.current) return;
      if (data.payload) {
        const entry: PayloadEntry = {
          id: `gen-${Date.now()}-${Math.random()}`,
          provider: data.payload.provider,
          providerFull: data.payload.provider_full_name,
          model: data.payload.watch_model,
          timestamp: new Date(data.payload.sync_timestamp).toISOString(),
          json: data.payload,
          isNew: true,
          byteSize: JSON.stringify(data.payload).length,
          stored: data.stored === true,
          source: 'generate',
        };
        setPayloads(prev => {
          const updated = [entry, ...prev].slice(0, 100);
          setTimeout(() => {
            if (!mountedRef.current) return;
            setPayloads(p => p.map(x => x.id === entry.id ? { ...x, isNew: false } : x));
          }, 2500);
          return updated;
        });
        setCount(c => c + 1);
        setLastTs(new Date(data.payload.sync_timestamp).toLocaleTimeString());
        setConnected(true);
        setCountdown(5);
      }
    } catch {
      if (mountedRef.current) setConnected(false);
    }
  }, []);

  // Start / switch ingestion loop when mode or boot state changes
  useEffect(() => {
    if (booting) return;
    if (mode === 'drip' && !dripLoaded) return;

    mountedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const fetchFn = mode === 'drip' ? fetchDrip : fetchGenerate;
    fetchFn();
    timerRef.current = setInterval(fetchFn, 5000);
    countdownRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setCountdown(c => c <= 1 ? 5 : c - 1);
    }, 1000);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [booting, mode, dripLoaded, fetchDrip, fetchGenerate]);

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setPayloads([]);
    setCount(0);
    setConnected(false);
    setMode(newMode);
  };

  return (
    <div className="noise" style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-mono)', background: 'var(--bg)' }}>
      <div className="scanlines" />
      <div className="vignette" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: '#000', zIndex: 10, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="glow" style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.2em' }}>◈ PULSEDUMP SYNTHETIC</span>
          <span style={{ color: '#1a4a1a', fontSize: '10px' }}>│</span>
          <span style={{ color: '#2a5a2a', fontSize: '10px' }}>WEARABLE DATA INGESTION SIMULATOR</span>
        </div>
        {/* Mode switcher */}
        {!booting && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => switchMode('generate')}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '3px 10px', borderRadius: '2px', cursor: 'pointer', border: '1px solid',
                borderColor: mode === 'generate' ? 'var(--green)' : '#1a4a1a',
                color: mode === 'generate' ? 'var(--green)' : '#336633',
                background: mode === 'generate' ? 'rgba(0,255,65,0.08)' : 'transparent',
                textShadow: mode === 'generate' ? '0 0 6px rgba(0,255,65,0.5)' : 'none',
              }}
            >
              ⚙ GENERATE
            </button>
            <button
              onClick={() => switchMode('drip')}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '3px 10px', borderRadius: '2px', cursor: 'pointer', border: '1px solid',
                borderColor: mode === 'drip' ? 'var(--amber)' : '#1a4a1a',
                color: mode === 'drip' ? 'var(--amber)' : '#336633',
                background: mode === 'drip' ? 'rgba(255,183,0,0.06)' : 'transparent',
                textShadow: mode === 'drip' ? '0 0 6px rgba(255,183,0,0.4)' : 'none',
              }}
            >
              ▶ REPLAY
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      {!booting && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '6px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,10,0,0.95)', zIndex: 10, position: 'relative', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className={connected ? 'pulse-dot' : ''} style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? 'var(--green)' : '#ff4444', boxShadow: connected ? '0 0 6px var(--green)' : '0 0 6px #ff4444' }} />
            <span className={connected ? 'glow' : 'glow-red'} style={{ fontSize: '10px', fontWeight: 'bold' }}>{connected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
          <span style={{ color: '#1a4a1a' }}>│</span>
          <span style={{ color: '#2a5a2a', fontSize: '10px' }}>MODE: <span style={{ color: mode === 'drip' ? 'var(--amber)' : 'var(--green-dim)' }}>{mode === 'drip' ? 'REPLAY' : 'GENERATE'}</span></span>
          <span style={{ color: '#1a4a1a' }}>│</span>
          <span style={{ color: '#2a5a2a', fontSize: '10px' }}>INGESTED: <span style={{ color: 'var(--green-dim)' }}>{count}</span></span>
          <span style={{ color: '#1a4a1a' }}>│</span>
          <span style={{ color: '#2a5a2a', fontSize: '10px' }}>LAST SYNC: <span style={{ color: 'var(--green-dim)' }}>{lastTs || '—'}</span></span>
          <span style={{ color: '#1a4a1a' }}>│</span>
          <span style={{ color: '#2a5a2a', fontSize: '10px' }}>NEXT: <span style={{ color: countdown <= 1 ? 'var(--amber)' : 'var(--green-dim)' }}>{countdown}s</span></span>
          {mode === 'drip' && dripStatus && (
            <>
              <span style={{ color: '#1a4a1a' }}>│</span>
              <span style={{ color: '#4a6a2a', fontSize: '10px' }}>
                QUEUE: <span style={{ color: 'var(--amber)' }}>{dripStatus.queued}</span> / {dripStatus.total} remaining
              </span>
            </>
          )}
          <span style={{ marginLeft: 'auto', color: '#0d2a0d', fontSize: '10px' }}>PULSEDUMP SYNTHETIC v0.1.0</span>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        {booting ? (
          <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
            {bootLines.map((line, i) => {
              const safeStr = line ?? '';
              return (
                <div key={i} style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: safeStr.startsWith('PulseDump') ? '14px' : '11px',
                  lineHeight: '1.7',
                  color: safeStr.startsWith('━') ? '#0d2a0d'
                    : safeStr.startsWith('  [OK]') ? '#336633'
                    : safeStr.startsWith('SYSTEM') ? 'var(--green)'
                    : 'var(--green)',
                  textShadow: safeStr.startsWith('PulseDump') ? '0 0 12px rgba(0,255,65,0.8)'
                    : safeStr.startsWith('SYSTEM') ? '0 0 8px rgba(0,255,65,0.5)'
                    : undefined,
                }}>
                  {safeStr || '\u00A0'}
                </div>
              );
            })}
            {bootLines.length < BOOT_SEQUENCE.length && (
              <span className="blink-cursor" style={{ color: 'var(--green)' }}>█</span>
            )}
          </div>

        ) : mode === 'drip' && !dripLoaded ? (
          /* Drip upload screen */
          <div style={{ padding: '32px', maxWidth: '560px', margin: '0 auto', marginTop: '60px' }}>
            <div style={{ color: 'var(--green)', fontSize: '12px', marginBottom: '6px', letterSpacing: '0.1em' }}>▶ REPLAY MODE</div>
            <div style={{ color: '#2a5a2a', fontSize: '10px', marginBottom: '20px', lineHeight: '1.6' }}>
              Upload your synthetic data JSON file. Each record will be inserted into Supabase one by one, every 5 seconds — exactly like a live wearable stream.
            </div>
            <DripUploader onLoad={loadDripRecords} />
            <div style={{ marginTop: '16px', color: '#1a4a1a', fontSize: '10px', lineHeight: '1.8' }}>
              <div>Expected format:</div>
              <pre style={{ fontFamily: 'var(--font-mono)', color: '#2a5a2a', fontSize: '10px' }}>{`[
  { "provider": "fitbit", "heart_rate": 72, ... },
  { "provider": "garmin", "heart_rate": 88, ... }
]`}</pre>
            </div>
          </div>

        ) : payloads.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="glow" style={{ fontSize: '12px', letterSpacing: '0.15em', marginBottom: '8px' }}>AWAITING FIRST PAYLOAD</div>
              <span className="blink-cursor" style={{ color: 'var(--green)' }}>█</span>
            </div>
          </div>

        ) : (
          <div ref={scrollRef} style={{ height: '100%', overflowY: 'auto', padding: '12px 16px 24px' }}>
            <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)', color: '#1a4a1a', fontSize: '10px' }}>
              <span>root@pulsedump:~$ tail -f /var/log/wearable_stream.jsonl</span>
              <span className="blink-cursor" style={{ color: 'var(--green)', marginLeft: '4px' }}>█</span>
            </div>
            {payloads.map((entry, i) => (
              <PayloadCard key={entry.id} entry={entry} index={i} />
            ))}
            <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid var(--border)', color: '#0d2a0d', fontSize: '10px', textAlign: 'center' }}>
              — {count} payloads ingested — {mode === 'drip' ? 'replaying from file' : 'synthetic generation'} —
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '6px 16px', borderTop: '1px solid var(--border)', background: '#000', display: 'flex', justifyContent: 'space-between', zIndex: 10, position: 'relative' }}>
        <span style={{ color: '#1a4a1a', fontSize: '10px' }}>providers: fitbit • garmin • oura • whoop • apple • samsung</span>
        <span style={{ color: '#0d2a0d', fontSize: '10px' }}>interval: 5000ms • db: supabase • payloads: jsonb</span>
      </div>
    </div>
  );
}
