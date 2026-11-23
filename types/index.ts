import type { Database, UserRole, CourseCategory, EnrollmentStatus } from './database.types';

export type { UserRole, CourseCategory, EnrollmentStatus };

// Convenience type aliases for Database entities
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Quiz = Database['public']['Tables']['quizzes']['Row'];
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];
export type StudentQuizQuestion = Database['public']['Views']['student_quiz_questions']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];
export type LessonProgress = Database['public']['Tables']['lesson_progress']['Row'];
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];
export type Certificate = Database['public']['Tables']['certificates']['Row'];

// Quiz Question Options format (supports kids audio/image and text)
export interface QuizOption {
  id: string;
  text: string;
  image_url?: string;
}

// Client Quiz Submission Request (sent to Server Action / API Route)
export interface QuizSubmissionRequest {
  enrollmentId: string;
  lessonId: string;
  quizId: string;
  answers: Record<string, string>; // { [questionId: string]: selectedOptionId }
}

// Server Quiz Grading Response
export interface QuizGradingResult {
  success: boolean;
  scorePercentage: number;
  totalQuestions: number;
  correctAnswersCount: number;
  passingScore: number;
  passed: boolean;
  message: string;
  nextLessonUnlockAt?: string | null;
  nextLessonId?: string | null;
  errors?: string[];
}

// Video Progress Tracking Request
export interface UpdateVideoProgressRequest {
  enrollmentId: string;
  lessonId: string;
  watchPercentage: number; // 0 - 100
}

// Session Verification Result
export interface SessionCheckResult {
  valid: boolean;
  reason?: 'unauthenticated' | 'session_superseded' | 'user_not_found';
  userId?: string;
  role?: UserRole;
}
