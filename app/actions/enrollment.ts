'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Helper to ensure the current authenticated user is an admin.
 */
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return { user, profile };
}

/**
 * Student submits course enrollment with receipt image and transaction ID.
 * Enforces business rules:
 * - Prevents duplicate submissions if already 'active' or 'pending'.
 * - If previously 'rejected', resets status to 'pending' with new receipt & transaction ID.
 */
export async function submitEnrollment(
  courseId: string,
  receiptUrl: string,
  transactionId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Please log in to enroll in this course' };
  }

  if (!receiptUrl?.trim()) {
    return { success: false, error: 'Payment receipt image is required' };
  }

  if (!transactionId?.trim()) {
    return { success: false, error: 'Transaction ID is required' };
  }

  const admin = createAdminClient();

  // 1. Check existing enrollment for this student & course
  const { data: existing } = await admin
    .from('enrollments')
    .select('id, status, admin_notes')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'active') {
      return {
        success: false,
        error: 'You are already actively enrolled in this course. You can access your lessons from the Dashboard.',
      };
    }

    if (existing.status === 'pending') {
      return {
        success: false,
        error: 'Your fee payment is currently pending admin verification. Please allow a few hours for review.',
      };
    }

    // If 'rejected', allow re-submission with new receipt and transaction ID
    if (existing.status === 'rejected') {
      const { data: updated, error: updateError } = await admin
        .from('enrollments')
        .update({
          receipt_url: receiptUrl.trim(),
          transaction_id: transactionId.trim(),
          status: 'pending',
          admin_notes: null, // Clear old rejection note
          reviewed_by: null,
          reviewed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      revalidatePath(`/courses/${courseId}`);
      revalidatePath('/dashboard');
      revalidatePath('/admin/enrollments');
      return { success: true, enrollment: updated, resubmitted: true };
    }
  }

  // 2. Insert fresh enrollment
  const { data, error } = await admin
    .from('enrollments')
    .insert({
      user_id: user.id,
      course_id: courseId,
      receipt_url: receiptUrl.trim(),
      transaction_id: transactionId.trim(),
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/courses/${courseId}`);
  revalidatePath('/dashboard');
  revalidatePath('/admin/enrollments');
  return { success: true, enrollment: data };
}

/**
 * Admin approves enrollment:
 * 1. Sets enrollment status to 'active'
 * 2. Immediately unlocks Day 1 lesson in lesson_progress
 */
export async function approveEnrollment(enrollmentId: string) {
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();

    // 1. Fetch enrollment details
    const { data: enrollment, error: fetchError } = await admin
      .from('enrollments')
      .select('id, user_id, course_id, status')
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      return { success: false, error: 'Enrollment record not found' };
    }

    const nowIso = new Date().toISOString();

    // 2. Update enrollment status to 'active'
    const { data: updatedEnrollment, error: updateError } = await admin
      .from('enrollments')
      .update({
        status: 'active',
        reviewed_by: user.id,
        reviewed_at: nowIso,
        approved_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 3. Find Day 1 lesson for this course
    const { data: day1Lesson } = await admin
      .from('lessons')
      .select('id')
      .eq('course_id', enrollment.course_id)
      .eq('day_number', 1)
      .single();

    // 4. Ensure Day 1 lesson progress is created and unlocked immediately
    if (day1Lesson) {
      await admin.from('lesson_progress').upsert(
        {
          enrollment_id: enrollment.id,
          lesson_id: day1Lesson.id,
          user_id: enrollment.user_id,
          watch_percentage: 0.0,
          video_completed: false,
          quiz_unlocked: false,
          quiz_passed: false,
          is_completed: false,
          unlock_at: nowIso, // Unlocked immediately
        },
        { onConflict: 'enrollment_id,lesson_id' }
      );
    }

    revalidatePath('/admin/enrollments');
    revalidatePath('/admin');
    return { success: true, enrollment: updatedEnrollment };
  } catch (err: any) {
    return { success: false, error: err.message || 'Approval failed' };
  }
}

/**
 * Admin rejects enrollment:
 * Updates status to 'rejected' with optional reason/admin notes
 */
export async function rejectEnrollment(enrollmentId: string, reason?: string) {
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: updatedEnrollment, error } = await admin
      .from('enrollments')
      .update({
        status: 'rejected',
        admin_notes: reason?.trim() || null,
        reviewed_by: user.id,
        reviewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/enrollments');
    revalidatePath('/admin');
    return { success: true, enrollment: updatedEnrollment };
  } catch (err: any) {
    return { success: false, error: err.message || 'Rejection failed' };
  }
}
