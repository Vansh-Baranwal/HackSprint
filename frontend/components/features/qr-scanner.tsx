'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (token: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          scanner.stop();
          setIsScanning(false);
          onScan(decodedText);
        },
        () => {
          // Ignore scan errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      setError('Failed to access camera. Please check permissions or enter the token manually.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      onScan(manualToken.trim());
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-0 bg-transparent border-none shadow-none">
        <h3 className="text-sm font-heading tracking-widest uppercase text-white mb-4 text-center">
          Scan QR Code
        </h3>

        {!isScanning ? (
          <div className="space-y-4">
            <div
              id="qr-reader"
              className="w-full aspect-square bg-neutral-900/50 border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden"
            >
              <p className="text-gray-500 dark:text-gray-400 font-bank text-xs uppercase tracking-widest">
                Click "Start Scanning"
              </p>
            </div>
            <Button onClick={startScanning} className="w-full bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white border-0 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all font-bank uppercase tracking-widest text-xs h-12 rounded-full mt-4">
              Start Scanning
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border border-orange-500/30" />
            <Button onClick={stopScanning} variant="secondary" className="w-full bg-neutral-800 hover:bg-neutral-700 text-white border-white/10 font-bank uppercase text-xs h-12 rounded-full mt-4">
              Stop Scanning
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </Card>

      <Card className="p-0 bg-transparent border-none shadow-none">
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 font-bank text-xs uppercase">Or</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>
        <h3 className="text-sm font-heading tracking-widest uppercase text-white mb-4 text-center">
          Enter Token Manually
        </h3>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Input
            label="Credential Token"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Enter the credential token"
          />
          <Button type="submit" disabled={!manualToken.trim()} className="w-full bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white border-0 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all font-bank uppercase tracking-widest text-xs h-12 rounded-full mt-2 disabled:opacity-50 disabled:shadow-none">
            Verify Token
          </Button>
        </form>
      </Card>
    </div>
  );
}
