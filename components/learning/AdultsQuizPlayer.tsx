'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlayCircle,
  Clock,
  Loader2,
  ArrowRight,
  HelpCircle,
  Check,
} from 'lucide-react';
import { submitQuiz, type QuizSubmissionResponse } from '@/app/actions/learning';
import type { StudentQuizQuestion, QuizOption } from '@/types';

interface AdultsQuizPlayerProps {
  lessonId: string;
  dayNumber: number;
  questions: StudentQuizQuestion[];
  initialQuizPassed?: boolean;
  onReviewVideoClick?: () => void;
  onLessonPassed?: () => void;
}

export function AdultsQuizPlayer({
  lessonId,
  dayNumber,
  questions,
  initialQuizPassed = false,
  onReviewVideoClick,
  onLessonPassed,
}: AdultsQuizPlayerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

  function handleSelectOption(questionId: string, optionId: string) {
    if (gradingResult?.passed) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setErrorMessage(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setErrorMessage(`Please answer all ${questions.length} questions before submitting.`);
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
        setErrorMessage(res.error || 'Quiz evaluation failed. Please try again.');
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
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-xs space-y-5 animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            Day {dayNumber} Milestone Complete
          </span>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Lesson Completed Successfully
          </h2>
          <div className="mt-2 text-xs text-slate-600">
            Final Score: <strong className="text-emerald-700 font-bold">{gradingResult.score}%</strong>{' '}
            ({gradingResult.correctCount} / {gradingResult.totalQuestions} questions correct)
          </div>
        </div>

        {/* Drip Notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 max-w-md mx-auto text-xs space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-700">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Next Sequential Lesson</span>
          </div>
          <p className="text-slate-500">
            Day {dayNumber + 1} will unlock tomorrow at <strong>12:00 AM midnight PKT (Asia/Karachi)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onReviewVideoClick && (
            <button
              type="button"
              onClick={onReviewVideoClick}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Review Video Lesson</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retake Practice Quiz</span>
          </button>
        </div>
      </div>
    );
  }

  // --- FAIL SCREEN (Score < 70%) ---
  if (gradingResult && !gradingResult.passed) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xs space-y-5 animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <XCircle className="h-8 w-8" />
        </div>

        <div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Passing Threshold Not Met
          </span>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Score: {gradingResult.score}%
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            You scored {gradingResult.correctCount} of {gradingResult.totalQuestions} questions correctly. You need at least <strong>70%</strong> to mark this day complete and advance.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onReviewVideoClick && (
            <button
              type="button"
              onClick={onReviewVideoClick}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Review Video Material</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retake Quiz Now</span>
          </button>
        </div>
      </div>
    );
  }

  // --- QUESTIONS LIST ---
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Day {dayNumber} Comprehension Quiz
          </h3>
        </div>
        <span className="text-xs font-medium text-slate-500">
          Required to pass: <strong>70%</strong>
        </span>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          const opts = (q.options as unknown as QuizOption[]) || [];
          const selectedOptionId = answers[q.id];

          return (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3.5 shadow-2xs"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Question {qIndex + 1} of {questions.length}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {q.question_text}
                </h4>
              </div>

              {q.image_url && (
                <div className="relative aspect-video max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <Image src={q.image_url} alt="Question figure" fill className="object-contain p-2" />
                </div>
              )}

              {/* Options Radio List */}
              <div className="space-y-2 pt-1">
                {opts.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span>{opt.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Submit Quiz for Grading</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
