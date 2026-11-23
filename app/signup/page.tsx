'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Lock,
  Loader2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { signUpAction } from '@/app/actions/auth';

export default function SignUpPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    startTransition(async () => {
      const res = await signUpAction(formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      } else {
        setFormError(res.error || 'Failed to create account. Please try again.');
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
          Create Student Account 🚀
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-500">
          Enroll in Kids interactive adventures or adult professional courses.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-[32px] border-3 border-amber-200/80 bg-white p-6 shadow-md sm:p-8">
          {formError && (
            <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                Full Name *
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ali Khan"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                Email Address *
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ali@example.com"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            {/* Phone / WhatsApp */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                Phone / WhatsApp Number *
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                Used for instant fee approval notifications via WhatsApp/SMS.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-display font-bold text-slate-700">
                Password * (minimum 6 characters)
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border-2 border-slate-200 py-2.5 pl-10 pr-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            {/* Account Policy Info */}
            <div className="rounded-2xl bg-amber-50 p-3 text-[11px] font-semibold text-amber-900 flex items-center gap-2 border border-amber-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Single-session protection: logging in on a new device signs out previous devices.
              </span>
            </div>

            {/* Tactile 3D Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="btn-3d-amber w-full py-3.5 text-sm text-amber-950 font-display font-black tracking-wide"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Create Student Account</span>
                  <ArrowRight className="h-4 w-4 ml-1.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs font-semibold text-slate-500">
            Already registered?{' '}
            <Link
              href="/login"
              className="font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Sign in to your account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
