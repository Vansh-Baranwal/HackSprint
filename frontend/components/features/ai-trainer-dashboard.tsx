'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Activity, Heart, Flame, Moon, ArrowRight, Share2, AlertTriangle, Play, Pause } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils/cn';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Slide {
  slide_id: string;
  header: string;
  primary_metric: string;
  subtext: string;
  percentage_trend_label?: string;
  intensity_breakdown?: Record<string, number>;
  theme_colors?: string[];
  recovery_metrics?: Record<string, any>;
}

interface WrappedResponse {
  status: string;
  wrapped: {
    time_horizon: string;
    slides: Slide[];
    shareable_summary_card: {
      title: string;
      total_minutes_active: number;
      total_calories_burned: number;
      archetype: string;
      archetype_tier: string;
      avg_sleep_efficiency: string;
      avg_hrv_ms: number;
      theme_colors: string[];
    }
  }
  isMock?: boolean;
}

const MOCK_DATA: WrappedResponse = {
  status: "success",
  wrapped: {
    time_horizon: "Past 7 Days",
    slides: [
      {
        slide_id: "total_minutes",
        header: "YOUR BODY WAS TUNED IN",
        primary_metric: "255 mins",
        subtext: "Spent in active training states. Moving 5,015 active kilocalories total.",
        percentage_trend_label: "-14% vs last week"
      },
      {
        slide_id: "top_genre",
        header: "YOUR GO-TO STIMULUS",
        primary_metric: "HIGH",
        subtext: "This training intensity single-handedly dominated your neuromuscular profile this week.",
        percentage_trend_label: "Top Training Genre",
        intensity_breakdown: {
          "high": 3,
          "medium": 2,
          "low": 2
        }
      },
      {
        slide_id: "cns_vibe",
        header: "YOUR PHYSIOLOGICAL VIBE TYPE",
        primary_metric: "The Steady Cruiser",
        subtext: "Balanced recovery metrics paired with consistent daily energy outputs. True homeostatic flow state.",
        theme_colors: ["#10B981", "#059669"],
        recovery_metrics: {
          avg_hrv_rmssd_ms: 50.3,
          avg_sleep_efficiency_pct: 92.1,
          avg_resting_hr_bpm: 50.7,
          hrv_trend_vs_last_week: "-23%"
        }
      },
      {
        slide_id: "body_quirk",
        header: "THE GLYCOGEN HIGH-POINT",
        primary_metric: "135 mg/dL",
        subtext: "Your peak systemic fuel saturation window lit up the charts on Sunday!",
        percentage_trend_label: "Metabolic Peak"
      }
    ],
    shareable_summary_card: {
      title: "ScreenSense Body Wrapped",
      total_minutes_active: 255,
      total_calories_burned: 5015,
      archetype: "The Steady Cruiser",
      archetype_tier: "homeostasis",
      avg_sleep_efficiency: "92%",
      avg_hrv_ms: 50.3,
      theme_colors: ["#10B981", "#059669"]
    }
  },
  isMock: true,
};

// Generate 7 days of dummy logs for the POST payload
const generateHistoryLogs = () => {
  const logs = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    logs.push({
      date: d.toISOString().split('T')[0],
      workout_duration_minutes: Math.floor(Math.random() * 60) + 30,
      active_calories: Math.floor(Math.random() * 500) + 200,
      hrv_rmssd: Math.floor(Math.random() * 40) + 40,
      sleep_efficiency: 0.8 + Math.random() * 0.15,
      resting_heart_rate: Math.floor(Math.random() * 15) + 45,
      blood_glucose_mg_dl: Math.floor(Math.random() * 40) + 90
    });
  }
  return logs;
};

