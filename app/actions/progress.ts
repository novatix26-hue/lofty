'use server';

import { createClient } from '@/lib/supabase/server';
import { isVideoRequirementMet } from '@/lib/learning/drip';

/**
 * Server action to update student video watch percentage.
 * When watchPercentage >= 85%, unlocks the quiz for the lesson.
 */
export async function updateVideoProgress(
  enrollmentId: string,
  lessonId: string,
  watchPercentage: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const clampedPercentage = Math.min(100, Math.max(0, watchPercentage));
  const videoCompleted = isVideoRequirementMet(clampedPercentage);

  const { data, error } = await supabase
    .from('lesson_progress')
    .update({
      watch_percentage: clampedPercentage,
      video_completed: videoCompleted,
      quiz_unlocked: videoCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to update progress' };
  }

  return {
    success: true,
    watchPercentage: clampedPercentage,
    quizUnlocked: data.quiz_unlocked,
  };
}
