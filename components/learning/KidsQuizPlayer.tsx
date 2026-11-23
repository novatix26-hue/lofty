'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlayCircle,
  Star,
  Award,
  Loader2,
  Clock,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';
import { submitQuiz, type QuizSubmissionResponse } from '@/app/actions/learning';
import type { StudentQuizQuestion, QuizOption } from '@/types';

interface KidsQuizPlayerProps {
  lessonId: string;
  dayNumber: number;
  questions: StudentQuizQuestion[];
  initialQuizPassed?: boolean;
  onReviewVideoClick?: () => void;
  onLessonPassed?: () => void;
}

export function KidsQuizPlayer({
  lessonId,
  dayNumber,
  questions,
  initialQuizPassed = false,
  onReviewVideoClick,
  onLessonPassed,
}: KidsQuizPlayerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [gradingResult, setGradingResult] = useState<QuizSubmissionResponse | null>(
    initialQuizPassed
      ? {
          success: true,
          passed: true,
          score: 100,
          correctCount: questions.length,
          totalQuestions: questions.length,
        }
      : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Play audio voiceover prompt
  function handlePlayAudio(questionId: string, audioUrl: string) {
    try {
      setIsPlayingAudio(questionId);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(null);
      audio.onerror = () => setIsPlayingAudio(null);
      audio.play().catch(() => setIsPlayingAudio(null));
    } catch {
      setIsPlayingAudio(null);
    }
  }

  // Option selection
  function handleSelectOption(questionId: string, optionId: string) {
    if (gradingResult?.passed) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setErrorMessage(null);
  }

  // Quiz submission
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setErrorMessage(
        `Please answer all ${questions.length} questions before submitting!`
      );
      return;
    }

    startTransition(async () => {
      const res = await submitQuiz(lessonId, answers);
      if (res.success) {
        setGradingResult(res);
        if (res.passed) {
          onLessonPassed?.();
        }
      } else {
        setErrorMessage(res.error || 'Quiz submission failed. Please try again.');
      }
    });
  }

  function handleRetake() {
    setAnswers({});
    setGradingResult(null);
    setErrorMessage(null);
  }

  // --- PASS SCREEN (Score >= 70%) ---
  if (gradingResult?.passed) {
    return (
      <div className="relative overflow-hidden rounded-[36px] border-4 border-amber-300 bg-gradient-to-b from-purple-500 via-pink-500 to-amber-400 p-8 sm:p-12 text-center text-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Floating Confetti Stars */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <Star className="h-10 w-10 text-amber-300 fill-amber-300 animate-bounce" />
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur border-2 border-white/40 shadow-inner">
            <Award className="h-10 w-10 text-amber-200 fill-amber-300 animate-pulse" />
          </div>
          <Star className="h-10 w-10 text-amber-300 fill-amber-300 animate-bounce delay-150" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-white/25 px-5 py-1.5 text-xs font-display font-black uppercase tracking-wider backdrop-blur border border-white/30">
          <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
          <span>SUPERSTAR LEARNER!</span>
        </span>

        <h2 className="mt-4 font-display text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
          YOU PASSED DAY {dayNumber}! 🎉
        </h2>

        <div className="mt-5 inline-flex items-baseline gap-3 rounded-3xl bg-white/25 px-8 py-3.5 backdrop-blur shadow-inner border border-white/30">
          <span className="text-sm font-display font-bold text-white/90">Your Score:</span>
          <span className="font-display text-4xl font-black text-amber-300">
            {gradingResult.score}%
          </span>
          <span className="text-xs font-bold text-white/90">
            ({gradingResult.correctCount}/{gradingResult.totalQuestions} correct)
          </span>
        </div>

        <p className="mt-4 max-w-md mx-auto text-xs sm:text-sm text-white font-semibold leading-relaxed">
          Incredible job! You unlocked today&apos;s victory badge. Day {dayNumber + 1} unlocks tomorrow at midnight (12:00 AM PKT).
        </p>

        {/* Next Drip Unlock Card */}
        <div className="mt-6 rounded-2xl bg-white/20 p-4 backdrop-blur max-w-sm mx-auto border border-white/30 text-xs">
          <div className="flex items-center justify-center gap-1.5 font-display font-black text-amber-200 uppercase">
            <Clock className="h-4 w-4" />
            <span>Next Adventure Milestone</span>
          </div>
          <p className="mt-1 font-display font-bold text-white text-sm">
            Tomorrow at 12:00 AM (Midnight PKT)
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {onReviewVideoClick && (
            <button
              type="button"
              onClick={onReviewVideoClick}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/20 px-5 py-3 text-xs font-display font-bold text-white hover:bg-white/30 transition-all shadow-sm border border-white/30"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Watch Video Again</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRetake}
            className="btn-3d-amber px-7 py-3 text-sm text-amber-950 font-display font-black"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            <span>Play Quiz Again</span>
          </button>
        </div>
      </div>
    );
  }

  // --- FAIL SCREEN (Score < 70%) ---
  if (gradingResult && !gradingResult.passed) {
    return (
      <div className="rounded-[36px] border-3 border-amber-300 bg-amber-50 p-8 text-center shadow-lg space-y-4 animate-in fade-in duration-300">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-200 text-amber-800 shadow-inner">
          <RotateCcw className="h-8 w-8 stroke-[2.5]" />
        </div>

        <div>
          <span className="rounded-full bg-amber-200 px-3.5 py-1 text-xs font-display font-black text-amber-900 uppercase">
            Almost There! Keep Going!
          </span>
          <h3 className="mt-2 font-display text-3xl font-black text-slate-900">
            Score: {gradingResult.score}%
          </h3>
          <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-600 max-w-md mx-auto">
            You got {gradingResult.correctCount} of {gradingResult.totalQuestions} questions right. You need at least <strong className="text-purple-700">70%</strong> to pass and unlock the next lesson.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          {onReviewVideoClick && (
            <button
              type="button"
              onClick={onReviewVideoClick}
              className="inline-flex items-center gap-2 rounded-2xl bg-white border-2 border-amber-300 px-5 py-3 text-xs font-display font-bold text-slate-700 hover:bg-amber-100 transition-colors shadow-xs"
            >
              <PlayCircle className="h-4 w-4 text-amber-600" />
              <span>Review Video First</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRetake}
            className="btn-3d-purple px-6 py-3 text-xs font-display font-black"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            <span>Try Quiz Again! 🚀</span>
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE KIDS QUIZ QUESTIONS ---
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-[28px] border-3 border-purple-200 bg-gradient-to-r from-purple-100 via-pink-50 to-amber-50 p-5 sm:p-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-300">
            <Sparkles className="h-6 w-6 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <h3 className="font-display text-lg font-black text-purple-950">
              Day {dayNumber} Quiz Time!
            </h3>
            <p className="text-xs font-bold text-purple-700">Listen, tap the pictures, and earn stars!</p>
          </div>
        </div>
        <span className="rounded-full bg-white px-3.5 py-1 text-xs font-display font-black text-purple-800 shadow-xs border border-purple-200">
          Goal: &ge;70%
        </span>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
          <XCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Questions Stack */}
      <div className="space-y-8">
        {questions.map((q, qIndex) => {
          const opts = (q.options as unknown as QuizOption[]) || [];
          const selectedOptionId = answers[q.id];

          return (
            <div
              key={q.id}
              className="rounded-[32px] border-3 border-amber-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5"
            >
              {/* Question Header & Prompt */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-purple-600 font-display font-black text-sm text-white shadow-xs">
                      {qIndex + 1}
                    </span>
                    <span className="font-display text-xs font-black text-purple-700 uppercase tracking-wider">
                      Question {qIndex + 1} of {questions.length}
                    </span>
                  </div>

                  <h4 className="font-display text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {q.question_text}
                  </h4>
                </div>

                {/* Big Audio Speaker Button (Kids Special Feature) */}
                {q.audio_url && (
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(q.id, q.audio_url!)}
                    className={`btn-3d-amber px-5 py-2.5 text-xs font-display font-black shrink-0 ${
                      isPlayingAudio === q.id
                        ? 'ring-4 ring-amber-300 animate-pulse'
                        : ''
                    }`}
                  >
                    <Volume2 className="h-5 w-5 mr-1.5" />
                    <span>{isPlayingAudio === q.id ? 'Listening...' : 'Listen Sound 🔊'}</span>
                  </button>
                )}
              </div>

              {/* Question Illustration Image (if present) */}
              {q.image_url && (
                <div className="relative aspect-video max-w-sm overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50">
                  <Image
                    src={q.image_url}
                    alt="Question image"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}

              {/* Tappable Tactile 3D Option Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                {opts.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`group relative flex flex-col items-center justify-between rounded-3xl p-5 text-center transition-all ${
                        isSelected
                          ? 'border-3 border-b-6 border-purple-600 bg-purple-50 shadow-md translate-y-1'
                          : 'border-3 border-b-6 border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/30 active:border-b-2 active:translate-y-1'
                      }`}
                    >
                      {/* Option Image Thumbnail for young kids */}
                      {opt.image_url && (
                        <div className="relative h-32 w-full max-w-[150px] overflow-hidden rounded-2xl border border-slate-100 bg-white mb-3 shadow-xs">
                          <Image
                            src={opt.image_url}
                            alt={opt.text || 'Choice picture'}
                            fill
                            className="object-contain p-2 group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      <span
                        className={`font-display text-base font-black ${
                          isSelected ? 'text-purple-950' : 'text-slate-800'
                        }`}
                      >
                        {opt.text}
                      </span>

                      {/* Selected checkmark pill */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chunky 3D Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="btn-3d-purple w-full py-4 text-base font-display font-black tracking-wide"
        >
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2 text-amber-300 fill-amber-300" />
              <span>Submit My Answers & Check Score! ⭐</span>
              <ArrowRight className="h-5 w-5 ml-2 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
