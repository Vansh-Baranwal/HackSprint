import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseDump Synthetic',
  description: 'Realtime synthetic wearable health data ingestion simulator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-green-400 antialiased">{children}</body>
    </html>
  );
}
