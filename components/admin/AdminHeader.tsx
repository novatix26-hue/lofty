'use client';

import { Menu, Bell, Shield, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AdminHeaderProps {
  adminEmail?: string;
  adminName?: string;
  onMenuToggle: () => void;
  pendingCount?: number;
}

export function AdminHeader({
  adminEmail = 'admin@lofty.edu',
  adminName = 'Administrator',
  onMenuToggle,
  pendingCount = 0,
}: AdminHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Administrative Portal
          </span>
          <h2 className="text-sm font-semibold text-slate-800">Lofty Management Console</h2>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Pending approvals alert badge */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 border border-amber-200/60">
            <Bell className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            <span className="hidden xs:inline">{pendingCount} Pending Approvals</span>
            <span className="xs:hidden">{pendingCount}</span>
          </div>
        )}

        {/* Admin profile chip */}
        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 sm:pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-sm">
            <Shield className="h-4 w-4" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">{adminName}</p>
            <p className="text-[11px] text-slate-500 leading-tight">{adminEmail}</p>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className="ml-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
