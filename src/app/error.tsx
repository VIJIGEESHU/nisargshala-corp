'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe diagnostic error without secrets
    console.error('[CLIENT_CRASH_AUDIT]', error.name, error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center p-6 text-forest-950 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-forest-200 p-8 shadow-2xl text-center space-y-6">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-forest-600/30 bg-white mx-auto shadow-md">
          <Image
            src="/images/nisargshala-logo.png"
            alt="Nisargshala Logo"
            fill
            className="object-contain p-1"
            priority
          />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            Temporary Session Mismatch
          </div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Nisargshala Portal Recovery
          </h1>
          <p className="text-xs text-forest-600 leading-relaxed">
            We encountered a temporary client-side interface mismatch. Click below to refresh your session assets.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="w-full bg-forest-800 hover:bg-forest-900 text-white py-3.5 rounded-xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page & Retry
          </button>

          <a
            href="/"
            className="w-full bg-sand-100 hover:bg-sand-200 text-forest-900 py-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 block border border-sand-300"
          >
            <Home className="w-4 h-4" />
            Return to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
