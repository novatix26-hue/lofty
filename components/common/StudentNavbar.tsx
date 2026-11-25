'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  Shield,
  LogOut,
  Sparkles,
  User,
  Award,
  Star,
} from 'lucide-react';
import { signOutAction } from '@/app/actions/auth';
import type { Profile } from '@/types';

interface StudentNavbarProps {
  userProfile?: Profile | null;
}

export function StudentNavbar({ userProfile }: StudentNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isStudent = userProfile?.role === 'student';
  const isAdmin = userProfile?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-200/60 bg-[#FFFDF7]/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 text-white shadow-md shadow-orange-300/40 border-b-2 border-orange-600 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xl font-black tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                Lofty
              </span>
              <span className="font-display text-xs font-extrabold uppercase tracking-wider text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                LMS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <span className="text-purple-600 flex items-center gap-0.5">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                Kids (5–12)
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">Adults</span>
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/courses"
            className={`font-display text-sm font-bold transition-all px-3 py-1.5 rounded-xl ${
              pathname === '/courses' || pathname === '/'
                ? 'text-sky-700 bg-sky-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Course Catalog
          </Link>

          {userProfile && (
            <>
              <Link
                href="/dashboard"
                className={`font-display text-sm font-bold transition-all px-3 py-1.5 rounded-xl ${
                  pathname === '/dashboard'
                    ? 'text-sky-700 bg-sky-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                My Dashboard
              </Link>
              <Link
                href="/dashboard/report-card"
                className={`font-display text-sm font-bold transition-all px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                  pathname === '/dashboard/report-card'
                    ? 'text-amber-800 bg-amber-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Award className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span>Report Card & Badges</span>
              </Link>
            </>
          )}

          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span>Admin Console</span>
            </Link>
          ) : (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white/90 hover:bg-slate-900 hover:text-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors"
              title="Admin Portal & Fee Approvals"
            >
              <Shield className="h-3.5 w-3.5 text-amber-500" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* User CTA / Auth Buttons */}
        <div className="flex items-center gap-3">
          {userProfile ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900">
                  {userProfile.full_name || userProfile.email}
                </span>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-100 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                  {userProfile.role}
                </span>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 text-sm font-display font-black text-white shadow-sm border-2 border-white">
                {(userProfile.full_name || userProfile.email).charAt(0).toUpperCase()}
              </div>

              <form action={signOutAction}>
                <button
                  type="submit"
                  title="Sign Out"
                  className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1 rounded-2xl border border-amber-300 bg-amber-50/80 px-3 py-2 text-xs font-display font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                title="Admin Console"
              >
                <Shield className="h-3.5 w-3.5 text-amber-600" />
                <span>Admin</span>
              </Link>
              <Link
                href="/login"
                className="rounded-2xl px-4 py-2 text-xs font-display font-bold text-slate-700 hover:bg-amber-100/60 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="btn-3d-amber px-5 py-2 text-xs text-amber-950 font-display font-bold"
              >
                Start Learning &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
