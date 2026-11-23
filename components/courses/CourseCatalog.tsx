'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Briefcase,
  PlayCircle,
  Search,
  BookOpen,
  ArrowRight,
  Volume2,
  CheckCircle2,
  Star,
  Award,
  Zap,
  GraduationCap,
} from 'lucide-react';
import type { Course } from '@/types';

export interface CatalogCourse extends Course {
  lessons?: { count: number }[];
}

interface CourseCatalogProps {
  courses: CatalogCourse[];
}

export function CourseCatalog({ courses }: CourseCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'kids' | 'adults'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const kidsCourses = courses.filter((c) => c.category === 'kids');
  const adultsCourses = courses.filter((c) => c.category === 'adults');

  const filteredCourses = courses.filter((c) => {
    const matchesCategory =
      activeCategory === 'all' ? true : c.category === activeCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-12">
      {/* JOYFUL HERO SECTION (Khan Academy Kids & Duolingo Inspired) */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-amber-100 via-sky-100 to-purple-100 p-8 sm:p-14 border-3 border-amber-200/80 shadow-md">
        {/* Floating playful cloud shapes */}
        <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full bg-white/70 blur-xl pointer-events-none" />
        <div className="absolute top-1/2 -right-12 h-56 w-56 rounded-full bg-amber-200/50 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-sky-200/50 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-display font-extrabold text-amber-800 shadow-xs border border-amber-200">
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-400" />
            <span>Interactive Learning for Kids (5–12) & Professional Adults</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Learn something awesome today,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-sky-600">
              one joyful step at a time!
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-700 font-semibold leading-relaxed max-w-2xl">
            Spark curiosity in children with voice-guided lessons, picture quizzes, and star rewards—or master high-demand modern skills with our structured adult curriculum.
          </p>

          {/* Quick Perks Pill Row */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-display font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-1.5 text-emerald-800 shadow-xs border border-emerald-200">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span>Earn Golden Stars</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-1.5 text-sky-800 shadow-xs border border-sky-200">
              <Volume2 className="h-4 w-4 text-sky-500" />
              <span>Voice Narration for Kids</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-1.5 text-purple-800 shadow-xs border border-purple-200">
              <Award className="h-4 w-4 text-purple-500" />
              <span>Official Digital Certificates</span>
            </span>
          </div>
        </div>
      </div>

      {/* PROMINENT AUDIENCE SWITCHER TABS & SEARCH */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-amber-200/60 pb-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          {/* All Courses Tab */}
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`rounded-2xl px-5 py-2.5 text-xs font-display font-bold transition-all border-b-3 ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-950 shadow-md translate-y-0'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            All Courses ({courses.length})
          </button>

          {/* Kids Tab (Joyful Chunky 3D Push Button) */}
          <button
            type="button"
            onClick={() => setActiveCategory('kids')}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-display font-black transition-all border-b-4 ${
              activeCategory === 'kids'
                ? 'bg-purple-600 text-white border-purple-800 shadow-lg shadow-purple-300/40 -translate-y-0.5'
                : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
            <span>🌟 Kids Adventures (5–12) ({kidsCourses.length})</span>
          </button>

          {/* Adults Tab (Clean Professional Styling) */}
          <button
            type="button"
            onClick={() => setActiveCategory('adults')}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-display font-bold transition-all border-b-3 ${
              activeCategory === 'adults'
                ? 'bg-sky-700 text-white border-sky-900 shadow-md -translate-y-0.5'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <Briefcase className="h-4 w-4 text-sky-600" />
            <span>Adults LMS ({adultsCourses.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exciting courses..."
            className="w-full rounded-2xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
      </div>

      {/* COURSES GRID */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const isKids = course.category === 'kids';
            const lessonCount = course.lessons?.[0]?.count || 0;

            if (isKids) {
              // --- KIDS CARD: Bubbly, joyful, 3D pushable, Duolingo/Khan Kids style ---
              return (
                <div
                  key={course.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[30px] border-3 border-amber-300/90 bg-white p-3.5 shadow-md hover:shadow-xl hover:border-amber-400 hover:-translate-y-1.5 transition-all duration-300"
                >
                  {/* Thumbnail Image Container */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-[22px] bg-purple-100 border border-purple-100">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-purple-100 text-purple-400">
                        <Sparkles className="h-14 w-14 animate-pulse" />
                      </div>
                    )}

                    {/* Fun Badge */}
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-3.5 py-1 text-xs font-display font-black text-white shadow-md border-b-2 border-purple-800">
                        <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                        <span>KIDS (AGES 5–12)</span>
                      </span>
                    </div>

                    {/* Audio feature pill */}
                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-display font-extrabold text-sky-700 shadow-xs border border-sky-200">
                        <Volume2 className="h-3.5 w-3.5 text-sky-600" />
                        <span>Audio Quizzes</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-xl font-black tracking-tight text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="mt-2 text-xs font-semibold text-slate-600 line-clamp-2 leading-relaxed">
                      {course.description || 'Fun, colorful cartoon lessons with audio riddles and tap-to-learn games!'}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-amber-100 pt-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-display font-extrabold text-purple-700">
                        <PlayCircle className="h-4 w-4 text-purple-600" />
                        <span>{lessonCount} Daily Adventure Lessons</span>
                      </span>

                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 font-display">Fee</span>
                        <span className="text-base font-display font-black text-slate-900">
                          PKR {Number(course.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tactile 3D Action Button */}
                  <div className="p-1 pt-0">
                    <Link
                      href={`/courses/${course.id}`}
                      className="btn-3d-purple w-full py-3.5 text-sm font-display font-black tracking-wide"
                    >
                      <span>Start Adventure! 🚀</span>
                      <ArrowRight className="h-4 w-4 ml-1.5 stroke-[2.5]" />
                    </Link>
                  </div>
                </div>
              );
            }

            // --- ADULTS CARD: Clean, modern, sophisticated LMS style ---
            return (
              <div
                key={course.id}
                className="group flex flex-col justify-between overflow-hidden rounded-[26px] border-2 border-slate-200/90 bg-white shadow-xs hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                      <BookOpen className="h-12 w-12" />
                    </div>
                  )}

                  <div className="absolute left-3 top-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-display font-bold text-white shadow-sm">
                      <Briefcase className="h-3 w-3 text-sky-400" />
                      <span>Adults</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {course.title}
                  </h3>

                  <p className="mt-2 text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed">
                    {course.description || 'Comprehensive curriculum with video lessons and mastery quizzes.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      <PlayCircle className="h-4 w-4 text-sky-500" />
                      <span>{lessonCount} Sequential Lessons</span>
                    </span>

                    <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Total Fee</span>
                      <span className="text-sm font-bold text-slate-900">
                        PKR {Number(course.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional CTA */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/courses/${course.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-2.5 text-xs font-display font-bold text-white shadow-xs hover:bg-sky-600 transition-colors"
                  >
                    <span>View Curriculum</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[30px] border-3 border-dashed border-amber-200 bg-white/70 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-amber-400" />
          <h3 className="mt-3 font-display text-lg font-bold text-slate-900">No courses found</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {searchQuery
              ? 'Try searching for something else or clear your search term.'
              : 'Courses will be published soon. Stay tuned!'}
          </p>
        </div>
      )}
    </div>
  );
}
