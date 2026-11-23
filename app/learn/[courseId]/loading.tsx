import React from 'react';
import { Play } from 'lucide-react';

export default function LearnPortalLoading() {
  return (
    <div className="min-h-screen bg-slate-900 text-white animate-pulse">
      {/* Top Learning Bar Skeleton */}
      <div className="h-16 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
        <div className="h-6 w-48 bg-slate-800 rounded-lg" />
        <div className="h-8 w-24 bg-slate-800 rounded-xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video & Content Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video w-full rounded-3xl bg-slate-800 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-slate-700/80 flex items-center justify-center text-slate-500">
              <Play className="h-8 w-8 ml-1" />
            </div>
          </div>
          <div className="h-8 w-3/4 bg-slate-800 rounded-xl" />
          <div className="h-4 w-full bg-slate-800 rounded-lg" />
          <div className="h-4 w-5/6 bg-slate-800 rounded-lg" />
        </div>

        {/* Sidebar Lessons Drawer Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-36 bg-slate-800 rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-800/80 p-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-slate-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 bg-slate-700 rounded" />
                  <div className="h-3 w-1/2 bg-slate-700/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
