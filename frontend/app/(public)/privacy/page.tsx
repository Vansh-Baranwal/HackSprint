import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="text-orange-500 hover:text-orange-400 mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-extrabold text-white font-heading uppercase tracking-widest">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500">Last Updated: May 2026</p>

        <div className="space-y-6 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Data Collection</h2>
            <p>
              At Khel Setu, we collect personal information such as name, date of birth, biometric data (if voluntarily provided), and sporting credentials. We only collect data necessary to verify your athletic identity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. How We Use Your Data</h2>
            <p>
              Your data is primarily used to process verification requests with respective sporting federations. We also use anonymized telemetry data in our AI Coach to provide personalized training and recovery recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Data Security and Blockchain</h2>
            <p>
              We utilize state-of-the-art encryption to secure your documents. Verified credentials are cryptographically signed and stored on a decentralized ledger to ensure tamper-proof authenticity while preserving your privacy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
