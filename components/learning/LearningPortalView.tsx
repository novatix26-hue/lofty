'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Menu,
  PlayCircle,
  HelpCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  Briefcase,
  Clock,
} from 'lucide-react';
import { LearningSidebar, type LessonSidebarItem } from './LearningSidebar';
import { VideoPlayer } from './VideoPlayer';
import { LockedLessonCountdown } from './LockedLessonCountdown';
import { KidsQuizPlayer } from './KidsQuizPlayer';
import { AdultsQuizPlayer } from './AdultsQuizPlayer';
import type { Course, StudentQuizQuestion } from '@/types';

export interface LessonWithClientData {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  videoUrl: string | null; // Null if locked by time
  durationSeconds: number;
  isUnlocked: boolean;
  unlockAt: string | null;
  isLockedByTime: boolean;
  isCompleted: boolean;
  videoWatched: boolean;
  quizPassed: boolean;
  quizId?: string;
  questions: StudentQuizQuestion[]; // Without correct_option_id
}

interface LearningPortalViewProps {
  course: Course;
  lessons: LessonWithClientData[];
  initialLessonId: string;
}

export function LearningPortalView({
  course,
  lessons: initialLessons,
  initialLessonId,
}: LearningPortalViewProps) {
  const [lessons, setLessons] = useState<LessonWithClientData[]>(initialLessons);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(initialLessonId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'quiz'>('video');

  const isKids = course.category === 'kids';

  const currentLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];

  // Map to sidebar items
  const sidebarItems: LessonSidebarItem[] = lessons.map((l) => ({
    id: l.id,
    dayNumber: l.dayNumber,
    title: l.title,
    durationSeconds: l.durationSeconds,
    isCompleted: l.isCompleted,
    isUnlocked: l.isUnlocked,
    unlockAt: l.unlockAt,
    isLockedByTime: l.isLockedByTime,
  }));

  // Handle video 85% watched
  function handleQuizUnlocked() {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === currentLesson.id ? { ...l, videoWatched: true } : l
      )
    );
  }

  // Handle quiz passed
  function handleLessonPassed() {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === currentLesson.id
          ? { ...l, isCompleted: true, quizPassed: true, videoWatched: true }
          : l
      )
    );
  }

  return (
    <div
      className={`flex min-h-screen ${
        isKids ? 'bg-[#FFFDF7] text-slate-900' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Sidebar Navigation */}
      <LearningSidebar
        courseTitle={course.title}
        courseCategory={course.category}
        lessons={sidebarItems}
        selectedLessonId={selectedLessonId}
        onSelectLesson={(id) => {
          setSelectedLessonId(id);
          setActiveTab('video');
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Learning Workspace */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        {/* Top Navbar */}
        <header
          className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md sm:px-6 ${
            isKids
              ? 'bg-[#FFFDF7]/95 border-amber-200/80 shadow-xs'
              : 'bg-white/95 border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open lessons drawer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-slate-600 hover:text-slate-950 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">My Dashboard</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-display font-black text-white shadow-xs ${
                  isKids ? 'bg-purple-600' : 'bg-slate-900'
                }`}
              >
                D{currentLesson.dayNumber}
              </span>
              <h2 className="font-display text-xs sm:text-sm font-black text-slate-900 truncate max-w-[180px] sm:max-w-md">
                {currentLesson.title}
              </h2>
            </div>
          </div>

          {/* Tab Switcher (Video vs Quiz) */}
          {!currentLesson.isLockedByTime && (
            <div className="inline-flex rounded-2xl border-2 border-slate-200 bg-white p-1 text-xs font-display font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all ${
                  activeTab === 'video'
                    ? isKids
                      ? 'bg-sky-500 text-white shadow-xs font-black'
                      : 'bg-slate-900 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Video Lesson</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                disabled={!currentLesson.videoWatched && !currentLesson.isCompleted}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all ${
                  activeTab === 'quiz'
                    ? isKids
                      ? 'bg-purple-600 text-white shadow-xs font-black'
                      : 'bg-blue-600 text-white shadow-xs font-black'
                    : currentLesson.videoWatched || currentLesson.isCompleted
                    ? 'text-purple-700 hover:text-purple-900 font-extrabold'
                    : 'text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>{isKids ? 'Play Quiz! ⭐' : 'Quiz'}</span>
                {currentLesson.isCompleted && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 fill-emerald-100" />
                )}
              </button>
            </div>
          )}
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* CASE 1: Locked by Drip Schedule (Tomorrow) */}
          {currentLesson.isLockedByTime && currentLesson.unlockAt ? (
            <LockedLessonCountdown
              dayNumber={currentLesson.dayNumber}
              lessonTitle={currentLesson.title}
              unlockAt={currentLesson.unlockAt}
              isKids={isKids}
              onSelectPreviousDay={() => {
                const prevUnlocked = [...lessons]
                  .reverse()
                  .find((l) => !l.isLockedByTime);
                if (prevUnlocked) setSelectedLessonId(prevUnlocked.id);
              }}
            />
          ) : (
            /* CASE 2: Unlocked Lesson */
            <>
              {activeTab === 'video' ? (
                <div className="space-y-6">
                  {/* Lesson Heading */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isKids
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          Day {currentLesson.dayNumber} Lesson
                        </span>

                        {currentLesson.isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Passed & Completed</span>
                          </span>
                        )}
                      </div>

                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
                        {currentLesson.title}
                      </h1>
                    </div>
                  </div>

                  {/* Video Player Component */}
                  {currentLesson.videoUrl ? (
                    <VideoPlayer
                      lessonId={currentLesson.id}
                      videoUrl={currentLesson.videoUrl}
                      durationSeconds={currentLesson.durationSeconds}
                      isKids={isKids}
                      initialVideoWatched={currentLesson.videoWatched || currentLesson.isCompleted}
                      onQuizUnlocked={handleQuizUnlocked}
                      onStartQuizClick={() => setActiveTab('quiz')}
                    />
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                      No video attached for this lesson.
                    </div>
                  )}

                  {/* Description / Lesson Notes */}
                  {currentLesson.description && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Lesson Notes & Guide
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {currentLesson.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* QUIZ TAB */
                <div className="space-y-6">
                  {isKids ? (
                    <KidsQuizPlayer
                      lessonId={currentLesson.id}
                      dayNumber={currentLesson.dayNumber}
                      questions={currentLesson.questions}
                      initialQuizPassed={currentLesson.quizPassed || currentLesson.isCompleted}
                      onReviewVideoClick={() => setActiveTab('video')}
                      onLessonPassed={handleLessonPassed}
                    />
                  ) : (
                    <AdultsQuizPlayer
                      lessonId={currentLesson.id}
                      dayNumber={currentLesson.dayNumber}
                      questions={currentLesson.questions}
                      initialQuizPassed={currentLesson.quizPassed || currentLesson.isCompleted}
                      onReviewVideoClick={() => setActiveTab('video')}
                      onLessonPassed={handleLessonPassed}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
