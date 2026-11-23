'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Sparkles,
  Briefcase,
  PlayCircle,
  Lock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader2,
  Receipt,
  Building2,
  Smartphone,
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { submitEnrollment } from '@/app/actions/enrollment';
import { uploadPaymentReceipt } from '@/app/actions/receipt';
import type { Course, Lesson, Enrollment, Profile } from '@/types';

interface CourseDetailViewProps {
  course: Course;
  lessons: Lesson[];
  existingEnrollment: Enrollment | null;
  userProfile: Profile | null;
}

export function CourseDetailView({
  course,
  lessons,
  existingEnrollment: initialEnrollment,
  userProfile,
}: CourseDetailViewProps) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(initialEnrollment);
  const [transactionId, setTransactionId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isKids = course.category === 'kids';
  const isEnrolled = enrollment?.status === 'active';
  const isPendingVerification = enrollment?.status === 'pending';
  const isRejected = enrollment?.status === 'rejected';

  // Handle Receipt Upload to private Supabase Storage bucket 'receipts'
  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    setFormError(null);

    const fd = new FormData();
    fd.append('file', file);

    const res = await uploadPaymentReceipt(fd);
    setUploadingReceipt(false);

    if (res.success && res.url) {
      setReceiptUrl(res.url);
    } else {
      setFormError(res.error || 'Failed to upload receipt image. Please try again.');
    }
  }

  // Handle Enrollment Form Submit
  function handleEnrollmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!userProfile) {
      setFormError('Please log in or create an account to submit your payment receipt.');
      return;
    }

    if (!transactionId.trim()) {
      setFormError('Transaction ID is required.');
      return;
    }

    if (!receiptUrl.trim()) {
      setFormError('Please upload your payment receipt image.');
      return;
    }

    startTransition(async () => {
      const res = await submitEnrollment(course.id, receiptUrl, transactionId);
      if (res.success && res.enrollment) {
        setEnrollment(res.enrollment as Enrollment);
        setSuccessMessage(
          res.resubmitted
            ? 'Your new payment receipt has been submitted! Our admin team will verify it shortly.'
            : 'Payment receipt submitted successfully! Day 1 will unlock immediately once approved.'
        );
      } else {
        setFormError(res.error || 'Failed to submit enrollment.');
      }
    });
  }

  return (
    <div className="space-y-10">
      {/* Back button */}
      <div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Course Catalog</span>
        </Link>
      </div>

      {/* Course Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 ${
          isKids
            ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 text-white shadow-lg'
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md'
        }`}
      >
        <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-xs ${
                  isKids ? 'bg-amber-400 text-purple-950' : 'bg-blue-600 text-white'
                }`}
              >
                {isKids ? <Sparkles className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
                <span>{isKids ? 'KIDS (AGES 5–12)' : 'ADULTS PROGRAM'}</span>
              </span>

              <span className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
                {lessons.length} Sequential Daily Lessons
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-4xl leading-tight">
              {course.title}
            </h1>

            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
              {course.description ||
                'Master this curriculum with structured daily lessons, interactive quizzes, and guaranteed step-by-step progress.'}
            </p>

            <div className="flex items-center gap-6 pt-2">
              <div>
                <span className="block text-[11px] uppercase font-bold text-white/70">
                  Course Fee
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  PKR {Number(course.price).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Thumbnail preview */}
          {course.thumbnail_url && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-white/20 shadow-xl lg:aspect-square">
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Curriculum Outline & Payment Section */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Left: Curriculum Syllabus (Titles only, locked content) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Course Curriculum & Daily Schedule
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Lessons unlock one calendar day at a time upon passing each day&apos;s quiz (70%+).
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {lessons.length} Days
            </span>
          </div>

          <div className="space-y-3">
            {lessons.length > 0 ? (
              lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-xs ${
                        isKids
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      D{lesson.day_number}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Day {lesson.day_number}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {lesson.title}
                      </h4>
                      {lesson.description && (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Locked indicator */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Locked</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                Lesson schedule will be published shortly.
              </div>
            )}
          </div>
        </div>

        {/* Right: Enrollment Status / Fee Payment Box */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Enrollment & Fee Submission
              </h3>
              <p className="text-xs text-slate-500">
                Upload your payment slip to activate your Day 1 lesson immediately.
              </p>
            </div>

            {/* Condition 1: Already Enrolled (Active) */}
            {isEnrolled && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>You are actively enrolled!</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Your payment was verified by the admin team. You can continue your daily lessons right from your student dashboard.
                </p>
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {/* Condition 2: Pending Verification */}
            {isPendingVerification && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  <span>Pending Admin Verification</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  We have received your payment slip for Transaction ID{' '}
                  <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">
                    {enrollment?.transaction_id}
                  </code>
                  . Our team typically reviews submissions within 2 to 6 hours.
                </p>
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
                >
                  <span>Check Status on Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {/* Condition 3: Rejected Enrollment -> Show reason and allow re-submission */}
            {isRejected && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>Payment Verification Declined</span>
                </div>
                {enrollment?.admin_notes && (
                  <p className="text-xs text-red-700 bg-red-100/70 p-2.5 rounded-lg">
                    <strong>Admin Reason:</strong> {enrollment.admin_notes}
                  </p>
                )}
                <p className="text-[11px] text-red-600">
                  Please verify your transaction and upload a clear screenshot of your receipt below.
                </p>
              </div>
            )}

            {/* Condition 4: Not Enrolled or Rejected (Show Payment Instructions & Form) */}
            {(!enrollment || isRejected) && (
              <div className="space-y-5">
                {/* Payment Instructions Box */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span>Payment Methods (Fee: PKR {Number(course.price).toLocaleString()})</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700">
                    {/* Bank Transfer */}
                    <div className="rounded-xl bg-white p-2.5 border border-blue-100 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        <span>Meezan Bank / HBL</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Title: <strong>Lofty Education Services</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        IBAN: PK65MEZN0001234567890123
                      </p>
                    </div>

                    {/* JazzCash */}
                    <div className="rounded-xl bg-white p-2.5 border border-blue-100 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Smartphone className="h-3.5 w-3.5 text-amber-600" />
                        <span>JazzCash</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Account: <strong>0300-1234567</strong> (Lofty Edu)
                      </p>
                    </div>

                    {/* EasyPaisa */}
                    <div className="rounded-xl bg-white p-2.5 border border-blue-100 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                        <span>EasyPaisa</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Account: <strong>0345-7654321</strong> (Lofty Edu)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logged in check */}
                {userProfile ? (
                  <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
                    {formError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {formError}
                      </div>
                    )}

                    {successMessage && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                        {successMessage}
                      </div>
                    )}

                    {/* Transaction ID */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Transaction ID / Reference Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. TRX987654321"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Receipt Upload to private Supabase Storage */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Upload Payment Receipt Screenshot *
                      </label>
                      <div className="mt-1.5">
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 hover:border-blue-400 hover:bg-slate-100 transition-colors">
                          {uploadingReceipt ? (
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                          ) : (
                            <Upload className="h-6 w-6 text-slate-400" />
                          )}
                          <span className="mt-2 text-xs font-semibold text-slate-700">
                            {uploadingReceipt
                              ? 'Uploading to secure storage...'
                              : receiptUrl
                              ? 'Change Receipt Image'
                              : 'Select Payment Slip Image'}
                          </span>
                          <span className="mt-0.5 text-[10px] text-slate-400">
                            PNG, JPG or WEBP (Max 5MB)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingReceipt}
                            onChange={handleReceiptUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Receipt Preview */}
                      {receiptUrl && (
                        <div className="relative mt-2.5 h-28 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          <Image
                            src={receiptUrl}
                            alt="Receipt preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isPending || uploadingReceipt || !receiptUrl}
                      className={`w-full py-3.5 text-xs font-display font-black disabled:opacity-50 flex items-center justify-center gap-2 ${
                        isKids ? 'btn-3d-purple' : 'btn-3d-sky'
                      }`}
                    >
                      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>
                        {isRejected ? 'Re-submit Payment Slip' : 'Submit Fee for Verification 🚀'}
                      </span>
                    </button>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center space-y-3">
                    <p className="text-xs text-slate-600 font-semibold">
                      You must be signed in to submit payment receipts and enroll.
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <Link
                        href={`/login?redirectTo=/courses/${course.id}`}
                        className={`py-3 text-xs font-display font-black text-center ${
                          isKids ? 'btn-3d-amber' : 'btn-3d-sky'
                        }`}
                      >
                        Sign in to Enroll &rarr;
                      </Link>
                      <Link
                        href="/signup"
                        className="rounded-2xl border-2 border-slate-200 bg-white py-2.5 text-xs font-display font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Create New Student Account
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
