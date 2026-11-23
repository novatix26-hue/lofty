'use client';

import {
  CheckCircle2,
  PlayCircle,
  Clock,
  Lock,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';
import { formatCountdown } from '@/lib/learning/drip';

export interface LessonSidebarItem {
  id: string;
  dayNumber: number;
  title: string;
  durationSeconds: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  unlockAt: string | null;
  isLockedByTime: boolean; // unlock_at > now
}

interface LearningSidebarProps {
  courseTitle: string;
  courseCategory: 'kids' | 'adults';
  lessons: LessonSidebarItem[];
  selectedLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function LearningSidebar({
  courseTitle,
  courseCategory,
  lessons,
  selectedLessonId,
  onSelectLesson,
  isOpen = false,
  onClose,
}: LearningSidebarProps) {
  const isKids = courseCategory === 'kids';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isKids ? 'border-purple-200' : 'border-slate-200'}`}
      >
        {/* Header */}
        <div
          className={`flex h-16 items-center justify-between border-b px-5 ${
            isKids ? 'border-purple-100 bg-purple-50/50' : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${
                isKids ? 'bg-purple-600' : 'bg-slate-900'
              }`}
            >
              {isKids ? <Sparkles className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Curriculum Schedule
              </span>
              <h2 className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                {courseTitle}
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {lessons.map((lesson) => {
            const isSelected = selectedLessonId === lesson.id;
            const isCompleted = lesson.isCompleted;
            const isScheduledTomorrow = lesson.isLockedByTime;
            const isLocked = !lesson.isUnlocked && !isScheduledTomorrow;
            const isCurrent = !isCompleted && !isScheduledTomorrow && !isLocked;

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => {
                  onSelectLesson(lesson.id);
                  onClose?.();
                }}
                className={`group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-all ${
                  isSelected
                    ? isKids
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : isCurrent
                    ? isKids
                      ? 'border border-purple-200 bg-purple-50/80 hover:bg-purple-100/70'
                      : 'border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70'
                    : 'border border-transparent hover:bg-slate-50'
                }`}
              >
                {/* Status Indicator Icon */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted && (
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isSelected ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}

                  {isCurrent && (
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isSelected ? 'bg-white text-blue-600' : isKids ? 'bg-purple-600 text-white animate-pulse' : 'bg-blue-600 text-white animate-pulse'
                      }`}
                    >
                      <PlayCircle className="h-4 w-4" />
                    </div>
                  )}

                  {isScheduledTomorrow && (
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isSelected ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                    </div>
                  )}

                  {isLocked && (
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isSelected ? 'bg-white text-slate-400' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isSelected
                          ? 'text-white/80'
                          : isKids
                          ? 'text-purple-700'
                          : 'text-blue-600'
                      }`}
                    >
                      Day {lesson.dayNumber}
                    </span>

                    {/* Badge */}
                    {isCompleted && (
                      <span
                        className={`text-[10px] font-bold ${
                          isSelected ? 'text-emerald-200' : 'text-emerald-600'
                        }`}
                      >
                        Done
                      </span>
                    )}

                    {isScheduledTomorrow && lesson.unlockAt && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          isSelected
                            ? 'bg-amber-300 text-purple-950'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Tomorrow
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-xs font-bold truncate leading-snug mt-0.5 ${
                      isSelected
                        ? 'text-white'
                        : isLocked
                        ? 'text-slate-400'
                        : 'text-slate-900'
                    }`}
                  >
                    {lesson.title}
                  </h4>

                  <span
                    className={`block text-[10px] mt-0.5 ${
                      isSelected ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {Math.round(lesson.durationSeconds / 60)} mins
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Drip Policy Footer */}
        <div
          className={`border-t p-4 text-[11px] leading-relaxed ${
            isKids ? 'border-purple-100 bg-purple-50/50 text-purple-900' : 'border-slate-100 bg-slate-50 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span>Pacing Policy</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Pass each daily quiz with $\ge 70\%$ to unlock the next day&apos;s lesson at 12:00 AM PKT midnight.
          </p>
        </div>
      </aside>
    </>
  );
}
