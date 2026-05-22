'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { LoginForm } from '@/components/forms/login-form';
import { apiClient } from '@/lib/api/client';
import type { LoginFormData } from '@/lib/validations/auth';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const registered = searchParams.get('registered');

  // Mouse tracking for interactive background spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMounted, setIsMounted] = useState(false);

  const springConfig = { damping: 25, stiffness: 200 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleLogin = async (data: LoginFormData) => {
    try {
      setError('');
      const response = await apiClient.post<any>('/auth/login', data);
      
      // Store auth data in localStorage
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        // Also set as a cookie so the Next.js middleware can read it for route protection
        document.cookie = `Access_Token=${response.accessToken}; path=/; max-age=${15 * 60}; SameSite=Lax`;
      }
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      // Hard redirect to dashboard to ensure clean page load
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error("Login error:", err);
      const message = err.response?.data?.message || err.message || 'Invalid email or password';
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8 overflow-hidden selection:bg-orange-500/30">
      {/* Interactive Cursor Background (Spotlight) */}
      {isMounted && (
        <motion.div
          className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 mix-blend-screen blur-[120px]"
          style={{
            x: smoothMouseX,
            y: smoothMouseY,
            background: 'radial-gradient(circle, rgba(249,115,22,0.3) 0%, rgba(239,68,68,0.08) 40%, rgba(0,0,0,0) 70%)',
          }}
        />
      )}

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-3 hover:scale-105 transition-transform duration-300">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 font-heading font-extrabold text-3xl uppercase tracking-widest drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              Khel Setu
            </span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading uppercase">
            Welcome back
          </h1>
          <p className="mt-2 text-xs text-gray-400 font-bank uppercase tracking-wider">
            Sign in to your Khel Setu account
          </p>
        </div>

        {registered && (
          <div
            className="rounded-lg border border-green-800 bg-green-900/20 p-4 text-sm text-green-300 font-bank"
            role="alert"
          >
            Registration successful! Please sign in with your credentials.
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-neutral-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <LoginForm onSubmit={handleLogin} error={error} />
        </div>

        <div className="text-center text-xs text-gray-500 font-bank">
          <p>
            By signing in, you agree to our{' '}
            <Link
              href="/terms"
              className="font-medium text-orange-400 hover:text-orange-300 transition-colors"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="font-medium text-orange-400 hover:text-orange-300 transition-colors"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
