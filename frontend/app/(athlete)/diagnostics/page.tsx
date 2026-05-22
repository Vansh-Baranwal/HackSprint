'use client';

import React, { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { PosturalSway } from '@/components/features/postural-sway';
import { ReactionTime } from '@/components/features/reaction-time';
import { CameraHRV } from '@/components/features/camera-hrv';
import { Activity, Zap, Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type DiagnosticTest = 'sway' | 'reaction' | 'hrv';

export default function DiagnosticsPage() {
  const [activeTest, setActiveTest] = useState<DiagnosticTest>('sway');

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-heading uppercase tracking-widest">
            Diagnostics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-bank">
            Run clinical-grade baseline assessments and check your readiness
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-neutral-900/50 p-1.5 rounded-xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTest('sway')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bank tracking-widest uppercase transition-all duration-300",
              activeTest === 'sway' 
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]" 
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Postural</span> Sway
          </button>
          
          <button
            onClick={() => setActiveTest('reaction')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bank tracking-widest uppercase transition-all duration-300",
              activeTest === 'reaction' 
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]" 
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Cognitive</span> Speed
          </button>
          
          <button
            onClick={() => setActiveTest('hrv')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bank tracking-widest uppercase transition-all duration-300",
              activeTest === 'hrv' 
                ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]" 
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            <Heart className="w-4 h-4" />
            Camera <span className="hidden sm:inline">HRV</span>
          </button>
        </div>

        {/* Active Test Area */}
        <div className="mt-8 transition-all duration-300 ease-in-out">
          {activeTest === 'sway' && <PosturalSway />}
          {activeTest === 'reaction' && <ReactionTime />}
          {activeTest === 'hrv' && <CameraHRV />}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
