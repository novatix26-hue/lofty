'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

export interface LessonInput {
  course_id: string;
  title: string;
  description?: string;
  day_number: number;
  video_url: string;
  duration_seconds?: number;
  is_published?: boolean;
}

export async function createLesson(input: LessonInput) {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    // 1. Insert lesson
    const { data: lesson, error: lessonError } = await admin
      .from('lessons')
      .insert({
        course_id: input.course_id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        day_number: Number(input.day_number),
        video_url: input.video_url.trim(),
        duration_seconds: Number(input.duration_seconds) || 0,
        is_published: input.is_published ?? true,
      })
      .select()
      .single();

    if (lessonError) {
      return { success: false, error: lessonError.message };
    }

    // 2. Automatically initialize an associated quiz for this lesson
    await admin
      .from('quizzes')
      .insert({
        lesson_id: lesson.id,
        title: `${lesson.title} Quiz`,
        passing_score_percentage: 70.0,
      })
      .select()
      .single();

    revalidatePath(`/admin/courses/${input.course_id}`);
    return { success: true, lesson };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create lesson' };
  }
}

export async function updateLesson(
  lessonId: string,
  courseId: string,
  input: Partial<Omit<LessonInput, 'course_id'>>
) {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.description !== undefined) updateData.description = input.description.trim() || null;
    if (input.day_number !== undefined) updateData.day_number = Number(input.day_number);
    if (input.video_url !== undefined) updateData.video_url = input.video_url.trim();
    if (input.duration_seconds !== undefined) updateData.duration_seconds = Number(input.duration_seconds);
    if (input.is_published !== undefined) updateData.is_published = input.is_published;

    const { data: lesson, error } = await admin
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true, lesson };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update lesson' };
  }
}

export async function deleteLesson(lessonId: string, courseId: string) {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    const { error } = await admin.from('lessons').delete().eq('id', lessonId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete lesson' };
  }
}

export async function reorderLessons(
  courseId: string,
  items: { id: string; day_number: number }[]
) {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    for (const item of items) {
      await admin
        .from('lessons')
        .update({ day_number: item.day_number, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reorder lessons' };
  }
}
