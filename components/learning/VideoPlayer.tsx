'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  HelpCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { markVideoWatched } from '@/app/actions/learning';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  durationSeconds: number;
  isKids?: boolean;
  initialVideoWatched?: boolean;
  onQuizUnlocked?: () => void;
  onStartQuizClick?: () => void;
}

export function VideoPlayer({
  lessonId,
  videoUrl,
  durationSeconds,
  isKids = false,
  initialVideoWatched = false,
  onQuizUnlocked,
  onStartQuizClick,
}: VideoPlayerProps) {
  const [videoWatched, setVideoWatched] = useState(initialVideoWatched);
  const [watchPercentage, setWatchPercentage] = useState(initialVideoWatched ? 100 : 0);
  const [isPending, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if standard HTML5 video or iframe embed
  const isDirectVideo =
    videoUrl.endsWith('.mp4') ||
    videoUrl.endsWith('.webm') ||
    videoUrl.endsWith('.ogg') ||
    videoUrl.includes('commondatastorage.googleapis.com') ||
    videoUrl.includes('/storage/v1/object/');

  // Handle HTML5 Video progress tracking
  function handleTimeUpdate() {
    if (videoWatched) return;

    const el = videoRef.current;
    if (!el || !el.duration) return;

    const current = el.currentTime;
    const total = el.duration;
    const pct = Math.min(100, Math.round((current / total) * 100));
    setWatchPercentage(pct);

    if (pct >= 85) {
      triggerMilestone();
    }
  }

  function handleVideoEnded() {
    if (!videoWatched) {
      triggerMilestone();
    }
  }

  function triggerMilestone() {
    if (videoWatched) return;
    setVideoWatched(true);
    setWatchPercentage(100);

    startTransition(async () => {
      const res = await markVideoWatched(lessonId);
      if (res.success) {
        onQuizUnlocked?.();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-md">
        {isDirectVideo ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            className="h-full w-full object-contain"
          />
        ) : (
          <iframe
            src={videoUrl}
            title="Lesson Video Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        )}
      </div>

      {/* Watch Progress Milestone & Quiz Gate Card */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
          videoWatched
            ? 'border-emerald-200 bg-emerald-50/60'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {videoWatched ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Video Watch Requirement Met (85%+)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Quiz Locked</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {videoWatched
                ? 'Great job! You have watched this lesson video. You may now take the quiz to test your mastery.'
                : 'You must watch at least 85% of this video lesson before attempting the quiz.'}
            </p>

            {/* Watch progress tracker */}
            {!videoWatched && (
              <div className="pt-2 max-w-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Watch Progress: {watchPercentage}%</span>
                  <span>Goal: 85%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isKids
                        ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500'
                        : 'bg-sky-600'
                    }`}
                    style={{ width: `${Math.min(100, (watchPercentage / 85) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {!isDirectVideo && !videoWatched && (
              <button
                type="button"
                disabled={isPending}
                onClick={triggerMilestone}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2.5 text-xs font-display font-bold text-slate-700 hover:bg-slate-50 active:scale-98 shadow-xs"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                )}
                <span>I Finished Watching</span>
              </button>
            )}

            {/* Start Quiz Button */}
            <button
              type="button"
              disabled={!videoWatched}
              onClick={onStartQuizClick}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-display font-black transition-all ${
                videoWatched
                  ? isKids
                    ? 'btn-3d-purple animate-bounce'
                    : 'btn-3d-sky'
                  : 'rounded-2xl bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
              }`}
            >
              {videoWatched ? (
                <>
                  <HelpCircle className="h-4 w-4" />
                  <span>{isKids ? 'Start Quiz Now! ⭐' : 'Start Lesson Quiz'}</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Quiz Locked (Watch 85%)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
