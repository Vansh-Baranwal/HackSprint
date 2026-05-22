'use client';

import React from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { AITrainerDashboard } from '@/components/features/ai-trainer-dashboard';

export default function AITrainerPage() {
  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-heading uppercase tracking-widest flex items-center gap-3">
            AI Trainer
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-bank">
            Personalised training insights and load monitoring powered by HackSprint Intelligence.
          </p>
        </div>

        <AITrainerDashboard />
      </div>
    </AuthenticatedLayout>
  );
}
