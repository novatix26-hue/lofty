import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-10 w-64 bg-slate-200 rounded-xl mb-3" />
      <div className="h-4 w-96 bg-slate-200 rounded-lg mb-8" />

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>

      {/* Course List Skeleton */}
      <div className="h-6 w-48 bg-slate-200 rounded-lg mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-40 w-full rounded-xl bg-slate-200 mb-4" />
            <div className="h-5 w-3/4 bg-slate-200 rounded-lg mb-2" />
            <div className="h-3 w-1/2 bg-slate-200 rounded-lg mb-6" />
            <div className="h-9 w-full bg-slate-200 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
