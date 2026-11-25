import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { getDemoUser, getDemoEnrollments } from '@/lib/auth/demo';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';

export const metadata = {
  title: 'Admin Console | Lofty Educational LMS',
  description: 'Course management, lesson drip builder, and fee approval queue',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Check for Active Demo Admin Session (Fast & 100% reliable)
  const demoUser = await getDemoUser();
  if (demoUser && demoUser.role === 'admin') {
    const demoEnrollments = await getDemoEnrollments();
    const pendingCount = demoEnrollments.filter((e) => e.status === 'pending').length;

    return (
      <AdminLayoutShell
        adminEmail={demoUser.email}
        adminName={demoUser.full_name || 'Admin'}
        pendingCount={pendingCount}
      >
        {children}
      </AdminLayoutShell>
    );
  }

  if (isPlaceholderConfig()) {
    if (!demoUser) {
      redirect('/login?redirectTo=/admin');
    }

    if (demoUser.role !== 'admin') {
      redirect('/dashboard?error=admin_access_required');
    }
  }

  // 2. Live Supabase Mode
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Authentication check
    if (!user) {
      redirect('/login?redirectTo=/admin');
    }

    // Strict Role Verification (Server-Side)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      redirect('/dashboard?error=admin_access_required');
    }

    // Query pending fee approvals count for badge indicators
    let pendingCount = 0;
    try {
      const admin = createAdminClient();
      const { count } = await admin
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      pendingCount = count || 0;
    } catch {
      pendingCount = 0;
    }

    return (
      <AdminLayoutShell
        adminEmail={profile.email}
        adminName={profile.full_name || 'Admin'}
        pendingCount={pendingCount}
      >
        {children}
      </AdminLayoutShell>
    );
  } catch {
    redirect('/login?redirectTo=/admin');
  }
}
