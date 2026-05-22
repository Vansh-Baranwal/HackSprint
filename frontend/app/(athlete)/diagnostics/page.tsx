'use client';

import React from 'react';
import { AuthenticatedLayout } from '@/components/layouts/authenticated-layout';
import { PosturalSway } from '@/components/features/postural-sway';

export default function DiagnosticsPage() {
  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-heading uppercase tracking-widest">
            Diagnostics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-bank">
            Run clinical-grade baseline assessments and check your concussion status
          </p>
        </div>

        <PosturalSway />
      </div>
    </AuthenticatedLayout>
  );
}
