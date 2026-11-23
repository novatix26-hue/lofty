'use client';

import { useState, useTransition, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { signInAction } from '@/app/actions/auth';

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    notice?: string;
    redirectTo?: string;
    reason?: string;
  }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const router = useRouter();
  const resolvedSearchParams = use(searchParams);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Handle URL notice / errors
  const sessionExpired =
    resolvedSearchParams.error === 'session_expired' ||
    resolvedSearchParams.reason === 'session_expired';
  const adminRequired = resolvedSearchParams.error === 'admin_access_required';
  const checkEmailNotice = resolvedSearchParams.notice === 'check_email';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await signInAction({ email, password });
      if (res.success && res.redirectTo) {
        const dest = resolvedSearchParams.redirectTo || res.redirectTo;
        router.push(dest);
        router.refresh();
      } else {
        setFormError(res.error || 'Invalid credentials. Please try again.');
      }
    });
  }

  return (
    <div
      suppressHydrationWarning
      className="flex min-h-screen flex-col justify-center bg-[#FFFDF7] px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 text-white shadow-md shadow-orange-300/40 border-b-2 border-orange-600 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-7 w-7" />
          </div>
          <span className="font-display text-2xl font-black tracking-tight text-slate-900">
            Lofty LMS
          </span>
        </Link>
        <h2 className="mt-4 font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Welcome back! 👋
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-500">
          Sign in to continue your Kids (5–12) or Adult learning adventure.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-[32px] border-3 border-amber-200/80 bg-white p-6 shadow-md sm:p-8">
          {/* Status Banners */}
          {sessionExpired && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border-2 border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="font-bold">Session Ended:</strong> You were logged out because your account was signed in on another device.
              </div>
            </div>
          )}

          {adminRequired && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border-2 border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <strong className="font-bold">Admin Access Required:</strong> You must be an administrator to access that section.
              </div>
            </div>
          )}

          {checkEmailNotice && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong className="font-bold">Registration Complete!</strong> Please check your inbox to confirm your email before signing in.
              </div>
            </div>
          )}

          {formError && (
            <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            {/* Email */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            {/* Tactile 3D Sign In Button */}
            <button
              type="submit"
              disabled={isPending}
              className="btn-3d-sky w-full py-3.5 text-sm font-display font-black tracking-wide"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 ml-1.5 stroke-[2.5]" />
                </>
              )}
            </button>

            {/* Quick Demo Test Logins */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-center text-slate-400 uppercase tracking-wider mb-2">
                ⚡ Quick Local Testing Shortcuts
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('student@example.com');
                    setPassword('password123');
                    startTransition(async () => {
                      const res = await signInAction({
                        email: 'student@example.com',
                        password: 'password123',
                      });
                      if (res.success && res.redirectTo) {
                        router.push(res.redirectTo);
                        router.refresh();
                      }
                    });
                  }}
                  className="rounded-xl border border-amber-300 bg-amber-50/80 px-2.5 py-2 text-center text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                >
                  🎓 Demo Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@example.com');
                    setPassword('password123');
                    startTransition(async () => {
                      const res = await signInAction({
                        email: 'admin@example.com',
                        password: 'password123',
                      });
                      if (res.success && res.redirectTo) {
                        router.push(res.redirectTo);
                        router.refresh();
                      }
                    });
                  }}
                  className="rounded-xl border border-blue-300 bg-blue-50/80 px-2.5 py-2 text-center text-xs font-bold text-blue-900 hover:bg-blue-100 transition-colors"
                >
                  ⚡ Demo Admin
                </button>
              </div>
            </div>
          </form>

          {/* Switch to Signup */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs font-semibold text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/signup"
              className="font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Sign up as a Student &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
