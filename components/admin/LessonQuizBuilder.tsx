'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Plus,
  PlayCircle,
  Clock,
  Sparkles,
  Briefcase,
  HelpCircle,
  Volume2,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Edit,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  type LessonInput,
} from '@/app/actions/lessons';
import {
  saveQuizQuestion,
  deleteQuizQuestion,
  getOrCreateQuiz,
  type QuestionInput,
} from '@/app/actions/quizzes';
import { uploadCourseAsset } from '@/app/actions/upload';
import type { Course, Lesson, Quiz, QuizQuestion, QuizOption } from '@/types';

interface LessonWithQuiz extends Lesson {
  quiz?: (Quiz & { quiz_questions: QuizQuestion[] }) | null;
}

interface LessonQuizBuilderProps {
  course: Course;
  initialLessons: LessonWithQuiz[];
}

export function LessonQuizBuilder({
  course,
  initialLessons,
}: LessonQuizBuilderProps) {
  const [lessons, setLessons] = useState<LessonWithQuiz[]>(initialLessons);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(
    initialLessons[0]?.id || null
  );
  const [isPending, startTransition] = useTransition();

  // --- LESSON MODAL STATE ---
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonFormData, setLessonFormData] = useState<LessonInput>({
    course_id: course.id,
    title: '',
    description: '',
    day_number: 1,
    video_url: '',
    duration_seconds: 300,
    is_published: true,
  });
  const [lessonError, setLessonError] = useState<string | null>(null);

  // --- QUESTION MODAL STATE ---
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [targetQuizId, setTargetQuizId] = useState<string>('');
  const [targetLessonId, setTargetLessonId] = useState<string>('');
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionFormData, setQuestionFormData] = useState<{
    question_text: string;
    audio_url: string;
    image_url: string;
    options: QuizOption[];
    correct_option_id: string;
    explanation: string;
  }>({
    question_text: '',
    audio_url: '',
    image_url: '',
    options: [
      { id: 'opt_1', text: '', image_url: '' },
      { id: 'opt_2', text: '', image_url: '' },
      { id: 'opt_3', text: '', image_url: '' },
    ],
    correct_option_id: 'opt_1',
    explanation: '',
  });

  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const isKidsCourse = course.category === 'kids';

  // Open Lesson Modal
  function handleOpenCreateLesson() {
    setEditingLesson(null);
    const nextDay = lessons.length > 0 ? Math.max(...lessons.map((l) => l.day_number)) + 1 : 1;
    setLessonFormData({
      course_id: course.id,
      title: '',
      description: '',
      day_number: nextDay,
      video_url: '',
      duration_seconds: 300,
      is_published: true,
    });
    setLessonError(null);
    setIsLessonModalOpen(true);
  }

  function handleOpenEditLesson(lesson: Lesson) {
    setEditingLesson(lesson);
    setLessonFormData({
      course_id: course.id,
      title: lesson.title,
      description: lesson.description || '',
      day_number: lesson.day_number,
      video_url: lesson.video_url,
      duration_seconds: lesson.duration_seconds,
      is_published: lesson.is_published,
    });
    setLessonError(null);
    setIsLessonModalOpen(true);
  }

  // Submit Lesson Form
  function handleLessonSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLessonError(null);

    if (!lessonFormData.title.trim()) {
      setLessonError('Lesson title is required');
      return;
    }
    if (!lessonFormData.video_url.trim()) {
      setLessonError('Video URL is required');
      return;
    }

    startTransition(async () => {
      if (editingLesson) {
        const res = await updateLesson(editingLesson.id, course.id, lessonFormData);
        if (res.success && res.lesson) {
          setLessons((prev) =>
            prev.map((l) =>
              l.id === editingLesson.id ? { ...l, ...res.lesson } : l
            )
          );
          setIsLessonModalOpen(false);
        } else {
          setLessonError(res.error || 'Failed to update lesson');
        }
      } else {
        const res = await createLesson(lessonFormData);
        if (res.success && res.lesson) {
          const newLesson: LessonWithQuiz = {
            ...(res.lesson as Lesson),
            quiz: {
              id: 'temp-' + Date.now(),
              lesson_id: res.lesson.id,
              title: `${res.lesson.title} Quiz`,
              passing_score_percentage: 70,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              quiz_questions: [],
            },
          };
          setLessons((prev) => [...prev, newLesson].sort((a, b) => a.day_number - b.day_number));
          setExpandedLessonId(res.lesson.id);
          setIsLessonModalOpen(false);
        } else {
          setLessonError(res.error || 'Failed to create lesson');
        }
      }
    });
  }

  // Delete Lesson
  function handleDeleteLesson(lessonId: string, title: string) {
    if (!confirm(`Are you sure you want to delete Day ${title}? All associated quiz questions will be deleted.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteLesson(lessonId, course.id);
      if (res.success) {
        setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      }
    });
  }

  // Move Lesson Day Number Up/Down
  function handleMoveLesson(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const newLessons = [...lessons];
    const current = newLessons[index];
    const other = newLessons[targetIndex];

    const currentDay = current.day_number;
    current.day_number = other.day_number;
    other.day_number = currentDay;

    newLessons.sort((a, b) => a.day_number - b.day_number);
    setLessons(newLessons);

    startTransition(async () => {
      await reorderLessons(
        course.id,
        newLessons.map((l) => ({ id: l.id, day_number: l.day_number }))
      );
    });
  }

  // --- QUESTION BUILDER ACTIONS ---
  async function handleOpenAddQuestion(lesson: LessonWithQuiz) {
    setEditingQuestion(null);
    setTargetLessonId(lesson.id);

    let quizId = lesson.quiz?.id;
    if (!quizId || quizId.startsWith('temp-')) {
      const quizRes = await getOrCreateQuiz(lesson.id);
      if (quizRes.success && quizRes.quiz) {
        quizId = quizRes.quiz.id;
      }
    }

    setTargetQuizId(quizId || '');
    setQuestionFormData({
      question_text: '',
      audio_url: '',
      image_url: '',
      options: [
        { id: 'opt_1', text: '', image_url: '' },
        { id: 'opt_2', text: '', image_url: '' },
        { id: 'opt_3', text: '', image_url: '' },
      ],
      correct_option_id: 'opt_1',
      explanation: '',
    });
    setQuestionError(null);
    setIsQuestionModalOpen(true);
  }

  function handleOpenEditQuestion(question: QuizQuestion, lessonId: string) {
    setEditingQuestion(question);
    setTargetQuizId(question.quiz_id);
    setTargetLessonId(lessonId);

    const opts = (question.options as unknown as QuizOption[]) || [];
    setQuestionFormData({
      question_text: question.question_text,
      audio_url: question.audio_url || '',
      image_url: question.image_url || '',
      options: opts.length > 0 ? opts : [{ id: 'opt_1', text: '', image_url: '' }, { id: 'opt_2', text: '', image_url: '' }],
      correct_option_id: question.correct_option_id,
      explanation: question.explanation || '',
    });
    setQuestionError(null);
    setIsQuestionModalOpen(true);
  }

  // Handle Audio Upload for Kids Question
  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia('audio');
    setQuestionError(null);

    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadCourseAsset(fd, 'audio');
    setUploadingMedia(null);

    if (res.success && res.url) {
      setQuestionFormData((prev) => ({ ...prev, audio_url: res.url! }));
    } else {
      setQuestionError(res.error || 'Failed to upload audio');
    }
  }

  // Handle Question Image Upload
  async function handleQuestionImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia('question_image');
    setQuestionError(null);

    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadCourseAsset(fd, 'thumbnails');
    setUploadingMedia(null);

    if (res.success && res.url) {
      setQuestionFormData((prev) => ({ ...prev, image_url: res.url! }));
    } else {
      setQuestionError(res.error || 'Failed to upload image');
    }
  }

  // Handle Option Image Upload for Kids Option
  async function handleOptionImageUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(`option_image_${index}`);
    setQuestionError(null);

    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadCourseAsset(fd, 'options');
    setUploadingMedia(null);

    if (res.success && res.url) {
      setQuestionFormData((prev) => {
        const nextOptions = [...prev.options];
        nextOptions[index] = { ...nextOptions[index], image_url: res.url! };
        return { ...prev, options: nextOptions };
      });
    } else {
      setQuestionError(res.error || 'Failed to upload option image');
    }
  }

  // Option array helpers
  function addOption() {
    const nextId = `opt_${questionFormData.options.length + 1}`;
    setQuestionFormData((prev) => ({
      ...prev,
      options: [...prev.options, { id: nextId, text: '', image_url: '' }],
    }));
  }

  function removeOption(index: number) {
    if (questionFormData.options.length <= 2) {
      setQuestionError('A question must have at least 2 options');
      return;
    }
    setQuestionFormData((prev) => {
      const removedId = prev.options[index].id;
      const nextOptions = prev.options.filter((_, i) => i !== index);
      let nextCorrect = prev.correct_option_id;
      if (nextCorrect === removedId) {
        nextCorrect = nextOptions[0]?.id || 'opt_1';
      }
      return { ...prev, options: nextOptions, correct_option_id: nextCorrect };
    });
  }

  // Submit Question
  function handleQuestionSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQuestionError(null);

    if (!questionFormData.question_text.trim()) {
      setQuestionError('Question text is required');
      return;
    }

    const validOptions = questionFormData.options.filter((o) => o.text.trim().length > 0 || o.image_url);
    if (validOptions.length < 2) {
      setQuestionError('Please provide at least 2 valid options with text or image');
      return;
    }

    startTransition(async () => {
      const payload: QuestionInput = {
        id: editingQuestion?.id,
        quiz_id: targetQuizId,
        question_text: questionFormData.question_text,
        audio_url: questionFormData.audio_url || null,
        image_url: questionFormData.image_url || null,
        options: validOptions,
        correct_option_id: questionFormData.correct_option_id,
        explanation: questionFormData.explanation || null,
        course_id: course.id,
      };

      const res = await saveQuizQuestion(payload);
      if (res.success && res.question) {
        const savedQ = res.question as QuizQuestion;
        setLessons((prev) =>
          prev.map((l) => {
            if (l.id === targetLessonId && l.quiz) {
              const existingQuestions = l.quiz.quiz_questions || [];
              const updatedQuestions = editingQuestion
                ? existingQuestions.map((q) => (q.id === savedQ.id ? savedQ : q))
                : [...existingQuestions, savedQ];
              return {
                ...l,
                quiz: {
                  ...l.quiz,
                  quiz_questions: updatedQuestions,
                },
              };
            }
            return l;
          })
        );
        setIsQuestionModalOpen(false);
      } else {
        setQuestionError(res.error || 'Failed to save question');
      }
    });
  }

  // Delete Question
  function handleDeleteQuestion(questionId: string, lessonId: string) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    startTransition(async () => {
      const res = await deleteQuizQuestion(questionId, course.id);
      if (res.success) {
        setLessons((prev) =>
          prev.map((l) => {
            if (l.id === lessonId && l.quiz) {
              return {
                ...l,
                quiz: {
                  ...l.quiz,
                  quiz_questions: (l.quiz.quiz_questions || []).filter((q) => q.id !== questionId),
                },
              };
            }
            return l;
          })
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Back and Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Courses</span>
          </Link>

          <div className="mt-2 flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {course.title}
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isKidsCourse
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-slate-900 text-white'
              }`}
            >
              {isKidsCourse ? (
                <>
                  <Sparkles className="h-3 w-3" />
                  <span>Kids Course (5-12)</span>
                </>
              ) : (
                <>
                  <Briefcase className="h-3 w-3" />
                  <span>Adults Course</span>
                </>
              )}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Ordered daily lessons (Day 1, Day 2...), video watch unlocking (85%), and strict server-graded quizzes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateLesson}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Day Lesson</span>
        </button>
      </div>

      {/* Sequential Lessons List */}
      <div className="space-y-4">
        {lessons.length > 0 ? (
          lessons.map((lesson, index) => {
            const isExpanded = expandedLessonId === lesson.id;
            const questions = lesson.quiz?.quiz_questions || [];

            return (
              <div
                key={lesson.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all"
              >
                {/* Lesson Header Row */}
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/70">
                  <div className="flex items-center gap-3">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={index === 0 || isPending}
                        onClick={() => handleMoveLesson(index, 'up')}
                        title="Move lesson up"
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === lessons.length - 1 || isPending}
                        onClick={() => handleMoveLesson(index, 'down')}
                        title="Move lesson down"
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Day Pill */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">
                      D{lesson.day_number}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                          Day {lesson.day_number}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{lesson.title}</h3>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <PlayCircle className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{lesson.video_url}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{Math.round(lesson.duration_seconds / 60)} mins</span>
                        </span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {questions.length} Quiz Questions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Controls */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditLesson(lesson)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                      title="Edit lesson details"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(lesson.id, `${lesson.day_number}: ${lesson.title}`)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete lesson"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLessonId(isExpanded ? null : lesson.id)
                      }
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
                    >
                      <span>Quiz Builder</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Quiz Editor Section */}
                {isExpanded && (
                  <div className="border-t border-slate-200 p-5 bg-white space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-purple-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Day {lesson.day_number} Quiz Questions (Pass Score: 70%)
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500">
                          {isKidsCourse
                            ? 'Kids Mode: Attach optional narration voiceover and colorful option images.'
                            : 'Students must watch >= 85% of video to unlock this quiz.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddQuestion(lesson)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Question</span>
                      </button>
                    </div>

                    {/* Questions Cards */}
                    {questions.length > 0 ? (
                      <div className="space-y-3">
                        {questions.map((q, qIndex) => {
                          const opts = (q.options as unknown as QuizOption[]) || [];
                          return (
                            <div
                              key={q.id}
                              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                                      {qIndex + 1}
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {q.question_text}
                                    </p>
                                  </div>

                                  {/* Audio Player Preview (Kids feature) */}
                                  {q.audio_url && (
                                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-purple-50 p-2 text-xs text-purple-800 border border-purple-200/60">
                                      <Volume2 className="h-4 w-4 text-purple-600 shrink-0" />
                                      <audio controls src={q.audio_url} className="h-7 w-48 sm:w-64" />
                                      <span className="text-[11px] font-medium text-purple-700 hidden sm:inline">
                                        Kids Audio Prompt
                                      </span>
                                    </div>
                                  )}

                                  {/* Image Illustration */}
                                  {q.image_url && (
                                    <div className="relative mt-2 h-24 w-36 overflow-hidden rounded-lg border border-slate-200">
                                      <Image
                                        src={q.image_url}
                                        alt="Question illustration"
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditQuestion(q, lesson.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                    title="Edit question"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(q.id, lesson.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    title="Delete question"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Options List */}
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                                {opts.map((opt) => {
                                  const isCorrect = opt.id === q.correct_option_id;
                                  return (
                                    <div
                                      key={opt.id}
                                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                                        isCorrect
                                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium'
                                          : 'border-slate-200 bg-white text-slate-700'
                                      }`}
                                    >
                                      {/* Option Image (Kids picture option) */}
                                      {opt.image_url && (
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200">
                                          <Image
                                            src={opt.image_url}
                                            alt={opt.text || 'Option image'}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                      )}

                                      <div className="flex-1 truncate">
                                        <span>{opt.text || '(Picture option)'}</span>
                                      </div>

                                      {isCorrect && (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {q.explanation && (
                                <p className="text-[11px] italic text-slate-500">
                                  Hint / Explanation: {q.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                        No quiz questions created yet for Day {lesson.day_number}.
                        Click &ldquo;Add Question&rdquo; to configure the multiple choice quiz.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <PlayCircle className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              No lessons added yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Start building the curriculum with Day 1 lesson and video content.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateLesson}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Day 1 Lesson</span>
            </button>
          </div>
        )}
      </div>

      {/* --- LESSON MODAL --- */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingLesson ? `Edit Day ${editingLesson.day_number} Lesson` : 'Add New Day Lesson'}
              </h2>
              <button
                type="button"
                onClick={() => setIsLessonModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {lessonError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {lessonError}
              </div>
            )}

            <form onSubmit={handleLessonSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Day Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lessonFormData.day_number}
                    onChange={(e) =>
                      setLessonFormData({
                        ...lessonFormData,
                        day_number: Number(e.target.value),
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Duration (in Seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="30"
                    value={lessonFormData.duration_seconds}
                    onChange={(e) =>
                      setLessonFormData({
                        ...lessonFormData,
                        duration_seconds: Number(e.target.value),
                      })
                    }
                    placeholder="e.g. 300 for 5 mins"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  required
                  value={lessonFormData.title}
                  onChange={(e) =>
                    setLessonFormData({ ...lessonFormData, title: e.target.value })
                  }
                  placeholder="e.g. Magic Vowels or React Server Components Deep Dive"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Video URL * (MP4 / HLS / Embed)
                </label>
                <input
                  type="url"
                  required
                  value={lessonFormData.video_url}
                  onChange={(e) =>
                    setLessonFormData({ ...lessonFormData, video_url: e.target.value })
                  }
                  placeholder="https://commondatastorage.googleapis.com/.../lesson.mp4"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Students must watch at least 85% of this video to unlock the quiz.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Lesson Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={lessonFormData.description}
                  onChange={(e) =>
                    setLessonFormData({ ...lessonFormData, description: e.target.value })
                  }
                  placeholder="Lesson objectives, key takeaways..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingLesson ? 'Save Changes' : 'Create Lesson'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUIZ QUESTION MODAL (Rich Audio & Visual for Kids) --- */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingQuestion ? 'Edit Quiz Question' : 'Add Quiz Question'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isKidsCourse
                    ? 'Kids Course: Configure voiceover audio and picture choices.'
                    : 'Configure question and mark the correct answer option.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {questionError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {questionError}
              </div>
            )}

            <form onSubmit={handleQuestionSubmit} className="mt-5 space-y-5">
              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Question Prompt *
                </label>
                <input
                  type="text"
                  required
                  value={questionFormData.question_text}
                  onChange={(e) =>
                    setQuestionFormData({ ...questionFormData, question_text: e.target.value })
                  }
                  placeholder={
                    isKidsCourse
                      ? 'e.g. Which animal says "Moo"?'
                      : 'e.g. What is the default caching behavior of fetch in Next.js?'
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Kids Audio Voiceover (Upload to Supabase Storage or Paste URL) */}
              {isKidsCourse && (
                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                      <Volume2 className="h-4 w-4 text-purple-600" />
                      <span>Audio Narration Voiceover (Kids 5-12)</span>
                    </label>
                    <span className="text-[11px] text-purple-700">Optional</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-purple-300 bg-white px-3.5 py-2 text-xs font-semibold text-purple-800 hover:bg-purple-100/60 transition-colors">
                      {uploadingMedia === 'audio' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      ) : (
                        <Upload className="h-4 w-4 text-purple-600" />
                      )}
                      <span>{uploadingMedia === 'audio' ? 'Uploading...' : 'Upload Audio (MP3/OGG)'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        disabled={!!uploadingMedia}
                        onChange={handleAudioUpload}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      value={questionFormData.audio_url}
                      onChange={(e) =>
                        setQuestionFormData({ ...questionFormData, audio_url: e.target.value })
                      }
                      placeholder="Or paste audio URL..."
                      className="flex-1 rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {questionFormData.audio_url && (
                    <div className="flex items-center gap-2 pt-1">
                      <audio controls src={questionFormData.audio_url} className="h-8 w-full max-w-sm" />
                      <button
                        type="button"
                        onClick={() => setQuestionFormData({ ...questionFormData, audio_url: '' })}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Question Illustration Image */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <ImageIcon className="h-4 w-4 text-slate-500" />
                  <span>Question Illustration Image (Optional)</span>
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                    {uploadingMedia === 'question_image' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="h-4 w-4 text-slate-500" />
                    )}
                    <span>{uploadingMedia === 'question_image' ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!!uploadingMedia}
                      onChange={handleQuestionImageUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    value={questionFormData.image_url}
                    onChange={(e) =>
                      setQuestionFormData({ ...questionFormData, image_url: e.target.value })
                    }
                    placeholder="Or paste image URL"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {questionFormData.image_url && (
                  <div className="relative mt-2.5 h-24 w-40 overflow-hidden rounded-xl border border-slate-200">
                    <Image
                      src={questionFormData.image_url}
                      alt="Question illustration preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Multiple Choice Options Builder */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Answer Choices & Correct Option *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Select the green radio button corresponding to the single correct option.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addOption}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Choice</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {questionFormData.options.map((opt, optIndex) => {
                    const isCorrect = questionFormData.correct_option_id === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Radio Button marking Correct Option */}
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="correct_option"
                              checked={isCorrect}
                              onChange={() =>
                                setQuestionFormData({
                                  ...questionFormData,
                                  correct_option_id: opt.id,
                                })
                              }
                              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                isCorrect ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {isCorrect ? 'Correct' : `Choice ${optIndex + 1}`}
                            </span>
                          </label>

                          {/* Option Text Input */}
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = [...questionFormData.options];
                              newOpts[optIndex].text = e.target.value;
                              setQuestionFormData({ ...questionFormData, options: newOpts });
                            }}
                            placeholder={`Choice ${optIndex + 1} text...`}
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />

                          {/* Option Image Upload (Kids Feature) */}
                          {isKidsCourse && (
                            <label
                              title="Upload Picture for this choice"
                              className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              {uploadingMedia === `option_image_${optIndex}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                              ) : (
                                <ImageIcon className="h-3.5 w-3.5 text-purple-600" />
                              )}
                              <span className="hidden sm:inline">Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={!!uploadingMedia}
                                onChange={(e) => handleOptionImageUpload(optIndex, e)}
                                className="hidden"
                              />
                            </label>
                          )}

                          {/* Delete Option button */}
                          {questionFormData.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(optIndex)}
                              className="p-1 text-slate-400 hover:text-red-600"
                              title="Remove choice"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Option Image Preview if attached */}
                        {opt.image_url && (
                          <div className="mt-2.5 flex items-center gap-2 pl-6">
                            <div className="relative h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                              <Image
                                src={opt.image_url}
                                alt="Option image"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-[11px] text-slate-500 truncate max-w-xs">
                              {opt.image_url}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = [...questionFormData.options];
                                newOpts[optIndex].image_url = '';
                                setQuestionFormData({ ...questionFormData, options: newOpts });
                              }}
                              className="text-[10px] text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Explanation / Feedback (Shown after attempt)
                </label>
                <input
                  type="text"
                  value={questionFormData.explanation}
                  onChange={(e) =>
                    setQuestionFormData({ ...questionFormData, explanation: e.target.value })
                  }
                  placeholder="e.g. Great job! Cows say Moo and produce nutritious milk."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !!uploadingMedia}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingQuestion ? 'Save Question' : 'Add Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
