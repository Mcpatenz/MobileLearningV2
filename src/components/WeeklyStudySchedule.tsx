import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ClipboardList,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  MapPin,
  Filter,
} from 'lucide-react';
import type { WeeklyScheduleEvent, WeeklyStudyScheduleData } from '../types/lms';

export interface WeeklyStudyScheduleProps {
  scheduleData?: WeeklyStudyScheduleData | null;
  loading?: boolean;
  onOpenAssignment?: (assignmentId: number) => void;
  onOpenQuiz?: (quizId: number) => void;
  onOpenExam?: (examId: number) => void;
}

export const WeeklyStudySchedule: React.FC<WeeklyStudyScheduleProps> = ({
  scheduleData,
  loading = false,
  onOpenAssignment,
  onOpenQuiz,
  onOpenExam,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number | null>(null);

  // Generate 7 days of the active week from Monday
  const weekDays = useMemo(() => {
    const baseDate = scheduleData?.start_date
      ? new Date(scheduleData.start_date)
      : (() => {
          const d = new Date();
          const day = d.getDay();
          const diff = day === 0 ? -6 : 1 - day;
          d.setDate(d.getDate() + diff);
          d.setHours(0, 0, 0, 0);
          return d;
        })();

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullDayNames = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const current = new Date(baseDate);
      current.setDate(baseDate.getDate() + i);
      const isoStr = current.toISOString().split('T')[0];
      days.push({
        index: i,
        name: dayNames[i],
        fullName: fullDayNames[i],
        dateNum: current.getDate(),
        monthName: current.toLocaleDateString('en-US', { month: 'short' }),
        isoStr,
        isToday: isoStr === todayStr,
      });
    }
    return days;
  }, [scheduleData?.start_date]);

  // Filter events
  const allEvents = scheduleData?.events || [];

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      // Category filter
      if (selectedCategory === 'assignments' && ev.type !== 'assignment') return false;
      if (selectedCategory === 'exams' && ev.type !== 'exam' && ev.type !== 'quiz') return false;
      if (selectedCategory === 'classes' && ev.type !== 'class_session') return false;
      if (selectedCategory === 'study' && ev.type !== 'study_block') return false;

      // Day filter
      if (selectedDayOffset !== null) {
        const targetDay = weekDays[selectedDayOffset];
        if (targetDay && ev.date !== targetDay.isoStr) return false;
      }

      return true;
    });
  }, [allEvents, selectedCategory, selectedDayOffset, weekDays]);

  // Group events by date
  const eventsByDay = useMemo(() => {
    const map = new Map<string, WeeklyScheduleEvent[]>();
    weekDays.forEach((d) => map.set(d.isoStr, []));

    allEvents.forEach((ev) => {
      if (map.has(ev.date)) {
        map.get(ev.date)!.push(ev);
      }
    });

    return map;
  }, [allEvents, weekDays]);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'assignment':
        return {
          icon: ClipboardList,
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
          tag: 'Assignment Due',
        };
      case 'exam':
        return {
          icon: GraduationCap,
          bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
          tag: 'Dept Exam',
        };
      case 'quiz':
        return {
          icon: BookOpen,
          bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25',
          tag: 'Timed Quiz',
        };
      case 'study_block':
        return {
          icon: Sparkles,
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
          tag: 'Study Time',
        };
      default:
        return {
          icon: Clock,
          bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
          tag: 'Class Period',
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
                Weekly Study Schedule
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Time Manager
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {scheduleData?.week_label || 'Current Week Schedule'} · Upcoming coursework & deadlines
            </p>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <strong>{scheduleData?.assignments_due_count ?? 2}</strong> Assignments Due
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            <strong>{scheduleData?.exams_quizzes_count ?? 2}</strong> Assessments
          </span>
        </div>
      </div>

      {/* 7-Day Interactive Week Bar */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((d) => {
          const dayItems = eventsByDay.get(d.isoStr) || [];
          const hasExam = dayItems.some((e) => e.type === 'exam' || e.type === 'quiz');
          const hasAssignment = dayItems.some((e) => e.type === 'assignment');
          const isSelected = selectedDayOffset === d.index;

          return (
            <button
              key={d.isoStr}
              type="button"
              onClick={() => setSelectedDayOffset(isSelected ? null : d.index)}
              className={`p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
                isSelected
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md'
                  : d.isToday
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold opacity-75">
                {d.name}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono my-0.5">
                {d.dateNum}
              </span>
              <div className="flex items-center gap-1 h-2">
                {hasExam && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                {hasAssignment && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {!hasExam && !hasAssignment && dayItems.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Category Filter Chips & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'assignments', label: 'Assignments Due' },
            { id: 'exams', label: 'Exams & Quizzes' },
            { id: 'classes', label: 'Class Times' },
            { id: 'study', label: 'Study Blocks' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {selectedDayOffset !== null && (
          <button
            type="button"
            onClick={() => setSelectedDayOffset(null)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-mono"
          >
            Show full week ({weekDays[selectedDayOffset].fullName} selected)
          </button>
        )}
      </div>

      {/* Events Agenda List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-1">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              No tasks scheduled for this selection
            </p>
            <p className="text-xs text-slate-500">
              You are all caught up! Select another day or clear the filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredEvents.map((ev) => {
              const badge = getEventBadge(ev.type);
              const Icon = badge.icon;
              const isUrgent = ev.priority === 'high';

              return (
                <div
                  key={ev.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 ${
                    isUrgent
                      ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${badge.bg}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{badge.tag}</span>
                      </span>

                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{ev.start_time || 'Scheduled'}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {ev.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {ev.subject_code} · {ev.subject_name}
                      </span>
                      {ev.location_or_room && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{ev.location_or_room}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(ev.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>

                    {ev.type === 'assignment' && onOpenAssignment && (
                      <button
                        type="button"
                        onClick={() => onOpenAssignment(Number(String(ev.id).replace(/\D/g, '')))}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                      >
                        View Assignment
                      </button>
                    )}

                    {ev.type === 'quiz' && onOpenQuiz && (
                      <button
                        type="button"
                        onClick={() => onOpenQuiz(Number(String(ev.id).replace(/\D/g, '')))}
                        className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors"
                      >
                        Start Quiz
                      </button>
                    )}

                    {ev.type === 'exam' && onOpenExam && (
                      <button
                        type="button"
                        onClick={() => onOpenExam(Number(String(ev.id).replace(/\D/g, '')))}
                        className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                      >
                        Enter Exam
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
