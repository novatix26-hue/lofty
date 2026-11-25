import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { DEMO_PREVIEW_COURSES } from '@/lib/demo/courses';
import { CourseManager } from '@/components/admin/CourseManager';
import type { Course } from '@/types';

export const dynamic = 'force-dynamic';

function getDemoFormattedCourses(): Course[] {
  return DEMO_PREVIEW_COURSES.map((c) => ({
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

export default async function AdminCoursesPage() {
  if (isPlaceholderConfig()) {
    return <CourseManager initialCourses={getDemoFormattedCourses()} />;
  }

  try {
    const admin = createAdminClient();

    const { data: courses, error } = await admin
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !courses) {
      return <CourseManager initialCourses={getDemoFormattedCourses()} />;
    }

    return <CourseManager initialCourses={(courses as Course[]) || []} />;
  } catch {
    return <CourseManager initialCourses={getDemoFormattedCourses()} />;
  }
}

