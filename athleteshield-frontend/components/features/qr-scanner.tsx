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
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Scan QR Code
        </h3>

        {!isScanning ? (
          <div className="space-y-4">
            <div
              id="qr-reader"
              className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
            >
              <p className="text-gray-500 dark:text-gray-400">
                Click "Start Scanning" to begin
              </p>
            </div>
            <Button onClick={startScanning} className="w-full">
              Start Scanning
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div id="qr-reader" className="w-full" />
            <Button onClick={stopScanning} variant="secondary" className="w-full">
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

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Or Enter Token Manually
        </h3>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Input
            label="Credential Token"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Enter the credential token"
          />
          <Button type="submit" disabled={!manualToken.trim()} className="w-full">
            Verify Token
          </Button>
        </form>
      </Card>
    </div>
  );
}
