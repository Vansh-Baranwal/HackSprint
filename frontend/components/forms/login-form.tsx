'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Lock } from 'lucide-react';

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, error: externalError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleFormSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {(externalError || errors.root) && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          role="alert"
        >
          {externalError || errors.root?.message}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        icon={<Mail className="h-5 w-5" />}
        error={errors.email?.message}
        disabled={isLoading}
        required
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        icon={<Lock className="h-5 w-5" />}
        error={errors.password?.message}
        disabled={isLoading}
        required
        {...register('password')}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-zinc-700 bg-neutral-900/50 text-orange-600 focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-400 font-bank">Remember me</span>
        </label>

        <Link
          href="/forgot-password"
          className="text-sm font-bank text-orange-400 hover:text-orange-300"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white border-0 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all font-bank uppercase tracking-widest text-xs h-12 rounded-full">
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-gray-400 font-bank">
        Don't have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-orange-400 hover:text-orange-300"
        >
          Register here
        </Link>
      </p>
    </form>
  );
};
