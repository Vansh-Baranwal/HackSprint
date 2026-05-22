'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { QRScanner } from '@/components/features/qr-scanner';
import { CredentialVerificationDisplay } from '@/components/features/credential-verification-display';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';

export default function QRVerificationPage() {
  const [verificationData, setVerificationData] = useState<any>(null);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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

  const handleScan = async (scannedText: string) => {
    setIsVerifying(true);
    setError('');
    setVerificationData(null);

    let token = scannedText.trim();
    try {
      // If the QR code contains a full URL like https://athleteshield.com/verify/{token}
      const url = new URL(token);
      if (url.pathname.includes('/verify/')) {
        token = url.pathname.split('/verify/').pop() || token;
      } else if (url.searchParams.has('token')) {
        token = url.searchParams.get('token')!;
      }
    } catch (e) {
      // Not a valid URL, assume the raw text is the token
    }

    try {
      const response = await apiClient.post<any>('/public/credentials/verify', { token });
      setVerificationData(response);
    } catch (err: any) {
      setError(
        err.response?.status === 404 || err.response?.status === 400
          ? 'Invalid or expired credential. Please check the QR code and try again.'
          : 'Failed to verify credential. Please try again later.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setVerificationData(null);
    setError('');
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

      <div className="relative z-10 w-full max-w-2xl space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-3 hover:scale-105 transition-transform duration-300">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 font-heading font-extrabold text-3xl uppercase tracking-widest drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              Khel Setu
            </span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading uppercase">
            Verify Credential
          </h1>
          <p className="mt-2 text-xs text-gray-400 font-bank uppercase tracking-wider">
            Scan a QR code or enter a token to verify an athlete's credential
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900/40 p-8 shadow-2xl backdrop-blur-xl">
          {/* Status Messages */}
          {isVerifying && (
            <div className="mb-6 p-4 border border-orange-500/30 bg-orange-950/20 rounded-lg">
              <p className="text-sm text-orange-400 font-bank uppercase">
                Verifying credential...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 border border-red-500/30 bg-red-950/20 rounded-lg">
              <p className="text-sm text-red-400 font-bank">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                className="mt-3 bg-neutral-800 hover:bg-neutral-700 text-white border-white/10 font-bank uppercase text-xs h-10 px-4"
              >
                Try Again
              </Button>
            </div>
          )}

          {verificationData ? (
            <div className="space-y-6">
              <CredentialVerificationDisplay data={verificationData} />
              <Button onClick={handleReset} className="w-full bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white border-0 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all font-bank uppercase tracking-widest text-xs h-12 rounded-full">
                Verify Another Credential
              </Button>
            </div>
          ) : (
            <QRScanner onScan={handleScan} />
          )}
        </div>

        <div className="mt-8 p-6 border border-white/5 bg-neutral-900/20 rounded-2xl backdrop-blur-sm">
          <h3 className="text-xs font-heading uppercase tracking-widest text-orange-400 mb-4 drop-shadow-md">
            About Credential Verification
          </h3>
          <ul className="text-xs text-gray-400 font-bank space-y-2 list-none">
            <li className="flex items-start"><span className="text-orange-500 mr-2">▹</span> Credentials are cryptographically signed and cannot be forged</li>
            <li className="flex items-start"><span className="text-orange-500 mr-2">▹</span> Verification is instant and does not require authentication</li>
            <li className="flex items-start"><span className="text-orange-500 mr-2">▹</span> Only public information is displayed during verification</li>
            <li className="flex items-start"><span className="text-orange-500 mr-2">▹</span> Revoked or expired credentials will be clearly marked</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
