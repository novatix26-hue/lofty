import { createAdminClient } from '@/lib/supabase/admin';
import { FeeApprovalQueue, type EnrollmentRecord } from '@/components/admin/FeeApprovalQueue';

export const dynamic = 'force-dynamic';

export default async function AdminEnrollmentsPage() {
  const admin = createAdminClient();

  const { data: enrollments, error } = await admin
    .from('enrollments')
    .select(`
      id,
      user_id,
      course_id,
      status,
      receipt_url,
      transaction_id,
      admin_notes,
      reviewed_at,
      approved_at,
      created_at,
      profiles:user_id (id, full_name, email, avatar_url),
      courses:course_id (id, title, category, price, thumbnail_url)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load enrollments: {error.message}
      </div>
    );
  }

  return (
    <FeeApprovalQueue
      initialEnrollments={(enrollments as unknown as EnrollmentRecord[]) || []}
    />
  );
}
