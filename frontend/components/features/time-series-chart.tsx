'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimeSeriesData } from '@/types';

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  title: string;
}

export function TimeSeriesChart({ data, title }: TimeSeriesChartProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6B7280' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fill: '#6B7280' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#F9FAFB',
            }}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="registrations"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Registrations"
          />
          <Line
            type="monotone"
            dataKey="verifications"
            stroke="#10B981"
            strokeWidth={2}
            name="Verifications"
          />
          <Line
            type="monotone"
            dataKey="reports"
            stroke="#EF4444"
            strokeWidth={2}
            name="Reports"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
