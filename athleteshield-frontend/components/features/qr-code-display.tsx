'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  credentialType?: string;
}

export function QRCodeDisplay({ token, isOpen, onClose, credentialType }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `credential-qr-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleShare = async () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'credential-qr.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Credential QR Code',
              text: 'Scan this QR code to verify my credential',
            });
          } catch (err) {
            console.error('Error sharing:', err);
          }
        } else {
          alert('Sharing is not supported on this device');
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Credential QR Code">
      <div className="space-y-6">
        <div className="flex flex-col items-center">
          <div ref={qrRef} className="p-6 bg-white rounded-lg">
            <QRCodeSVG value={token} size={256} level="H" includeMargin />
          </div>
          {credentialType && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              {credentialType.replace(/_/g, ' ')}
            </p>
          )}
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to use this QR code:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Show this QR code to verifiers</li>
            <li>They can scan it to verify your credential</li>
            <li>The QR code is valid for a limited time</li>
            <li>Generate a new one if it expires</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleShare} className="flex-1">
            Share
          </Button>
          <Button onClick={handleDownload} className="flex-1">
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
