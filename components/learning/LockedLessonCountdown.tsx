'use client';

import { useState, useEffect } from 'react';
import { Clock, Lock, Sparkles, Moon, Sun, ArrowLeft } from 'lucide-react';
import { formatCountdown } from '@/lib/learning/drip';

interface LockedLessonCountdownProps {
  dayNumber: number;
  lessonTitle: string;
  unlockAt: string | Date;
  isKids?: boolean;
  onSelectPreviousDay?: () => void;
}

export function LockedLessonCountdown({
  dayNumber,
  lessonTitle,
  unlockAt,
  isKids = false,
  onSelectPreviousDay,
}: LockedLessonCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    // Initial calculation
    setTimeLeft(formatCountdown(unlockAt));

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(formatCountdown(unlockAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [unlockAt]);

  if (isKids) {
    // --- KIDS THEME: Playful, star-lit, encouraging, friendly ---
    return (
      <div className="flex min-h-[480px] flex-col items-center justify-center rounded-3xl border-2 border-purple-200 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 p-8 text-center text-white shadow-xl">
        <div className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600/30 ring-8 ring-purple-500/20 animate-pulse">
            <Moon className="h-12 w-12 text-amber-300" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-purple-950 font-black shadow-md">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>

        <span className="rounded-full bg-purple-500/20 px-4 py-1 text-xs font-black tracking-wide text-purple-300 uppercase">
          Day {dayNumber} is Resting!
        </span>

        <h2 className="mt-3 font-display text-2xl font-black text-white sm:text-3xl">
          Awesome work today!
        </h2>

        <p className="mt-2 max-w-md text-xs sm:text-sm text-purple-200 leading-relaxed font-semibold">
          You passed today&apos;s quiz. Day {dayNumber} ({lessonTitle}) unlocks tomorrow at 12:00 AM midnight (Pakistan Time). Get some good sleep and come back tomorrow!
        </p>

        {/* Live Countdown Box */}
        <div className="mt-6 rounded-3xl border-2 border-purple-500/40 bg-purple-900/50 p-6 backdrop-blur-md shadow-inner">
          <div className="flex items-center justify-center gap-2 text-xs font-display font-black text-amber-300 uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            <span>Unlocks In</span>
          </div>
          <div className="mt-2 font-mono text-3xl sm:text-5xl font-black text-white tracking-widest drop-shadow-md">
            {timeLeft || 'Calculating...'}
          </div>
          <span className="mt-2 block text-[11px] font-bold text-purple-300">
            Pakistan Standard Time (Asia/Karachi, UTC+5)
          </span>
        </div>

        {onSelectPreviousDay && (
          <button
            type="button"
            onClick={onSelectPreviousDay}
            className="mt-6 btn-3d-purple px-6 py-2.5 text-xs font-display font-black"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            <span>Review Previous Lessons</span>
          </button>
        )}
      </div>
    );
  }

  // --- ADULTS THEME: Clean, modern, distraction-free milestone ---
  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-200">
        <Lock className="h-8 w-8" />
      </div>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
        Scheduled Drip Milestone
      </span>

      <h2 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
        Day {dayNumber}: {lessonTitle}
      </h2>

      <p className="mt-2 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
        This lesson is locked by your course&apos;s daily drip schedule. In accordance with curriculum pacing, lessons unlock one calendar day at a time following successful quiz completion.
      </p>

      {/* Countdown Box */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-8 py-5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-blue-600" />
          <span>Scheduled to Unlock In</span>
        </span>
        <div className="mt-1 font-mono text-3xl font-bold text-slate-900 tracking-wider">
          {timeLeft || 'Calculating...'}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Unlocks at 12:00 AM PKT (Asia/Karachi)
        </p>
      </div>

      {onSelectPreviousDay && (
        <button
          type="button"
          onClick={onSelectPreviousDay}
          className="mt-6 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          &larr; Review previous lesson material
        </button>
      )}
    </div>
  );
}
