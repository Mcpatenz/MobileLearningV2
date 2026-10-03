import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  AlertTriangle,
  GraduationCap,
  ClipboardList,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  Flame,
  X,
} from 'lucide-react';
import type { MonthlyLearningIntensity, DayIntensityData } from '../types/lms';

export interface LearningIntensityHeatmapProps {
  intensityData?: MonthlyLearningIntensity | null;
  loading?: boolean;
}

export const LearningIntensityHeatmap: React.FC<LearningIntensityHeatmapProps> = ({
  intensityData,
  loading = false,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayIntensityData | null>(null);

  if (!intensityData) {
    return null;
  }

  const {
    month_name,
    year,
    days,
    total_study_minutes,
    total_deadlines,
    peak_intensity_day,
    active_study_days,
  } = intensityData;

  // Day names header (Monday-first standard)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate day-of-week offset for first day of month (0 Sunday -> 6, 1 Monday -> 0)
  const firstDay = days.length > 0 ? days[0].day_of_week : 1;
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  // Format hours
  const formatHours = (mins: number) => {
    const h = (mins / 60).toFixed(1);
    return `${h} hrs`;
  };

  // Color mapper for intensity tiers (0 to 4)
  const getCellClasses = (level: number, isSelected: boolean) => {
    const selectedRing = isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 z-10' : '';
    switch (level) {
      case 4:
        return `bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold border-emerald-700 shadow-xs ${selectedRing}`;
      case 3:
        return `bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white border-emerald-600 ${selectedRing}`;
      case 2:
        return `bg-emerald-400/80 text-slate-900 dark:bg-emerald-800 dark:text-emerald-100 border-emerald-400/40 ${selectedRing}`;
      case 1:
        return `bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 ${selectedRing}`;
      default:
        return `bg-slate-100/70 text-slate-500 dark:bg-slate-800/40 dark:text-slate-500 border-slate-200/50 dark:border-slate-800/50 ${selectedRing}`;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header with Title and Month Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
                Learning Intensity Heatmap
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                {month_name} {year}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribution of module deadlines, assessments, and study activity over the month
            </p>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <strong>{formatHours(total_study_minutes)}</strong> Focus Recorded
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <strong>{active_study_days}</strong> Active Days
          </span>
        </div>
      </div>

      {/* Main Heatmap Grid & Legend */}
      <div className="space-y-3">
        {/* Day of Week Labels */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {dayLabels.map((lbl) => (
            <span
              key={lbl}
              className="text-[11px] font-mono uppercase text-slate-400 font-semibold"
            >
              {lbl}
            </span>
          ))}
        </div>

        {/* Month Heatmap Calendar Matrix */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div
              key={`empty_${i}`}
              className="aspect-square rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-transparent"
            />
          ))}

          {/* Actual days in month */}
          {days.map((d) => {
            const isSelected = selectedDay?.date === d.date;
            const hasDeadlines = d.deadlines_count > 0;
            const hasExam = d.events.some((e) => e.type === 'exam');

            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : d)}
                className={`relative aspect-square rounded-xl border flex flex-col items-center justify-between p-1 sm:p-1.5 transition-all ${getCellClasses(
                  d.intensity_level,
                  isSelected
                )} hover:scale-105 cursor-pointer`}
                title={`${d.date}: ${d.study_minutes}m study, ${d.deadlines_count} deadlines`}
              >
                <span className="text-[10px] sm:text-xs font-mono font-bold leading-none">
                  {d.day_of_month}
                </span>

                {/* Event Marker Dots */}
                <div className="flex items-center gap-0.5 h-1.5">
                  {hasExam && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-2xs" />
                  )}
                  {hasDeadlines && !hasExam && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-2xs" />
                  )}
                  {d.study_minutes > 0 && (
                    <span className="w-1 h-1 rounded-full bg-current opacity-70" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Intensity Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>Intensity:</span>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              <span>None</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300" />
              <span>Light</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-emerald-400 dark:bg-emerald-800" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 dark:bg-emerald-600" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 dark:bg-emerald-500 font-bold" />
              <span>Peak / Deadlines</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Assignment Due</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Exam Date</span>
            </span>
          </div>
        </div>
      </div>

      {/* Selected Day Inspection Card */}
      {selectedDay && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                  Tier {selectedDay.intensity_level} Intensity
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {selectedDay.study_minutes}m Focus · {selectedDay.deadlines_count} Deadlines
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display mt-1">
                {new Date(selectedDay.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedDay.events.length === 0 ? (
            <p className="text-xs text-slate-500">
              No coursework deadlines or focus sessions logged on this day.
            </p>
          ) : (
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/80 space-y-1">
              {selectedDay.events.map((ev, idx) => (
                <div key={idx} className="pt-2 pb-1 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {ev.type === 'exam' ? (
                      <GraduationCap className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : ev.type === 'assignment_due' ? (
                      <ClipboardList className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{ev.title}</p>
                      {ev.detail && <p className="text-[11px] text-slate-500">{ev.detail}</p>}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                    {ev.subject_code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
