'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RegisterForm } from '@/components/forms/register-form';
import { apiClient } from '@/lib/api/client';
import type { RegisterFormData } from '@/lib/validations/auth';

export default function RegisterPage() {
  const [error, setError] = useState<string>('');

  const handleRegister = async (data: RegisterFormData) => {
    try {
      setError('');
      await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      // Router push is handled in the RegisterForm component
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join AthleteShield to manage your athlete identity securely
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-gray-800">
          <RegisterForm onSubmit={handleRegister} error={error} />
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>
            By creating an account, you agree to our{' '}
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
