'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { getDemoUser } from '@/lib/auth/demo';
import { revalidatePath } from 'next/cache';
import type { CourseCategory } from '@/types';

async function assertAdmin() {
  if (isPlaceholderConfig()) {
    const demoUser = await getDemoUser();
    if (!demoUser || demoUser.role !== 'admin') {
      throw new Error('Forbidden: Admin access required');
    }
    return { id: demoUser.id, email: demoUser.email };
  }

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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface CourseInput {
  title: string;
  slug?: string;
  description?: string;
  category: CourseCategory;
  price: number;
  thumbnail_url?: string;
  intro_video_url?: string;
  is_published?: boolean;
}

export async function createCourse(input: CourseInput) {
  try {
    await assertAdmin();

    const slug = input.slug?.trim() || `${generateSlug(input.title)}-${Date.now().toString().slice(-4)}`;

    if (isPlaceholderConfig()) {
      revalidatePath('/admin/courses');
      revalidatePath('/admin');
      return {
        success: true,
        course: {
          id: `demo-${Date.now()}`,
          title: input.title.trim(),
          slug,
          description: input.description?.trim() || null,
          category: input.category,
          price: Number(input.price) || 0,
          thumbnail_url: input.thumbnail_url?.trim() || null,
          intro_video_url: input.intro_video_url?.trim() || null,
          is_published: input.is_published ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
      };
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from('courses')
      .insert({
        title: input.title.trim(),
        slug,
        description: input.description?.trim() || null,
        category: input.category,
        price: Number(input.price) || 0,
        thumbnail_url: input.thumbnail_url?.trim() || null,
        intro_video_url: input.intro_video_url?.trim() || null,
        is_published: input.is_published ?? false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/courses');
    revalidatePath('/admin');
    return { success: true, course: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create course' };
  }
}

export async function updateCourse(courseId: string, input: Partial<CourseInput>) {
  try {
    await assertAdmin();

    if (isPlaceholderConfig()) {
      revalidatePath('/admin/courses');
      revalidatePath(`/admin/courses/${courseId}`);
      revalidatePath('/admin');
      return {
        success: true,
        course: {
          id: courseId,
          ...input,
          updated_at: new Date().toISOString(),
        } as any,
      };
    }

    const admin = createAdminClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.slug !== undefined && input.slug.trim()) updateData.slug = input.slug.trim();
    if (input.description !== undefined) updateData.description = input.description.trim() || null;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.price !== undefined) updateData.price = Number(input.price);
    if (input.thumbnail_url !== undefined) updateData.thumbnail_url = input.thumbnail_url?.trim() || null;
    if (input.intro_video_url !== undefined) updateData.intro_video_url = input.intro_video_url?.trim() || null;
    if (input.is_published !== undefined) updateData.is_published = input.is_published;

    const { data, error } = await admin
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath('/admin');
    return { success: true, course: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update course' };
  }
}

export async function togglePublishCourse(courseId: string, isPublished: boolean) {
  try {
    await assertAdmin();

    if (isPlaceholderConfig()) {
      revalidatePath('/admin/courses');
      revalidatePath(`/admin/courses/${courseId}`);
      revalidatePath('/admin');
      return { success: true };
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from('courses')
      .update({
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath('/admin');
    return { success: true, course: data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle publication' };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    await assertAdmin();

    if (isPlaceholderConfig()) {
      revalidatePath('/admin/courses');
      revalidatePath('/admin');
      return { success: true };
    }

    const admin = createAdminClient();

    const { error } = await admin.from('courses').delete().eq('id', courseId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/courses');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete course' };
  }
}
