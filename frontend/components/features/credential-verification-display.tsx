'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CredentialVerificationDisplayProps {
  data: {
    athleteName: string;
    federationName: string;
    issueDate: string;
    credentialType: string;
    status: 'VALID' | 'EXPIRED' | 'REVOKED';
    claims?: Record<string, any>;
  };
}

export function CredentialVerificationDisplay({ data }: CredentialVerificationDisplayProps) {
  const isValid = data.status === 'VALID';

  return (
    <Card className="p-0 bg-transparent border-none shadow-none">
      <div className="space-y-6">
        <div className="text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isValid
                ? 'bg-green-500/20 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'bg-red-500/20 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
            }`}
          >
            {isValid ? (
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white font-heading uppercase tracking-wider mb-2">
            {isValid ? 'Credential Verified' : 'Credential Invalid'}
          </h2>
          <Badge
            variant={isValid ? 'success' : 'error'}
            className="text-lg px-4 py-2"
          >
            {data.status}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-neutral-900/50 border border-white/5 rounded-xl">
            <p className="text-xs text-gray-400 font-bank uppercase tracking-widest">Athlete Name</p>
            <p className="text-lg font-semibold text-white mt-1">
              {data.athleteName}
            </p>
          </div>

          <div className="p-4 bg-neutral-900/50 border border-white/5 rounded-xl">
            <p className="text-xs text-gray-400 font-bank uppercase tracking-widest">Issuing Federation</p>
            <p className="text-lg font-semibold text-white mt-1">
              {data.federationName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-900/50 border border-white/5 rounded-xl">
              <p className="text-xs text-gray-400 font-bank uppercase tracking-widest">Credential Type</p>
              <p className="text-sm font-medium text-white mt-1">
                {data.credentialType.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="p-4 bg-neutral-900/50 border border-white/5 rounded-xl">
              <p className="text-xs text-gray-400 font-bank uppercase tracking-widest">Issue Date</p>
              <p className="text-sm font-medium text-white mt-1">
                {new Date(data.issueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {data.claims && Object.keys(data.claims).length > 0 && (
            <div className="p-4 bg-neutral-900/50 border border-white/5 rounded-xl">
              <p className="text-xs text-orange-400 font-heading uppercase tracking-widest mb-3">
                Verified Claims
              </p>
              <dl className="space-y-3">
                {Object.entries(data.claims).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <dt className="text-gray-400 font-bank uppercase text-xs">
                      {key.replace(/_/g, ' ')}:
                    </dt>
                    <dd className="text-white font-medium">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-orange-500 mt-0.5 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div>
              <p className="text-xs font-heading uppercase tracking-widest text-orange-400">
                Trust Indicators
              </p>
              <p className="text-xs text-orange-200/70 font-bank mt-1 leading-relaxed">
                This credential has been cryptographically verified and issued by an authorized
                federation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
