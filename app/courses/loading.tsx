import React from 'react';

export default function CoursesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 animate-pulse">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="h-10 w-72 bg-slate-200 rounded-xl mx-auto mb-3" />
        <div className="h-4 w-96 bg-slate-200 rounded-lg mx-auto" />
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-10">
        <div className="h-11 w-44 rounded-2xl bg-slate-200" />
        <div className="h-11 w-44 rounded-2xl bg-slate-200" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="aspect-video w-full rounded-2xl bg-slate-200 mb-4" />
            <div className="h-5 w-3/4 bg-slate-200 rounded-lg mb-2" />
            <div className="h-4 w-1/2 bg-slate-200 rounded-lg mb-6" />
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-slate-200 rounded-lg" />
              <div className="h-9 w-28 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
