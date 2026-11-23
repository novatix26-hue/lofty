-- ==============================================================================
-- LOFTY LMS SEED DATA: For development and testing
-- ==============================================================================

-- 1. Insert Sample Courses (Kids & Adults)
INSERT INTO public.courses (id, title, slug, description, category, price, is_published)
VALUES 
  (
    'a1000000-0000-0000-0000-000000000001',
    'Fun with Phonics & Math: Explorer Level 1',
    'fun-with-phonics-math-level-1',
    'A high-energy, visual learning adventure for curious minds aged 5-8 with cheerful characters and audio hints!',
    'kids',
    49.00,
    true
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'Full-Stack Web Engineering with TypeScript & Next.js',
    'full-stack-web-engineering',
    'A masterclass for adults covering modern architecture, distributed databases, and high-performance server components.',
    'adults',
    199.00,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Sample Lessons for Kids Course (Day 1 and Day 2)
INSERT INTO public.lessons (id, course_id, title, description, day_number, video_url, duration_seconds, is_published)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Day 1: The Magic of Vowel Sounds',
    'Discover the letters A, E, I, O, U through a musical safari adventure.',
    1,
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    300,
    true
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Day 2: Counting Jungle Animals',
    'Count the playful monkeys and colorful toucans in the canopy.',
    2,
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    360,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Kids Quiz for Day 1
INSERT INTO public.quizzes (id, lesson_id, title, passing_score_percentage)
VALUES (
  'd1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'Day 1 Animal Sound Check',
  70.00
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Kids Quiz Questions with Audio and Image Options
INSERT INTO public.quiz_questions (id, quiz_id, order_index, question_text, audio_url, image_url, options, correct_option_id, explanation)
VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    1,
    'Which animal says "Moo" and starts with the letter C?',
    'https://actions.google.com/sounds/v1/animals/cow_moo.ogg',
    'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=400',
    '[
      {"id": "opt_cow", "text": "Cow", "image_url": "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=200"},
      {"id": "opt_dog", "text": "Dog", "image_url": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200"},
      {"id": "opt_cat", "text": "Cat", "image_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200"}
    ]'::jsonb,
    'opt_cow',
    'Great job! Cows say Moo!'
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000001',
    2,
    'How many apples do you see on the tree?',
    'https://actions.google.com/sounds/v1/cartoon/pop.ogg',
    'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    '[
      {"id": "opt_3", "text": "3 Apples"},
      {"id": "opt_5", "text": "5 Apples"},
      {"id": "opt_1", "text": "1 Apple"}
    ]'::jsonb,
    'opt_3',
    'Awesome! There are three red apples!'
  )
ON CONFLICT (id) DO NOTHING;
