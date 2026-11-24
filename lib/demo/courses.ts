import type { CatalogCourse } from '@/components/courses/CourseCatalog';
import type { LessonWithClientData } from '@/components/learning/LearningPortalView';
import type { Course } from '@/types';

export const DEMO_PREVIEW_COURSES: CatalogCourse[] = [
  {
    id: 'demo-kids-1',
    title: 'Fun English Phonics & Cartoon Adventures (Ages 5–12)',
    slug: 'fun-english-phonics',
    description:
      'Interactive audio-visual storytelling, phonics, vocabulary games, and picture quizzes designed especially for young stars.',
    category: 'kids',
    price: 1500,
    is_published: true,
    thumbnail_url:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
    intro_video_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lessons: [{ count: 7 }],
  },
  {
    id: 'demo-kids-2',
    title: 'Little Math Wizards: Numbers, Shapes & Audio Riddles',
    slug: 'little-math-wizards',
    description:
      'Delightful early childhood math adventure with voice-guided problem solving, colorful tap-and-learn picture puzzles, and reward stars.',
    category: 'kids',
    price: 1800,
    is_published: true,
    thumbnail_url:
      'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&auto=format&fit=crop&q=80',
    intro_video_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lessons: [{ count: 10 }],
  },
  {
    id: 'demo-adults-1',
    title: 'Modern Full-Stack Web Development Bootcamp',
    slug: 'modern-fullstack-bootcamp',
    description:
      'Master Next.js 15, TypeScript, PostgreSQL, and Supabase with sequential daily video milestones, server-graded quizzes, and digital certificates.',
    category: 'adults',
    price: 3500,
    is_published: true,
    thumbnail_url:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    intro_video_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lessons: [{ count: 14 }],
  },
  {
    id: 'demo-adults-2',
    title: 'Executive Professional English & Business Communication',
    slug: 'executive-business-english',
    description:
      'Advance your corporate career with mastery in executive email writing, interview fluency, negotiation tactics, and business presentation skills.',
    category: 'adults',
    price: 2800,
    is_published: true,
    thumbnail_url:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
    intro_video_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lessons: [{ count: 8 }],
  },
];

export function getDemoLessonsForCourse(courseId: string): LessonWithClientData[] {
  const isKids = courseId.includes('kids');

  return [
    {
      id: `${courseId}-lesson-1`,
      dayNumber: 1,
      title: isKids ? 'Day 1: Magic Alphabet & Phonics Song' : 'Day 1: Modern Full-Stack Setup & Architecture',
      description: isKids
        ? 'Sing along with funny phonics, learn letter sounds, and play the picture riddle game.'
        : 'Get hands-on with Next.js 15 App Router, TypeScript, Supabase SSR, and Tailwind CSS design principles.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationSeconds: 300,
      isUnlocked: true,
      unlockAt: new Date().toISOString(),
      isLockedByTime: false,
      isCompleted: false,
      videoWatched: false,
      quizPassed: false,
      quizId: `quiz-${courseId}-1`,
      questions: isKids
        ? [
            {
              id: 'q1',
              quiz_id: `quiz-${courseId}-1`,
              order_index: 1,
              question_text: 'Which letter starts the word "Apple"? 🍎',
              audio_url: null,
              image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80',
              options: [
                { id: 'opt_a', text: 'Letter A' },
                { id: 'opt_b', text: 'Letter B' },
                { id: 'opt_c', text: 'Letter C' },
              ],
              created_at: new Date().toISOString(),
            },
            {
              id: 'q2',
              quiz_id: `quiz-${courseId}-1`,
              order_index: 2,
              question_text: 'What sound does a Cat make? 🐱',
              audio_url: null,
              image_url: null,
              options: [
                { id: 'opt_meow', text: 'Meow! Meow!' },
                { id: 'opt_woof', text: 'Woof! Woof!' },
                { id: 'opt_quack', text: 'Quack! Quack!' },
              ],
              created_at: new Date().toISOString(),
            },
          ]
        : [
            {
              id: 'q1',
              quiz_id: `quiz-${courseId}-1`,
              order_index: 1,
              question_text: 'What is the default rendering paradigm in Next.js App Router?',
              audio_url: null,
              image_url: null,
              options: [
                { id: 'opt_rsc', text: 'React Server Components (RSC)' },
                { id: 'opt_spa', text: 'Single Page Client-Side SPA' },
                { id: 'opt_ssg', text: 'Static HTML only' },
              ],
              created_at: new Date().toISOString(),
            },
            {
              id: 'q2',
              quiz_id: `quiz-${courseId}-1`,
              order_index: 2,
              question_text: 'Which Supabase package is recommended for Next.js SSR with Cookie handling?',
              audio_url: null,
              image_url: null,
              options: [
                { id: 'opt_ssr', text: '@supabase/ssr' },
                { id: 'opt_auth_helpers', text: '@supabase/auth-helpers-nextjs' },
                { id: 'opt_plain', text: '@supabase/supabase-js alone' },
              ],
              created_at: new Date().toISOString(),
            },
          ],
    },
    {
      id: `${courseId}-lesson-2`,
      dayNumber: 2,
      title: isKids ? 'Day 2: Animal Friends & Voice Riddles' : 'Day 2: Server Actions & Authentication State',
      description: 'Scheduled sequential lesson unlocked automatically via drip schedule.',
      videoUrl: null,
      durationSeconds: 420,
      isUnlocked: false,
      unlockAt: new Date(Date.now() + 86400000).toISOString(),
      isLockedByTime: true,
      isCompleted: false,
      videoWatched: false,
      quizPassed: false,
      quizId: `quiz-${courseId}-2`,
      questions: [],
    },
  ];
}
