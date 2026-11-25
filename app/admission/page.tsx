import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { getDemoUser } from '@/lib/auth/demo';
import { DEMO_PREVIEW_COURSES } from '@/lib/demo/courses';
import { StudentNavbar } from '@/components/common/StudentNavbar';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { AdmissionFormView } from '@/components/admission/AdmissionFormView';
import type { Course, Profile } from '@/types';

export const metadata = {
  title: 'Online Admission & Fee Verification | Lofty LMS',
  description: 'Submit your online admission form and payment receipt to enroll in Lofty LMS courses.',
};

interface AdmissionPageProps {
  searchParams: Promise<{
    courseId?: string;
  }>;
}

export default async function AdmissionPage({ searchParams }: AdmissionPageProps) {
  const { courseId } = await searchParams;

  let courses: Course[] = [];
  let userProfile: Profile | null = null;

  if (isPlaceholderConfig()) {
    courses = DEMO_PREVIEW_COURSES.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      category: c.category,
      price: c.price,
      is_published: c.is_published,
      thumbnail_url: c.thumbnail_url,
      intro_video_url: c.intro_video_url || null,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
    userProfile = await getDemoUser();
  } else {
    try {
      const admin = createAdminClient();
      const { data: dbCourses } = await admin
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (dbCourses && dbCourses.length > 0) {
        courses = dbCourses as Course[];
      } else {
        courses = DEMO_PREVIEW_COURSES.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          category: c.category,
          price: c.price,
          is_published: c.is_published,
          thumbnail_url: c.thumbnail_url,
          intro_video_url: c.intro_video_url || null,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));
      }

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
        userProfile = profile || null;
      }
    } catch {
      courses = DEMO_PREVIEW_COURSES.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        price: c.price,
        is_published: c.is_published,
        thumbnail_url: c.thumbnail_url,
        intro_video_url: c.intro_video_url || null,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF7]">
      <StudentNavbar userProfile={userProfile} />

      <main className="flex-1 pb-24 md:pb-16">
        <AdmissionFormView
          courses={courses}
          initialCourseId={courseId}
          userProfile={userProfile}
        />
      </main>

      <MobileBottomNav userProfile={userProfile} />
    </div>
  );
}
