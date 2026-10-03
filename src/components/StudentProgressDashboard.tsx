import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  FileCheck,
  TrendingUp,
  Percent,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  CheckCheck,
  ExternalLink,
  Target,
  FileText,
  Video,
} from 'lucide-react';
import type {
  StudentProgressAnalytics,
  LessonProgressItem,
  QuizScoreItem,
  ExamScoreItem,
  SubjectLessonProgress,
} from '../types/lms';

interface StudentProgressDashboardProps {
  analytics: StudentProgressAnalytics;
  loading?: boolean;
  onRefresh?: () => void;
  onToggleLesson?: (lessonId: number) => Promise<void>;
  onOpenReportCard?: () => void;
  onNavigateToTasks?: (tab: 'assignments' | 'quizzes' | 'exams') => void;
  darkMode?: boolean;
}

const COLORS = {
  emerald: '#059669',
  emeraldLight: '#10b981',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  indigo: '#6366f1',
  rose: '#f43f5e',
  slate: '#64748b',
  slateLight: '#94a3b8',
  slateDark: '#1e293b',
};

const PIE_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

export const StudentProgressDashboard: React.FC<StudentProgressDashboardProps> = ({
  analytics,
  loading = false,
  onRefresh,
  onToggleLesson,
  onOpenReportCard,
  onNavigateToTasks,
  darkMode = false,
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'lessons' | 'quizzes' | 'exams'>('overview');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
  const [togglingLessonId, setTogglingLessonId] = useState<number | null>(null);

  // Subject filtering
  const filteredLessonSubjects =
    selectedSubjectFilter === 'All'
      ? analytics.subjects_lesson_progress
      : analytics.subjects_lesson_progress.filter(
          (s) => s.subject_code === selectedSubjectFilter || String(s.subject_id) === selectedSubjectFilter
        );

  const filteredQuizzes =
    selectedSubjectFilter === 'All'
      ? analytics.quiz_scores
      : analytics.quiz_scores.filter(
          (q) => q.subject_code === selectedSubjectFilter || String(q.subject_id) === selectedSubjectFilter
        );

  const filteredExams =
    selectedSubjectFilter === 'All'
      ? analytics.exam_scores
      : analytics.exam_scores.filter(
          (e) => e.subject_code === selectedSubjectFilter || String(e.subject_id) === selectedSubjectFilter
        );

  const filteredComparisons =
    selectedSubjectFilter === 'All'
      ? analytics.subject_comparisons
      : analytics.subject_comparisons.filter(
          (c) => c.subject_code === selectedSubjectFilter || String(c.subject_id) === selectedSubjectFilter
        );

  // Chart data for Overview: Comparison across subjects
  const overviewChartData = filteredComparisons.map((item) => ({
    name: item.subject_code,
    fullName: item.subject_name,
    'Lesson Completion %': item.lesson_completion_rate,
    'Quiz Average %': item.quiz_avg,
    'Exam Average %': item.exam_avg,
    'Final Grade %': item.final_grade,
  }));

  // Chart data for Lessons: Completed vs Pending count
  const lessonCountChartData = filteredLessonSubjects.map((s) => ({
    name: s.subject_code,
    fullName: s.subject_name,
    Completed: s.completed_lessons,
    Pending: Math.max(0, s.total_lessons - s.completed_lessons),
    Total: s.total_lessons,
    'Completion Rate %': s.completion_rate,
  }));

  // Chart data for Quizzes: Score % vs Passing %
  const quizChartData = filteredQuizzes.map((q) => ({
    name: q.title.length > 22 ? `${q.title.slice(0, 20)}...` : q.title,
    fullTitle: q.title,
    subject: q.subject_code,
    'My Score %': q.percentage !== null ? q.percentage : 0,
    'Passing Threshold %': q.passing_percentage,
    ScorePoints: q.score !== null ? q.score : 0,
    TotalPoints: q.total_points,
    Status: q.status,
    Remark: q.remark,
    isCompleted: q.status === 'Completed',
  }));

  // Chart data for Exams: Score % vs Passing %
  const examChartData = filteredExams.map((e) => ({
    name: e.title.length > 22 ? `${e.title.slice(0, 20)}...` : e.title,
    fullTitle: e.title,
    subject: e.subject_code,
    'My Score %': e.percentage !== null ? e.percentage : 0,
    'Passing Threshold %': e.passing_percentage,
    ScorePoints: e.score !== null ? e.score : 0,
    TotalPoints: e.total_points,
    Status: e.status,
    Remark: e.remark,
    isCompleted: e.status === 'Completed',
  }));

  // Pie chart data for overall balance
  const donutData = [
    { name: 'Completed Lessons', value: analytics.total_lessons_completed },
    {
      name: 'Remaining Lessons',
      value: Math.max(0, analytics.total_lessons_assigned - analytics.total_lessons_completed),
    },
  ];

  const handleLessonCheck = async (lessonId: number) => {
    if (!onToggleLesson || togglingLessonId) return;
    try {
      setTogglingLessonId(lessonId);
      await onToggleLesson(lessonId);
    } finally {
      setTogglingLessonId(null);
    }
  };

  const getGwaBadge = (gwa: number) => {
    if (gwa >= 98) return { label: 'With Highest Honors', color: 'bg-emerald-500 text-white' };
    if (gwa >= 95) return { label: 'With High Honors', color: 'bg-cyan-600 text-white' };
    if (gwa >= 90) return { label: 'With Honors', color: 'bg-indigo-600 text-white' };
    if (gwa >= 75) return { label: 'Passed / Good Standing', color: 'bg-emerald-600 text-white' };
    return { label: 'Academic Intervention', color: 'bg-rose-600 text-white' };
  };

  const gwaBadge = getGwaBadge(analytics.general_weighted_average);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {entry.value}
                {String(entry.name).includes('%') || String(entry.name).includes('Rate') ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Row */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-semibold uppercase tracking-wider">
              Student Visual Analytics
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${gwaBadge.color}`}>
              {gwaBadge.label}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white mt-1">
            Learning Progress & Assessment Mastery
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Visual tracking for assigned curriculum lessons, video lectures, quizzes, and quarterly examinations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onOpenReportCard && (
            <button
              type="button"
              onClick={onOpenReportCard}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Official Form 138</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <BarChart3 className={`w-4 h-4 ${loading ? 'animate-spin' : 'text-emerald-600'}`} />
              <span>Sync Metrics</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Interactive KPI Cards with Recharts Progress Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Lessons Completion */}
        <div
          onClick={() => setActiveView('lessons')}
          className={`cursor-pointer rounded-3xl p-4 sm:p-5 border transition-all ${
            activeView === 'lessons'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Assigned Lessons
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {analytics.overall_lesson_completion_rate}%
            </span>
            <span className="text-xs font-mono text-emerald-600 font-semibold">
              {analytics.total_lessons_completed}/{analytics.total_lessons_assigned} Done
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, analytics.overall_lesson_completion_rate)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Core Modules & Videos</span>
            <span className="font-semibold text-emerald-600">View Lessons &rarr;</span>
          </p>
        </div>

        {/* Card 2: Quiz Average */}
        <div
          onClick={() => setActiveView('quizzes')}
          className={`cursor-pointer rounded-3xl p-4 sm:p-5 border transition-all ${
            activeView === 'quizzes'
              ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Quiz Performance
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {analytics.overall_quiz_average}%
            </span>
            <span className="text-xs font-mono text-cyan-600 font-semibold">
              {analytics.quizzes_passed_count}/{analytics.total_quizzes_count} Passed
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, analytics.overall_quiz_average)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Pass Benchmark: 75%</span>
            <span className="font-semibold text-cyan-600">View Quizzes &rarr;</span>
          </p>
        </div>

        {/* Card 3: Examination Average */}
        <div
          onClick={() => setActiveView('exams')}
          className={`cursor-pointer rounded-3xl p-4 sm:p-5 border transition-all ${
            activeView === 'exams'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Examination Mastery
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {analytics.overall_exam_average}%
            </span>
            <span className="text-xs font-mono text-indigo-600 font-semibold">
              {analytics.exams_passed_count}/{analytics.total_exams_count} Passed
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, analytics.overall_exam_average)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Quarterly Exams</span>
            <span className="font-semibold text-indigo-600">View Exams &rarr;</span>
          </p>
        </div>

        {/* Card 4: General Weighted Average (Form 138) */}
        <div
          onClick={() => setActiveView('overview')}
          className={`cursor-pointer rounded-3xl p-4 sm:p-5 border transition-all ${
            activeView === 'overview'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              General Weighted Avg
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {analytics.general_weighted_average}%
            </span>
            <span className="text-xs font-mono text-amber-600 font-semibold">
              40-30-30 DepEd
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, analytics.general_weighted_average)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Academic Standing</span>
            <span className="font-semibold text-amber-600">Overview &rarr;</span>
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Subject Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeView === 'overview'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Overview & Comparison</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('lessons')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeView === 'lessons'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Assigned Lessons ({analytics.total_lessons_completed}/{analytics.total_lessons_assigned})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('quizzes')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeView === 'quizzes'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Quiz Scores ({analytics.quiz_scores.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('exams')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeView === 'exams'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Examination Scores ({analytics.exam_scores.length})</span>
          </button>
        </div>

        {/* Filter by Subject */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Filter:
          </label>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="All">All Enrolled Subjects</option>
            {analytics.subjects_lesson_progress.map((s) => (
              <option key={s.subject_id} value={s.subject_code}>
                {s.subject_code} — {s.subject_name.slice(0, 24)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: OVERVIEW & COMPARISON DASHBOARD
      ===================================================================== */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Main Comparison Chart: Lessons vs Quizzes vs Exams vs Final Grade */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cross-Subject Performance & Completion Rates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Side-by-side comparison of lesson completion rates, quiz averages, examination scores, and final grades.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Lessons
                </span>
                <span className="flex items-center gap-1.5 text-cyan-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Quizzes
                </span>
                <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Exams
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Final Grade
                </span>
              </div>
            </div>

            <div className="w-full h-80 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewChartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    dy={5}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={75} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Passing 75%', fill: '#f43f5e', fontSize: 10, position: 'right' }} />
                  <Bar dataKey="Lesson Completion %" fill={COLORS.emerald} radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Quiz Average %" fill={COLORS.cyan} radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Exam Average %" fill={COLORS.indigo} radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Final Grade %" fill={COLORS.amber} radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two-Column Detail Cards: Subject Table & Progress Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Subject Mastery Table */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Detailed Subject Mastery Standings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="pb-3 font-semibold">Subject</th>
                      <th className="pb-3 font-semibold text-center">Lessons</th>
                      <th className="pb-3 font-semibold text-center">Quizzes</th>
                      <th className="pb-3 font-semibold text-center">Quarterly Exam</th>
                      <th className="pb-3 font-semibold text-center">Final Grade</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredComparisons.map((c) => (
                      <tr key={c.subject_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {c.subject_code}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {c.subject_name}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-emerald-600">
                          {c.lesson_completion_rate}%
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-cyan-600">
                          {c.quiz_avg}%
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-indigo-600">
                          {c.exam_avg}%
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-900 dark:text-white">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                            {c.final_grade}%
                          </span>
                        </td>
                        <td className="py-3 pl-2 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.final_grade >= 75
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {c.remarks}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overall Learning Distribution Donut */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Curriculum Completion Ratio
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned syllabus lessons completed across all departments.
                </p>
              </div>

              <div className="w-full h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill={COLORS.emerald} />
                      <Cell fill="#cbd5e1" />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {analytics.overall_lesson_completion_rate}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Completed</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed Lessons
                  </span>
                  <span className="font-mono font-bold">{analytics.total_lessons_completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" /> Pending Lessons
                  </span>
                  <span className="font-mono font-bold">
                    {Math.max(0, analytics.total_lessons_assigned - analytics.total_lessons_completed)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: ASSIGNED LESSONS COMPLETION DASHBOARD
      ===================================================================== */}
      {activeView === 'lessons' && (
        <div className="space-y-6">
          {/* Lessons Stacked Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Lesson Completion Breakdown by Subject
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visual breakdown of completed vs remaining assigned lessons per enrolled subject.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" /> Pending
                </span>
              </div>
            </div>

            <div className="w-full h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lessonCountChartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} interval={0} dy={5} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Completed" stackId="a" fill={COLORS.emerald} radius={[0, 0, 4, 4]} maxBarSize={38} />
                  <Bar dataKey="Pending" stackId="a" fill="#cbd5e1" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Module-by-Module & Interactive Lesson Checklist Drilldown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                Assigned Curriculum Modules & Interactive Checklist
              </h3>
              <span className="text-xs text-slate-500">
                Click any lesson checkbox to update progress in real time
              </span>
            </div>

            {filteredLessonSubjects.map((subj) => (
              <div
                key={subj.subject_id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono text-emerald-600 font-semibold">
                      {subj.subject_code} · {subj.total_lessons} Total Lessons
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{subj.subject_name}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                        {subj.completion_rate}%
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {subj.completed_lessons} / {subj.total_lessons} Completed
                      </span>
                    </div>
                    <div className="w-24 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${subj.completion_rate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Modules list */}
                <div className="space-y-3">
                  {subj.modules.map((mod) => {
                    const isExpanded = expandedModuleId === mod.id || subj.modules.length === 1;
                    return (
                      <div
                        key={mod.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                {mod.title}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {mod.completed_lessons} of {mod.total_lessons} lessons completed ({mod.completion_rate}%)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-3.5 pt-0 space-y-2 border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                            {mod.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                                  lesson.completed
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleLessonCheck(lesson.id)}
                                    disabled={togglingLessonId === lesson.id}
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                                      lesson.completed
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent'
                                    }`}
                                  >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                  </button>
                                  <div>
                                    <span
                                      className={`font-medium block ${
                                        lesson.completed
                                          ? 'line-through text-slate-500 dark:text-slate-400'
                                          : 'text-slate-800 dark:text-slate-200'
                                      }`}
                                    >
                                      {lesson.title}
                                    </span>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                      <span className="uppercase font-mono font-semibold text-emerald-600">
                                        {lesson.type}
                                      </span>
                                      <span>·</span>
                                      <span>{lesson.duration_minutes} mins duration</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {lesson.completed ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                                      COMPLETED
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                                      PENDING
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: QUIZ SCORES DASHBOARD
      ===================================================================== */}
      {activeView === 'quizzes' && (
        <div className="space-y-6">
          {/* Quizzes Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Quiz Assessment Score Performance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scores achieved compared against the 75% passing threshold across all quizzes.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-cyan-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Score %
                </span>
                <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 75% Passing Line
                </span>
              </div>
            </div>

            <div className="w-full h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizChartData} margin={{ top: 15, right: 20, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} interval={0} dy={5} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={75}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{ value: 'Passing 75%', fill: '#f43f5e', fontSize: 10, position: 'right' }}
                  />
                  <Bar
                    dataKey="My Score %"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                    fill={COLORS.cyan}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quiz Score Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono text-cyan-600 font-semibold">
                      {quiz.subject_code} · {quiz.total_items} Questions · {quiz.total_points} Pts
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{quiz.title}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      quiz.status !== 'Completed'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : quiz.passed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {quiz.remark}
                  </span>
                </div>

                {quiz.status === 'Completed' ? (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">Correct Items:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {quiz.correct_items ?? 0} / {quiz.total_items} ({quiz.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${quiz.passed ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, quiz.percentage || 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Points: {quiz.score} / {quiz.total_points}</span>
                      <span>Passing threshold: {quiz.passing_score} pts ({quiz.passing_percentage}%)</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <span>Quiz not yet taken. Timed assessment waiting.</span>
                    {onNavigateToTasks && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTasks('quizzes')}
                        className="font-semibold underline hover:text-amber-950 dark:hover:text-white"
                      >
                        Take Quiz &rarr;
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 4: EXAMINATION SCORES DASHBOARD
      ===================================================================== */}
      {activeView === 'exams' && (
        <div className="space-y-6">
          {/* Examination Scores Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Quarterly Examination Performance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Departmental examinations officially recorded on your Form 138 academic standing.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Exam Score %
                </span>
                <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 75% Passing Line
                </span>
              </div>
            </div>

            <div className="w-full h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examChartData} margin={{ top: 15, right: 20, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} interval={0} dy={5} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={75}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{ value: 'Passing 75%', fill: '#f43f5e', fontSize: 10, position: 'right' }}
                  />
                  <Bar
                    dataKey="My Score %"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                    fill={COLORS.indigo}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Exam Score Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono text-indigo-600 font-semibold">
                      {exam.subject_code} · {exam.total_items} Items · {exam.total_points} Total Points
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{exam.title}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      exam.status !== 'Completed'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : exam.passed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {exam.remark}
                  </span>
                </div>

                {exam.status === 'Completed' ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">Official Exam Score:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {exam.correct_items ?? 0} / {exam.total_items} items ({exam.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${exam.passed ? 'bg-indigo-600' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, exam.percentage || 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Points: {exam.score} / {exam.total_points} pts</span>
                      <span>Passing threshold: {exam.passing_score} pts ({exam.passing_percentage}%)</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                    <span>Quarterly exam ready for submission.</span>
                    {onNavigateToTasks && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTasks('exams')}
                        className="font-semibold underline hover:text-indigo-950 dark:hover:text-white"
                      >
                        Start Exam &rarr;
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
