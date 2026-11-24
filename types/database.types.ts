export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'student';
export type CourseCategory = 'kids' | 'adults';
export type EnrollmentStatus = 'pending' | 'active' | 'rejected' | 'completed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          active_session_token: string | null;
          active_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          active_session_token?: string | null;
          active_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          active_session_token?: string | null;
          active_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          category: CourseCategory;
          thumbnail_url: string | null;
          intro_video_url: string | null;
          price: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          category: CourseCategory;
          thumbnail_url?: string | null;
          intro_video_url?: string | null;
          price?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          category?: CourseCategory;
          thumbnail_url?: string | null;
          intro_video_url?: string | null;
          price?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          day_number: number;
          video_url: string;
          duration_seconds: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          day_number: number;
          video_url: string;
          duration_seconds?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          day_number?: number;
          video_url?: string;
          duration_seconds?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lessons_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          }
        ];
      };
      quizzes: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          passing_score_percentage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          passing_score_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          passing_score_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quizzes_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: true;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          }
        ];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          order_index: number;
          question_text: string;
          audio_url: string | null;
          image_url: string | null;
          options: Json;
          correct_option_id: string;
          explanation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          order_index?: number;
          question_text: string;
          audio_url?: string | null;
          image_url?: string | null;
          options: Json;
          correct_option_id: string;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          order_index?: number;
          question_text?: string;
          audio_url?: string | null;
          image_url?: string | null;
          options?: Json;
          correct_option_id?: string;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_questions_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          }
        ];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          status: EnrollmentStatus;
          receipt_url: string;
          transaction_id: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          approved_at: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          status?: EnrollmentStatus;
          receipt_url: string;
          transaction_id: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          approved_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          status?: EnrollmentStatus;
          receipt_url?: string;
          transaction_id?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          approved_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'enrollments_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enrollments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      lesson_progress: {
        Row: {
          id: string;
          enrollment_id: string;
          lesson_id: string;
          user_id: string;
          watch_percentage: number;
          video_completed: boolean;
          video_watched: boolean;
          quiz_unlocked: boolean;
          quiz_passed: boolean;
          is_completed: boolean;
          is_unlocked: boolean;
          unlock_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          lesson_id: string;
          user_id: string;
          watch_percentage?: number;
          video_completed?: boolean;
          video_watched?: boolean;
          quiz_unlocked?: boolean;
          quiz_passed?: boolean;
          is_completed?: boolean;
          is_unlocked?: boolean;
          unlock_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          lesson_id?: string;
          user_id?: string;
          watch_percentage?: number;
          video_completed?: boolean;
          video_watched?: boolean;
          quiz_unlocked?: boolean;
          quiz_passed?: boolean;
          is_completed?: boolean;
          is_unlocked?: boolean;
          unlock_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lesson_progress_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lesson_progress_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lesson_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          lesson_id: string;
          enrollment_id: string;
          user_id: string;
          student_id: string | null;
          score: number | null;
          score_percentage: number;
          passed: boolean;
          answers: Json;
          attempt_number: number;
          submitted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          lesson_id: string;
          enrollment_id: string;
          user_id: string;
          student_id?: string | null;
          score?: number | null;
          score_percentage?: number;
          passed: boolean;
          answers: Json;
          attempt_number?: number;
          submitted_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          lesson_id?: string;
          enrollment_id?: string;
          user_id?: string;
          student_id?: string | null;
          score?: number | null;
          score_percentage?: number;
          passed?: boolean;
          answers?: Json;
          attempt_number?: number;
          submitted_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_attempts_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_attempts_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      certificates: {
        Row: {
          id: string;
          certificate_id: string;
          user_id: string;
          course_id: string;
          student_name: string;
          course_title: string;
          issued_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          certificate_id: string;
          user_id: string;
          course_id: string;
          student_name: string;
          course_title: string;
          issued_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          certificate_id?: string;
          user_id?: string;
          course_id?: string;
          student_name?: string;
          course_title?: string;
          issued_at?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'certificates_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'certificates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      student_quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          order_index: number;
          question_text: string;
          audio_url: string | null;
          image_url: string | null;
          options: Json;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      complete_lesson_and_schedule_next: {
        Args: {
          p_enrollment_id: string;
          p_lesson_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      update_active_session: {
        Args: {
          p_session_token: string;
        };
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
      course_category: CourseCategory;
      enrollment_status: EnrollmentStatus;
    };
  };
}
