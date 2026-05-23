import React from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/" className="text-orange-500 hover:text-orange-400 mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-extrabold text-white font-heading uppercase tracking-widest">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500">Last Updated: May 2026</p>

        <div className="space-y-6 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Khel Setu, you accept and agree to be bound by the terms and provision of this agreement. Khel Setu provides a blockchain-backed platform for athlete verification and credential management.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. User Accounts</h2>
            <p>
              Athletes and Federations must provide accurate, complete, and current registration information. You are responsible for safeguarding your credentials and reporting any unauthorized use of your account to the platform administrators immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Verification Rules</h2>
            <p>
              Any documents uploaded for verification must be authentic and unaltered. Fraudulent document submission may result in a permanent ban from the Khel Setu platform and associated sporting federations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
