'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, Shield, LogOut, User, Award, GraduationCap } from 'lucide-react';
import { signOutAction } from '@/app/actions/auth';
import type { Profile } from '@/types';

interface MobileBottomNavProps {
  userProfile?: Profile | null;
}

export function MobileBottomNav({ userProfile }: MobileBottomNavProps) {
  const pathname = usePathname();

  // Hide on admin routes or auth pages
  if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const isCourses = pathname === '/courses' || pathname === '/';
  const isDashboard = pathname === '/dashboard';
  const isReportCard = pathname === '/dashboard/report-card';

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t-2 border-amber-200/80 bg-[#FFFDF7]/95 backdrop-blur-md md:hidden px-2 pb-safe shadow-lg">
      <Link
        href="/courses"
        className={`flex flex-col items-center gap-1 py-1 text-xs font-display font-bold transition-all ${
          isCourses ? 'text-sky-600 scale-105' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <BookOpen className="h-5 w-5 stroke-[2.2]" />
        <span>Browse</span>
      </Link>

      <Link
        href="/admission"
        className={`flex flex-col items-center gap-1 py-1 text-xs font-display font-bold transition-all ${
          pathname === '/admission' ? 'text-amber-600 scale-105' : 'text-slate-500 hover:text-amber-700'
        }`}
      >
        <GraduationCap className="h-5 w-5 text-amber-500 stroke-[2.2]" />
        <span>Admission</span>
      </Link>

      {userProfile ? (
        <>
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 py-1 text-xs font-display font-bold transition-all ${
              isDashboard ? 'text-sky-600 scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 stroke-[2.2]" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard/report-card"
            className={`flex flex-col items-center gap-1 py-1 text-xs font-display font-bold transition-all ${
              isReportCard ? 'text-amber-600 scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award className="h-5 w-5 text-amber-500 stroke-[2.2]" />
            <span>Rewards</span>
          </Link>

          {userProfile.role === 'admin' ? (
            <Link
              href="/admin"
              className="flex flex-col items-center gap-1 py-1 text-xs font-display font-bold text-slate-700"
            >
              <Shield className="h-5 w-5 text-slate-800" />
              <span>Admin</span>
            </Link>
          ) : (
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex flex-col items-center gap-1 py-1 text-xs font-display font-bold text-slate-400 hover:text-red-500"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          <Link
            href="/admin"
            className="flex flex-col items-center gap-1 py-1 text-xs font-display font-bold text-slate-500 hover:text-amber-600"
          >
            <Shield className="h-5 w-5 text-amber-500" />
            <span>Admin</span>
          </Link>
          <Link
            href="/login"
            className="flex flex-col items-center gap-1 py-1 text-xs font-display font-bold text-slate-500 hover:text-sky-600"
          >
            <User className="h-5 w-5" />
            <span>Sign In</span>
          </Link>
        </>
      )}
    </nav>
  );
}
