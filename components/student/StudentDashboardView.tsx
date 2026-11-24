'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Briefcase,
  BookOpen,
  RefreshCw,
  Star,
  Award,
} from 'lucide-react';
import type { Profile } from '@/types';

export interface ActiveCourseCardData {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseCategory: 'kids' | 'adults';
  courseThumbnail: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  currentDay: number;
}

export interface PendingCourseCardData {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseCategory: 'kids' | 'adults';
  coursePrice: number;
  courseThumbnail: string | null;
  transactionId: string;
  createdAt: string;
}

export interface RejectedCourseCardData {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseCategory: 'kids' | 'adults';
  coursePrice: number;
  adminNotes: string | null;
  createdAt: string;
}

interface StudentDashboardViewProps {
  userProfile: Profile;
  activeCourses: ActiveCourseCardData[];
  pendingCourses: PendingCourseCardData[];
  rejectedCourses: RejectedCourseCardData[];
}

export function StudentDashboardView({
  userProfile,
  activeCourses,
  pendingCourses,
  rejectedCourses,
}: StudentDashboardViewProps) {
  const hasNoCourses =
    activeCourses.length === 0 &&
    pendingCourses.length === 0 &&
    rejectedCourses.length === 0;

  return (
    <div className="space-y-10">
      {/* JOYFUL WELCOME BANNER */}
      <div className="rounded-[32px] border-3 border-amber-200/80 bg-gradient-to-r from-amber-50 via-sky-50 to-purple-50 p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-amber-200/40 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 right-1/3 h-36 w-36 rounded-full bg-sky-200/40 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-display font-extrabold text-sky-800 shadow-xs border border-sky-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                <span>Student Learning Adventure</span>
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              Welcome back, {userProfile.full_name || 'Learner'}! 🎉
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-xl">
              Keep your streak alive! Master your daily video lesson and unlock tomorrow&apos;s class at midnight.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/report-card"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-display font-extrabold text-amber-800 shadow-sm border-2 border-amber-300 hover:bg-amber-50 transition-all"
            >
              <Award className="h-4 w-4 text-amber-500 fill-amber-400" />
              <span>Rewards & Badges</span>
            </Link>

            <Link
              href="/courses"
              className="btn-3d-sky px-5 py-2.5 text-xs font-display font-extrabold"
            >
              <BookOpen className="h-4 w-4 mr-1.5" />
              <span>Explore Courses</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 1: Active Enrolled Courses */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b-2 border-amber-200/60 pb-3.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 stroke-[2.5]" />
            <h2 className="font-display text-xl font-black text-slate-900">
              Active Courses ({activeCourses.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500 font-display">
            Sequential 1-Day-at-a-Time Drip
          </span>
        </div>

        {activeCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {activeCourses.map((course) => {
              const isKids = course.courseCategory === 'kids';

              if (isKids) {
                // --- KIDS ACTIVE COURSE: Playful chunky 3D card ---
                return (
                  <div
                    key={course.enrollmentId}
                    className="flex flex-col justify-between overflow-hidden rounded-[30px] border-3 border-amber-300 bg-white p-3.5 shadow-md hover:border-amber-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full rounded-[22px] overflow-hidden bg-purple-100 border border-purple-100">
                      {course.courseThumbnail ? (
                        <Image
                          src={course.courseThumbnail}
                          alt={course.courseTitle}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-purple-100 text-purple-400">
                          <GraduationCap className="h-12 w-12" />
                        </div>
                      )}

                      <div className="absolute left-3 top-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-3.5 py-1 text-xs font-display font-black text-white shadow-md border-b-2 border-purple-800">
                          <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                          <span>Kids (5–12)</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="flex flex-1 flex-col p-4 space-y-4">
                      <h3 className="font-display text-lg font-black text-slate-900 line-clamp-2 leading-snug">
                        {course.courseTitle}
                      </h3>

                      {/* Colorful Progress Bar with playful accents */}
                      <div className="space-y-2 rounded-2xl bg-amber-50/70 p-3.5 border border-amber-200">
                        <div className="flex items-center justify-between text-xs font-display font-extrabold">
                          <span className="text-amber-900 flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                            <span>Progress</span>
                          </span>
                          <span className="text-purple-700 text-sm font-black">
                            {course.progressPercentage}%
                          </span>
                        </div>

                        <div className="h-3.5 w-full overflow-hidden rounded-full bg-white border border-amber-200 p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 transition-all duration-500 shadow-xs"
                            style={{ width: `${course.progressPercentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-0.5">
                          <span>{course.completedLessons}/{course.totalLessons} Lessons Done</span>
                          <span className="text-purple-700 font-extrabold bg-purple-100 px-2 py-0.5 rounded-full">
                            Day {course.currentDay} Current
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Chunky 3D Push Button */}
                    <div className="p-1 pt-0">
                      <Link
                        href={`/learn/${course.courseId}`}
                        className="btn-3d-purple w-full py-3.5 text-sm font-display font-black"
                      >
                        <PlayCircle className="h-4 w-4 mr-1.5" />
                        <span>Continue Class! 🚀</span>
                      </Link>
                    </div>
                  </div>
                );
              }

              // --- ADULTS ACTIVE COURSE: Sleek, clean LMS layout ---
              return (
                <div
                  key={course.enrollmentId}
                  className="flex flex-col justify-between overflow-hidden rounded-[26px] border-2 border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-video w-full bg-slate-100">
                    {course.courseThumbnail ? (
                      <Image
                        src={course.courseThumbnail}
                        alt={course.courseTitle}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                        <GraduationCap className="h-10 w-10" />
                      </div>
                    )}

                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-display font-bold text-white shadow-xs">
                        <Briefcase className="h-3 w-3 text-sky-400" />
                        <span>Adults</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 space-y-4">
                    <h3 className="font-display font-bold text-slate-900 text-base leading-snug line-clamp-2">
                      {course.courseTitle}
                    </h3>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Course Progress</span>
                        <span className="text-slate-900 font-bold">{course.progressPercentage}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-sky-600 transition-all duration-500"
                          style={{ width: `${course.progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 font-medium">
                        <span>{course.completedLessons} of {course.totalLessons} lessons finished</span>
                        <span>Day {course.currentDay} Current</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <Link
                      href={`/learn/${course.courseId}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-display font-bold text-white shadow-xs hover:bg-sky-600 transition-colors"
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>Continue Lesson</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[30px] border-3 border-dashed border-amber-200 bg-white/60 p-10 text-center text-xs font-semibold text-slate-500">
            No active courses right now. Pick an adventure from our course catalog!
          </div>
        )}
      </div>

      {/* SECTION 2: Pending Fee Approvals */}
      {pendingCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-amber-200/60 pb-3">
            <Clock className="h-5 w-5 text-amber-600 stroke-[2.5]" />
            <h2 className="font-display text-xl font-black text-slate-900">
              Pending Verification ({pendingCourses.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pendingCourses.map((item) => (
              <div
                key={item.enrollmentId}
                className="flex flex-col justify-between rounded-[28px] border-2 border-amber-300 bg-amber-50/70 p-6 shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-3 py-1 text-xs font-display font-black text-amber-900">
                      <Clock className="h-3.5 w-3.5 text-amber-700" />
                      <span>Review in Progress</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500" suppressHydrationWarning>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-black text-slate-900 leading-snug">
                    {item.courseTitle}
                  </h3>

                  <div className="rounded-2xl bg-white p-3.5 border border-amber-200 text-xs font-semibold space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Transaction ID:</span>
                      <code className="font-mono font-bold text-slate-900">
                        {item.transactionId}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Course Fee:</span>
                      <span className="font-bold text-slate-900">
                        PKR {Number(item.coursePrice).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                  Day 1 lesson unlocks automatically the moment admin reviews your receipt! You can watch the intro video while you wait.
                </p>

                <div className="pt-2">
                  <Link
                    href={`/courses/${item.courseId}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white py-2 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100/60 transition-colors"
                  >
                    <PlayCircle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Watch Free Intro Video</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Rejected / Action Required */}
      {rejectedCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-red-200 pb-3">
            <AlertCircle className="h-5 w-5 text-red-600 stroke-[2.5]" />
            <h2 className="font-display text-xl font-black text-slate-900">
              Action Required ({rejectedCourses.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rejectedCourses.map((item) => (
              <div
                key={item.enrollmentId}
                className="flex flex-col justify-between rounded-[28px] border-2 border-red-300 bg-red-50/70 p-6 shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-display font-black text-red-900">
                    <AlertCircle className="h-3.5 w-3.5 text-red-700" />
                    <span>Receipt Needs Revision</span>
                  </span>

                  <h3 className="font-display text-base font-black text-slate-900 leading-snug">
                    {item.courseTitle}
                  </h3>

                  {item.adminNotes ? (
                    <div className="rounded-2xl bg-white p-3.5 border border-red-200 text-xs font-semibold text-red-700">
                      <strong>Admin Note:</strong> {item.adminNotes}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-red-600">
                      The uploaded receipt could not be verified. Please re-check your payment slip.
                    </p>
                  )}
                </div>

                <Link
                  href={`/courses/${item.courseId}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-3 text-xs font-display font-black text-white shadow-xs hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Re-upload Payment Receipt</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State Banner if completely fresh student */}
      {hasNoCourses && (
        <div className="rounded-[36px] border-3 border-dashed border-amber-300/80 p-12 text-center space-y-4 bg-white/80">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-3xl bg-amber-100 text-amber-600">
            <GraduationCap className="h-9 w-9" />
          </div>
          <h2 className="font-display text-2xl font-black text-slate-900">
            Ready to Begin Your Adventure?
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-md mx-auto leading-relaxed">
            You are not enrolled in any classes yet. Explore colorful cartoon phonics and math for kids, or professional engineering programs for adults!
          </p>
          <div className="pt-2">
            <Link
              href="/courses"
              className="btn-3d-amber px-7 py-3 text-sm font-display font-black inline-flex items-center gap-2"
            >
              <span>Explore Course Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
