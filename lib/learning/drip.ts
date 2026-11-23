/**
 * LEARNING ENGINE & DRIP SCHEDULING UTILITIES
 * Enforces:
 * - 85% Video Watch Threshold
 * - 70% Server-Side Quiz Passing Grade
 * - Next-Day Midnight Unlock in Pakistan Standard Time (Asia/Karachi, UTC+5)
 */

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC+5

/**
 * Calculates exact 12:00:00 AM (midnight) of the next calendar day in Pakistan Standard Time (PKT).
 * Formula:
 * 1. Project current time into PKT.
 * 2. Advance to the next calendar date at 00:00:00.000 PKT.
 * 3. Convert back to UTC ISO Date.
 */
export function getNextKarachiMidnight(currentDate = new Date()): Date {
  const pktTime = new Date(currentDate.getTime() + PKT_OFFSET_MS);

  const year = pktTime.getUTCFullYear();
  const month = pktTime.getUTCMonth();
  const date = pktTime.getUTCDate();

  // Next calendar day at 00:00:00 PKT
  const nextPktMidnightUtcMs = Date.UTC(year, month, date + 1, 0, 0, 0, 0) - PKT_OFFSET_MS;
  return new Date(nextPktMidnightUtcMs);
}

/**
 * Alias maintaining compatibility
 */
export const getNextDayMidnight = getNextKarachiMidnight;

/**
 * Evaluates whether a lesson is currently accessible:
 * 1. Must be flagged is_unlocked === true (or not false)
 * 2. unlock_at timestamp must be in the past (<= now)
 */
export function isLessonUnlocked(
  unlockAt: string | Date | null | undefined,
  isUnlocked: boolean = true
): boolean {
  if (!isUnlocked) return false;
  if (!unlockAt) return false;

  const unlockTime = new Date(unlockAt).getTime();
  return unlockTime <= Date.now();
}

/**
 * Checks if a video watch percentage meets the 85% minimum requirement to unlock the quiz.
 */
export function isVideoRequirementMet(watchPercentage: number): boolean {
  return watchPercentage >= 85.0;
}

/**
 * Checks if quiz score meets or exceeds the 70% threshold.
 */
export function isQuizPassing(scorePercentage: number): boolean {
  return scorePercentage >= 70.0;
}

/**
 * Formats milliseconds remaining into a live countdown string (e.g. "11h 45m 20s" or "0m 45s")
 */
export function formatCountdown(targetDate: Date | string, now = new Date()): string {
  const targetTime = new Date(targetDate).getTime();
  const nowTime = now.getTime();
  const diffMs = targetTime - nowTime;

  if (diffMs <= 0) return '0s';

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
