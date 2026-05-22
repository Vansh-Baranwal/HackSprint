'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/forms/login-form';
import { apiClient } from '@/lib/api/client';
import type { LoginFormData } from '@/lib/validations/auth';
import type { User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const registered = searchParams.get('registered');

  const handleLogin = async (data: LoginFormData) => {
    try {
      setError('');
      const user = await apiClient.post<User>('/auth/login', data);
      
      // Redirect based on user role
      if (user.roles.includes('ATHLETE')) {
        router.push('/dashboard');
      } else if (user.roles.includes('FEDERATION')) {
        router.push('/dashboard');
      } else if (user.roles.includes('ADMIN') || user.roles.includes('INVESTIGATOR')) {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid email or password';
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your AthleteShield account
          </p>
        </div>

        {registered && (
          <div
            className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
            role="alert"
          >
            Registration successful! Please sign in with your credentials.
          </div>
        )}

        <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-gray-800">
          <LoginForm onSubmit={handleLogin} error={error} />
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>
            By signing in, you agree to our{' '}
            <Link
              href="/terms"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