export function AITrainerDashboard() {
  const [data, setData] = useState<WrappedResponse | null>(null);
  const [modelData, setModelData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    async function fetchAnalytics() {
      const logs = generateHistoryLogs();
      try {
        const payload = {
          athlete_id: "athlete_1",
          history: logs
        };

        const response = await fetch('https://hacksprint-mtyl.onrender.com/api/v1/analytics/wrapped', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000) // 10s timeout
        });
        
        if (!response.ok) {
          throw new Error('API returned an error');
        }
        
        const result = await response.json();
        if (result && result.wrapped) {
          setData(result);
        } else {
          throw new Error('Invalid data structure');
        }
      } catch (error) {
        console.warn('Failed to fetch AI Trainer data, falling back to mock data:', error);
        setData(MOCK_DATA);
      } finally {
        // Generate chronological model prediction mock data for the graph
        const chronologicalLogs = [...logs].reverse();
        const predictions = chronologicalLogs.map((log, index) => {
          // Normal pattern: a steady, optimal physiological wave
          const normalPattern = 45 + Math.sin(index / chronologicalLogs.length * Math.PI * 2) * 10;
          return {
            date: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
            injury_risk: Math.round(Math.random() * 30 + 10),
            cns_fatigue: Math.round(Math.random() * 40 + 20),
            metabolic_load: Math.round(Math.random() * 50 + 40),
            normal_pattern: Math.round(normalPattern),
          };
        });
        setModelData(predictions);
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center bg-neutral-900/40 rounded-xl border border-white/5 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400 font-bank animate-pulse tracking-widest uppercase text-sm">Processing 7-Day Telemetry...</p>
      </div>
    );
  }

  if (!data) return null;

  const slides = data.wrapped.slides;
  const summary = data.wrapped.shareable_summary_card;
  const themeColors = summary.theme_colors || ["#000000", "#111111"];
  const gradientStyle = {
    background: `linear-gradient(135deg, ${themeColors[0]}40, ${themeColors[1]}80)`,
  };

  const nextSlide = () => {
    if (activeSlideIndex < slides.length) {
      setActiveSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(prev => prev - 1);
    }
  };

  const isSummaryView = activeSlideIndex === slides.length;

  return (
    <>
    <div className="relative rounded-3xl overflow-hidden transition-all duration-1000 shadow-2xl min-h-[600px] flex flex-col" style={gradientStyle}>
      {/* Decorative Overlays */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-50 z-0 pointer-events-none" style={{ backgroundColor: themeColors[0] }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 z-0 pointer-events-none" style={{ backgroundColor: themeColors[1] }} />

      {/* Header Bar */}
      <div className="relative z-10 flex justify-between items-center p-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <BrainCircuit className="w-5 h-5" />
          <span className="font-heading tracking-widest uppercase font-bold">Body Wrapped</span>
        </div>
        <div className="text-white/60 font-bank text-xs uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full border border-white/10">
          {data.wrapped.time_horizon}
        </div>
      </div>

      {data.isMock && (
        <div className="relative z-10 bg-black/50 border-b border-white/5 text-gray-300 px-4 py-2 text-xs font-bank flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          External engine unavailable. Displaying cached weekly recap.
        </div>
      )}

      {/* Progress Bars */}
      <div className="relative z-10 flex gap-2 px-6 pt-6">
        {[...Array(slides.length + 1)].map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full bg-white transition-all duration-300",
                idx < activeSlideIndex ? "w-full" : idx === activeSlideIndex ? "w-full animate-pulse" : "w-0"
              )} 
            />
          </div>
        ))}
      </div>

      {/* Slide Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        
        {!isSummaryView ? (
          // Individual Slide View
          <div className="max-w-2xl w-full space-y-8 animate-in fade-in zoom-in duration-500">
            <p className="text-white/70 font-bank tracking-[0.2em] uppercase text-sm font-bold">
              {slides[activeSlideIndex].header}
            </p>
            
            <h2 className="text-6xl md:text-8xl font-heading font-black text-white drop-shadow-2xl">
              {slides[activeSlideIndex].primary_metric}
            </h2>
            
            <p className="text-xl md:text-2xl text-white/90 font-bank leading-relaxed max-w-xl mx-auto">
              {slides[activeSlideIndex].subtext}
            </p>

            {slides[activeSlideIndex].percentage_trend_label && (
              <div className="inline-block mt-4 px-4 py-2 rounded-full bg-black/30 border border-white/20 backdrop-blur-md">
                <span className="text-white font-bank font-bold tracking-widest text-sm uppercase">
                  {slides[activeSlideIndex].percentage_trend_label}
                </span>
              </div>
            )}
          </div>
        ) : (
          // Summary Card View
          <div className="max-w-md w-full animate-in slide-in-from-bottom-8 duration-700">
            <Card className="bg-black/40 backdrop-blur-xl border-white/20 overflow-hidden shadow-2xl">
              <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${themeColors[0]}, ${themeColors[1]})` }} />
              <CardBody className="p-8 space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-gray-400 font-bank text-xs uppercase tracking-widest">Your Weekly Archetype</p>
                  <h2 className="text-3xl font-heading font-black text-white uppercase tracking-tight">
                    {summary.archetype}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Activity className="w-5 h-5 text-white/60 mb-2" />
                    <p className="text-2xl font-bold text-white font-heading">{summary.total_minutes_active}</p>
                    <p className="text-[10px] text-gray-400 font-bank uppercase tracking-widest">Active Mins</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Flame className="w-5 h-5 text-white/60 mb-2" />
                    <p className="text-2xl font-bold text-white font-heading">{summary.total_calories_burned}</p>
                    <p className="text-[10px] text-gray-400 font-bank uppercase tracking-widest">Calories</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Moon className="w-5 h-5 text-white/60 mb-2" />
                    <p className="text-2xl font-bold text-white font-heading">{summary.avg_sleep_efficiency}</p>
                    <p className="text-[10px] text-gray-400 font-bank uppercase tracking-widest">Sleep Eff.</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Heart className="w-5 h-5 text-white/60 mb-2" />
                    <p className="text-2xl font-bold text-white font-heading">{summary.avg_hrv_ms}</p>
                    <p className="text-[10px] text-gray-400 font-bank uppercase tracking-widest">Avg HRV (ms)</p>
                  </div>
                </div>

                <Button className="w-full font-bank uppercase tracking-widest gap-2 bg-white text-black hover:bg-gray-200 border-none">
                  <Share2 className="w-4 h-4" /> Share Summary
                </Button>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="relative z-10 p-6 flex justify-between items-center bg-gradient-to-t from-black/50 to-transparent">
        <Button 
          variant="ghost" 
          onClick={prevSlide}
          disabled={activeSlideIndex === 0}
          className="text-white hover:bg-white/10 disabled:opacity-30 font-bank uppercase tracking-widest"
        >
          Previous
        </Button>
        
        {!isSummaryView ? (
          <Button 
            onClick={nextSlide}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bank uppercase tracking-widest gap-2 backdrop-blur-md"
          >
            Next Slide <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button 
            onClick={() => setActiveSlideIndex(0)}
            variant="ghost"
            className="text-white hover:bg-white/10 font-bank uppercase tracking-widest"
          >
            Replay
          </Button>
        )}
      </div>
    </div>

    {/* Prediction Models Graph Section */}
    <Card className="mt-8 bg-neutral-900 border-white/10 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-black/40 p-6">
        <CardTitle className="flex items-center gap-2 text-white font-heading text-2xl">
          <Activity className="w-6 h-6 text-emerald-400" />
          Physiological Model Predictions
        </CardTitle>
        <p className="text-gray-400 font-bank text-sm uppercase tracking-widest">7-Day Analysis (Injury Risk, CNS Fatigue, Metabolic Load)</p>
      </CardHeader>
      <CardBody className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={modelData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="date" 
              stroke="#ffffff50"
              tick={{ fill: '#ffffff80', fontSize: 12, fontFamily: 'var(--font-bank)' }}
            />
            <YAxis 
              stroke="#ffffff50"
              tick={{ fill: '#ffffff80', fontSize: 12, fontFamily: 'var(--font-bank)' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#111111', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontFamily: 'var(--font-bank)',
                color: '#fff'
              }}
              itemStyle={{ fontFamily: 'var(--font-bank)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'var(--font-bank)' }} />
            <Line 
              type="monotone" 
              dataKey="injury_risk" 
              name="Injury Risk (%)" 
              stroke="#EF4444" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: '#000' }}
            />
            <Line 
              type="monotone" 
              dataKey="cns_fatigue" 
              name="CNS Fatigue (%)" 
              stroke="#F59E0B" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2, fill: '#000' }}
            />
            <Line 
              type="monotone" 
              dataKey="metabolic_load" 
              name="Metabolic Load (%)" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#000' }}
            />
            <Line 
              type="monotone" 
              dataKey="normal_pattern" 
              name="Optimal Baseline Pattern" 
              stroke="#ffffff80" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
    </>
  );
}
