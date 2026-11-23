'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { QuizOption } from '@/types';

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

export interface QuestionInput {
  id?: string;
  quiz_id: string;
  order_index?: number;
  question_text: string;
  audio_url?: string | null;
  image_url?: string | null;
  options: QuizOption[];
  correct_option_id: string;
  explanation?: string | null;
  course_id?: string;
}

export async function getOrCreateQuiz(lessonId: string) {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    // Look for existing quiz
    const { data: existingQuiz } = await admin
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (existingQuiz) {
      return { success: true, quiz: existingQuiz };
    }

    // Create new quiz
    const { data: newQuiz, error } = await admin
      .from('quizzes')
      .insert({
        lesson_id: lessonId,
        title: 'Lesson Quiz',
        passing_score_percentage: 70.0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, quiz: newQuiz };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch or create quiz' };
  }
}

export async function saveQuizQuestion(input: QuestionInput) {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    if (!input.question_text.trim()) {
      return { success: false, error: 'Question text is required' };
    }

    if (!input.options || input.options.length < 2) {
      return { success: false, error: 'At least 2 options are required' };
    }

    if (!input.correct_option_id) {
      return { success: false, error: 'Please mark the correct option' };
    }

    const payload: any = {
      quiz_id: input.quiz_id,
      question_text: input.question_text.trim(),
      audio_url: input.audio_url?.trim() || null,
      image_url: input.image_url?.trim() || null,
      options: input.options,
      correct_option_id: input.correct_option_id,
      explanation: input.explanation?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (input.order_index !== undefined) {
      payload.order_index = input.order_index;
    }

    let result;
    if (input.id) {
      // Update existing question
      result = await admin
        .from('quiz_questions')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single();
    } else {
      // Create new question
      result = await admin
        .from('quiz_questions')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    if (input.course_id) {
      revalidatePath(`/admin/courses/${input.course_id}`);
    }
    return { success: true, question: result.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save question' };
  }
}

export async function deleteQuizQuestion(questionId: string, courseId?: string) {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    const { error } = await admin
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      return { success: false, error: error.message };
    }

    if (courseId) {
      revalidatePath(`/admin/courses/${courseId}`);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete question' };
  }
}
