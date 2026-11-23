import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { getDemoUser, getDemoEnrollments } from '@/lib/auth/demo';
import { CourseDetailView } from '@/components/courses/CourseDetailView';
import { StudentNavbar } from '@/components/common/StudentNavbar';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { DEMO_PREVIEW_COURSES } from '@/lib/demo/courses';
import type { Course, Lesson, Enrollment, Profile } from '@/types';

export const dynamic = 'force-dynamic';

interface CourseDetailPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  let userProfile: Profile | null = null;
  let existingEnrollment: Enrollment | null = null;

  if (isPlaceholderConfig()) {
    userProfile = await getDemoUser();
    const demoEnrollments = await getDemoEnrollments();
    const match = demoEnrollments.find((e) => e.course_id === courseId);
    if (match) {
      existingEnrollment = match as unknown as Enrollment;
    }
  } else {
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

        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle();
        existingEnrollment = enrollment as Enrollment | null;
      }
    } catch (err) {
      // Graceful fallback for local preview
    }
  }

  let course: Course | null = null;
  let lessons: Lesson[] = [];

  if (courseId.startsWith('demo-')) {
    const demo =
      DEMO_PREVIEW_COURSES.find((d) => d.id === courseId) || DEMO_PREVIEW_COURSES[0];
    course = demo;
    lessons = [
      {
        id: `${demo.id}-lesson-1`,
        course_id: demo.id,
        title:
          demo.category === 'kids'
            ? 'Day 1: Magic Alphabet & Phonics Song'
            : 'Day 1: Project Architecture & Environment Setup',
        description:
          'Engaging foundation lesson with interactive video checkpoints and visual examples.',
        day_number: 1,
        duration_seconds: 450,
        is_published: true,
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `${demo.id}-lesson-2`,
        course_id: demo.id,
        title:
          demo.category === 'kids'
            ? 'Day 2: Animal Friends & Voice Riddles'
            : 'Day 2: State Flow & Server-Side Security',
        description: 'Day 2 sequential mastery topic scheduled for next-day drip unlock.',
        day_number: 2,
        duration_seconds: 600,
        is_published: true,
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  } else {
    try {
      const admin = createAdminClient();
      const { data: dbCourse } = await admin
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      course = dbCourse;

      if (course) {
        const { data: dbLessons } = await admin
          .from('lessons')
          .select(
            'id, course_id, title, description, day_number, duration_seconds, is_published, video_url, created_at, updated_at'
          )
          .eq('course_id', courseId)
          .order('day_number', { ascending: true });
        lessons = (dbLessons as Lesson[]) || [];
      }
    } catch (err) {
      // not found
    }
  }

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-12">
      <StudentNavbar userProfile={userProfile} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CourseDetailView
          course={course as Course}
          lessons={(lessons as Lesson[]) || []}
          existingEnrollment={existingEnrollment}
          userProfile={userProfile}
        />
      </main>

      <MobileBottomNav userProfile={userProfile} />
    </div>
  );
}
