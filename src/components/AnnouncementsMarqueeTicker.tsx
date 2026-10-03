import React, { useState, useRef } from 'react';
import {
  Megaphone,
  AlertTriangle,
  Wrench,
  Calendar,
  Info,
  ChevronRight,
  X,
  Pause,
  Play,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import type { SchoolAnnouncement } from '../types/lms';

export interface AnnouncementsMarqueeTickerProps {
  announcements: SchoolAnnouncement[];
  loading?: boolean;
}

export const AnnouncementsMarqueeTicker: React.FC<AnnouncementsMarqueeTickerProps> = ({
  announcements,
  loading = false,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<SchoolAnnouncement | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || announcements.length === 0) {
    return null;
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'urgent':
        return {
          icon: AlertTriangle,
          badgeBg: 'bg-rose-600 text-white animate-pulse',
          label: 'URGENT UPDATE',
        };
      case 'maintenance':
        return {
          icon: Wrench,
          badgeBg: 'bg-amber-500 text-slate-950 font-bold',
          label: 'MAINTENANCE',
        };
      case 'academic':
        return {
          icon: Calendar,
          badgeBg: 'bg-blue-600 text-white',
          label: 'ACADEMIC NOTICE',
        };
      default:
        return {
          icon: Info,
          badgeBg: 'bg-emerald-600 text-white',
          label: 'CAMPUS NEWS',
        };
    }
  };

  const hasUrgent = announcements.some((a) => a.category === 'urgent');

  return (
    <>
      {/* Marquee Ticker Container */}
      <div
        className={`w-full rounded-2xl border transition-all duration-300 relative overflow-hidden ${
          hasUrgent
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 gap-3">
          {/* Static Left Badge & Icon */}
          <div className="flex items-center gap-2 shrink-0 z-10">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold font-mono uppercase tracking-wider shadow-xs ${
                hasUrgent
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 fill-current" />
              <span>Announcements</span>
            </span>
          </div>

          {/* Scrolling Marquee Rail */}
          <div
            className="flex-1 overflow-hidden relative cursor-pointer group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className={`flex items-center whitespace-nowrap gap-12 transition-transform ${
                isPaused ? '' : 'animate-marquee'
              }`}
              style={{
                animationDuration: `${Math.max(25, announcements.length * 15)}s`,
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              {/* Duplicate announcement array for seamless continuous infinite looping */}
              {[...announcements, ...announcements].map((ann, idx) => {
                const badge = getCategoryBadge(ann.category);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={`${ann.id}_${idx}`}
                    onClick={() => setSelectedAnnouncement(ann)}
                    className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity"
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${badge.badgeBg}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-xs sm:text-sm font-semibold truncate max-w-sm sm:max-w-md">
                      {ann.title}
                    </span>

                    <span className="text-[11px] opacity-75 font-mono hidden sm:inline">
                      · {ann.author_name}
                    </span>

                    <span className="text-xs text-emerald-400 group-hover:underline flex items-center gap-0.5 ml-1 font-medium">
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls: Play/Pause and Dismiss */}
          <div className="flex items-center gap-1 shrink-0 z-10 pl-1 border-l border-slate-300/30 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              title={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Dismiss announcement ticker for this session"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal for Clicked Announcement */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      getCategoryBadge(selectedAnnouncement.category).badgeBg
                    }`}
                  >
                    {getCategoryBadge(selectedAnnouncement.category).label}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(selectedAnnouncement.posted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                  {selectedAnnouncement.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <p className="whitespace-pre-line text-sm">{selectedAnnouncement.message}</p>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Issued by: {selectedAnnouncement.author_name}</span>
                <span>Target: {selectedAnnouncement.broadcast_to}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-semibold text-xs"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
