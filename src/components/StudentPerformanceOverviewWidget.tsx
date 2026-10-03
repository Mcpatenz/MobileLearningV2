import React from 'react';
import {
  Award,
  TrendingUp,
  FileText,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import type { StudentPerformanceOverview } from '../types/lms';

export interface StudentPerformanceOverviewWidgetProps {
  overview?: StudentPerformanceOverview | null;
  onViewReportCard?: () => void;
  onSelectSubject?: (subjectId: number) => void;
}

export const StudentPerformanceOverviewWidget: React.FC<StudentPerformanceOverviewWidgetProps> = ({
  overview,
  onViewReportCard,
  onSelectSubject,
}) => {
  if (!overview || overview.subjects_evaluated === 0) {
    return null;
  }

  const {
    weighted_average_grade,
    academic_standing,
    subjects,
    highest_grade,
    lowest_grade,
  } = overview;

  // Color scheme based on weighted average grade
  const isHonors = weighted_average_grade >= 90;
  const isHighHonors = weighted_average_grade >= 95;
  const isHighestHonors = weighted_average_grade >= 98;
  const isPassing = weighted_average_grade >= 75;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header with Title and Honors Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
                Performance Overview
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Server Computed
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current weighted average grade across all {overview.subjects_evaluated} enrolled subjects
            </p>
          </div>
        </div>

        {onViewReportCard && (
          <button
            type="button"
            onClick={onViewReportCard}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Official Report Card</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        )}
      </div>

      {/* Main Stat Showcase Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        {/* Left: Big Weighted Average Metric */}
        <div className="md:col-span-4 flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            {/* Circular progress background */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  isHighHonors
                    ? 'text-amber-500'
                    : isHonors
                    ? 'text-emerald-500'
                    : isPassing
                    ? 'text-teal-600'
                    : 'text-rose-500'
                }
                strokeDasharray={`${weighted_average_grade}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                {weighted_average_grade}%
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">GWA</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-500">
              General Weighted Avg
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  isHighestHonors
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                    : isHighHonors
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                    : isHonors
                    ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-500/30'
                    : isPassing
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-500/30'
                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                }`}
              >
                {isHonors ? <Sparkles className="w-3.5 h-3.5 text-amber-500" /> : <Award className="w-3.5 h-3.5" />}
                <span>{academic_standing}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Grade Stats Breakdown */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-5 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
            <p className="text-slate-500 font-mono text-[11px]">Highest Grade</p>
            <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {highest_grade}%
            </p>
            <p className="text-[10px] text-slate-400">Peak Performance</p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
            <p className="text-slate-500 font-mono text-[11px]">Lowest Grade</p>
            <p className="text-base font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">
              {lowest_grade}%
            </p>
            <p className="text-[10px] text-slate-400">Target Area</p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 col-span-2 sm:col-span-1">
            <p className="text-slate-500 font-mono text-[11px]">Status</p>
            <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isPassing ? 'Passed' : 'Needs Review'}</span>
            </p>
            <p className="text-[10px] text-slate-400">DepEd Passing: 75%</p>
          </div>
        </div>
      </div>

      {/* Per-Subject Grade Rows */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Subject-by-Subject Weighted Grade Distribution</span>
          </span>
          <span className="font-mono text-[11px]">DepEd K-12 Transmuted</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((sub) => {
            const subPassed = sub.final_grade >= 75;
            const subHonors = sub.final_grade >= 90;
            return (
              <div
                key={sub.subject_id}
                onClick={() => onSelectSubject?.(sub.subject_id)}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {sub.subject_code}
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      subHonors
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : subPassed
                        ? 'text-slate-900 dark:text-white'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {sub.final_grade}%
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                    {sub.subject_name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sub.honors_status}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      subHonors ? 'bg-emerald-500' : subPassed ? 'bg-teal-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, sub.final_grade))}%` }}
                  />
                </div>

                {/* Micro components breakdown */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span>Asg: {sub.assignment_avg}%</span>
                  <span>Quiz: {sub.quiz_avg}%</span>
                  <span>Exam: {sub.exam_avg}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
