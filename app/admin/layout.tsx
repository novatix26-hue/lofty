import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Authentication check
  if (!user) {
    redirect('/login?redirectTo=/admin');
  }

  // 2. Strict Role Verification (Server-Side)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard?error=admin_access_required');
  }

  // 3. Query pending fee approvals count for badge indicators
  const admin = createAdminClient();
  const { count: pendingCount } = await admin
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <AdminLayoutShell
      adminEmail={profile.email}
      adminName={profile.full_name || 'Admin'}
      pendingCount={pendingCount || 0}
    >
      {children}
    </AdminLayoutShell>
  );
}
