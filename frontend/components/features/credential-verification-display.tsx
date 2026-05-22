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
    <Card className={`p-6 ${isValid ? 'border-green-300' : 'border-red-300'}`}>
      <div className="space-y-6">
        <div className="text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isValid
                ? 'bg-green-100 dark:bg-green-900/20'
                : 'bg-red-100 dark:bg-red-900/20'
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

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
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
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Athlete Name</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {data.athleteName}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Issuing Federation</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {data.federationName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Credential Type</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {data.credentialType.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Issue Date</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {new Date(data.issueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {data.claims && Object.keys(data.claims).length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Verified Claims
              </p>
              <dl className="space-y-2">
                {Object.entries(data.claims).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-gray-600 dark:text-gray-400">
                      {key.replace(/_/g, ' ')}:
                    </dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-medium">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
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
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Trust Indicators
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
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
