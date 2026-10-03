import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  User as UserIcon,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Download,
  Search,
  BookOpen,
  FileText,
  LogOut,
  Moon,
  Sun,
  RefreshCw,
  Pencil,
  ListChecks,
  XCircle,
  QrCode,
} from 'lucide-react';
import { apiRequest, performSingleFlightRefresh } from '../services/api';
import type {
  User,
  Subject,
  Assignment,
  AssignmentSubmission,
  Quiz,
  Exam,
  AssessmentAttempt,
  RetakeRequest,
  SubjectGradeSummary,
} from '../types/lms';
import { QuestionBankManager } from './QuestionBankManager';
import { QRCodeDisplayModal } from './QRCodeDisplayModal';

interface TeacherPortalProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type TeacherTab = 'dashboard' | 'classes' | 'tasks' | 'results' | 'profile';

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  user,
  onUserUpdated,
  onLogout,
  darkMode,
  onToggleDarkMode,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');

  // Dashboard
  const [dashboard, setDashboard] = useState<any>(null);

  // Classes & Modules
  const [classesData, setClassesData] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [displayQRModal, setDisplayQRModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    payload: string;
    type: 'class_join' | 'assignment_submit';
    codeLabel?: string;
  } | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [newModTitle, setNewModTitle] = useState('');
  const [newModDesc, setNewModDesc] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<'pdf' | 'docx' | 'video' | 'reading'>('pdf');

  // Tasks ('submissions' | 'retakes' | 'assignments' | 'quizzes' | 'exams')
  const [taskMode, setTaskMode] = useState<
    'submissions' | 'retakes' | 'assignments' | 'quizzes' | 'exams'
  >('submissions');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [retakeRequests, setRetakeRequests] = useState<RetakeRequest[]>([]);
  const [assessmentAttempts, setAssessmentAttempts] = useState<AssessmentAttempt[]>([]);
  const [retakeNotes, setRetakeNotes] = useState<Record<number, string>>({});
  const [processingRetakeId, setProcessingRetakeId] = useState<number | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Create Assignment form
  const [assignSubjectId, setAssignSubjectId] = useState<number>(101);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignMaxScore, setAssignMaxScore] = useState('50');
  const [assignDueDate, setAssignDueDate] = useState('2026-10-12');
  const [assignLeadQuestion, setAssignLeadQuestion] = useState('');
  const [assignLeadAnswer, setAssignLeadAnswer] = useState('');
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [editAssignTitle, setEditAssignTitle] = useState('');
  const [editAssignMaxScore, setEditAssignMaxScore] = useState('50');

  // Quizzes & Exams
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [newQuizSubjectId, setNewQuizSubjectId] = useState<number>(101);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizTime, setNewQuizTime] = useState('15');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newChoiceA, setNewChoiceA] = useState('');
  const [newChoiceB, setNewChoiceB] = useState('');
  const [newChoiceC, setNewChoiceC] = useState('');
  const [newChoiceD, setNewChoiceD] = useState('');
  const [newCorrectChoice, setNewCorrectChoice] = useState('A');
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [editQuizTitle, setEditQuizTitle] = useState('');
  const [editQuizTime, setEditQuizTime] = useState('15');

  const [newExamSubjectId, setNewExamSubjectId] = useState<number>(101);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDuration, setNewExamDuration] = useState('45');
  const [newExamQuestion, setNewExamQuestion] = useState('');
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [editExamTitle, setEditExamTitle] = useState('');
  const [editExamDuration, setEditExamDuration] = useState('45');

  // Results (Gradebook & Reports)
  const [resultsMode, setResultsMode] = useState<'gradebook' | 'reports'>('gradebook');
  const [gradebook, setGradebook] = useState<SubjectGradeSummary[]>([]);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editAssignAvg, setEditAssignAvg] = useState('');
  const [editQuizAvg, setEditQuizAvg] = useState('');
  const [editExamAvg, setEditExamAvg] = useState('');

  // Profile
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [email, setEmail] = useState(user.email);
  const [contactNumber, setContactNumber] = useState(user.contact_number);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/teacher/dashboard');
      setDashboard(data);
    } catch (err: any) {
      showToast(err?.message || 'Error loading teacher dashboard', 'error');
    }
  }, [showToast]);

  const loadClasses = useCallback(async () => {
    try {
      const data = await apiRequest<{ subjects: any[] }>('/api/v1/teacher/subjects');
      setClassesData(data.subjects);
      if (data.subjects.length > 0 && !selectedClass) {
        setSelectedClass(data.subjects[0]);
      } else if (selectedClass) {
        const updated = data.subjects.find((s) => s.id === selectedClass.id);
        if (updated) setSelectedClass(updated);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error loading classes', 'error');
    }
  }, [selectedClass, showToast]);

  const loadTasks = useCallback(async () => {
    try {
      const [assignRes, assessRes] = await Promise.all([
        apiRequest<{ assignments: Assignment[]; submissions: AssignmentSubmission[] }>(
          '/api/v1/teacher/assignments'
        ),
        apiRequest<{
          quizzes: Quiz[];
          exams: Exam[];
          attempts?: AssessmentAttempt[];
          retake_requests?: RetakeRequest[];
        }>('/api/v1/teacher/assessments'),
      ]);
      setAssignments(assignRes.assignments);
      setSubmissions(assignRes.submissions);
      setQuizzes(assessRes.quizzes);
      setExams(assessRes.exams);
      setAssessmentAttempts(assessRes.attempts || []);
      setRetakeRequests(assessRes.retake_requests || []);
    } catch (err: any) {
      showToast(err?.message || 'Error loading tasks', 'error');
    }
  }, [showToast]);

  const handleReviewRetakeRequest = async (reqId: number, action: 'approve' | 'decline') => {
    setProcessingRetakeId(reqId);
    try {
      const res = await apiRequest<{ message: string }>(
        `/api/v1/teacher/retake-requests/${reqId}/review`,
        {
          method: 'POST',
          body: JSON.stringify({
            action,
            teacher_note: retakeNotes[reqId] || '',
          }),
        }
      );
      showToast(res.message, action === 'approve' ? 'success' : 'info');
      loadTasks();
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to review retake request', 'error');
    } finally {
      setProcessingRetakeId(null);
    }
  };

  const loadGradebook = useCallback(async () => {
    try {
      const data = await apiRequest<{ subjects: Subject[]; gradebook: SubjectGradeSummary[] }>(
        '/api/v1/teacher/gradebook'
      );
      setGradebook(data.gradebook);
    } catch (err: any) {
      showToast(err?.message || 'Error loading gradebook', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === 'classes') loadClasses();
    if (activeTab === 'tasks') loadTasks();
    if (activeTab === 'results') loadGradebook();
  }, [activeTab, loadClasses, loadTasks, loadGradebook]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newModTitle.trim()) return;
    try {
      const res = await apiRequest<{ message: string }>('/api/v1/teacher/modules', {
        method: 'POST',
        body: JSON.stringify({
          subject_id: selectedClass.id,
          title: newModTitle,
          description: newModDesc,
          lesson_title: newLessonTitle,
          lesson_type: newLessonType,
        }),
      });
      showToast(res.message, 'success');
      setNewModTitle('');
      setNewModDesc('');
      setNewLessonTitle('');
      loadClasses();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create module', 'error');
    }
  };

  const handleDeleteModule = async (modId: number) => {
    try {
      await apiRequest(`/api/v1/teacher/modules/${modId}`, { method: 'DELETE' });
      showToast('Module deleted.', 'info');
      loadClasses();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete module', 'error');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;
    try {
      const initialQuestions = assignLeadQuestion.trim()
        ? [
            {
              id: Date.now(),
              question_text: assignLeadQuestion.trim(),
              question_type: 'short_answer' as const,
              points: Number(assignMaxScore) || 25,
              choices: [],
              correct_answer: assignLeadAnswer.trim() || 'See solution rubric',
            },
          ]
        : [];

      const res = await apiRequest<{ message: string }>('/api/v1/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify({
          subject_id: assignSubjectId,
          title: assignTitle,
          description: assignDesc,
          instructions: assignInstructions,
          max_score: Number(assignMaxScore) || 50,
          due_date: new Date(assignDueDate).toISOString(),
          attachments: [`${assignTitle.replace(/\s+/g, '_')}_Worksheet.pdf`],
          questions: initialQuestions,
        }),
      });
      showToast(res.message, 'success');
      setAssignTitle('');
      setAssignDesc('');
      setAssignInstructions('');
      setAssignLeadQuestion('');
      setAssignLeadAnswer('');
      loadTasks();
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Could not create assignment', 'error');
    }
  };

  const handleGradeSubmission = async (action: 'grade' | 'return') => {
    if (!gradingSubmission) return;
    try {
      const res = await apiRequest<{ message: string }>(
        `/api/v1/teacher/submissions/${gradingSubmission.id}/grade`,
        {
          method: 'POST',
          body: JSON.stringify({
            action,
            score: action === 'grade' ? Number(gradeScore) : null,
            feedback: gradeFeedback,
          }),
        }
      );
      showToast(res.message, 'success');
      setGradingSubmission(null);
      setGradeScore('');
      setGradeFeedback('');
      loadTasks();
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save grade', 'error');
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;
    try {
      const questions = newQuestionText.trim()
        ? [
            {
              id: Date.now(),
              question_text: newQuestionText.trim(),
              question_type: 'multiple_choice',
              points: 10,
              choices: [
                { id: 'A', text: newChoiceA || 'Option A' },
                { id: 'B', text: newChoiceB || 'Option B' },
                { id: 'C', text: newChoiceC || 'Option C' },
                { id: 'D', text: newChoiceD || 'Option D' },
              ],
              correct_answer: newCorrectChoice,
            },
          ]
        : undefined;

      const res = await apiRequest<{ message: string }>('/api/v1/teacher/quizzes', {
        method: 'POST',
        body: JSON.stringify({
          subject_id: newQuizSubjectId,
          title: newQuizTitle,
          time_limit_minutes: Number(newQuizTime) || 15,
          max_attempts: 2,
          questions,
        }),
      });
      showToast(res.message, 'success');
      setNewQuizTitle('');
      setNewQuestionText('');
      loadTasks();
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to publish quiz', 'error');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;
    try {
      const questions = newExamQuestion.trim()
        ? [
            {
              id: Date.now(),
              question_text: newExamQuestion.trim(),
              question_type: 'true_false',
              points: 15,
              choices: [
                { id: 'True', text: 'True' },
                { id: 'False', text: 'False' },
              ],
              correct_answer: 'True',
            },
          ]
        : undefined;

      const res = await apiRequest<{ message: string }>('/api/v1/teacher/exams', {
        method: 'POST',
        body: JSON.stringify({
          subject_id: newExamSubjectId,
          title: newExamTitle,
          duration_minutes: Number(newExamDuration) || 45,
          questions,
        }),
      });
      showToast(res.message, 'success');
      setNewExamTitle('');
      setNewExamQuestion('');
      loadTasks();
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to publish exam', 'error');
    }
  };

  const handleSaveGradebookRow = async (ssId: number) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/v1/teacher/gradebook/${ssId}`, {
        method: 'PUT',
        body: JSON.stringify({
          assignment_avg: Number(editAssignAvg),
          quiz_avg: Number(editQuizAvg),
          exam_avg: Number(editExamAvg),
        }),
      });
      showToast(res.message, 'success');
      setEditingRowId(null);
      loadGradebook();
    } catch (err: any) {
      showToast(err?.message || 'Could not update gradebook', 'error');
    }
  };

  const handleExportGradebookCsv = () => {
    const headers = [
      'Student ID',
      'Student Name',
      'Subject Code',
      'Section',
      'Assignments (%)',
      'Quizzes (%)',
      'Exams (%)',
      'Final Grade (%)',
      'Remarks',
    ];
    const rows = gradebook.map((r) => [
      r.student_school_id,
      `"${r.student_name}"`,
      r.subject_code,
      `"${r.section}"`,
      r.assignment_avg,
      r.quiz_avg,
      r.exam_avg,
      r.final_grade,
      r.remarks,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TNHS_Gradebook_${user.school_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported official TNHS Gradebook CSV.', 'success');
  };

  return (
    <div className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
      {/* =====================================================================
          TAB 1: TEACHER DASHBOARD
      ===================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-emerald-600">{user.first_name[0]}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  FACULTY PORTAL · {user.school_id} · {user.department}
                </p>
                <h1 className="text-2xl font-bold font-display">Good morning, {user.name}</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* 6 Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">Total Students</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                {dashboard?.statistics?.total_students ?? 3}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">Assigned Subjects</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                {dashboard?.statistics?.total_subjects ?? 3}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('tasks');
                setTaskMode('submissions');
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left hover:border-emerald-500"
            >
              <p className="text-xs text-amber-600 font-medium">Pending Submissions</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                {dashboard?.statistics?.pending_submissions ?? 2}
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('tasks');
                setTaskMode('retakes');
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-300 dark:border-amber-800/70 text-left hover:border-emerald-500"
            >
              <p className="text-xs text-amber-600 font-semibold">Retake Requests</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1 text-amber-600">
                {dashboard?.statistics?.pending_retake_requests ?? 0}
              </p>
            </button>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">Active Quizzes</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                {dashboard?.statistics?.active_quizzes ?? 1}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">Active Exams</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                {dashboard?.statistics?.active_exams ?? 1}
              </p>
            </div>
          </div>

          {/* Pending Retake Requests Banner on Dashboard */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold font-display">
                  Student Quiz & Exam Retake Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Students who have submitted a quiz or exam have their take button disabled until you approve their retake request.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tasks');
                  setTaskMode('retakes');
                }}
                className="text-xs font-semibold text-emerald-600 hover:underline shrink-0"
              >
                Manage All Retakes
              </button>
            </div>

            {(dashboard?.pending_retake_requests || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                No pending quiz or examination retake requests at this time.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(dashboard?.pending_retake_requests || []).map((req: RetakeRequest) => (
                  <div
                    key={req.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {req.assessment_type} Retake Request
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {req.student_name} ({req.student_school_id}) · {req.student_section}
                        </span>
                      </div>
                      <p className="text-sm font-semibold">
                        {req.subject_code}: {req.assessment_title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Reason: “{req.reason}” · Requested {new Date(req.requested_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={processingRetakeId === req.id}
                        onClick={() => handleReviewRetakeRequest(req.id, 'approve')}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Enable Button</span>
                      </button>
                      <button
                        type="button"
                        disabled={processingRetakeId === req.id}
                        onClick={() => handleReviewRetakeRequest(req.id, 'decline')}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 text-xs font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submissions Awaiting Grading */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display">Submissions Awaiting Evaluation</h2>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('tasks');
                    setTaskMode('submissions');
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Open Grading Queue
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(dashboard?.pending_submissions || []).length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    All student submissions have been graded!
                  </p>
                ) : (
                  (dashboard?.pending_submissions || []).map((sub: AssignmentSubmission) => (
                    <div
                      key={sub.id}
                      className="py-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-mono text-slate-500">
                          {sub.student_name} ({sub.student_school_id}) · {sub.student_section}
                        </p>
                        <p className="text-sm font-semibold">{sub.assignment_title}</p>
                        {sub.total_items !== undefined && sub.total_items > 0 && (
                          <p className="text-xs font-mono text-emerald-600">
                            Auto-check: {sub.correct_items ?? 0}/{sub.total_items} items ·{' '}
                            {sub.remarks || (sub.passed ? 'PASSED' : 'FAILED')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGradingSubmission(sub);
                          setGradeScore(String(sub.score ?? sub.max_score));
                          setActiveTab('tasks');
                          setTaskMode('submissions');
                        }}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shrink-0"
                      >
                        Grade Now
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assigned Subjects Overview */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display">Assigned Classes</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('classes')}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Manage Modules
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(dashboard?.subjects || []).map((s: Subject) => (
                  <div key={s.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-slate-500">
                        {s.code} · {s.grade_level} · {s.section}
                      </p>
                      <p className="text-sm font-semibold">{s.name}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-500 shrink-0">
                      {s.enrolled_count} students
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: TEACHER CLASSES, STUDENT ROSTER & MODULE BUILDER
      ===================================================================== */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">My Classes & Learning Modules</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Inspect enrolled students, monitor progress, and publish learning modules.
              </p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {classesData.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${
                    selectedClass?.id === cls.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cls.code} ({cls.section})
                </button>
              ))}
            </div>
          </div>

          {selectedClass && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Modules & Create Module Form */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-bold font-display">
                      Published Modules — {selectedClass.code}
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        setDisplayQRModal({
                          isOpen: true,
                          title: `${selectedClass.code} — ${selectedClass.name}`,
                          subtitle: `Grade ${selectedClass.grade_level} · ${selectedClass.section} · Prof. ${user.name}`,
                          payload: JSON.stringify({
                            type: 'class_join',
                            subject_id: selectedClass.id,
                            code: selectedClass.code,
                            name: selectedClass.name,
                            school_year: selectedClass.school_year,
                          }),
                          type: 'class_join',
                          codeLabel: `TNHS:JOIN:${selectedClass.code}`,
                        })
                      }
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-2xs self-start sm:self-auto"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Show Class QR Code</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(selectedClass.modules || []).map((m: any) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                      >
                        <div>
                          <h3 className="text-sm font-bold">{m.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                          <p className="text-xs font-mono text-emerald-600 mt-1">
                            {m.lessons?.length || 0} Lesson Resource(s) · Published
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(m.id)}
                          aria-label="Delete module"
                          className="min-h-[40px] min-w-[40px] rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={handleCreateModule}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4"
                >
                  <h3 className="text-base font-bold font-display">
                    Publish New Module & Resource ({selectedClass.code})
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Module Title</label>
                    <input
                      type="text"
                      value={newModTitle}
                      onChange={(e) => setNewModTitle(e.target.value)}
                      placeholder="e.g. Module 4: Coordinate Geometry & Distance Formula"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Module Description</label>
                    <input
                      type="text"
                      value={newModDesc}
                      onChange={(e) => setNewModDesc(e.target.value)}
                      placeholder="Summary of learning competencies..."
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">
                        Initial Lesson / Resource Title
                      </label>
                      <input
                        type="text"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder="e.g. Lesson 4.1: Midpoint & Distance Proofs (PDF)"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Resource Format</label>
                      <select
                        value={newLessonType}
                        onChange={(e) => setNewLessonType(e.target.value as any)}
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                      >
                        <option value="pdf">PDF Handout</option>
                        <option value="docx">DOCX Worksheet</option>
                        <option value="video">Video Lecture</option>
                        <option value="reading">Reading Module</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish Module to Class</span>
                  </button>
                </form>
              </div>

              {/* Right 5 Cols: Enrolled Student Roster & Search */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 self-start">
                <h2 className="text-lg font-bold font-display">
                  Class Roster ({selectedClass.students?.length || 0})
                </h2>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student name or ID..."
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                  />
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedClass.students || [])
                    .filter(
                      (s: any) =>
                        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.school_id.toLowerCase().includes(studentSearch.toLowerCase())
                    )
                    .map((stu: any) => (
                      <div key={stu.id} className="py-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{stu.name}</p>
                            <p className="text-xs font-mono text-slate-500">
                              {stu.school_id} · {stu.section}
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-600">
                            Grade: {stu.final_grade}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${stu.progress || 75}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: TEACHER TASKS (SUBMISSIONS & GRADING, ASSIGNMENTS, QUIZZES, EXAMS)
      ===================================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">
                Coursework, Grading & Assessments
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Evaluate student submissions and publish assignments, quizzes, and departmental
                examinations.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {(
                [
                  { id: 'submissions', label: `Submissions (${submissions.length})` },
                  {
                    id: 'retakes',
                    label: `Retake Requests (${retakeRequests.filter((r) => r.status === 'pending').length})`,
                  },
                  { id: 'assignments', label: 'Assignments' },
                  { id: 'quizzes', label: 'Quizzes' },
                  { id: 'exams', label: 'Exams' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTaskMode(t.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    taskMode === t.id
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {taskMode === 'submissions' && (
            <div className="space-y-4">
              {gradingSubmission && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-emerald-600 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono text-emerald-600">
                        MOBILE GRADING INTERFACE · MAX SCORE: {gradingSubmission.max_score} PTS
                      </p>
                      <h2 className="text-xl font-bold font-display">
                        {gradingSubmission.student_name} ({gradingSubmission.student_school_id})
                      </h2>
                      <p className="text-xs text-slate-500">
                        {gradingSubmission.assignment_title} · Submitted{' '}
                        {new Date(gradingSubmission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGradingSubmission(null)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Attached Student Files:</p>
                    {gradingSubmission.files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>
                          {f.name} ({f.size_kb} KB)
                        </span>
                      </div>
                    ))}
                    {gradingSubmission.notes && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 pt-1">
                        Student Note: “{gradingSubmission.notes}”
                      </p>
                    )}
                    {gradingSubmission.total_items !== undefined &&
                      gradingSubmission.total_items > 0 && (
                        <p className="text-xs font-mono font-bold text-emerald-600 pt-1">
                          Auto-Graded Question Score: {gradingSubmission.correct_items ?? 0} /{' '}
                          {gradingSubmission.total_items} Correct Items · Remark:{' '}
                          {gradingSubmission.remarks ||
                            (gradingSubmission.passed ? 'PASSED' : 'FAILED')}
                        </p>
                      )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Numerical Score (out of {gradingSubmission.max_score})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={gradingSubmission.max_score}
                        value={gradeScore}
                        onChange={(e) => setGradeScore(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-base font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Teacher Feedback</label>
                      <input
                        type="text"
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        placeholder="Write constructive feedback for the student..."
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleGradeSubmission('grade')}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Grade & Notify Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGradeSubmission('return')}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl border border-amber-500 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Return Submission for Revision (Re-Enables Student Button)</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {submissions.map((sub) => {
                  const hasScore = sub.score !== null && sub.score !== undefined;
                  const passed =
                    sub.passed !== undefined && sub.passed !== null
                      ? sub.passed
                      : hasScore
                      ? Number(sub.score) / Math.max(1, sub.max_score) >= 0.6
                      : null;
                  const remark = sub.remarks || (passed === null ? null : passed ? 'PASSED' : 'FAILED');
                  return (
                    <div
                      key={sub.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-mono text-slate-500">
                            {sub.student_name} ({sub.student_school_id}) · Status: {sub.status}
                          </p>
                          {hasScore && (
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                              Score:{' '}
                              {sub.total_items !== undefined && sub.total_items > 0
                                ? `${sub.correct_items ?? 0}/${sub.total_items} items (${sub.score}/${sub.max_score} pts)`
                                : `${sub.score}/${sub.max_score}`}
                            </span>
                          )}
                          {remark && (
                            <span
                              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                                remark === 'PASSED'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-600 border-red-500/30'
                              }`}
                            >
                              {remark}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold">{sub.assignment_title}</h3>
                        <p className="text-xs text-slate-500">
                          Submitted {new Date(sub.submitted_at).toLocaleString()} ·{' '}
                          {sub.files.map((f) => f.name).join(', ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGradingSubmission(sub);
                          setGradeScore(String(sub.score ?? sub.max_score));
                          setGradeFeedback(sub.feedback || '');
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold shrink-0"
                      >
                        {sub.score !== null ? 'Update Grade / Return' : 'Grade Submission'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {taskMode === 'retakes' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <h2 className="text-lg font-bold font-display">
                    Student Retake Requests (Quizzes & Departmental Exams)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    After submitting a quiz or exam, a student’s start button is disabled. Approve a request below to unlock and enable the retake button for that student.
                  </p>
                </div>

                {retakeRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    No retake requests have been submitted by students yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {retakeRequests.map((req) => {
                      const latestAttempt = assessmentAttempts.find(
                        (a) =>
                          a.student_id === req.student_id &&
                          a.assessment_type === req.assessment_type &&
                          a.assessment_id === req.assessment_id &&
                          a.status !== 'in_progress'
                      );
                      return (
                        <div
                          key={req.id}
                          className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${
                                  req.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                    : req.status === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                    : req.status === 'used'
                                    ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30'
                                    : 'bg-red-500/10 text-red-600 border-red-500/30'
                                }`}
                              >
                                {req.status.toUpperCase()}
                              </span>
                              <span className="text-xs font-mono font-bold uppercase text-slate-500">
                                {req.assessment_type} · {req.subject_code}
                              </span>
                              <span className="text-xs font-mono text-slate-500">
                                {req.student_name} ({req.student_school_id}) · {req.student_section}
                              </span>
                            </div>
                            <h3 className="text-base font-bold">{req.assessment_title}</h3>
                            {latestAttempt && (
                              <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                Previous Score: {latestAttempt.correct_items ?? 0} /{' '}
                                {latestAttempt.total_items ?? 0} Correct Items ({latestAttempt.score} /{' '}
                                {latestAttempt.max_score} pts · {latestAttempt.percentage}%) · Remark:{' '}
                                <span
                                  className={
                                    latestAttempt.passed
                                      ? 'text-emerald-600 font-bold'
                                      : 'text-red-600 font-bold'
                                  }
                                >
                                  {latestAttempt.remarks ||
                                    (latestAttempt.passed ? 'PASSED' : 'FAILED')}
                                </span>
                              </p>
                            )}
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Student Reason: “{req.reason}” · Requested{' '}
                              {new Date(req.requested_at).toLocaleString()}
                            </p>
                            {req.teacher_note && (
                              <p className="text-xs font-mono text-emerald-600">
                                Teacher Note: {req.teacher_note}
                              </p>
                            )}
                          </div>

                          {req.status === 'pending' ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                              <input
                                type="text"
                                value={retakeNotes[req.id] || ''}
                                onChange={(e) =>
                                  setRetakeNotes((prev) => ({
                                    ...prev,
                                    [req.id]: e.target.value,
                                  }))
                                }
                                placeholder="Optional teacher note..."
                                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                              />
                              <button
                                type="button"
                                disabled={processingRetakeId === req.id}
                                onClick={() => handleReviewRetakeRequest(req.id, 'approve')}
                                className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve & Enable Button</span>
                              </button>
                              <button
                                type="button"
                                disabled={processingRetakeId === req.id}
                                onClick={() => handleReviewRetakeRequest(req.id, 'decline')}
                                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-600 text-xs font-semibold flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Decline</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs font-mono text-slate-500 shrink-0">
                              {req.status === 'approved'
                                ? 'Retake Button Enabled for Student'
                                : req.status === 'used'
                                ? 'Student Completed Approved Retake'
                                : 'Request Declined'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Student Quiz & Exam Attempts with Correct Items / Total Items & Remarks */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h2 className="text-lg font-bold font-display">
                  Submitted Quiz & Exam Results (Shuffled Question & Choice Logs)
                </h2>
                {assessmentAttempts.filter((a) => a.status !== 'in_progress').length === 0 ? (
                  <p className="text-xs text-slate-500">No completed quiz or exam attempts yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assessmentAttempts
                      .filter((a) => a.status !== 'in_progress')
                      .map((att) => (
                        <div
                          key={att.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400">
                                {att.assessment_type}
                              </span>
                              <span className="text-sm font-bold">{att.assessment_title}</span>
                              <span
                                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  att.passed
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-600 border-red-500/30'
                                }`}
                              >
                                {att.remarks || (att.passed ? 'PASSED' : 'FAILED')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              Student ID #{att.student_id} · Submitted{' '}
                              {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : '—'}
                            </p>
                          </div>
                          <div className="text-right font-mono">
                            <p className="text-sm font-bold">
                              {att.correct_items ?? 0} / {att.total_items ?? 0} Correct Items
                            </p>
                            <p className="text-xs text-slate-500">
                              {att.score} / {att.max_score} pts ({att.percentage}%)
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {taskMode === 'assignments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleCreateAssignment}
                className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 self-start"
              >
                <h2 className="text-lg font-bold font-display">Publish New Assignment</h2>
                <div>
                  <label className="block text-xs font-semibold mb-1">Subject</label>
                  <select
                    value={assignSubjectId}
                    onChange={(e) => setAssignSubjectId(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  >
                    <option value={101}>MATH-10A: Mathematics 10</option>
                    <option value={103}>COMP-10S: Mobile Computing</option>
                    <option value={105}>STAT-10E: Data Analytics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Assignment Title</label>
                  <input
                    type="text"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    placeholder="e.g. Problem Set #4: Tangent-Secant Power Theorems"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Short Description</label>
                  <input
                    type="text"
                    value={assignDesc}
                    onChange={(e) => setAssignDesc(e.target.value)}
                    placeholder="Core competencies covered..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Max Score</label>
                    <input
                      type="number"
                      value={assignMaxScore}
                      onChange={(e) => setAssignMaxScore(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Due Date</label>
                    <input
                      type="date"
                      value={assignDueDate}
                      onChange={(e) => setAssignDueDate(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Initial Assignment Question (Optional — Add/Edit More After Publishing)
                  </label>
                  <input
                    type="text"
                    value={assignLeadQuestion}
                    onChange={(e) => setAssignLeadQuestion(e.target.value)}
                    placeholder="Enter initial problem or question prompt..."
                    className="w-full min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  />
                  <input
                    type="text"
                    value={assignLeadAnswer}
                    onChange={(e) => setAssignLeadAnswer(e.target.value)}
                    placeholder="Expected answer key / grading rubric..."
                    className="w-full min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Publish Assignment & Alert Students
                </button>
              </form>

              <div className="lg:col-span-7 space-y-4">
                {assignments.map((a) => {
                  const isEditingMeta = editingAssignmentId === a.id;
                  return (
                    <div
                      key={a.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <p className="text-xs font-mono text-slate-500">
                            {a.subject_code} · Due {new Date(a.due_date).toLocaleDateString()} · Max{' '}
                            {a.max_score} pts · {a.submissions_count ?? 0} Submissions (
                            {a.graded_count ?? 0} Graded)
                          </p>
                          {isEditingMeta ? (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={editAssignTitle}
                                onChange={(e) => setEditAssignTitle(e.target.value)}
                                className="flex-1 min-w-[200px] min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
                              />
                              <input
                                type="number"
                                value={editAssignMaxScore}
                                onChange={(e) => setEditAssignMaxScore(e.target.value)}
                                className="w-24 min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                                placeholder="Max Pts"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  await apiRequest(`/api/v1/teacher/assignments/${a.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                      title: editAssignTitle,
                                      max_score: Number(editAssignMaxScore) || a.max_score,
                                    }),
                                  });
                                  showToast('Assignment details updated.', 'success');
                                  setEditingAssignmentId(null);
                                  loadTasks();
                                }}
                                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingAssignmentId(null)}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <h3 className="text-base font-bold">{a.title}</h3>
                          )}
                          {a.description && (
                            <p className="text-xs text-slate-500">{a.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAssignmentId(a.id);
                              setEditAssignTitle(a.title);
                              setEditAssignMaxScore(String(a.max_score));
                            }}
                            title="Edit Assignment Details"
                            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-xs font-semibold flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await apiRequest(`/api/v1/teacher/assignments/${a.id}`, {
                                method: 'DELETE',
                              });
                              showToast('Assignment deleted.', 'info');
                              loadTasks();
                            }}
                            title="Delete Assignment"
                            className="min-h-[38px] min-w-[38px] rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Bank Manager for this Assignment */}
                      <QuestionBankManager
                        assessmentType="assignments"
                        assessmentId={a.id}
                        assessmentTitle={a.title}
                        subjectCode={a.subject_code}
                        questions={a.questions || []}
                        onUpdated={loadTasks}
                        showToast={showToast}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {taskMode === 'quizzes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleCreateQuiz}
                className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3.5 self-start"
              >
                <h2 className="text-lg font-bold font-display">Create Timed Quiz</h2>
                <div>
                  <label className="block text-xs font-semibold mb-1">Subject</label>
                  <select
                    value={newQuizSubjectId}
                    onChange={(e) => setNewQuizSubjectId(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  >
                    <option value={101}>MATH-10A: Mathematics 10</option>
                    <option value={103}>COMP-10S: Mobile Computing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Quiz Title</label>
                  <input
                    type="text"
                    value={newQuizTitle}
                    onChange={(e) => setNewQuizTitle(e.target.value)}
                    placeholder="e.g. Quiz #3: Inscribed Angles & Chords"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    value={newQuizTime}
                    onChange={(e) => setNewQuizTime(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Question Prompt</label>
                  <input
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Enter question text..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newChoiceA}
                    onChange={(e) => setNewChoiceA(e.target.value)}
                    placeholder="Choice A"
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  />
                  <input
                    type="text"
                    value={newChoiceB}
                    onChange={(e) => setNewChoiceB(e.target.value)}
                    placeholder="Choice B"
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  />
                  <input
                    type="text"
                    value={newChoiceC}
                    onChange={(e) => setNewChoiceC(e.target.value)}
                    placeholder="Choice C"
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  />
                  <input
                    type="text"
                    value={newChoiceD}
                    onChange={(e) => setNewChoiceD(e.target.value)}
                    placeholder="Choice D"
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Correct Answer</label>
                  <select
                    value={newCorrectChoice}
                    onChange={(e) => setNewCorrectChoice(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  >
                    <option value="A">Choice A</option>
                    <option value="B">Choice B</option>
                    <option value="C">Choice C</option>
                    <option value="D">Choice D</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Publish Quiz
                </button>
              </form>

              <div className="lg:col-span-7 space-y-4">
                {quizzes.map((q) => {
                  const isEditingMeta = editingQuizId === q.id;
                  return (
                    <div
                      key={q.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <p className="text-xs font-mono text-slate-500">
                            {q.subject_code} · {q.time_limit_minutes} mins · {q.questions.length}{' '}
                            questions · {q.total_points} pts
                          </p>
                          {isEditingMeta ? (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={editQuizTitle}
                                onChange={(e) => setEditQuizTitle(e.target.value)}
                                className="flex-1 min-w-[200px] min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
                              />
                              <input
                                type="number"
                                value={editQuizTime}
                                onChange={(e) => setEditQuizTime(e.target.value)}
                                className="w-24 min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                                placeholder="Minutes"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  await apiRequest(`/api/v1/teacher/quizzes/${q.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                      title: editQuizTitle,
                                      time_limit_minutes:
                                        Number(editQuizTime) || q.time_limit_minutes,
                                    }),
                                  });
                                  showToast('Quiz settings updated.', 'success');
                                  setEditingQuizId(null);
                                  loadTasks();
                                }}
                                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingQuizId(null)}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <h3 className="text-base font-bold">{q.title}</h3>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuizId(q.id);
                              setEditQuizTitle(q.title);
                              setEditQuizTime(String(q.time_limit_minutes));
                            }}
                            title="Edit Quiz Settings"
                            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-xs font-semibold flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await apiRequest(`/api/v1/teacher/quizzes/${q.id}`, {
                                method: 'DELETE',
                              });
                              showToast('Quiz deleted.', 'info');
                              loadTasks();
                            }}
                            title="Delete Quiz"
                            className="min-h-[38px] min-w-[38px] rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Bank Manager for this Quiz */}
                      <QuestionBankManager
                        assessmentType="quizzes"
                        assessmentId={q.id}
                        assessmentTitle={q.title}
                        subjectCode={q.subject_code}
                        questions={q.questions || []}
                        onUpdated={loadTasks}
                        showToast={showToast}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {taskMode === 'exams' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleCreateExam}
                className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 self-start"
              >
                <h2 className="text-lg font-bold font-display">Publish Departmental Exam</h2>
                <div>
                  <label className="block text-xs font-semibold mb-1">Subject</label>
                  <select
                    value={newExamSubjectId}
                    onChange={(e) => setNewExamSubjectId(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  >
                    <option value={101}>MATH-10A: Mathematics 10</option>
                    <option value={103}>COMP-10S: Mobile Computing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Examination Title</label>
                  <input
                    type="text"
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    placeholder="e.g. Midterm Departmental Exam — Applied Computing"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Lead Question (True/False Verification)
                  </label>
                  <input
                    type="text"
                    value={newExamQuestion}
                    onChange={(e) => setNewExamQuestion(e.target.value)}
                    placeholder="Enter statement..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Publish Examination
                </button>
              </form>

              <div className="lg:col-span-7 space-y-4">
                {exams.map((ex) => {
                  const isEditingMeta = editingExamId === ex.id;
                  return (
                    <div
                      key={ex.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <p className="text-xs font-mono text-emerald-600">
                            {ex.subject_code} · {ex.duration_minutes} mins · {ex.questions.length}{' '}
                            questions · {ex.total_points} pts · Server Auto-Save Enabled
                          </p>
                          {isEditingMeta ? (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={editExamTitle}
                                onChange={(e) => setEditExamTitle(e.target.value)}
                                className="flex-1 min-w-[200px] min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
                              />
                              <input
                                type="number"
                                value={editExamDuration}
                                onChange={(e) => setEditExamDuration(e.target.value)}
                                className="w-24 min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                                placeholder="Minutes"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  await apiRequest(`/api/v1/teacher/exams/${ex.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                      title: editExamTitle,
                                      duration_minutes:
                                        Number(editExamDuration) || ex.duration_minutes,
                                    }),
                                  });
                                  showToast('Examination settings updated.', 'success');
                                  setEditingExamId(null);
                                  loadTasks();
                                }}
                                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingExamId(null)}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <h3 className="text-base font-bold mt-0.5">{ex.title}</h3>
                          )}
                          <p className="text-xs text-slate-500 mt-1">{ex.instructions}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExamId(ex.id);
                              setEditExamTitle(ex.title);
                              setEditExamDuration(String(ex.duration_minutes));
                            }}
                            title="Edit Examination Settings"
                            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-xs font-semibold flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await apiRequest(`/api/v1/teacher/exams/${ex.id}`, {
                                method: 'DELETE',
                              });
                              showToast('Examination deleted.', 'info');
                              loadTasks();
                            }}
                            title="Delete Examination"
                            className="min-h-[38px] min-w-[38px] rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Bank Manager for this Examination */}
                      <QuestionBankManager
                        assessmentType="exams"
                        assessmentId={ex.id}
                        assessmentTitle={ex.title}
                        subjectCode={ex.subject_code}
                        questions={ex.questions || []}
                        onUpdated={loadTasks}
                        showToast={showToast}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: TEACHER GRADEBOOK & ANALYTICS REPORTS
      ===================================================================== */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">
                Official Gradebook & Performance Reports
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage weighted grades, edit scores, and export CSV reports.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setResultsMode('gradebook')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                    resultsMode === 'gradebook'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Gradebook
                </button>
                <button
                  type="button"
                  onClick={() => setResultsMode('reports')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                    resultsMode === 'reports'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Analytics Charts
                </button>
              </div>
              <button
                type="button"
                onClick={handleExportGradebookCsv}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {resultsMode === 'gradebook' ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-3">Subject</th>
                    <th className="py-3.5 px-3 text-right font-mono">Assignments (40%)</th>
                    <th className="py-3.5 px-3 text-right font-mono">Quizzes (30%)</th>
                    <th className="py-3.5 px-3 text-right font-mono">Exams (30%)</th>
                    <th className="py-3.5 px-3 text-right font-mono">Final Grade</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {gradebook.map((row) => {
                    const isEditing = editingRowId === row.student_subject_id;
                    return (
                      <tr key={row.student_subject_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {row.student_name}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {row.student_school_id} · {row.section}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono">{row.subject_code}</td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editAssignAvg}
                              onChange={(e) => setEditAssignAvg(e.target.value)}
                              className="w-16 px-2 py-1 rounded border text-right font-mono"
                            />
                          ) : (
                            `${row.assignment_avg}%`
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editQuizAvg}
                              onChange={(e) => setEditQuizAvg(e.target.value)}
                              className="w-16 px-2 py-1 rounded border text-right font-mono"
                            />
                          ) : (
                            `${row.quiz_avg}%`
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editExamAvg}
                              onChange={(e) => setEditExamAvg(e.target.value)}
                              className="w-16 px-2 py-1 rounded border text-right font-mono"
                            />
                          ) : (
                            `${row.exam_avg}%`
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-emerald-600">
                          {row.final_grade}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => handleSaveGradebookRow(row.student_subject_id)}
                              className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRowId(row.student_subject_id);
                                setEditAssignAvg(String(row.assignment_avg));
                                setEditQuizAvg(String(row.quiz_avg));
                                setEditExamAvg(String(row.exam_avg));
                              }}
                              className="min-h-[36px] px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
              <h2 className="text-lg font-bold font-display">
                Class Performance Distribution & Mastery Analytics
              </h2>
              <div className="space-y-4">
                {gradebook.map((row) => (
                  <div key={row.student_subject_id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">
                        {row.student_name} ({row.subject_code})
                      </span>
                      <span className="font-mono font-bold">{row.final_grade}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${row.final_grade}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: TEACHER PROFILE
      ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-emerald-600">TEACHER ID: {user.school_id}</p>
              <h1 className="text-2xl font-bold font-display">{user.name}</h1>
              <p className="text-xs text-slate-500">
                {user.department} · {user.specialization}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-2"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await apiRequest<{ user: User; message: string }>('/api/v1/me', {
                  method: 'PUT',
                  body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    contact_number: contactNumber,
                  }),
                });
                onUserUpdated(res.user);
                showToast(res.message, 'success');
              } catch (err: any) {
                showToast(err?.message || 'Update failed', 'error');
              }
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl"
          >
            <h2 className="text-lg font-bold font-display">Edit Faculty Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Contact Number</label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
              >
                Save Faculty Profile
              </button>
              <button
                type="button"
                onClick={async () => {
                  const rotated = await performSingleFlightRefresh();
                  if (rotated) {
                    showToast('Rotated refresh token & issued new 15m access token.', 'success');
                  }
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Rotate Token Pair Now
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          FIXED BOTTOM NAVIGATION BAR (TEACHER: 5 TABS)
      ===================================================================== */}
      <nav
        aria-label="Teacher Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-xl mx-auto grid grid-cols-5 items-center h-16 px-2">
          {(
            [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'classes', label: 'Classes', icon: BookOpen },
              { id: 'tasks', label: 'Tasks', icon: ClipboardList },
              { id: 'results', label: 'Results', icon: BarChart3 },
              { id: 'profile', label: 'Profile', icon: UserIcon },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] tracking-tight mt-1 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* QR Code Display Modal for Teachers to Show Class/Assignment Codes */}
      {displayQRModal && (
        <QRCodeDisplayModal
          isOpen={displayQRModal.isOpen}
          onClose={() => setDisplayQRModal(null)}
          title={displayQRModal.title}
          subtitle={displayQRModal.subtitle}
          payload={displayQRModal.payload}
          type={displayQRModal.type}
          codeLabel={displayQRModal.codeLabel}
          showToast={showToast}
        />
      )}
    </div>
  );
};
