'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Clock, AlertTriangle, Zap, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type GameState = 'idle' | 'waiting' | 'ready' | 'finished' | 'false_start';

export function ReactionTime() {
  const [state, setState] = useState<GameState>('idle');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [lastReaction, setLastReaction] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleStart = () => {
    setState('waiting');
    setLastReaction(null);
    const delay = Math.floor(Math.random() * 3000) + 2000; // 2s to 5s
    timerRef.current = setTimeout(() => {
      setState('ready');
      setStartTime(performance.now());
    }, delay);
  };

  const handleInteraction = () => {
    if (state === 'waiting') {
      // Clicked too early!
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('false_start');
    } else if (state === 'ready') {
      // Valid reaction!
      const reactionTime = Math.round(performance.now() - startTime);
      const newAttempts = [...attempts, reactionTime];
      setLastReaction(reactionTime);
      
      if (newAttempts.length >= MAX_ATTEMPTS) {
        setAttempts(newAttempts);
        setState('finished');
      } else {
        setAttempts(newAttempts);
        setState('idle'); // Loop back to idle for the next attempt
      }
    }
  };

  const resetAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAttempts([]);
    setLastReaction(null);
    setState('idle');
  };

  const average = attempts.length > 0 
    ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length) 
    : 0;

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden shadow-2xl bg-neutral-900/40 backdrop-blur-xl border-white/10">
      <CardHeader className="border-b border-white/5 bg-black/40 px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-heading text-white uppercase tracking-widest m-0 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Reaction Speed
        </CardTitle>
        <span className="inline-flex items-center justify-center rounded-full border border-orange-500/30 text-orange-400 font-bank text-xs px-2 py-0.5">
          {attempts.length}/{MAX_ATTEMPTS}
        </span>
      </CardHeader>
      
      <CardBody className="p-0 relative">
        {/* The main interactive area */}
        <div 
          className={`
            w-full h-80 flex flex-col items-center justify-center cursor-pointer transition-colors duration-150 relative select-none
            ${state === 'idle' && attempts.length === 0 ? 'bg-transparent' : ''}
            ${state === 'idle' && attempts.length > 0 ? 'bg-neutral-800/50' : ''}
            ${state === 'waiting' ? 'bg-red-600' : ''}
            ${state === 'ready' ? 'bg-green-500' : ''}
            ${state === 'finished' ? 'bg-neutral-900/80' : ''}
            ${state === 'false_start' ? 'bg-orange-600' : ''}
          `}
          onClick={handleInteraction}
        >
          {state === 'idle' && attempts.length === 0 && (
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-lg font-heading text-white tracking-widest uppercase">Cognitive Readiness Test</p>
              <p className="text-sm font-bank text-gray-400 max-w-sm">
                When the red screen turns green, tap as fast as you can. We will average {MAX_ATTEMPTS} attempts to determine your baseline cognitive reaction speed.
              </p>
              <Button onClick={(e) => { e.stopPropagation(); handleStart(); }} size="lg" className="mt-4 font-bank uppercase tracking-widest">
                Start Test
              </Button>
            </div>
          )}

          {state === 'idle' && attempts.length > 0 && (
            <div className="text-center space-y-4">
              <p className="text-3xl font-heading font-bold text-white">{lastReaction} ms</p>
              <p className="text-xs font-bank text-gray-400 tracking-widest uppercase">Attempt {attempts.length} logged</p>
              <Button onClick={(e) => { e.stopPropagation(); handleStart(); }} className="mt-4 font-bank uppercase tracking-widest bg-orange-600 hover:bg-orange-700 text-white border-none">
                Click to continue
              </Button>
            </div>
          )}

          {state === 'waiting' && (
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-white tracking-widest uppercase">Wait for Green</p>
              <p className="text-sm font-bank text-red-200 mt-2">Do not tap yet...</p>
            </div>
          )}

          {state === 'ready' && (
            <div className="text-center">
              <p className="text-6xl font-heading font-black text-white tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">TAP NOW!</p>
            </div>
          )}

          {state === 'false_start' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
              <p className="text-2xl font-heading font-bold text-white tracking-widest uppercase">Too Early!</p>
              <p className="text-sm font-bank text-orange-200">You must wait for the screen to turn green.</p>
              <Button onClick={(e) => { e.stopPropagation(); handleStart(); }} variant="secondary" className="mt-4 border-white/20 text-white bg-black/20 hover:bg-black/40">
                Try Again
              </Button>
            </div>
          )}

          {state === 'finished' && (
            <div className="text-center space-y-6 w-full px-8 py-6">
              <div>
                <p className="text-xs font-heading text-orange-400 uppercase tracking-widest mb-2">Final Result</p>
                <div className="text-6xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600 drop-shadow-[0_0_25px_rgba(249,115,22,0.3)]">
                  {average} <span className="text-2xl font-bank text-gray-400">ms</span>
                </div>
              </div>
              
              <div className="bg-black/30 border border-white/5 rounded-xl p-4 w-full max-w-sm mx-auto">
                <p className="text-xs text-gray-400 font-bank uppercase tracking-widest mb-3 text-left">Attempt Breakdown</p>
                <div className="space-y-2">
                  {attempts.map((t, i) => (
                    <div key={i} className="flex justify-between items-center text-sm font-bank">
                      <span className="text-gray-500">Attempt {i + 1}</span>
                      <span className="text-gray-300 font-bold">{t} ms</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={(e) => { e.stopPropagation(); resetAll(); }} variant="secondary" className="font-bank uppercase tracking-widest flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset Test
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
