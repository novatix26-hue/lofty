import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CourseCatalog, type CatalogCourse } from '@/components/courses/CourseCatalog';
import { StudentNavbar } from '@/components/common/StudentNavbar';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { DEMO_PREVIEW_COURSES } from '@/lib/demo/courses';
import type { Profile } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  let userProfile: Profile | null = null;
  let coursesList: CatalogCourse[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      userProfile = profile as Profile | null;
    }
  } catch (err) {
    // Graceful fallback
  }

  try {
    const admin = createAdminClient();
    const { data: courses, error } = await admin
      .from('courses')
      .select('*, lessons(count)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (!error && courses && courses.length > 0) {
      coursesList = courses as CatalogCourse[];
    } else {
      coursesList = DEMO_PREVIEW_COURSES;
    }
  } catch (err) {
    coursesList = DEMO_PREVIEW_COURSES;
  }

  return (
    <div className="min-h-screen bg-[#FFFDF7] pb-20 md:pb-12">
      <StudentNavbar userProfile={userProfile} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CourseCatalog courses={coursesList} />
      </main>

      <MobileBottomNav userProfile={userProfile} />
    </div>
  );
}
