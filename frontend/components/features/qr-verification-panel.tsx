'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { CheckCircle, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface QRVerificationPanelProps {
  qrToken: string;
}

export const QRVerificationPanel: React.FC<QRVerificationPanelProps> = ({ qrToken }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [status, setStatus] = useState<'pending' | 'verified'>('pending');
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Polling for QR status
    if (status === 'verified') return;

    const poll = async () => {
      try {
        const data = await apiClient.get<any>(`/qr/verify/${qrToken}`);
        if (data.status === 'verified') {
          setStatus('verified');
          setVerificationData(data);
        }
      } catch (err) {
        console.error('Failed to verify QR', err);
      }
    };

    const intervalId = setInterval(poll, 2500); // poll every 2.5s

    return () => clearInterval(intervalId);
  }, [qrToken, status]);

  return (
    <Card className="mt-6 border-blue-200 shadow-md">
      <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
        <CardTitle className="text-blue-800 dark:text-blue-200">
          Instant Verification Simulation
        </CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col md:flex-row items-center gap-8 p-6">
        <div className="flex-shrink-0 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <QRCodeSVG value={`https://athleteshield.com/verify/${qrToken}`} size={160} />
        </div>
        
        <div className="flex-1 space-y-4 w-full">
          {status === 'pending' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <Clock className="w-6 h-6 animate-pulse" />
                <h3 className="text-xl font-semibold">Verification Pending</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Please wait while the automated verification system processes your document.
                This QR code will be verified in approximately <strong>{timeLeft} seconds</strong>.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                <div 
                  className="bg-yellow-400 h-2.5 rounded-full transition-all duration-1000 ease-linear" 
                  style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-xl font-semibold">Verified Successfully</h3>
              </div>
              
              {verificationData && verificationData.athlete && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Athlete Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Name:</div>
                    <div className="font-medium">{verificationData.athlete.name || 'N/A'}</div>
                    <div className="text-gray-500">Code:</div>
                    <div className="font-medium">{verificationData.athlete.athleteCode}</div>
                    <div className="text-gray-500">Sport:</div>
                    <div className="font-medium">{verificationData.athlete.primarySport}</div>
                  </div>
                </div>
              )}

              {verificationData && verificationData.reports && verificationData.reports.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider mb-2">Linked Reports ({verificationData.reports.length})</h4>
                  <ul className="space-y-2">
                    {verificationData.reports.map((report: any) => (
                      <li key={report.id} className="text-sm text-red-700 dark:text-red-400 flex justify-between border-b border-red-100 dark:border-red-800/50 pb-1 last:border-0 last:pb-0">
                        <span>{report.title}</span>
                        <span className="font-semibold text-xs py-0.5 px-2 bg-red-100 dark:bg-red-800 rounded-full">{report.severity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
