import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-4 flex items-center justify-center">
        <div className="h-16 w-16 animate-ping rounded-full bg-blue-400 opacity-20" />
        <div className="absolute flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
          <GraduationCap className="h-8 w-8 animate-bounce" />
        </div>
      </div>
      <h2 className="text-base font-bold text-slate-800 tracking-tight">
        Loading Lofty LMS...
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Preparing your fast learning environment
      </p>
    </div>
  );
}
