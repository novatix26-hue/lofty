'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import {
  getDemoUser,
  getDemoEnrollments,
  saveDemoEnrollments,
  type DemoEnrollmentItem,
} from '@/lib/auth/demo';
import { revalidatePath } from 'next/cache';

/**
 * Helper to ensure the current authenticated user is an admin.
 */
async function assertAdmin() {
  if (isPlaceholderConfig()) {
    const demoUser = await getDemoUser();
    if (!demoUser || demoUser.role !== 'admin') {
      throw new Error('Forbidden: Admin access required');
    }
    return { user: { id: demoUser.id, email: demoUser.email }, profile: demoUser };
  }

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

export interface AdmissionInput {
  courseId: string;
  fullName: string;
  email?: string;
  guardianName?: string;
  whatsappNumber: string;
  city?: string;
  country?: string;
  gender?: string;
  dateOfBirth?: string;
  educationLevel?: string;
  paymentMethod?: string;
  senderAccountName?: string;
  senderAccountNumber?: string;
  transactionId: string;
  amountPaid?: number;
  paymentDate?: string;
  receiptUrl: string;
  studentNotes?: string;
}

/**
 * Modern Comprehensive Student Admission & Fee Submission.
 * Captures full student personal profile, institute bank chosen, sender details, and receipt.
 */
export async function submitAdmissionForm(input: AdmissionInput) {
  try {
    const trimmedCourseId = input.courseId?.trim();
    const trimmedName = input.fullName?.trim();
    const trimmedWhatsapp = input.whatsappNumber?.trim();
    const trimmedTxId = input.transactionId?.trim();
    const trimmedReceipt = input.receiptUrl?.trim();

    if (!trimmedCourseId) return { success: false, error: 'براہ کرم کورس کا انتخاب کریں' };
    if (!trimmedName) return { success: false, error: 'طالب علم کا نام درج کریں' };
    if (!trimmedWhatsapp) return { success: false, error: 'واٹس ایپ نمبر درج کریں' };
    if (!trimmedTxId) return { success: false, error: 'ٹرانزیکشن آئی ڈی درج کریں' };
    if (!trimmedReceipt) return { success: false, error: 'فیس کی رسید اپلوڈ کریں' };

    const trimmedEmail = input.email?.trim().toLowerCase() || `${trimmedWhatsapp.replace(/\D/g, '') || Date.now()}@lofty.local`;
    const trimmedCity = input.city?.trim() || 'Pakistan';
    const trimmedBank = input.paymentMethod?.trim() || 'Bank Transfer';
    const trimmedSenderName = input.senderAccountName?.trim() || trimmedName;
    const trimmedSenderAcc = input.senderAccountNumber?.trim() || trimmedWhatsapp;


    // 1. Placeholder / Local Demo Mode
    if (isPlaceholderConfig()) {
      let demoUser = await getDemoUser();
      if (!demoUser) {
        demoUser = {
          id: `demo-student-${Date.now().toString().slice(-6)}`,
          email: trimmedEmail,
          full_name: trimmedName,
          phone: trimmedWhatsapp,
          guardian_name: input.guardianName?.trim() || null,
          city: trimmedCity,
          role: 'student',
          avatar_url: null,
          active_session_token: null,
          active_session_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const currentEnrollments = await getDemoEnrollments();
      const existing = currentEnrollments.find((e) => e.course_id === trimmedCourseId);

      const admissionRecord: DemoEnrollmentItem = {
        id: existing?.id || `demo-enr-${Date.now()}`,
        user_id: demoUser.id,
        course_id: trimmedCourseId,
        status: 'pending',
        receipt_url: trimmedReceipt,
        transaction_id: trimmedTxId,
        guardian_name: input.guardianName?.trim() || null,
        whatsapp_number: trimmedWhatsapp,
        city: trimmedCity,
        country: input.country?.trim() || 'Pakistan',
        gender: input.gender?.trim() || null,
        date_of_birth: input.dateOfBirth?.trim() || null,
        education_level: input.educationLevel?.trim() || null,
        payment_method: trimmedBank,
        sender_account_name: trimmedSenderName,
        sender_account_number: trimmedSenderAcc,
        amount_paid: Number(input.amountPaid) || 0,
        payment_date: input.paymentDate || new Date().toISOString().split('T')[0],
        student_notes: input.studentNotes?.trim() || null,
        admin_notes: null,
        reviewed_at: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        profiles: {
          id: demoUser.id,
          full_name: trimmedName,
          email: trimmedEmail,
          avatar_url: null,
        },
      };

      if (existing) {
        const idx = currentEnrollments.findIndex((e) => e.course_id === trimmedCourseId);
        currentEnrollments[idx] = admissionRecord;
      } else {
        currentEnrollments.unshift(admissionRecord);
      }

      await saveDemoEnrollments(currentEnrollments);
      revalidatePath(`/courses/${trimmedCourseId}`);
      revalidatePath('/dashboard');
      revalidatePath('/admin/enrollments');
      revalidatePath('/admin');

      return {
        success: true,
        enrollmentId: admissionRecord.id,
        message: 'Admission request and fee details submitted successfully!',
      };
    }

    // 2. Live Supabase Mode
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let targetUserId = user?.id;

    const admin = createAdminClient();

    // If student is not logged in, check if profile exists or create guest student profile
    if (!targetUserId) {
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (existingProfile) {
        targetUserId = existingProfile.id;
      } else {
        // Generate anonymous student uuid
        const newUuid = crypto.randomUUID();
        const { data: createdProfile, error: profileErr } = await admin
          .from('profiles')
          .insert({
            id: newUuid,
            email: trimmedEmail,
            full_name: trimmedName,
            phone: trimmedWhatsapp,
            role: 'student',
          })
          .select('id')
          .single();

        if (profileErr) {
          return { success: false, error: 'Could not create student profile: ' + profileErr.message };
        }
        targetUserId = createdProfile.id;
      }
    } else {
      // Update logged-in student profile with their latest contact details
      await admin
        .from('profiles')
        .update({
          full_name: trimmedName,
          phone: trimmedWhatsapp,
          city: trimmedCity,
        })
        .eq('id', targetUserId);
    }

    // Check existing enrollment
    const { data: existing } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('user_id', targetUserId)
      .eq('course_id', trimmedCourseId)
      .maybeSingle();

    const payload = {
      user_id: targetUserId,
      course_id: trimmedCourseId,
      status: 'pending' as const,
      receipt_url: trimmedReceipt,
      transaction_id: trimmedTxId,
      guardian_name: input.guardianName?.trim() || null,
      whatsapp_number: trimmedWhatsapp,
      city: trimmedCity,
      country: input.country?.trim() || 'Pakistan',
      gender: input.gender?.trim() || null,
      date_of_birth: input.dateOfBirth?.trim() || null,
      education_level: input.educationLevel?.trim() || null,
      payment_method: trimmedBank,
      sender_account_name: trimmedSenderName,
      sender_account_number: trimmedSenderAcc,
      amount_paid: Number(input.amountPaid) || 0,
      payment_date: input.paymentDate || new Date().toISOString().split('T')[0],
      student_notes: input.studentNotes?.trim() || null,
      admin_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    };

    let resultRecord;
    if (existing) {
      if (existing.status === 'active') {
        return {
          success: false,
          error: 'You are already actively enrolled in this course. You can access it from your Dashboard.',
        };
      }
      const { data: updated, error: updateErr } = await admin
        .from('enrollments')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) return { success: false, error: updateErr.message };
      resultRecord = updated;
    } else {
      const { data: inserted, error: insertErr } = await admin
        .from('enrollments')
        .insert(payload)
        .select()
        .single();

      if (insertErr) return { success: false, error: insertErr.message };
      resultRecord = inserted;
    }

    revalidatePath(`/courses/${trimmedCourseId}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/enrollments');
    revalidatePath('/admin');

    return {
      success: true,
      enrollmentId: resultRecord.id,
      message: 'Admission form & fee details submitted successfully!',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit admission form' };
  }
}

/**
 * Student submits course enrollment with receipt image and transaction ID (Backward-compatible).
 */
export async function submitEnrollment(
  courseId: string,
  receiptUrl: string,
  transactionId: string
) {
  if (isPlaceholderConfig()) {
    const demoUser = await getDemoUser();
    if (!demoUser) {
      return { success: false, error: 'Please log in to enroll in this course' };
    }

    if (!receiptUrl?.trim()) {
      return { success: false, error: 'Payment receipt image is required' };
    }

    if (!transactionId?.trim()) {
      return { success: false, error: 'Transaction ID is required' };
    }

    const currentEnrollments = await getDemoEnrollments();
    const existing = currentEnrollments.find((e) => e.course_id === courseId);

    if (existing) {
      if (existing.status === 'active') {
        return {
          success: false,
          error:
            'You are already actively enrolled in this course. You can access your lessons from the Dashboard.',
        };
      }
      if (existing.status === 'pending') {
        return {
          success: false,
          error:
            'Your fee payment is currently pending admin verification. Please allow a few hours for review.',
        };
      }
      existing.status = 'pending';
      existing.receipt_url = receiptUrl.trim();
      existing.transaction_id = transactionId.trim();
      existing.admin_notes = null;
      await saveDemoEnrollments(currentEnrollments);
      revalidatePath(`/courses/${courseId}`);
      revalidatePath('/dashboard');
      revalidatePath('/admin/enrollments');
      return { success: true, enrollment: existing, resubmitted: true };
    }

    const newEnr: DemoEnrollmentItem = {
      id: `demo-enr-${Date.now()}`,
      user_id: demoUser.id,
      course_id: courseId,
      status: 'pending',
      receipt_url: receiptUrl.trim(),
      transaction_id: transactionId.trim(),
      admin_notes: null,
      reviewed_at: null,
      approved_at: null,
      created_at: new Date().toISOString(),
    };

    currentEnrollments.unshift(newEnr);
    await saveDemoEnrollments(currentEnrollments);

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/enrollments');
    return { success: true, enrollment: newEnr };
  }

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
        error:
          'You are already actively enrolled in this course. You can access your lessons from the Dashboard.',
      };
    }

    if (existing.status === 'pending') {
      return {
        success: false,
        error:
          'Your fee payment is currently pending admin verification. Please allow a few hours for review.',
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
          admin_notes: null,
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
    if (isPlaceholderConfig()) {
      const enrollments = await getDemoEnrollments();
      const match = enrollments.find((e) => e.id === enrollmentId);
      if (match) {
        match.status = 'active';
        match.approved_at = new Date().toISOString();
        await saveDemoEnrollments(enrollments);
      }
      revalidatePath('/admin/enrollments');
      revalidatePath('/admin');
      revalidatePath('/dashboard');
      return { success: true, enrollment: match };
    }

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
          is_unlocked: true,
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
 * Admin rejects enrollment
 */
export async function rejectEnrollment(enrollmentId: string, reason?: string) {
  try {
    if (isPlaceholderConfig()) {
      const enrollments = await getDemoEnrollments();
      const match = enrollments.find((e) => e.id === enrollmentId);
      if (match) {
        match.status = 'rejected';
        match.admin_notes = reason?.trim() || 'Payment verification failed';
        await saveDemoEnrollments(enrollments);
      }
      revalidatePath('/admin/enrollments');
      revalidatePath('/admin');
      revalidatePath('/dashboard');
      return { success: true, enrollment: match };
    }

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
