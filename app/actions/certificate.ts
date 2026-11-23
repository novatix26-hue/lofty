'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Certificate } from '@/types';

export interface GenerateCertificateResult {
  success: boolean;
  certificate?: Certificate;
  error?: string;
  isCompleted?: boolean;
  completionPercentage?: number;
}

/**
 * Validates course completion and generates/retrieves an official digital certificate.
 */
export async function getOrCreateCertificate(
  courseId: string
): Promise<GenerateCertificateResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User must be authenticated.' };
    }

    const admin = createAdminClient();

    // 1. Fetch course details
    const { data: course, error: courseError } = await admin
      .from('courses')
      .select('id, title, category')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return { success: false, error: 'Course not found.' };
    }

    // 2. Fetch enrollment status
    const { data: enrollment, error: enrollError } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (enrollError || !enrollment || enrollment.status !== 'active') {
      return {
        success: false,
        error: 'You do not have an active enrollment for this course.',
      };
    }

    // 3. Check if certificate already exists
    const { data: existingCert } = await admin
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingCert) {
      return {
        success: true,
        certificate: existingCert,
        isCompleted: true,
        completionPercentage: 100,
      };
    }

    // 4. Check lesson completion
    const { data: lessons, error: lessonsError } = await admin
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    if (lessonsError || !lessons || lessons.length === 0) {
      return { success: false, error: 'Course has no lessons available.' };
    }

    const totalLessons = lessons.length;
    const lessonIds = lessons.map((l) => l.id);

    const { data: progressList } = await admin
      .from('lesson_progress')
      .select('lesson_id, is_completed')
      .eq('enrollment_id', enrollment.id)
      .in('lesson_id', lessonIds)
      .eq('is_completed', true);

    const completedLessonsCount = progressList ? progressList.length : 0;
    const completionPercentage = Math.round((completedLessonsCount / totalLessons) * 100);

    if (completedLessonsCount < totalLessons) {
      return {
        success: false,
        isCompleted: false,
        completionPercentage,
        error: `Course is ${completionPercentage}% completed. Complete all ${totalLessons} lessons to earn your certificate.`,
      };
    }

    // 5. Fetch student name
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const studentName =
      profile?.full_name?.trim() ||
      profile?.email?.split('@')[0] ||
      'Student';

    // 6. Generate unique certificate ID: LOFTY-CERT-XXXXX
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dateYear = new Date().getFullYear();
    const certificateId = `LOFTY-CERT-${dateYear}-${randomSuffix}`;

    // 7. Insert Certificate
    const { data: newCert, error: insertError } = await admin
      .from('certificates')
      .insert({
        certificate_id: certificateId,
        user_id: user.id,
        course_id: course.id,
        student_name: studentName,
        course_title: course.title,
        issued_at: new Date().toISOString(),
        metadata: {
          category: course.category,
          total_lessons: totalLessons,
          completed_at: new Date().toISOString(),
        },
      })
      .select('*')
      .single();

    if (insertError) {
      return {
        success: false,
        error: `Could not issue certificate: ${insertError.message}`,
      };
    }

    return {
      success: true,
      certificate: newCert,
      isCompleted: true,
      completionPercentage: 100,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while generating certificate.',
    };
  }
}

/**
 * Public certificate verification function
 */
export async function verifyCertificate(certificateId: string) {
  try {
    const admin = createAdminClient();
    const { data: cert, error } = await admin
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId.trim().toUpperCase())
      .maybeSingle();

    if (error || !cert) {
      return { success: false, error: 'Certificate not found or invalid ID.' };
    }

    return { success: true, certificate: cert };
  } catch (err: any) {
    return { success: false, error: err.message || 'Verification failed.' };
  }
}
