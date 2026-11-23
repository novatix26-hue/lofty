import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { getDemoEnrollments } from '@/lib/auth/demo';
import { FeeApprovalQueue, type EnrollmentRecord } from '@/components/admin/FeeApprovalQueue';

export const dynamic = 'force-dynamic';

export default async function AdminEnrollmentsPage() {
  if (isPlaceholderConfig()) {
    const demoEnrollments = await getDemoEnrollments();
    const formatted: EnrollmentRecord[] = demoEnrollments.map((e) => ({
      id: e.id,
      user_id: e.user_id,
      course_id: e.course_id,
      status: e.status,
      receipt_url: e.receipt_url,
      transaction_id: e.transaction_id,
      admin_notes: e.admin_notes,
      reviewed_at: e.reviewed_at,
      approved_at: e.approved_at,
      created_at: e.created_at,
      profiles: {
        id: e.user_id,
        full_name: 'Student Demo User',
        email: 'student@example.com',
        avatar_url: null,
      },
      courses: e.courses || {
        id: e.course_id,
        title: 'Demo Course',
        category: 'kids',
        price: 1500,
        thumbnail_url: null,
      },
    }));

    return <FeeApprovalQueue initialEnrollments={formatted} />;
  }

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
