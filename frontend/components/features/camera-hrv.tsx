'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Camera, AlertCircle, Heart } from 'lucide-react';

type HrvPhase = 'idle' | 'calibrating' | 'measuring' | 'result' | 'error';

export function CameraHRV() {
  const [phase, setPhase] = useState<HrvPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [bpm, setBpm] = useState<number | null>(null);
  const [hrv, setHrv] = useState<number | null>(null);
  const [liveSignal, setLiveSignal] = useState<number[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rAFRef = useRef<number | null>(null);

  // Signal processing state
  const signalBuffer = useRef<number[]>([]);
  const peakTimes = useRef<number[]>([]);
  const lastPeakTime = useRef<number>(0);
  const measurementStartTime = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        // Try to turn off torch if it was on
        try {
          track.applyConstraints({ advanced: [{ torch: false }] as any });
        } catch (e) {}
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We only need a small sample area (e.g. 50x50 center) to average colors
    const sz = 50;
    ctx.drawImage(video, video.videoWidth / 2 - sz / 2, video.videoHeight / 2 - sz / 2, sz, sz, 0, 0, sz, sz);
    
    const frame = ctx.getImageData(0, 0, sz, sz);
    let rSum = 0;
    // Iterate over pixels (R, G, B, A)
    for (let i = 0; i < frame.data.length; i += 4) {
      rSum += frame.data[i]; // Red channel
    }
    const rAvg = rSum / (sz * sz);

    // Simple moving average / buffer for signal smoothing
    signalBuffer.current.push(rAvg);
    if (signalBuffer.current.length > 90) { // ~3 seconds at 30fps
      signalBuffer.current.shift();
    }

    // Set live signal for UI (normalize it for rendering)
    if (signalBuffer.current.length > 10) {
      const min = Math.min(...signalBuffer.current);
      const max = Math.max(...signalBuffer.current);
      const normalized = signalBuffer.current.map(v => max - min === 0 ? 0 : (v - min) / (max - min));
      setLiveSignal([...normalized]);
      
      // Simple peak detection (beat detection)
      const now = performance.now();
      const latest = signalBuffer.current[signalBuffer.current.length - 1];
      const prev1 = signalBuffer.current[signalBuffer.current.length - 2];
      const prev2 = signalBuffer.current[signalBuffer.current.length - 3];
      
      // Look for a local maximum (very basic, in a real medical app we use bandpass filters)
      if (prev1 > latest && prev1 > prev2) {
        // Debounce peaks by at least 400ms (max 150 BPM)
        if (now - lastPeakTime.current > 400) {
          // Additional check: the peak must be relatively high compared to recent min/max
          const recentRange = max - min;
          if (recentRange > 2 && (prev1 - min) > recentRange * 0.5) {
            peakTimes.current.push(now);
            lastPeakTime.current = now;
          }
        }
      }
    }

    // Progress logic
    if (measurementStartTime.current > 0) {
      const elapsed = performance.now() - measurementStartTime.current;
      const totalTime = 15000; // 15 seconds
      setProgress(Math.min(100, (elapsed / totalTime) * 100));

      if (elapsed > totalTime) {
        finalizeMeasurement();
        return;
      }
    }

    rAFRef.current = requestAnimationFrame(processFrame);
  };

  const finalizeMeasurement = () => {
    stopCamera();
    
    // Calculate BPM and HRV (RMSSD proxy)
    const intervals: number[] = [];
    for (let i = 1; i < peakTimes.current.length; i++) {
      intervals.push(peakTimes.current[i] - peakTimes.current[i - 1]);
    }

    if (intervals.length < 3) {
      setErrorMsg("Could not detect a clear pulse. Ensure your finger covers the camera lens completely.");
      setPhase('error');
      return;
    }

    // Filter outliers (unrealistic RR intervals)
    const validIntervals = intervals.filter(i => i > 400 && i < 1200);
    
    if (validIntervals.length === 0) {
      setErrorMsg("Irregular pulse detected. Try again keeping your finger still.");
      setPhase('error');
      return;
    }

    const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
    const calcBpm = Math.round(60000 / avgInterval);
    
    // Calculate RMSSD (Root Mean Square of Successive Differences)
    let sumSqDiff = 0;
    for (let i = 1; i < validIntervals.length; i++) {
      const diff = validIntervals[i] - validIntervals[i - 1];
      sumSqDiff += diff * diff;
    }
    const calcHrv = Math.round(Math.sqrt(sumSqDiff / (validIntervals.length - 1)) || 0);

    setBpm(calcBpm);
    setHrv(calcHrv);
    setPhase('result');
  };

  const startTest = async () => {
    setPhase('calibrating');
    setErrorMsg('');
    setProgress(0);
    setBpm(null);
    setHrv(null);
    signalBuffer.current = [];
    peakTimes.current = [];
    lastPeakTime.current = 0;
    measurementStartTime.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Attempt to turn on the flashlight (torch) for better PPG illumination
        const track = stream.getVideoTracks()[0];
        const imageCapture = new (window as any).ImageCapture(track);
        try {
          const capabilities = await imageCapture.getPhotoCapabilities();
          if (capabilities.fillLightMode?.includes('flash')) {
            await track.applyConstraints({ advanced: [{ torch: true }] as any });
          }
        } catch (e) {
          // Ignore if torch is not supported
        }

        // Start processing frames
        rAFRef.current = requestAnimationFrame(processFrame);
        
        // Calibrate for 3 seconds before measuring
        setTimeout(() => {
          setPhase('measuring');
          measurementStartTime.current = performance.now();
        }, 3000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Camera access denied or device not supported. Please allow camera permissions to run the HRV test.");
      setPhase('error');
    }
  };

  const resetAll = () => {
    stopCamera();
    setPhase('idle');
  };

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden shadow-2xl bg-neutral-900/40 backdrop-blur-xl border-white/10">
      <CardHeader className="border-b border-white/5 bg-black/40 px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-heading text-white uppercase tracking-widest m-0 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Camera HRV
        </CardTitle>
        <span className="inline-flex items-center justify-center rounded-full border border-red-500/30 text-red-400 font-bank text-xs px-2 py-0.5">
          PPG Tech
        </span>
      </CardHeader>
      
      <CardBody className="p-6 md:p-8 space-y-8">
        
        {/* Hidden video and canvas for processing */}
        <div className="hidden">
          <video ref={videoRef} playsInline muted />
          <canvas ref={canvasRef} width={50} height={50} />
        </div>

        {phase === 'idle' && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center relative overflow-hidden">
                <Camera className="w-10 h-10 text-red-400" />
                <div className="absolute inset-0 bg-red-500/20 animate-pulse rounded-full" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-heading text-white tracking-widest uppercase">Optical Heart Rate</h2>
              <p className="text-gray-400 font-bank max-w-md mx-auto text-sm leading-relaxed">
                Uses Photoplethysmography (PPG) to analyze micro-color changes in your fingertip and calculate your resting Heart Rate and HRV.
              </p>
            </div>

            <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 text-left max-w-sm mx-auto space-y-4">
              <div className="flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-white/10 text-white flex shrink-0 items-center justify-center text-xs font-bold">1</span>
                <span className="text-sm text-gray-300 font-bank">Place your index finger completely covering the rear camera lens (and flash if near).</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-6 h-6 rounded-full bg-white/10 text-white flex shrink-0 items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm text-gray-300 font-bank">Hold still with light pressure for 15 seconds.</span>
              </div>
            </div>

            <Button onClick={startTest} size="lg" className="w-full max-w-sm font-bank uppercase tracking-widest">
              Grant Camera Access & Start
            </Button>
          </div>
        )}

        {(phase === 'calibrating' || phase === 'measuring') && (
          <div className="text-center space-y-8">
            <div className="relative w-32 h-32 mx-auto">
              {/* Progress Ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={(2 * Math.PI * 54) * (1 - progress / 100)}
                  className="transition-all duration-300 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className={`w-10 h-10 text-red-500 ${phase === 'measuring' ? 'animate-pulse' : ''}`} />
              </div>
            </div>

            <div>
              <p className="text-lg font-heading text-white uppercase tracking-widest">
                {phase === 'calibrating' ? 'Calibrating Exposure...' : 'Reading Pulse...'}
              </p>
              <p className="text-xs text-gray-400 font-bank mt-1 uppercase tracking-widest">
                Keep your finger still
              </p>
            </div>

            {/* Signal Graph (Visual only) */}
            <div className="h-16 w-full max-w-xs mx-auto bg-black/50 rounded border border-white/5 relative overflow-hidden flex items-end px-2">
              <div className="w-full h-full flex items-end justify-between gap-[2px]">
                {liveSignal.map((val, i) => (
                  <div key={i} className="bg-red-500/80 w-1 transition-all duration-75" style={{ height: `${val * 100}%` }} />
                ))}
              </div>
            </div>
            
            <Button onClick={resetAll} variant="secondary" className="font-bank text-xs">
              Cancel
            </Button>
          </div>
        )}

        {phase === 'result' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
              <Activity className="w-8 h-8" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-xl border bg-neutral-900/50 border-white/5 flex flex-col items-center">
                <span className="text-xs font-bank tracking-widest text-gray-400 uppercase mt-1 mb-2">Resting HR</span>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 font-heading">
                  {bpm}
                  <span className="text-sm text-gray-500 ml-1">BPM</span>
                </span>
              </div>
              <div className="p-4 rounded-xl border bg-neutral-900/50 border-white/5 flex flex-col items-center">
                <span className="text-xs font-bank tracking-widest text-gray-400 uppercase mt-1 mb-2">Est. HRV (RMSSD)</span>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-600 font-heading">
                  {hrv}
                  <span className="text-sm text-red-500/50 ml-1">ms</span>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-900/30 border border-white/5 max-w-sm mx-auto text-sm font-bank text-gray-400">
              {hrv! > 40 ? (
                <p className="text-green-400">Good autonomic readiness. You are well recovered.</p>
              ) : (
                <p className="text-yellow-400">Lower HRV detected. Consider light recovery work today.</p>
              )}
            </div>

            <Button onClick={resetAll} className="w-full max-w-sm font-bank uppercase tracking-widest">
              Done
            </Button>
          </div>
        )}

        {phase === 'error' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm font-bank text-red-400 max-w-xs mx-auto">{errorMsg}</p>
            <Button onClick={resetAll} variant="secondary" className="font-bank uppercase tracking-widest">
              Go Back
            </Button>
          </div>
        )}

      </CardBody>
    </Card>
  );
}
