'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Award,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Trophy,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Filter,
  Flame,
  Medal,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { Profile, Course, Enrollment, Certificate } from '@/types';
import { DigitalCertificateModal } from './DigitalCertificateModal';
import { getOrCreateCertificate } from '@/app/actions/certificate';

export interface CourseProgressSummary {
  course: Course;
  enrollment: Enrollment;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  isCompleted: boolean;
  certificate?: Certificate | null;
}

export interface QuizAttemptItem {
  id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  submitted_at: string;
  created_at: string;
  lessonTitle: string;
  dayNumber: number;
  courseTitle: string;
  courseCategory: 'kids' | 'adults';
}

interface ReportCardViewProps {
  profile: Profile;
  coursesWithProgress: CourseProgressSummary[];
  quizAttempts: QuizAttemptItem[];
}

export function ReportCardView({
  profile,
  coursesWithProgress,
  quizAttempts,
}: ReportCardViewProps) {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isClaimingCert, startClaimTransition] = useTransition();
  const [claimingCourseId, setClaimingCourseId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<'all' | 'kids' | 'adults'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');

  // Kids Rewards Calculations
  const kidsCourses = coursesWithProgress.filter((c) => c.course.category === 'kids');
  const hasKidsCourses = kidsCourses.length > 0;

  const passedKidsQuizzes = quizAttempts.filter(
    (q) => q.courseCategory === 'kids' && q.passed
  );

  let totalKidsStars = 0;
  passedKidsQuizzes.forEach((q) => {
    if (q.score >= 90) totalKidsStars += 3;
    else totalKidsStars += 1;
  });

  const totalLessonsPassed = quizAttempts.filter((q) => q.passed).length;
  const highScorerPassed = quizAttempts.some((q) => q.score >= 90);
  const courseCompleted = coursesWithProgress.some((c) => c.isCompleted);

  // Filter quiz attempts
  const filteredAttempts = quizAttempts.filter((q) => {
    if (filterCategory !== 'all' && q.courseCategory !== filterCategory) return false;
    if (filterStatus === 'passed' && !q.passed) return false;
    if (filterStatus === 'failed' && q.passed) return false;
    return true;
  });

  // Handle Certificate Claim
  function handleClaimCertificate(courseId: string) {
    setClaimingCourseId(courseId);
    setClaimError(null);
    startClaimTransition(async () => {
      const res = await getOrCreateCertificate(courseId);
      if (res.success && res.certificate) {
        setSelectedCertificate(res.certificate);
        setIsCertModalOpen(true);
      } else {
        setClaimError(res.error || 'Failed to generate certificate.');
      }
      setClaimingCourseId(null);
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-amber-200/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-100 px-3.5 py-1 text-xs font-display font-black text-sky-800 border border-sky-200">
              Student Academic Profile
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Live Progress & Verified Rewards</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
            Academic Report Card & Rewards ⭐
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Progress record for <span className="font-extrabold text-slate-900">{profile.full_name || profile.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white px-5 py-2.5 text-xs font-display font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <span>&larr; Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {claimError && (
        <div className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
          {claimError}
        </div>
      )}

      {/* KIDS REWARDS & ACHIEVEMENTS BANNER (Displayed if student has Kids courses) */}
      {hasKidsCourses && (
        <div className="mt-8 overflow-hidden rounded-[36px] bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-1.5 shadow-xl">
          <div className="rounded-[30px] bg-[#FFFDF8]/95 backdrop-blur p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-display font-black text-amber-900 border border-amber-300 shadow-xs">
                  <Sparkles className="h-4 w-4 text-amber-600 fill-amber-400 animate-spin" />
                  <span>Kids Superstar Rewards Corner</span>
                </div>
                <h2 className="mt-3 text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">
                  You are doing an awesome job! 🌟
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 max-w-lg">
                  Pass quizzes with 70%+ to earn 1 Star. Score 90%+ to earn 3 Golden Stars!
                </p>
              </div>

              {/* Star Counter */}
              <div className="flex items-center gap-4 rounded-3xl bg-amber-50 border-3 border-amber-300 px-7 py-4 shadow-inner">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-amber-950 shadow-md">
                  <Star className="h-8 w-8 fill-amber-950 stroke-none" />
                </div>
                <div>
                  <div className="text-4xl font-display font-black text-amber-950 leading-none">
                    {totalKidsStars}
                  </div>
                  <div className="text-xs font-display font-black text-amber-800 uppercase tracking-wider mt-1">
                    Stars Earned
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Badges Showcase */}
            <div className="mt-8 border-t-2 border-amber-100 pt-6">
              <h3 className="font-display text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                Milestone Achievement Badges
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Badge 1 */}
                <div
                  className={`rounded-3xl p-5 border-3 text-center transition-all ${
                    totalLessonsPassed >= 1
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950 shadow-md -translate-y-0.5'
                      : 'border-slate-200 bg-slate-50 opacity-40 grayscale'
                  }`}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-200 text-emerald-700 mb-2 shadow-xs">
                    <Zap className="h-7 w-7" />
                  </div>
                  <div className="font-display text-sm font-black">First Class Done!</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Pass Day 1 Quiz</div>
                </div>

                {/* Badge 2 */}
                <div
                  className={`rounded-3xl p-5 border-3 text-center transition-all ${
                    highScorerPassed
                      ? 'border-amber-300 bg-amber-50 text-amber-950 shadow-md -translate-y-0.5'
                      : 'border-slate-200 bg-slate-50 opacity-40 grayscale'
                  }`}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-200 text-amber-700 mb-2 shadow-xs">
                    <Flame className="h-7 w-7" />
                  </div>
                  <div className="font-display text-sm font-black">Quiz Super Star</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Score 90%+ on any quiz</div>
                </div>

                {/* Badge 3 */}
                <div
                  className={`rounded-3xl p-5 border-3 text-center transition-all ${
                    totalLessonsPassed >= 5
                      ? 'border-purple-300 bg-purple-50 text-purple-950 shadow-md -translate-y-0.5'
                      : 'border-slate-200 bg-slate-50 opacity-40 grayscale'
                  }`}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-200 text-purple-700 mb-2 shadow-xs">
                    <Medal className="h-7 w-7" />
                  </div>
                  <div className="font-display text-sm font-black">5-Day Streak</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Pass 5 distinct quizzes</div>
                </div>

                {/* Badge 4 */}
                <div
                  className={`rounded-3xl p-5 border-3 text-center transition-all ${
                    courseCompleted
                      ? 'border-sky-300 bg-sky-50 text-sky-950 shadow-md -translate-y-0.5'
                      : 'border-slate-200 bg-slate-50 opacity-40 grayscale'
                  }`}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-200 text-sky-700 mb-2 shadow-xs">
                    <Trophy className="h-7 w-7" />
                  </div>
                  <div className="font-display text-sm font-black">Course Champion</div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Complete 100% of course</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENROLLED COURSES COMPLETION & DIGITAL CERTIFICATES SECTION */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Course Progress & Certificates
            </h2>
            <p className="text-xs text-slate-500">
              Track your day-by-day learning completion across all enrolled courses.
            </p>
          </div>
        </div>

        {coursesWithProgress.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white">
            <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-700">No active enrollments</h3>
            <p className="mt-1 text-xs text-slate-500">
              Enroll in a course from our catalog to begin your learning journey.
            </p>
            <Link
              href="/courses"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <span>Explore Courses</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coursesWithProgress.map((item) => (
              <div
                key={item.course.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        item.course.category === 'kids'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {item.course.category === 'kids' ? 'Kids (Ages 5-12)' : 'Adults LMS'}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {item.completedLessons} / {item.totalLessons} Lessons
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900">
                    {item.course.title}
                  </h3>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">Progress</span>
                      <span className="font-bold text-slate-900">{item.completionPercentage}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          item.completionPercentage === 100
                            ? 'bg-emerald-500'
                            : item.course.category === 'kids'
                            ? 'bg-purple-600'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${item.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action: Certificate or Continue Learning */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  {item.isCompleted ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">
                        Course Completed!
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{item.totalLessons - item.completedLessons} lessons left</span>
                    </div>
                  )}

                  {/* Adults Certificate or Kids Trophy */}
                  {item.isCompleted ? (
                    item.certificate ? (
                      <button
                        onClick={() => {
                          setSelectedCertificate(item.certificate!);
                          setIsCertModalOpen(true);
                        }}
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition-colors"
                      >
                        <Award className="h-4 w-4" />
                        <span>View Certificate</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClaimCertificate(item.course.id)}
                        disabled={isClaimingCert && claimingCourseId === item.course.id}
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {isClaimingCert && claimingCourseId === item.course.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Award className="h-4 w-4" />
                        )}
                        <span>Claim Certificate</span>
                      </button>
                    )
                  ) : (
                    <Link
                      href={`/learn/${item.course.id}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                      <span>Continue Class</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUIZ ATTEMPTS & ASSESSMENT HISTORY TABLE */}
      <div className="mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Quiz Assessment History
            </h2>
            <p className="text-xs text-slate-500">
              Full breakdown of daily assessments, scores, and server-graded results.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setFilterCategory('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterCategory === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Audiences
              </button>
              <button
                onClick={() => setFilterCategory('kids')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterCategory === 'kids'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kids
              </button>
              <button
                onClick={() => setFilterCategory('adults')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterCategory === 'adults'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Adults
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setFilterStatus('passed')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterStatus === 'passed'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Passed (&ge;70%)
              </button>
              <button
                onClick={() => setFilterStatus('failed')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterStatus === 'failed'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Needs Retake
              </button>
            </div>
          </div>
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No quiz attempts recorded yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Course</th>
                    <th scope="col" className="px-6 py-3.5">Lesson Day</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Score</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Status</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Rewards</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredAttempts.map((attempt) => {
                    const dateFormatted = new Date(attempt.submitted_at || attempt.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true,
                    });

                    return (
                      <tr key={attempt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">
                            {attempt.courseTitle}
                          </div>
                          <span
                            className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                              attempt.courseCategory === 'kids'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {attempt.courseCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900">
                            Day {attempt.dayNumber}:
                          </span>{' '}
                          <span className="text-slate-600">{attempt.lessonTitle}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block rounded-lg px-2.5 py-1 text-xs font-black ${
                              attempt.passed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {attempt.score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {attempt.passed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Passed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                              <XCircle className="h-3 w-3" />
                              <span>Retake Allowed</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {attempt.courseCategory === 'kids' && attempt.passed ? (
                            <div className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800 font-bold text-[11px]">
                              {attempt.score >= 90 ? (
                                <>
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  <span className="ml-1 text-[10px] text-amber-700 font-black">+3</span>
                                </>
                              ) : (
                                <>
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  <span className="ml-1 text-[10px] text-amber-700 font-black">+1</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500" suppressHydrationWarning>
                          {dateFormatted}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Official Certificate Modal */}
      {selectedCertificate && (
        <DigitalCertificateModal
          certificate={selectedCertificate}
          isOpen={isCertModalOpen}
          onClose={() => {
            setIsCertModalOpen(false);
            setSelectedCertificate(null);
          }}
        />
      )}
    </div>
  );
}
