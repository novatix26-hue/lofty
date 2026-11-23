'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, LayoutDashboard } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected runtime errors for observability
    console.error('[Global Error Boundary Caught]:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-md">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h1 className="mt-5 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
        An unexpected error occurred while processing your request. Please try reloading the view
        or return to your dashboard.
      </p>

      {error.message && (
        <div className="mt-4 max-w-lg rounded-xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-[11px] font-mono text-red-700">
          {error.message}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4 text-slate-500" />
          <span>Go to Dashboard</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Home className="h-4 w-4 text-slate-500" />
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}
