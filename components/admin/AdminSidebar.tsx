'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  Users,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  pendingCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({
  pendingCount = 0,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: pathname === '/admin',
    },
    {
      name: 'Courses',
      href: '/admin/courses',
      icon: BookOpen,
      current: pathname.startsWith('/admin/courses'),
    },
    {
      name: 'Fee Approvals',
      href: '/admin/enrollments',
      icon: Receipt,
      current: pathname.startsWith('/admin/enrollments'),
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      name: 'Students',
      href: '/admin/students',
      icon: Users,
      current: pathname.startsWith('/admin/students'),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900">Lofty LMS</span>
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-500">Kids & Adults Education</p>
            </div>
          </Link>

          {/* Close button on mobile */}
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

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                  item.current
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      item.current ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
                      item.current
                        ? 'bg-white text-blue-700'
                        : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Category Pill Footer Banner */}
        <div className="m-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Dual Audience LMS</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Kids (5-12) with audio & picture quizzes, and Adults with video drips.
          </p>
        </div>
      </aside>
    </>
  );
}
