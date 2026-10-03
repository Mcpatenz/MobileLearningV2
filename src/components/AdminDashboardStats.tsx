import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { apiRequest, AuthTokenManager } from '../services/api';
import type { AdminDashboardAnalytics } from '../types/lms';

export interface AdminDashboardStatsProps {
  analytics?: AdminDashboardAnalytics | null;
  statistics?: {
    total_students: number;
    total_teachers: number;
    total_admins: number;
    total_subjects: number;
    active_classes: number;
    pending_approvals: number;
    active_token_sessions: number;
  };
  darkMode?: boolean;
  onNavigateTab?: (
    tab: 'users' | 'academics' | 'reports',
    subView?: 'approvals' | 'sessions'
  ) => void;
  onAuditScanCompleted?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export type AdminDashboardProps = AdminDashboardStatsProps;

interface AdminDashboardEndpointResponse {
  statistics: {
    total_students: number;
    total_teachers: number;
    total_admins: number;
    total_subjects: number;
    active_classes: number;
    pending_approvals: number;
    active_token_sessions: number;
  };
  analytics: AdminDashboardAnalytics;
}

const DEFAULT_ANALYTICS: AdminDashboardAnalytics = {
  user_growth: [
    { period: "Apr '26", students: 42, teachers: 8, admins: 1, total_users: 51 },
    { period: "May '26", students: 68, teachers: 10, admins: 1, total_users: 79 },
    { period: "Jun '26", students: 114, teachers: 12, admins: 2, total_users: 128 },
    { period: "Jul '26", students: 148, teachers: 14, admins: 2, total_users: 164 },
    { period: "Aug '26", students: 176, teachers: 15, admins: 2, total_users: 193 },
    { period: "Sep '26", students: 195, teachers: 16, admins: 2, total_users: 213 },
  ],
  active_subjects: [
    {
      code: 'MATH-10A',
      name: 'Mathematics 10: Advanced Algebra & Trigonometry',
      section: 'Rizal - STE',
      teacher_name: 'Engr. Roberto A. Reyes',
      enrolled_students: 38,
      modules_count: 4,
      assessments_count: 4,
      avg_progress: 82,
      avg_grade: 91,
    },
    {
      code: 'SCI-10A',
      name: 'Science 10: Earth, Physics & Biotechnology',
      section: 'Rizal - STE',
      teacher_name: 'Engr. Roberto A. Reyes',
      enrolled_students: 38,
      modules_count: 3,
      assessments_count: 3,
      avg_progress: 74,
      avg_grade: 88,
    },
    {
      code: 'ENG-10A',
      name: 'English 10: World Literature & Academic Writing',
      section: 'Rizal - STE',
      teacher_name: 'Prof. Elena G. Soriano',
      enrolled_students: 37,
      modules_count: 3,
      assessments_count: 3,
      avg_progress: 89,
      avg_grade: 93,
    },
    {
      code: 'FIL-10A',
      name: 'Filipino 10: Panitikang Pandaigdig',
      section: 'Rizal - STE',
      teacher_name: 'Prof. Elena G. Soriano',
      enrolled_students: 36,
      modules_count: 2,
      assessments_count: 2,
      avg_progress: 78,
      avg_grade: 89,
    },
    {
      code: 'ARAL-10A',
      name: 'Araling Panlipunan 10: Kontemporaryong Isyu',
      section: 'Rizal - STE',
      teacher_name: 'Mr. Marco P. Villanueva',
      enrolled_students: 35,
      modules_count: 2,
      assessments_count: 2,
      avg_progress: 71,
      avg_grade: 86,
    },
  ],
  submission_completion_by_subject: [
    {
      subject_code: 'MATH-10A',
      subject_name: 'Mathematics 10',
      completion_rate: 94,
      graded_rate: 89,
      submitted_count: 143,
      total_expected: 152,
    },
    {
      subject_code: 'SCI-10A',
      subject_name: 'Science 10',
      completion_rate: 90,
      graded_rate: 84,
      submitted_count: 103,
      total_expected: 114,
    },
    {
      subject_code: 'ENG-10A',
      subject_name: 'English 10',
      completion_rate: 96,
      graded_rate: 92,
      submitted_count: 107,
      total_expected: 111,
    },
    {
      subject_code: 'FIL-10A',
      subject_name: 'Filipino 10',
      completion_rate: 86,
      graded_rate: 80,
      submitted_count: 62,
      total_expected: 72,
    },
    {
      subject_code: 'ARAL-10A',
      subject_name: 'Araling Panlipunan 10',
      completion_rate: 82,
      graded_rate: 76,
      submitted_count: 57,
      total_expected: 70,
    },
  ],
  submission_status_breakdown: [
    { status: 'Graded & Verified', count: 438, percentage: 84 },
    { status: 'Submitted (Awaiting Grade)', count: 34, percentage: 7 },
    { status: 'Pending Submission', count: 33, percentage: 6 },
    { status: 'Overdue / Late', count: 14, percentage: 3 },
  ],
  overall_completion_rate: 91,
  overall_graded_rate: 84,
};

const PIE_COLORS = ['#059669', '#0d9488', '#d97706', '#e11d48'];

export const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({
  analytics,
  statistics,
  darkMode = false,
  onNavigateTab,
  onAuditScanCompleted,
  showToast,
}) => {
  const [growthChartMode, setGrowthChartMode] = useState<'area' | 'bar'>('area');
  const [completionChartMode, setCompletionChartMode] = useState<'subjects' | 'breakdown'>(
    'subjects'
  );
  const [subjectMetricView, setSubjectMetricView] = useState<'enrollment' | 'performance'>(
    'enrollment'
  );
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('MATH-10A');
  const [dashboardPayload, setDashboardPayload] = useState<AdminDashboardEndpointResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [scanningSecurity, setScanningSecurity] = useState<boolean>(false);

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<AdminDashboardEndpointResponse>('/api/v1/admin/dashboard');
      setDashboardPayload(res);
    } catch {
      // Fallback gracefully to passed props or baseline analytics
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  const handleRunSecurityScan = async () => {
    setScanningSecurity(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/v1/admin/security/audit-scan', {
        method: 'POST',
      });
      showToast?.(res.message, 'success');
      await fetchDashboardMetrics();
      onAuditScanCompleted?.();
    } catch (err: any) {
      showToast?.(err?.message || 'Security scan failed', 'error');
    } finally {
      setScanningSecurity(false);
    }
  };

  const data = analytics || dashboardPayload?.analytics || DEFAULT_ANALYTICS;
  const stats = statistics || dashboardPayload?.statistics;

  const latestGrowth =
    data.user_growth[data.user_growth.length - 1] || DEFAULT_ANALYTICS.user_growth[5];
  const prevGrowth =
    data.user_growth[data.user_growth.length - 2] || DEFAULT_ANALYTICS.user_growth[4];
  const monthlyGrowthDelta =
    prevGrowth.total_users > 0
      ? Math.round(
          ((latestGrowth.total_users - prevGrowth.total_users) / prevGrowth.total_users) * 100
        )
      : 12;

  const totalActiveSubjects =
    stats?.active_classes ?? stats?.total_subjects ?? data.active_subjects.length;

  const totalEnrolledAcrossSubjects = data.active_subjects.reduce(
    (sum, s) => sum + s.enrolled_students,
    0
  );
  const meanInstitutionalGrade =
    data.active_subjects.length > 0
      ? Math.round(
          data.active_subjects.reduce((sum, s) => sum + s.avg_grade, 0) /
            data.active_subjects.length
        )
      : 89;

  const tokenMeta = AuthTokenManager.getTokenMetadata();
  const selectedSubject =
    data.active_subjects.find((s) => s.code === selectedSubjectCode) || data.active_subjects[0];
  const selectedCompletion =
    data.submission_completion_by_subject.find((c) => c.subject_code === selectedSubject?.code) ||
    data.submission_completion_by_subject[0];

  const gridStroke = darkMode ? '#1e293b' : '#e2e8f0';
  const axisTickColor = darkMode ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      {/* Institutional Security & Cryptographic Posture Strip */}
      <div className="bg-slate-900 dark:bg-slate-900/90 text-white rounded-3xl p-4 sm:p-5 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono text-emerald-400">
              <span>HMAC-SHA256 Token Auth</span>
              <span aria-hidden="true">·</span>
              <span>Scrypt-16384 Salted Hashes</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Rotations: {tokenMeta.rotationCount}</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Access tokens reside in volatile memory (15m TTL). Refresh credentials rotate with
              server-side family revocation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRunSecurityScan}
            disabled={scanningSecurity}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Lock className={`w-3.5 h-3.5 ${scanningSecurity ? 'animate-spin' : ''}`} />
            <span>{scanningSecurity ? 'Scanning Posture...' : 'Run Security Posture Scan'}</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Total Students</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white">
            {stats?.total_students ?? latestGrowth.students}
          </p>
          <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            +{monthlyGrowthDelta}% vs last month
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Faculty Teachers</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white">
            {stats?.total_teachers ?? latestGrowth.teachers}
          </p>
          <p className="text-xs text-slate-500 mt-1">Assigned Instructors</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Completion Rate</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-emerald-600 dark:text-emerald-400">
            {data.overall_completion_rate}%
          </p>
          <p className="text-xs font-mono text-slate-500 mt-1 tabular-nums">
            {data.overall_graded_rate}% graded
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab?.('academics')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left hover:border-emerald-500 transition-colors"
        >
          <p className="text-xs text-slate-500">Total Active Subjects</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white">
            {totalActiveSubjects}
          </p>
          <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalEnrolledAcrossSubjects} seat enrollments
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab?.('users', 'approvals')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left hover:border-amber-500 transition-colors"
        >
          <p className="text-xs text-amber-600 font-semibold">Pending Approvals</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white">
            {stats?.pending_approvals ?? 3}
          </p>
          <p className="text-xs text-amber-600 mt-1">Awaiting Verification</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab?.('users', 'sessions')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left hover:border-emerald-500 transition-colors"
        >
          <p className="text-xs text-emerald-600 font-semibold">Active Sessions</p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white">
            {stats?.active_token_sessions ?? 1}
          </p>
          <p className="text-xs text-slate-500 mt-1">Token Families</p>
        </button>
      </div>

      {/* Recharts Visualization Row 1: User Growth & Submission Completion Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: User Growth Trajectory (AreaChart / BarChart) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>User Growth</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">SY 2026–2027</span>
              </div>
              <h2 className="text-lg font-bold font-display mt-0.5">
                Student & Faculty Onboarding Trajectory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cumulative verified accounts across Grade 10 STE cohorts and faculty departments
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setGrowthChartMode('area')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    growthChartMode === 'area'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Area
                </button>
                <button
                  type="button"
                  onClick={() => setGrowthChartMode('bar')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    growthChartMode === 'bar'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Cohort Bars
                </button>
              </div>
              <div className="text-right shrink-0 pl-1">
                <div className="text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{monthlyGrowthDelta}%
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500">
                  {latestGrowth.total_users} total
                </div>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {growthChartMode === 'area' ? (
                <AreaChart
                  data={data.user_growth}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="mlaStudentsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="mlaTeachersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{
                      fill: axisTickColor,
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    axisLine={{ stroke: gridStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: axisTickColor,
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const row = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg text-xs space-y-1.5">
                          <p className="font-mono font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 tabular-nums">
                            {label} · Total: {row.total_users}
                          </p>
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Students:
                            </span>
                            <span className="font-bold tabular-nums">{row.students}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-amber-600 dark:text-amber-400">Teachers:</span>
                            <span className="font-bold tabular-nums">{row.teachers}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-slate-500">Admins:</span>
                            <span className="font-bold tabular-nums">{row.admins}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="Students"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#mlaStudentsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="teachers"
                    name="Teachers"
                    stroke="#d97706"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#mlaTeachersGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={data.user_growth}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{
                      fill: axisTickColor,
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    axisLine={{ stroke: gridStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: axisTickColor,
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                  <Bar
                    dataKey="students"
                    name="Students"
                    stackId="users"
                    fill="#059669"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="teachers"
                    name="Teachers"
                    stackId="users"
                    fill="#d97706"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                Students:{' '}
                <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {latestGrowth.students}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Faculty:{' '}
                <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {latestGrowth.teachers}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Admins:{' '}
                <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {latestGrowth.admins}
                </strong>
              </span>
            </div>
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              Latest Period: {latestGrowth.period}
            </span>
          </div>
        </div>

        {/* CHART 2: Submission Completion Rates (BarChart by Subject or PieChart Breakdown) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submission Completion Rates</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {data.overall_completion_rate}% Turn-In
                </span>
              </div>
              <h2 className="text-lg font-bold font-display mt-0.5">
                Coursework Turn-In & Faculty Grading Velocity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Percentage of expected assignments, quizzes, and exams submitted vs. graded
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setCompletionChartMode('subjects')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    completionChartMode === 'subjects'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  By Subject
                </button>
                <button
                  type="button"
                  onClick={() => setCompletionChartMode('breakdown')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    completionChartMode === 'breakdown'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Distribution
                </button>
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {completionChartMode === 'subjects' ? (
                <BarChart
                  data={data.submission_completion_by_subject}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="subject_code"
                    tick={{
                      fill: axisTickColor,
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    axisLine={{ stroke: gridStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tick={{
                      fill: axisTickColor,
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg text-xs space-y-1.5">
                          <p className="font-mono font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                            {item.subject_code} · {item.subject_name}
                          </p>
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Submission Rate:
                            </span>
                            <span className="font-bold tabular-nums">{item.completion_rate}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 font-mono">
                            <span className="text-teal-600 dark:text-teal-400">Graded Rate:</span>
                            <span className="font-bold tabular-nums">{item.graded_rate}%</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 pt-0.5 tabular-nums">
                            {item.submitted_count} of {item.total_expected} expected items turned in
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                  <Bar
                    dataKey="completion_rate"
                    name="Completion Rate %"
                    fill="#059669"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={26}
                  />
                  <Bar
                    dataKey="graded_rate"
                    name="Graded Rate %"
                    fill="#0d9488"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={26}
                  />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data.submission_status_breakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.submission_status_breakdown.map((entry, index) => (
                      <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg text-xs font-mono space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">{item.status}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {item.count} submissions ({item.percentage}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Status Breakdown Summary Line */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {data.submission_status_breakdown.map((item, idx) => {
              const accentColors = [
                'text-emerald-600 dark:text-emerald-400',
                'text-teal-600 dark:text-teal-400',
                'text-amber-600 dark:text-amber-400',
                'text-rose-600 dark:text-rose-400',
              ];
              return (
                <div key={item.status} className="space-y-0.5">
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span
                      className={`font-bold tabular-nums ${accentColors[idx % accentColors.length]}`}
                    >
                      {item.percentage}%
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">{item.count}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{item.status}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recharts Visualization Row 2: Total Active Subjects Analytics (ComposedChart + Interactive Subject Drilldown) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Total Active Subjects ({totalActiveSubjects})</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Mean Grade {meanInstitutionalGrade}%</span>
            </div>
            <h2 className="text-lg font-bold font-display mt-0.5">
              Subject Enrollment, Module Mastery & Grade Averages
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setSubjectMetricView('enrollment')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  subjectMetricView === 'enrollment'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Enrollment & Progress
              </button>
              <button
                type="button"
                onClick={() => setSubjectMetricView('performance')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  subjectMetricView === 'performance'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Grade Mastery & Assessments
              </button>
            </div>
            <button
              type="button"
              onClick={fetchDashboardMetrics}
              title="Refresh dashboard metrics"
              className="min-h-[36px] min-w-[36px] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-emerald-500"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.active_subjects}
                margin={{ top: 10, right: 12, left: -14, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="code"
                  tick={{
                    fill: axisTickColor,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{
                    fill: axisTickColor,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                  tick={{
                    fill: axisTickColor,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const subj = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 shadow-lg text-xs space-y-1.5">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          {subj.code} · {subj.section}
                        </p>
                        <p className="text-slate-500 text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
                          {subj.name} ({subj.teacher_name})
                        </p>
                        <div className="flex items-center justify-between gap-4 font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Enrolled Learners:
                          </span>
                          <span className="font-bold tabular-nums">{subj.enrolled_students}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 font-mono">
                          <span className="text-amber-600 dark:text-amber-400">
                            Module Progress:
                          </span>
                          <span className="font-bold tabular-nums">{subj.avg_progress}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 font-mono">
                          <span className="text-sky-600 dark:text-sky-400">Mean Grade:</span>
                          <span className="font-bold tabular-nums">{subj.avg_grade}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey={
                    subjectMetricView === 'enrollment' ? 'enrolled_students' : 'assessments_count'
                  }
                  name={
                    subjectMetricView === 'enrollment'
                      ? 'Enrolled Learners'
                      : 'Published Assessments'
                  }
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                  onClick={(entry: any) => {
                    if (entry?.code) setSelectedSubjectCode(entry.code);
                  }}
                >
                  {data.active_subjects.map((entry, index) => (
                    <Cell
                      key={entry.code}
                      cursor="pointer"
                      fill={
                        entry.code === selectedSubjectCode
                          ? '#047857'
                          : index % 2 === 0
                          ? '#059669'
                          : '#10b981'
                      }
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={subjectMetricView === 'enrollment' ? 'avg_progress' : 'avg_grade'}
                  name={subjectMetricView === 'enrollment' ? 'Avg Progress %' : 'Avg Grade %'}
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#d97706', strokeWidth: 2, stroke: '#ffffff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Active Subject Breakdown List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
              {data.active_subjects.map((subj) => {
                const isSelected = subj.code === selectedSubject?.code;
                return (
                  <button
                    key={subj.code}
                    type="button"
                    onClick={() => setSelectedSubjectCode(subj.code)}
                    className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {subj.code}
                        </span>
                        <span aria-hidden="true" className="text-slate-400">
                          ·
                        </span>
                        <span className="text-slate-500 truncate">{subj.teacher_name}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                        {subj.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                      <div className="text-right">
                        <div className="font-bold tabular-nums text-slate-900 dark:text-white">
                          {subj.enrolled_students}
                        </div>
                        <div className="text-[10px] text-slate-500">learners</div>
                      </div>
                      <div className="text-right min-w-[44px]">
                        <div className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                          {subjectMetricView === 'enrollment'
                            ? `${subj.avg_progress}%`
                            : `${subj.avg_grade}%`}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {subjectMetricView === 'enrollment' ? 'progress' : 'mean'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Subject Summary Strip */}
            {selectedSubject && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                <span>
                  Selected:{' '}
                  <strong className="text-slate-900 dark:text-white">{selectedSubject.code}</strong>{' '}
                  · {selectedSubject.section}
                </span>
                <span className="tabular-nums">
                  {selectedSubject.modules_count} modules ·{' '}
                  {selectedCompletion?.completion_rate ?? 90}% turn-in ·{' '}
                  {selectedSubject.avg_grade}% avg
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard = AdminDashboardStats;
export default AdminDashboardStats;
