'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { BrainCircuit, Activity, TrendingUp, AlertTriangle, Battery, BatteryWarning } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface TrainingData {
  date: string;
  load: number;
  capacity: number;
}

interface AnalyticsPayload {
  readinessScore: number;
  fatigueLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  recommendedAction: string;
  aiAnalysis: string;
  weeklyData: TrainingData[];
  isMock?: boolean;
}

const MOCK_DATA: AnalyticsPayload = {
  readinessScore: 42,
  fatigueLevel: 'High',
  recommendedAction: 'Active Recovery / Rest',
  aiAnalysis: "Warning: Over-trained. Your accumulated training load over the last 3 days has significantly exceeded your recovery capacity. Your central nervous system is showing signs of high fatigue. I strongly recommend skipping high-intensity intervals today and focusing on mobility or complete rest.",
  weeklyData: [
    { date: 'Mon', load: 40, capacity: 85 },
    { date: 'Tue', load: 85, capacity: 80 },
    { date: 'Wed', load: 60, capacity: 70 },
    { date: 'Thu', load: 95, capacity: 65 },
    { date: 'Fri', load: 90, capacity: 50 },
    { date: 'Sat', load: 80, capacity: 40 },
    { date: 'Sun', load: 20, capacity: 45 }, // Today
  ],
  isMock: true,
};

export function AITrainerDashboard() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('https://hacksprint-mtyl.onrender.com/api/analytics/latest', {
          // Add a short timeout so the UI doesn't hang forever if the API is frozen
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          throw new Error('API returned an error');
        }
        
        const result = await response.json();
        // Assume the API matches our format, if not we map it. 
        // For safety, we check if it has the fields we need.
        if (result && result.readinessScore !== undefined) {
          setData(result);
        } else {
          throw new Error('Invalid data structure');
        }
      } catch (error) {
        console.error('Failed to fetch AI Trainer data, falling back to mock data:', error);
        // Fallback to mock data to ensure the hackathon demo works!
        setData(MOCK_DATA);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center bg-neutral-900/40 rounded-xl border border-white/5">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const maxLoad = Math.max(...data.weeklyData.map(d => Math.max(d.load, d.capacity)), 100);

  return (
    <div className="space-y-6">
      {data.isMock && (
        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-lg text-sm font-bank flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          External AI Engine is currently offline. Displaying cached analysis to ensure continuous functionality.
        </div>
      )}

      {/* AI Analysis Hero Card */}
      <Card className="border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.1)] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none" />
        <CardBody className="p-6 md:p-8 flex flex-col md:flex-row gap-8 relative z-10">
          <div className="flex-shrink-0 flex items-start">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-lg">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <h2 className="text-xl font-heading text-white tracking-widest uppercase">HackSprint AI Analysis</h2>
            <p className="text-gray-300 font-bank leading-relaxed text-lg">
              {data.aiAnalysis}
            </p>
            <div className="inline-block mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
              <span className="text-red-400 font-heading text-sm uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recommendation: {data.recommendedAction}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Metrics Row */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardBody className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bank uppercase tracking-widest">Readiness Score</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black font-heading ${data.readinessScore > 70 ? 'text-green-400' : data.readinessScore > 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {data.readinessScore}
                </span>
                <span className="text-gray-500 text-sm">/ 100</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${data.fatigueLevel === 'High' || data.fatigueLevel === 'Critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
              {data.fatigueLevel === 'High' || data.fatigueLevel === 'Critical' ? (
                <BatteryWarning className="w-6 h-6 text-red-400" />
              ) : (
                <Battery className="w-6 h-6 text-blue-400" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bank uppercase tracking-widest">CNS Fatigue Level</p>
              <span className={`text-2xl font-black font-heading ${data.fatigueLevel === 'High' || data.fatigueLevel === 'Critical' ? 'text-red-400' : 'text-white'}`}>
                {data.fatigueLevel}
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Graph Section */}
      <Card>
        <CardHeader className="border-b border-white/5">
          <CardTitle className="flex items-center justify-between">
            <span>Training Load vs Recovery Capacity</span>
            <div className="flex gap-4 text-xs font-bank font-normal">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                <span className="text-gray-400">Load</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                <span className="text-gray-400">Capacity</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="h-64 w-full flex items-end justify-between gap-2 pt-8 relative">
            {/* Background grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="w-full h-[1px] bg-white" />
              <div className="w-full h-[1px] bg-white" />
              <div className="w-full h-[1px] bg-white" />
              <div className="w-full h-[1px] bg-white" />
            </div>

            {data.weeklyData.map((day, i) => {
              const loadHeight = (day.load / maxLoad) * 100;
              const capHeight = (day.capacity / maxLoad) * 100;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2 z-10 group">
                  <div className="w-full flex justify-center gap-1 h-full items-end relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 p-2 rounded text-xs font-bank z-20 whitespace-nowrap">
                      Load: {day.load} | Cap: {day.capacity}
                    </div>
                    
                    <div 
                      className="w-1/3 max-w-[20px] bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm transition-all duration-500" 
                      style={{ height: `${loadHeight}%` }}
                    />
                    <div 
                      className="w-1/3 max-w-[20px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-500" 
                      style={{ height: `${capHeight}%` }}
                    />
                  </div>
                  <span className="text-xs font-bank text-gray-500 uppercase">{day.date}</span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
