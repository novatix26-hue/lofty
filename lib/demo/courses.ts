import type { CatalogCourse } from '@/components/courses/CourseCatalog';

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lessons: [{ count: 8 }],
  },
];
