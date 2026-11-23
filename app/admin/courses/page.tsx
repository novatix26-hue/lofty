import { createAdminClient } from '@/lib/supabase/admin';
import { CourseManager } from '@/components/admin/CourseManager';
import type { Course } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  const admin = createAdminClient();

  const { data: courses, error } = await admin
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load courses: {error.message}
      </div>
    );
  }

  return <CourseManager initialCourses={(courses as Course[]) || []} />;
}
