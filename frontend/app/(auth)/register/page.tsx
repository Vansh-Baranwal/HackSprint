'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { RegisterForm } from '@/components/forms/register-form';
import { apiClient } from '@/lib/api/client';
import type { RegisterFormData } from '@/lib/validations/auth';

export default function RegisterPage() {
  const [error, setError] = useState<string>('');

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

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-2xl space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-3 hover:scale-105 transition-transform duration-300">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 font-heading font-extrabold text-3xl uppercase tracking-widest drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              VONN
            </span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading uppercase">
            Create your account
          </h1>
          <p className="mt-2 text-xs text-gray-400 font-bank uppercase tracking-wider">
            Join VONN to manage your athlete identity securely
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <RegisterForm onSubmit={handleRegister} error={error} />
        </div>

        <div className="text-center text-xs text-gray-500 font-bank">
          <p>
            By creating an account, you agree to our{' '}
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
