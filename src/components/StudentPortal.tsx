import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home,
  BookOpen,
  ClipboardCheck,
  Bell,
  User as UserIcon,
  Play,
  CheckCircle2,
  Clock,
  Upload,
  FileText,
  Camera,
  ChevronRight,
  ArrowLeft,
  Award,
  RefreshCw,
  LogOut,
  Shield,
  Mail,
  CheckCheck,
  AlertTriangle,
  Moon,
  Sun,
  QrCode,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  apiRequest,
  AuthTokenManager,
  performSingleFlightRefresh,
} from '../services/api';
import type {
  User,
  Subject,
  LearningModule,
  VideoLesson,
  Assignment,
  Quiz,
  Exam,
  AssessmentAttempt,
  SubjectGradeSummary,
  AppNotification,
  DirectMessage,
  TokenSession,
  StudentProgressAnalytics,
  StudyResource,
  WeeklyStudyScheduleData,
  FocusStats,
  MonthlyLearningIntensity,
  SchoolAnnouncement,
} from '../types/lms';
import { StudentProgressDashboard } from './StudentProgressDashboard';
import { QRCodeScannerModal } from './QRCodeScannerModal';
import { StudentPerformanceOverviewWidget } from './StudentPerformanceOverviewWidget';
import { StudentModuleSearch } from './StudentModuleSearch';
import { CircularProgressIndicator } from './CircularProgressIndicator';
import { StudentResourceHub } from './StudentResourceHub';
import { WeeklyStudySchedule } from './WeeklyStudySchedule';
import { StudentFocusTimer } from './StudentFocusTimer';
import { LearningIntensityHeatmap } from './LearningIntensityHeatmap';
import { AnnouncementsMarqueeTicker } from './AnnouncementsMarqueeTicker';

interface StudentPortalProps {
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type StudentTab = 'home' | 'subjects' | 'tasks' | 'notifications' | 'profile';

export const StudentPortal: React.FC<StudentPortalProps> = ({
  user,
  onUserUpdated,
  onLogout,
  darkMode,
  onToggleDarkMode,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTab>('home');

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Subjects state
  const [subjectSection, setSubjectSection] = useState<'enrolled' | 'available' | 'resources'>('enrolled');
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [assignedModules, setAssignedModules] = useState<LearningModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [studyResources, setStudyResources] = useState<StudyResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyStudyScheduleData | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [focusStats, setFocusStats] = useState<FocusStats | null>(null);
  const [loadingFocus, setLoadingFocus] = useState(false);
  const [learningIntensity, setLearningIntensity] = useState<MonthlyLearningIntensity | null>(null);
  const [loadingIntensity, setLoadingIntensity] = useState(false);
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [subjectDetail, setSubjectDetail] = useState<{
    subject: Subject;
    modules: LearningModule[];
    videos: VideoLesson[];
    assignments: Assignment[];
    quizzes: Quiz[];
    exams: Exam[];
    grades: any;
  } | null>(null);
  const [subjectDetailTab, setSubjectDetailTab] = useState<
    'overview' | 'modules' | 'videos' | 'assignments' | 'quizzes' | 'exams' | 'grades'
  >('overview');
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Tasks sub-navigation ('assignments' | 'quizzes' | 'exams' | 'progress')
  const [taskSubTab, setTaskSubTab] = useState<'assignments' | 'quizzes' | 'exams' | 'progress'>(
    'assignments'
  );
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState<string>('All');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<number, string>>({});
  const [uploadFiles, setUploadFiles] = useState<{ name: string; type: string; size_kb: number }[]>(
    []
  );
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Quizzes & Active Quiz Player
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuizSession, setActiveQuizSession] = useState<{
    quiz: Quiz;
    attempt: AssessmentAttempt;
  } | null>(null);
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [confirmQuizSubmit, setConfirmQuizSubmit] = useState(false);
  const [quizResult, setQuizResult] = useState<AssessmentAttempt | null>(null);
  const [quizRemainingSec, setQuizRemainingSec] = useState<number>(0);

  // Exams & Server-Authoritative Exam Interface
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeExamSession, setActiveExamSession] = useState<{
    exam: Exam;
    attempt: AssessmentAttempt;
    resumed: boolean;
  } | null>(null);
  const [examQuestionIdx, setExamQuestionIdx] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examSaveState, setExamSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [confirmExamSubmit, setConfirmExamSubmit] = useState(false);
  const [examResult, setExamResult] = useState<AssessmentAttempt | null>(null);
  const [examRemainingSec, setExamRemainingSec] = useState<number>(0);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [submittingExam, setSubmittingExam] = useState(false);
  const [requestingRetakeKey, setRequestingRetakeKey] = useState<string | null>(null);
  const [retakeReasons, setRetakeReasons] = useState<Record<string, string>>({});

  // Progress / Grades / Report Card
  const [gradesData, setGradesData] = useState<{
    overall_average: number;
    school_year: string;
    semester: string;
    subjects: SubjectGradeSummary[];
  } | null>(null);
  const [progressAnalytics, setProgressAnalytics] = useState<StudentProgressAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Notifications & Messages
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [notifView, setNotifView] = useState<'notifications' | 'messages'>('notifications');
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<string>('All');

  // Profile & Security Sessions
  const [firstName, setFirstName] = useState(user.first_name);
  const [middleName, setMiddleName] = useState(user.middle_name || '');
  const [lastName, setLastName] = useState(user.last_name);
  const [email, setEmail] = useState(user.email);
  const [contactNumber, setContactNumber] = useState(user.contact_number);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activeSessions, setActiveSessions] = useState<(TokenSession & { is_current?: boolean })[]>(
    []
  );
  const [tokenMeta, setTokenMeta] = useState(AuthTokenManager.getTokenMetadata());

  useEffect(() => {
    const unsub = AuthTokenManager.onTokenStateChange(() => {
      setTokenMeta(AuthTokenManager.getTokenMetadata());
    });
    return () => {
      unsub();
    };
  }, []);

  const loadProgressAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await apiRequest<{ analytics: StudentProgressAnalytics }>(
        '/api/v1/student/progress-analytics'
      );
      setProgressAnalytics(res.analytics);
    } catch {
      // non-blocking
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const handleToggleLesson = async (lessonId: number) => {
    try {
      const res = await apiRequest<{ lesson_id: number; completed: boolean; message: string }>(
        `/api/v1/student/lessons/${lessonId}/toggle`,
        { method: 'POST' }
      );
      showToast(res.message, 'success');
      await Promise.all([loadProgressAnalytics(), loadDashboard()]);
      if (selectedSubjectId) {
        await loadSubjectDetail(selectedSubjectId);
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not update lesson progress', 'error');
    }
  };

  const loadAssignedModules = useCallback(async () => {
    setLoadingModules(true);
    try {
      const res = await apiRequest<{ modules: LearningModule[] }>('/api/v1/student/modules');
      setAssignedModules(res.modules || []);
    } catch {
      // fallback
    } finally {
      setLoadingModules(false);
    }
  }, []);

  const handleOpenModuleFromSearch = (subjectId: number, moduleId: number) => {
    setSelectedSubjectId(subjectId);
    setSubjectDetailTab('modules');
    loadSubjectDetail(subjectId).then(() => {
      setTimeout(() => {
        const el = document.getElementById(`module-card-${moduleId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    });
  };

  const loadStudyResources = useCallback(async () => {
    setLoadingResources(true);
    try {
      const res = await apiRequest<{ resources: StudyResource[] }>('/api/v1/student/resources');
      setStudyResources(res.resources || []);
    } catch {
      // fallback
    } finally {
      setLoadingResources(false);
    }
  }, []);

  const loadWeeklySchedule = useCallback(async () => {
    setLoadingSchedule(true);
    try {
      const res = await apiRequest<{ schedule: WeeklyStudyScheduleData }>(
        '/api/v1/student/study-schedule'
      );
      setWeeklySchedule(res.schedule || null);
    } catch {
      // fallback
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  const loadFocusStats = useCallback(async () => {
    setLoadingFocus(true);
    try {
      const res = await apiRequest<{ stats: FocusStats }>('/api/v1/student/focus-sessions');
      setFocusStats(res.stats || null);
    } catch {
      // fallback
    } finally {
      setLoadingFocus(false);
    }
  }, []);

  const loadLearningIntensity = useCallback(async () => {
    setLoadingIntensity(true);
    try {
      const res = await apiRequest<{ intensity: MonthlyLearningIntensity }>(
        '/api/v1/student/learning-intensity'
      );
      setLearningIntensity(res.intensity || null);
    } catch {
      // fallback
    } finally {
      setLoadingIntensity(false);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await apiRequest<{ announcements: SchoolAnnouncement[] }>(
        '/api/v1/student/announcements'
      );
      setAnnouncements(res.announcements || []);
    } catch {
      // fallback
    } finally {
      setLoadingAnnouncements(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const [data, gradesRes] = await Promise.all([
        apiRequest('/api/v1/student/dashboard'),
        apiRequest('/api/v1/student/grades').catch(() => null),
        loadProgressAnalytics(),
        loadAssignedModules(),
        loadStudyResources(),
        loadWeeklySchedule(),
        loadFocusStats(),
        loadLearningIntensity(),
        loadAnnouncements(),
      ]);
      setDashboardData(data);
      if (gradesRes) {
        setGradesData(gradesRes);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoadingDashboard(false);
    }
  }, [
    showToast,
    loadProgressAnalytics,
    loadAssignedModules,
    loadStudyResources,
    loadWeeklySchedule,
    loadFocusStats,
    loadLearningIntensity,
    loadAnnouncements,
  ]);

  const loadSubjects = useCallback(async () => {
    try {
      const [data] = await Promise.all([
        apiRequest<{ enrolled: Subject[]; available: Subject[] }>('/api/v1/student/subjects'),
        loadAssignedModules(),
      ]);
      setEnrolledSubjects(data.enrolled);
      setAvailableSubjects(data.available);
    } catch (err: any) {
      showToast(err?.message || 'Could not load subjects', 'error');
    }
  }, [showToast, loadAssignedModules]);

  const loadSubjectDetail = useCallback(
    async (subjectId: number) => {
      try {
        const data = await apiRequest(`/api/v1/student/subjects/${subjectId}`);
        setSubjectDetail(data);
        if (data.videos?.length > 0 && !activeVideo) {
          setActiveVideo(data.videos[0]);
        }
      } catch (err: any) {
        showToast(err?.message || 'Could not load subject details', 'error');
      }
    },
    [activeVideo, showToast]
  );

  const loadTasksData = useCallback(async () => {
    try {
      const [assignRes, quizRes, examRes, gradesRes] = await Promise.all([
        apiRequest<{ assignments: Assignment[] }>('/api/v1/student/assignments'),
        apiRequest<{ quizzes: Quiz[] }>('/api/v1/student/quizzes'),
        apiRequest<{ exams: Exam[] }>('/api/v1/student/exams'),
        apiRequest<any>('/api/v1/student/grades'),
        loadProgressAnalytics(),
      ]);
      setAssignments(assignRes.assignments);
      setQuizzes(quizRes.quizzes);
      setExams(examRes.exams);
      setGradesData(gradesRes);
    } catch (err: any) {
      showToast(err?.message || 'Could not load tasks', 'error');
    }
  }, [showToast, loadProgressAnalytics]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await apiRequest<{
        notifications: AppNotification[];
        messages: DirectMessage[];
      }>('/api/v1/student/notifications');
      setNotifications(data.notifications);
      setMessages(data.messages);
    } catch (err: any) {
      showToast(err?.message || 'Could not load notifications', 'error');
    }
  }, [showToast]);

  const loadProfileSessions = useCallback(async () => {
    try {
      const data = await apiRequest<{ active_sessions: TokenSession[] }>('/api/v1/me');
      setActiveSessions(data.active_sessions);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadNotifications();
  }, [loadDashboard, loadNotifications]);

  useEffect(() => {
    if (activeTab === 'subjects') loadSubjects();
    if (activeTab === 'tasks') loadTasksData();
    if (activeTab === 'notifications') loadNotifications();
    if (activeTab === 'profile') loadProfileSessions();
  }, [activeTab, loadSubjects, loadTasksData, loadNotifications, loadProfileSessions]);

  // Quiz & Exam Countdown Timers
  useEffect(() => {
    if (!activeQuizSession) return;
    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(activeQuizSession.attempt.expires_at).getTime() - Date.now()) / 1000)
      );
      setQuizRemainingSec(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeQuizSession]);

  useEffect(() => {
    if (!activeExamSession) return;
    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(activeExamSession.attempt.expires_at).getTime() - Date.now()) / 1000)
      );
      setExamRemainingSec(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeExamSession]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Actions
  const handleEnrollSubject = async (subjectId: number) => {
    try {
      const res = await apiRequest<{ message: string }>(
        `/api/v1/student/subjects/${subjectId}/enroll`,
        { method: 'POST' }
      );
      showToast(res.message, 'success');
      await loadSubjects();
      await loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Enrollment failed', 'error');
    }
  };

  const handleSaveVideoProgress = async (video: VideoLesson, currentTime: number, ended = false) => {
    try {
      await apiRequest(`/api/v1/student/videos/${video.id}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          watched_seconds: Math.round(currentTime),
          completed: ended,
        }),
      });
      if (selectedSubjectId) {
        loadSubjectDetail(selectedSubjectId);
      }
    } catch {
      // non-blocking
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const added: { name: string; type: string; size_kb: number }[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      added.push({
        name: f.name,
        type: f.type || 'application/octet-stream',
        size_kb: Math.max(12, Math.round(f.size / 1024)),
      });
    }
    setUploadFiles((prev) => [...prev, ...added]);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (
      selectedAssignment.status &&
      selectedAssignment.status !== 'Pending' &&
      selectedAssignment.status !== 'Returned'
    ) {
      showToast('This assignment has already been submitted and is locked.', 'info');
      return;
    }
    const hasAnsweredQuestions = Object.keys(assignmentAnswers).some(
      (k) => String(assignmentAnswers[Number(k)] || '').trim().length > 0
    );
    if (uploadFiles.length === 0 && !hasAnsweredQuestions) {
      showToast(
        'Please answer the assignment questions or attach at least one file (Camera, Photo, PDF, or Document).',
        'error'
      );
      return;
    }
    setSubmittingAssignment(true);
    try {
      const res = await apiRequest<{ message: string; submission: any }>(
        `/api/v1/student/assignments/${selectedAssignment.id}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            files: uploadFiles,
            notes: submissionNotes,
            answers: assignmentAnswers,
          }),
        }
      );
      showToast(res.message, 'success');
      if (res.submission) {
        setSelectedAssignment((prev) =>
          prev
            ? {
                ...prev,
                status: res.submission.status,
                score: res.submission.score,
                correct_items: res.submission.correct_items,
                total_items: res.submission.total_items ?? prev.questions?.length ?? 0,
                passed: res.submission.passed,
                remark: res.submission.remark,
                feedback: res.submission.feedback,
                submitted_at: res.submission.submitted_at,
                submitted_files: res.submission.files,
                submission_notes: res.submission.notes,
                answers: res.submission.answers || assignmentAnswers,
              }
            : null
        );
      }
      await loadTasksData();
      await loadDashboard();
      if (selectedSubjectId) {
        await loadSubjectDetail(selectedSubjectId);
      }
    } catch (err: any) {
      showToast(err?.message || 'Submission failed', 'error');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleRequestRetake = async (assessmentType: 'quiz' | 'exam', assessmentId: number) => {
    const key = `${assessmentType}_${assessmentId}`;
    setRequestingRetakeKey(key);
    try {
      const res = await apiRequest<{ message: string }>('/api/v1/student/retake-requests', {
        method: 'POST',
        body: JSON.stringify({
          assessment_type: assessmentType,
          assessment_id: assessmentId,
          reason:
            retakeReasons[key] ||
            'Requesting teacher approval to retake and improve mastery score.',
        }),
      });
      showToast(res.message, 'success');
      await loadTasksData();
      await loadDashboard();
      if (selectedSubjectId) {
        await loadSubjectDetail(selectedSubjectId);
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not submit retake request', 'error');
    } finally {
      setRequestingRetakeKey(null);
    }
  };

  const handleStartQuiz = async (quizId: number) => {
    try {
      const res = await apiRequest<{ quiz: Quiz; attempt: AssessmentAttempt }>(
        `/api/v1/student/quizzes/${quizId}/start`,
        { method: 'POST' }
      );
      setActiveQuizSession(res);
      setQuizAnswers(res.attempt.answers || {});
      setQuizQuestionIdx(0);
      setQuizResult(null);
      setConfirmQuizSubmit(false);
    } catch (err: any) {
      showToast(err?.message || 'Cannot start quiz', 'error');
    }
  };

  const handleSelectQuizAnswer = async (questionId: number, choiceId: string) => {
    if (!activeQuizSession) return;
    const next = { ...quizAnswers, [questionId]: choiceId };
    setQuizAnswers(next);
    try {
      await apiRequest(`/api/v1/student/quizzes/${activeQuizSession.quiz.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ question_id: questionId, answer: choiceId }),
      });
    } catch {
      // local state kept
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizSession || submittingQuiz) return;
    setSubmittingQuiz(true);
    try {
      const res = await apiRequest<{ message: string; attempt: AssessmentAttempt }>(
        `/api/v1/student/quizzes/${activeQuizSession.quiz.id}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answers: quizAnswers }),
        }
      );
      setQuizResult(res.attempt);
      setConfirmQuizSubmit(false);
      showToast(res.message, 'success');
      await loadTasksData();
      await loadDashboard();
      if (selectedSubjectId) {
        await loadSubjectDetail(selectedSubjectId);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit quiz', 'error');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleStartOrResumeExam = async (examId: number) => {
    try {
      const res = await apiRequest<{
        exam: Exam;
        attempt: AssessmentAttempt;
        resumed: boolean;
      }>(`/api/v1/student/exams/${examId}/start`, { method: 'POST' });
      setActiveExamSession(res);
      setExamAnswers(res.attempt.answers || {});
      setExamQuestionIdx(0);
      setExamResult(null);
      setConfirmExamSubmit(false);
      if (res.resumed) {
        showToast('Resumed your active examination session from the server.', 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Cannot start examination', 'error');
    }
  };

  const handleSelectExamAnswer = async (questionId: number, choiceId: string) => {
    if (!activeExamSession) return;
    const next = { ...examAnswers, [questionId]: choiceId };
    setExamAnswers(next);
    setExamSaveState('saving');
    try {
      await apiRequest(`/api/v1/student/exams/${activeExamSession.exam.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ question_id: questionId, answer: choiceId }),
      });
      setExamSaveState('saved');
    } catch {
      setExamSaveState('idle');
    }
  };

  const handleSubmitExam = async () => {
    if (!activeExamSession || submittingExam) return;
    setSubmittingExam(true);
    try {
      const res = await apiRequest<{ message: string; attempt: AssessmentAttempt }>(
        `/api/v1/student/exams/${activeExamSession.exam.id}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answers: examAnswers }),
        }
      );
      setExamResult(res.attempt);
      setConfirmExamSubmit(false);
      showToast(res.message, 'success');
      await loadTasksData();
      await loadDashboard();
      if (selectedSubjectId) {
        await loadSubjectDetail(selectedSubjectId);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit examination', 'error');
    } finally {
      setSubmittingExam(false);
    }
  };

  const handleNotificationDeepLink = async (notif: AppNotification) => {
    try {
      if (!notif.read) {
        await apiRequest(`/api/v1/student/notifications/${notif.id}/read`, { method: 'POST' });
      }
    } catch {
      // ignore
    }
    if (notif.target_type === 'assignment') {
      setActiveTab('tasks');
      setTaskSubTab('assignments');
    } else if (notif.target_type === 'quiz') {
      setActiveTab('tasks');
      setTaskSubTab('quizzes');
    } else if (notif.target_type === 'exam') {
      setActiveTab('tasks');
      setTaskSubTab('exams');
    } else if (notif.target_type === 'subject' && notif.target_id) {
      setActiveTab('subjects');
      setSelectedSubjectId(notif.target_id);
      loadSubjectDetail(notif.target_id);
    }
    loadNotifications();
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await apiRequest('/api/v1/student/notifications/read-all', { method: 'POST' });
      showToast('All notifications marked as read.', 'success');
      loadNotifications();
    } catch (err: any) {
      showToast(err?.message || 'Error updating notifications', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ user: User; message: string }>('/api/v1/me', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email,
          contact_number: contactNumber,
        }),
      });
      onUserUpdated(res.user);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ message: string }>('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      showToast(res.message, 'success');
      loadProfileSessions();
    } catch (err: any) {
      showToast(err?.message || 'Password change failed', 'error');
    }
  };

  const handleManualTokenRotate = async () => {
    const res = await performSingleFlightRefresh();
    if (res) {
      showToast(
        `Rotated refresh token & issued new 15m RAM access token (Session ${res.session_id.slice(0, 12)}).`,
        'success'
      );
      loadProfileSessions();
    } else {
      showToast('Token rotation failed.', 'error');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
      {/* Scrolling Marquee Announcements Ticker (Urgent Updates & Maintenance Notices) */}
      <AnnouncementsMarqueeTicker
        announcements={announcements}
        loading={loadingAnnouncements}
      />

      {/* =====================================================================
          TAB 1: STUDENT HOME DASHBOARD
      ===================================================================== */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Student Hero Greeting */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 border border-emerald-600/30 overflow-hidden flex items-center justify-center shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {user.first_name[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.grade_level} · {user.section} · ID{' '}
                  <span className="font-mono">{user.school_id}</span>
                </p>
                <h1 className="text-2xl font-bold tracking-tight font-display mt-0.5">
                  Good morning, {user.first_name}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowQRScanner(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QR Code</span>
              </button>
              <button
                type="button"
                onClick={loadDashboard}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDashboard ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync Portal</span>
              </button>
            </div>
          </div>

          {/* Performance Overview Widget (Server-authoritative weighted average grade across all subjects) */}
          <StudentPerformanceOverviewWidget
            overview={
              dashboardData?.performance_overview ||
              (gradesData?.subjects?.length
                ? {
                    weighted_average_grade: gradesData.overall_average,
                    general_weighted_average: gradesData.overall_average,
                    subjects_evaluated: gradesData.subjects.length,
                    highest_grade: Math.max(...gradesData.subjects.map((s: any) => s.final_grade)),
                    lowest_grade: Math.min(...gradesData.subjects.map((s: any) => s.final_grade)),
                    academic_standing:
                      gradesData.overall_average >= 98
                        ? 'With Highest Honors'
                        : gradesData.overall_average >= 95
                        ? 'With High Honors'
                        : gradesData.overall_average >= 90
                        ? 'With Honors'
                        : gradesData.overall_average >= 75
                        ? 'In Good Standing'
                        : 'Needs Academic Support',
                    subjects: gradesData.subjects.map((s: any) => ({
                      subject_id: s.subject_id,
                      subject_code: s.subject_code,
                      subject_name: s.subject_name,
                      final_grade: s.final_grade,
                      assignment_avg: s.assignment_avg,
                      quiz_avg: s.quiz_avg,
                      exam_avg: s.exam_avg,
                      progress: s.progress,
                      remarks: s.remarks || (s.final_grade >= 75 ? 'Passed' : 'Needs Improvement'),
                      honors_status:
                        s.final_grade >= 98
                          ? 'With Highest Honors'
                          : s.final_grade >= 95
                          ? 'With High Honors'
                          : s.final_grade >= 90
                          ? 'With Honors'
                          : s.final_grade >= 75
                          ? 'In Good Standing'
                          : 'Remediation Required',
                    })),
                  }
                : null)
            }
            onViewReportCard={() => setShowReportCardModal(true)}
            onSelectSubject={(subjId) => {
              setActiveTab('subjects');
              setSubjectSection('enrolled');
              loadSubjects();
              loadSubjectDetail(subjId);
            }}
          />

          {/* 4 Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <button
              type="button"
              onClick={() => setActiveTab('subjects')}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left hover:border-emerald-500/50 transition-colors"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">Enrolled Subjects</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                {dashboardData?.statistics?.enrolled_subjects ?? 3}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                SY 2026–2027 · Active
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('tasks');
                setTaskSubTab('assignments');
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left hover:border-emerald-500/50 transition-colors"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">Pending Assignments</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                {dashboardData?.statistics?.pending_assignments ?? 2}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Requires submission
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('tasks');
                setTaskSubTab('quizzes');
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left hover:border-emerald-500/50 transition-colors"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">Available Quizzes</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                {dashboardData?.statistics?.available_quizzes ?? 2}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Timed assessments
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('tasks');
                setTaskSubTab('exams');
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-left hover:border-emerald-500/50 transition-colors"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400">Available Exams</p>
              <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                {dashboardData?.statistics?.available_exams ?? 2}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Server auto-save active
              </p>
            </button>
          </div>

          {/* Quick QR Scanner Banner Card */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono text-emerald-100 uppercase tracking-wider block font-semibold">
                  Fast Class Join & Assignment Submission
                </span>
                <h3 className="text-base sm:text-lg font-bold font-display leading-snug">
                  Point your camera at a TNHS QR code
                </h3>
                <p className="text-xs text-emerald-100/90 leading-relaxed max-w-lg">
                  Instant camera scanner to join new subjects, enroll in sections, or scan assignment submission codes on worksheets.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQRScanner(true)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold shrink-0 self-start sm:self-auto flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>Launch QR Scanner</span>
            </button>
          </div>

          {/* Weekly Study Schedule Section (Calendar-like view for time management) */}
          <WeeklyStudySchedule
            scheduleData={weeklySchedule}
            loading={loadingSchedule}
            onOpenAssignment={(asgId) => {
              setActiveTab('tasks');
              setTaskSubTab('assignments');
              loadTasksData().then(() => {
                const found = assignments.find((a) => a.id === asgId);
                if (found) {
                  setSelectedAssignment(found);
                  setAssignmentAnswers(found.answers || {});
                  setUploadFiles(found.submitted_files || []);
                  setSubmissionNotes(found.submission_notes || '');
                }
              });
            }}
            onOpenQuiz={(_quizId) => {
              setActiveTab('tasks');
              setTaskSubTab('quizzes');
              loadTasksData();
            }}
            onOpenExam={(_examId) => {
              setActiveTab('tasks');
              setTaskSubTab('exams');
              loadTasksData();
            }}
          />

          {/* Resource Hub Widget (Download study materials & supplementary PDFs for active modules) */}
          <StudentResourceHub
            resources={studyResources}
            modules={assignedModules}
            loading={loadingResources}
            onOpenModule={(subjId, modId) => handleOpenModuleFromSearch(subjId, modId)}
            showToast={showToast}
          />

          {/* Focus Session Timer Widget (Pomodoro timer with study time stats) */}
          <StudentFocusTimer
            modules={assignedModules}
            stats={focusStats}
            onSessionLogged={() => {
              loadFocusStats();
              loadLearningIntensity();
            }}
            showToast={showToast}
          />

          {/* Learning Intensity Heatmap (Monthly distribution of deadlines & study activity) */}
          <LearningIntensityHeatmap
            intensityData={learningIntensity}
            loading={loadingIntensity}
          />

          {/* Continue Learning Focal Card */}
          {dashboardData?.continue_learning && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-2 max-w-xl">
                <p className="text-xs font-mono text-emerald-400">
                  CONTINUE LEARNING · {dashboardData.continue_learning.subject_code}
                </p>
                <h2 className="text-xl font-bold tracking-tight font-display">
                  {dashboardData.continue_learning.subject_name}
                </h2>
                <p className="text-sm text-slate-300">
                  {dashboardData.continue_learning.module_title}
                </p>
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>Course Mastery Progress</span>
                    <span>{dashboardData.continue_learning.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${dashboardData.continue_learning.progress_percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const subjId = dashboardData.continue_learning.subject_id;
                  setSelectedSubjectId(subjId);
                  setSubjectDetailTab('modules');
                  loadSubjectDetail(subjId);
                  setActiveTab('subjects');
                }}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shrink-0 whitespace-nowrap transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Continue Module</span>
              </button>
            </div>
          )}

          {/* Interactive Recharts Progress Dashboard */}
          {progressAnalytics && (
            <div className="pt-2">
              <StudentProgressDashboard
                analytics={progressAnalytics}
                loading={loadingAnalytics}
                onRefresh={loadProgressAnalytics}
                onToggleLesson={handleToggleLesson}
                onOpenReportCard={() => setShowReportCardModal(true)}
                onNavigateToTasks={(tab) => {
                  setActiveTab('tasks');
                  setTaskSubTab(tab);
                }}
                darkMode={darkMode}
              />
            </div>
          )}

          {/* Two-column Upcoming Deadlines & Recent Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight font-display">
                  Upcoming Academic Deadlines
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline min-h-[36px] flex items-center"
                >
                  View all tasks
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(dashboardData?.upcoming || []).map((item: any, idx: number) => (
                  <button
                    key={`${item.type}-${item.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      setActiveTab('tasks');
                      if (item.type === 'Assignment') setTaskSubTab('assignments');
                      if (item.type === 'Quiz') setTaskSubTab('quizzes');
                      if (item.type === 'Examination') setTaskSubTab('exams');
                    }}
                    className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.type} · {item.subject_name}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                        {item.title}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-amber-700 dark:text-amber-400">
                        Due {new Date(item.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight font-display">
                  Recent Notifications
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline min-h-[36px] flex items-center"
                >
                  Open inbox
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(dashboardData?.recent_notifications || notifications.slice(0, 4)).map(
                  (n: AppNotification) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationDeepLink(n)}
                      className="w-full py-3.5 flex items-start justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {n.category} · {new Date(n.created_at).toLocaleDateString()}
                          {!n.read ? ' · Unread' : ''}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: STUDENT SUBJECTS & SUBJECT DETAILS (7 TABS + VIDEO PLAYER)
      ===================================================================== */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          {!selectedSubjectId || !subjectDetail ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight font-display">
                    Academic Subjects
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Access your enrolled subjects or browse available TNHS courses to enroll.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-2xs"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Join Class via QR</span>
                  </button>

                  {/* Segmented Interactive Filter Control */}
                  <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSubjectSection('enrolled')}
                      className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        subjectSection === 'enrolled'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      My Subjects ({enrolledSubjects.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectSection('available')}
                      className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        subjectSection === 'available'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Available Subjects ({availableSubjects.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectSection('resources')}
                      className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        subjectSection === 'resources'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Resource Hub ({studyResources.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Module Search Input Bar for filtering assigned modules by title or subject tags */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white leading-tight">
                        Assigned Modules Quick-Search
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Filter coursework by title or subject tags for faster learning navigation
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">
                    {assignedModules.length} Modules Assigned
                  </span>
                </div>

                <StudentModuleSearch
                  modules={assignedModules}
                  loading={loadingModules}
                  onOpenModule={(subjId, modId) => handleOpenModuleFromSearch(subjId, modId)}
                  onSelectSubject={(subjId) => {
                    setSelectedSubjectId(subjId);
                    setSubjectDetailTab('overview');
                    loadSubjectDetail(subjId);
                  }}
                />
              </div>

              {subjectSection === 'resources' ? (
                <StudentResourceHub
                  resources={studyResources}
                  modules={assignedModules}
                  loading={loadingResources}
                  onOpenModule={(subjId, modId) => handleOpenModuleFromSearch(subjId, modId)}
                  showToast={showToast}
                />
              ) : subjectSection === 'enrolled' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledSubjects.map((subj) => (
                    <div
                      key={subj.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {subj.code} · {subj.grade_level} · {subj.section}
                        </p>
                        <h2 className="text-lg font-bold tracking-tight font-display">
                          {subj.name}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Instructor: {subj.teacher_name} · {subj.schedule}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                          {subj.modules_count} Modules · {subj.assignments_count} Assignments ·{' '}
                          {subj.quizzes_count} Quizzes · {subj.exams_count} Exams
                        </p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span>Completion Progress</span>
                            <span>{subj.progress ?? 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${subj.progress ?? 0}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubjectId(subj.id);
                            setSubjectDetailTab('overview');
                            loadSubjectDetail(subj.id);
                          }}
                          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                          <span>Open Subject Classroom</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableSubjects.length === 0 ? (
                    <div className="col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-semibold">
                        You are enrolled in all available subjects for your grade level!
                      </p>
                    </div>
                  ) : (
                    availableSubjects.map((subj) => (
                      <div
                        key={subj.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <p className="text-xs font-mono text-slate-500">
                            {subj.code} · {subj.grade_level} · {subj.section}
                          </p>
                          <h2 className="text-lg font-bold font-display">{subj.name}</h2>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {subj.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            Teacher: {subj.teacher_name} · {subj.enrolled_count} students enrolled
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEnrollSubject(subj.id)}
                          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                        >
                          Enroll in {subj.code}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            /* SUBJECT DETAILS VIEW WITH 7 TABS */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId(null);
                    setSubjectDetail(null);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-2 hover:bg-white dark:hover:bg-slate-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Subjects</span>
                </button>
                <span className="text-xs font-mono text-slate-500">
                  {subjectDetail.subject.code} · {subjectDetail.subject.schedule}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    {subjectDetail.subject.grade_level} · {subjectDetail.subject.section}
                  </p>
                  <h1 className="text-2xl font-bold font-display mt-1">
                    {subjectDetail.subject.name}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Instructor: {subjectDetail.subject.teacher_name} · Progress:{' '}
                    <span className="font-mono">{subjectDetail.subject.progress ?? 0}%</span>
                  </p>
                </div>

                {/* 7 Subject Detail Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
                  {(
                    [
                      'overview',
                      'modules',
                      'videos',
                      'assignments',
                      'quizzes',
                      'exams',
                      'grades',
                    ] as const
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSubjectDetailTab(t)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                        subjectDetailTab === t
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {subjectDetailTab === 'overview' && (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {subjectDetail.subject.description}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500">Modules</p>
                        <p className="text-xl font-bold font-mono mt-0.5">
                          {subjectDetail.modules.length}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500">Video Lessons</p>
                        <p className="text-xl font-bold font-mono mt-0.5">
                          {subjectDetail.videos.length}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500">Assignments</p>
                        <p className="text-xl font-bold font-mono mt-0.5">
                          {subjectDetail.assignments.length}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500">Quizzes & Exams</p>
                        <p className="text-xl font-bold font-mono mt-0.5">
                          {subjectDetail.quizzes.length + subjectDetail.exams.length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {subjectDetailTab === 'modules' && (
                  <div className="space-y-4 pt-2">
                    {subjectDetail.modules.map((mod) => (
                      <div
                        key={mod.id}
                        id={`module-card-${mod.id}`}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 scroll-mt-20 transition-all hover:border-emerald-500/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-bold">{mod.title}</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              {mod.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <CircularProgressIndicator
                              percentage={mod.completion_percentage ?? 0}
                              size="sm"
                            />
                            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hidden sm:inline font-semibold">
                              {mod.completion_percentage ?? 0}% complete
                            </span>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
                          {mod.lessons.map((les) => (
                            <div
                              key={les.id}
                              className="py-2.5 flex items-center justify-between gap-3"
                            >
                              <div>
                                <p className="text-sm font-medium">{les.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {les.type.toUpperCase()} · {les.duration_minutes} mins ·{' '}
                                  {les.content_summary}
                                </p>
                              </div>
                              {les.type === 'video' && (
                                <button
                                  type="button"
                                  onClick={() => setSubjectDetailTab('videos')}
                                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold whitespace-nowrap"
                                >
                                  Watch Video
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {subjectDetailTab === 'videos' && (
                  <div className="space-y-5 pt-2">
                    {activeVideo && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-white">
                        <video
                          ref={videoRef}
                          key={activeVideo.id}
                          src={activeVideo.video_url}
                          controls
                          className="w-full aspect-video bg-black"
                          onLoadedMetadata={(e) => {
                            const vid = e.currentTarget;
                            if (
                              activeVideo.watched_seconds > 0 &&
                              activeVideo.watched_seconds < activeVideo.duration_seconds - 2
                            ) {
                              vid.currentTime = activeVideo.watched_seconds;
                            }
                          }}
                          onPause={(e) =>
                            handleSaveVideoProgress(activeVideo, e.currentTarget.currentTime, false)
                          }
                          onEnded={(e) =>
                            handleSaveVideoProgress(activeVideo, e.currentTarget.duration, true)
                          }
                        />
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                            <span>{activeVideo.module_title}</span>
                            <span>
                              Resume Point: {activeVideo.watched_seconds}s /{' '}
                              {activeVideo.duration_seconds}s
                              {activeVideo.completed ? ' · Completed' : ''}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold">{activeVideo.title}</h3>
                          <p className="text-xs text-slate-300">{activeVideo.description}</p>
                          <p className="text-xs text-slate-400">
                            Instructor: {activeVideo.teacher_name}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-500">
                        Related Video Lessons in {subjectDetail.subject.code}
                      </h4>
                      {subjectDetail.videos.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setActiveVideo(v)}
                          className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 ${
                            activeVideo?.id === v.id
                              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold">{v.title}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              Watched {v.watched_seconds}s / {v.duration_seconds}s ·{' '}
                              {v.completed ? 'Completed' : 'In Progress'}
                            </p>
                          </div>
                          <Play className="w-4 h-4 text-emerald-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {subjectDetailTab === 'assignments' && (
                  <div className="space-y-3 pt-2">
                    {subjectDetail.assignments.map((a) => {
                      const isLocked =
                        a.status && a.status !== 'Pending' && a.status !== 'Returned';
                      const totalItems = a.total_items ?? a.questions?.length ?? 0;
                      return (
                        <div
                          key={a.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                              <span>
                                Status: {a.status} · Due {new Date(a.due_date).toLocaleDateString()}{' '}
                                · Max {a.max_score} pts
                              </span>
                              {a.score !== null && a.score !== undefined && (
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  · Score:{' '}
                                  {totalItems > 0 && a.correct_items !== null && a.correct_items !== undefined
                                    ? `${a.correct_items}/${totalItems} items (${a.score}/${a.max_score} pts)`
                                    : `${a.score}/${a.max_score} pts`}
                                </span>
                              )}
                              {a.remark && (
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold ${
                                    a.remark === 'PASSED'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-red-500/15 text-red-700 dark:text-red-300'
                                  }`}
                                >
                                  {a.remark}
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-bold mt-0.5">{a.title}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              {a.description}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {isLocked ? (
                              <>
                                <button
                                  type="button"
                                  disabled
                                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed opacity-70"
                                >
                                  Submitted (Disabled)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAssignment(a);
                                    setAssignmentAnswers(a.answers || {});
                                    setUploadFiles(a.submitted_files || []);
                                    setSubmissionNotes(a.submission_notes || '');
                                    setActiveTab('tasks');
                                    setTaskSubTab('assignments');
                                  }}
                                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                                >
                                  View Result
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAssignment(a);
                                  setAssignmentAnswers(a.answers || {});
                                  setUploadFiles(a.submitted_files || []);
                                  setSubmissionNotes(a.submission_notes || '');
                                  setActiveTab('tasks');
                                  setTaskSubTab('assignments');
                                }}
                                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shrink-0"
                              >
                                {a.status === 'Returned' ? 'Resubmit Assignment' : 'Open Assignment'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {subjectDetailTab === 'quizzes' && (
                  <div className="space-y-3 pt-2">
                    {subjectDetail.quizzes.map((q) => {
                      const hasSubmitted = (q.attempts_used ?? 0) > 0;
                      const isLocked = q.can_take === false;
                      const totalItems = q.total_items ?? q.questions.length;
                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-mono text-slate-500">
                              {q.time_limit_minutes} mins · {totalItems} items · Shuffled Questions &
                              Choices
                            </p>
                            <h4 className="text-base font-bold mt-0.5">{q.title}</h4>
                            {hasSubmitted && (
                              <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-0.5">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  Score: {q.best_correct_items ?? 0}/{totalItems} items (
                                  {q.best_score}/{q.total_points} pts)
                                </span>
                                {q.best_remark && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold ${
                                      q.best_remark === 'PASSED'
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-red-500/15 text-red-700 dark:text-red-300'
                                    }`}
                                  >
                                    {q.best_remark}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => {
                                setActiveTab('tasks');
                                setTaskSubTab('quizzes');
                                handleStartQuiz(q.id);
                              }}
                              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold shrink-0 ${
                                isLocked
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-70'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isLocked
                                ? 'Submitted (Disabled)'
                                : q.retake_status === 'approved'
                                ? 'Retake Quiz (Approved)'
                                : 'Start Quiz'}
                            </button>
                            {isLocked && (
                              <button
                                type="button"
                                disabled={
                                  q.retake_status === 'pending' ||
                                  requestingRetakeKey === `quiz_${q.id}`
                                }
                                onClick={() => handleRequestRetake('quiz', q.id)}
                                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                                  q.retake_status === 'pending'
                                    ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 cursor-not-allowed'
                                    : 'border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                }`}
                              >
                                {q.retake_status === 'pending'
                                  ? 'Retake Pending Approval'
                                  : 'Request Retake'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {subjectDetailTab === 'exams' && (
                  <div className="space-y-3 pt-2">
                    {subjectDetail.exams.map((ex) => {
                      const hasSubmitted = (ex.attempts_used ?? 0) > 0;
                      const isLocked = ex.can_take === false;
                      const totalItems = ex.total_items ?? ex.questions.length;
                      return (
                        <div
                          key={ex.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-mono text-slate-500">
                              {ex.duration_minutes} mins · {totalItems} items · {ex.total_points}{' '}
                              pts · Shuffled Questions & Choices
                            </p>
                            <h4 className="text-base font-bold mt-0.5">{ex.title}</h4>
                            {hasSubmitted && (
                              <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-0.5">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  Score: {ex.latest_correct_items ?? 0}/{totalItems} items (
                                  {ex.latest_score}/{ex.total_points} pts)
                                </span>
                                {ex.latest_remark && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold ${
                                      ex.latest_remark === 'PASSED'
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-red-500/15 text-red-700 dark:text-red-300'
                                    }`}
                                  >
                                    {ex.latest_remark}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => {
                                setActiveTab('tasks');
                                setTaskSubTab('exams');
                                handleStartOrResumeExam(ex.id);
                              }}
                              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold shrink-0 ${
                                isLocked
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-70'
                                  : 'bg-slate-900 dark:bg-emerald-600 text-white'
                              }`}
                            >
                              {isLocked
                                ? 'Submitted (Disabled)'
                                : ex.active_attempt
                                ? 'Resume Exam'
                                : ex.retake_status === 'approved'
                                ? 'Retake Exam (Approved)'
                                : 'Open Exam'}
                            </button>
                            {isLocked && (
                              <button
                                type="button"
                                disabled={
                                  ex.retake_status === 'pending' ||
                                  requestingRetakeKey === `exam_${ex.id}`
                                }
                                onClick={() => handleRequestRetake('exam', ex.id)}
                                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                                  ex.retake_status === 'pending'
                                    ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 cursor-not-allowed'
                                    : 'border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                }`}
                              >
                                {ex.retake_status === 'pending'
                                  ? 'Retake Pending Approval'
                                  : 'Request Retake'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {subjectDetailTab === 'grades' && (
                  <div className="pt-2">
                    {subjectDetail.grades ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-500">Assignments (40%)</p>
                          <p className="text-2xl font-bold font-mono mt-1">
                            {subjectDetail.grades.assignment_avg}%
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-500">Quizzes (30%)</p>
                          <p className="text-2xl font-bold font-mono mt-1">
                            {subjectDetail.grades.quiz_avg}%
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-xs text-slate-500">Quarterly Exam (30%)</p>
                          <p className="text-2xl font-bold font-mono mt-1">
                            {subjectDetail.grades.exam_avg}%
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                            Final Subject Grade
                          </p>
                          <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                            {subjectDetail.grades.final_grade}%
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Enroll in this subject to track your grades.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: STUDENT TASKS (ASSIGNMENTS, QUIZZES, EXAMS, PROGRESS/GRADES)
      ===================================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Sub-navigation bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-display">
                Academic Tasks & Assessments
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Submit coursework, complete timed quizzes, take departmental exams, and inspect your
                report card.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {(
                [
                  { id: 'assignments', label: 'Assignments' },
                  { id: 'quizzes', label: 'Quizzes' },
                  { id: 'exams', label: 'Exams' },
                  { id: 'progress', label: 'My Progress' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTaskSubTab(tab.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    taskSubTab === tab.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3A. ASSIGNMENTS */}
          {taskSubTab === 'assignments' && (
            <div className="space-y-4">
              {!selectedAssignment ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {['All', 'Pending', 'Submitted', 'Late', 'Graded', 'Returned'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setAssignmentFilter(st)}
                          className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                            assignmentFilter === st
                              ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowQRScanner(true)}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Scan Submission QR</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {assignments
                      .filter((a) => assignmentFilter === 'All' || a.status === assignmentFilter)
                      .map((a) => {
                        const isAssignmentLocked =
                          a.status && a.status !== 'Pending' && a.status !== 'Returned';
                        const totalItems = a.total_items ?? a.questions?.length ?? 0;
                        return (
                          <div
                            key={a.id}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                                <span>
                                  {a.subject_code} · {a.teacher_name} · Due{' '}
                                  {new Date(a.due_date).toLocaleDateString()} · Status: {a.status}
                                </span>
                                {a.questions && a.questions.length > 0 && (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    · {a.questions.length} Shuffled Question(s)
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-bold">{a.title}</h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {a.description}
                              </p>
                              {(a.score !== null && a.score !== undefined) || a.remark ? (
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                                  {totalItems > 0 &&
                                    a.correct_items !== null &&
                                    a.correct_items !== undefined && (
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        Correct Score: {a.correct_items} / {totalItems} items
                                      </span>
                                    )}
                                  {a.score !== null && a.score !== undefined && (
                                    <span className="text-slate-600 dark:text-slate-300">
                                      Points: {a.score} / {a.max_score} pts
                                    </span>
                                  )}
                                  {a.remark && (
                                    <span
                                      className={`px-2.5 py-0.5 rounded-md font-bold ${
                                        a.remark === 'PASSED'
                                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                          : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                                      }`}
                                    >
                                      Remark: {a.remark}
                                    </span>
                                  )}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {isAssignmentLocked ? (
                                <>
                                  <button
                                    type="button"
                                    disabled
                                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs font-semibold shrink-0 whitespace-nowrap cursor-not-allowed opacity-75"
                                  >
                                    Submitted (Disabled)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAssignment(a);
                                      setAssignmentAnswers(a.answers || {});
                                      setUploadFiles(a.submitted_files || []);
                                      setSubmissionNotes(a.submission_notes || '');
                                    }}
                                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shrink-0 whitespace-nowrap"
                                  >
                                    View Score & Details
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAssignment(a);
                                    setAssignmentAnswers(a.answers || {});
                                    setUploadFiles(a.submitted_files || []);
                                    setSubmissionNotes(a.submission_notes || '');
                                  }}
                                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 whitespace-nowrap"
                                >
                                  {a.status === 'Returned' ? 'Resubmit Work' : 'Answer & Submit Work'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                /* Assignment Submission Detail Sheet */
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
                  {(() => {
                    const isSubmittedLocked =
                      Boolean(selectedAssignment.status) &&
                      selectedAssignment.status !== 'Pending' &&
                      selectedAssignment.status !== 'Returned';
                    const totalItems =
                      selectedAssignment.total_items ??
                      selectedAssignment.questions?.length ??
                      0;
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSelectedAssignment(null)}
                            className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Assignments</span>
                          </button>
                          <span className="text-xs font-mono text-slate-500">
                            Status: {selectedAssignment.status} · Max Score:{' '}
                            {selectedAssignment.max_score}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                            {selectedAssignment.subject_name} · {selectedAssignment.teacher_name} ·
                            Unique Student Question & Option Order
                          </p>
                          <h2 className="text-xl font-bold font-display">
                            {selectedAssignment.title}
                          </h2>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                            {selectedAssignment.instructions}
                          </p>
                        </div>

                        {/* Official Score over Total Items & Pass/Fail Remark Banner */}
                        {(selectedAssignment.score !== null &&
                          selectedAssignment.score !== undefined) ||
                        selectedAssignment.remark ? (
                          <div
                            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              selectedAssignment.remark === 'FAILED'
                                ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                Official Assignment Evaluation
                              </p>
                              <div className="flex flex-wrap items-center gap-3">
                                {totalItems > 0 &&
                                  selectedAssignment.correct_items !== null &&
                                  selectedAssignment.correct_items !== undefined && (
                                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                                      Correct Score: {selectedAssignment.correct_items} /{' '}
                                      {totalItems} items
                                    </span>
                                  )}
                                <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">
                                  Points: {selectedAssignment.score ?? 0} /{' '}
                                  {selectedAssignment.max_score} pts
                                </span>
                              </div>
                              {selectedAssignment.feedback && (
                                <p className="text-xs text-slate-700 dark:text-slate-300 pt-0.5">
                                  {selectedAssignment.feedback}
                                </p>
                              )}
                            </div>
                            {selectedAssignment.remark && (
                              <span
                                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold self-start sm:self-center ${
                                  selectedAssignment.remark === 'PASSED'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}
                              >
                                REMARK: {selectedAssignment.remark}
                              </span>
                            )}
                          </div>
                        ) : null}

                        {selectedAssignment.attachments?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500">
                              Reference Materials Attached by Instructor
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedAssignment.attachments.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono flex items-center gap-2"
                                >
                                  <FileText className="w-4 h-4 text-emerald-600" />
                                  <span>{file}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedAssignment.questions &&
                          selectedAssignment.questions.length > 0 && (
                            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  Shuffled Problem Items & Questions (
                                  {selectedAssignment.questions.length})
                                </p>
                                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                                  Total:{' '}
                                  {selectedAssignment.questions.reduce(
                                    (acc, q) => acc + (Number(q.points) || 0),
                                    0
                                  )}{' '}
                                  pts
                                </span>
                              </div>
                              <div className="space-y-3">
                                {selectedAssignment.questions.map((q, idx) => (
                                  <div
                                    key={q.id}
                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                        Item #{idx + 1} ·{' '}
                                        {q.question_type.replace('_', ' ').toUpperCase()}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-semibold">
                                        {q.points} pts
                                      </span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                                      {q.question_text}
                                    </p>
                                    {q.choices && q.choices.length > 0 ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                        {q.choices.map((c) => {
                                          const selected = assignmentAnswers[q.id] === c.id;
                                          const label = c.display_label || c.id;
                                          return (
                                            <button
                                              key={c.id}
                                              type="button"
                                              disabled={isSubmittedLocked}
                                              onClick={() =>
                                                setAssignmentAnswers((prev) => ({
                                                  ...prev,
                                                  [q.id]: c.id,
                                                }))
                                              }
                                              className={`px-3 py-2.5 rounded-xl border text-left text-xs font-mono flex items-center justify-between transition-colors ${
                                                selected
                                                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold'
                                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                              } ${
                                                isSubmittedLocked
                                                  ? 'cursor-not-allowed opacity-80'
                                                  : 'hover:border-emerald-500'
                                              }`}
                                            >
                                              <span>
                                                <strong>{label}.</strong> {c.text}
                                              </span>
                                              {selected && (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        disabled={isSubmittedLocked}
                                        value={assignmentAnswers[q.id] || ''}
                                        onChange={(e) =>
                                          setAssignmentAnswers((prev) => ({
                                            ...prev,
                                            [q.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="Enter your answer..."
                                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono disabled:opacity-70 disabled:cursor-not-allowed"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        <form
                          onSubmit={handleSubmitAssignment}
                          className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800"
                        >
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold">
                              Upload Submission Files (Camera, Photo, PDF, DOCX)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <label
                                className={`min-h-[48px] px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 text-xs font-semibold ${
                                  isSubmittedLocked
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:border-emerald-500 cursor-pointer'
                                }`}
                              >
                                <Camera className="w-4 h-4 text-emerald-600" />
                                <span>Camera / Photo</span>
                                <input
                                  type="file"
                                  disabled={isSubmittedLocked}
                                  accept="image/*"
                                  capture="environment"
                                  onChange={handleFileInputChange}
                                  className="hidden"
                                />
                              </label>
                              <label
                                className={`min-h-[48px] px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 text-xs font-semibold ${
                                  isSubmittedLocked
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:border-emerald-500 cursor-pointer'
                                }`}
                              >
                                <FileText className="w-4 h-4 text-emerald-600" />
                                <span>Attach PDF / DOCX</span>
                                <input
                                  type="file"
                                  disabled={isSubmittedLocked}
                                  accept=".pdf,.doc,.docx,application/pdf"
                                  multiple
                                  onChange={handleFileInputChange}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                disabled={isSubmittedLocked}
                                onClick={() =>
                                  setUploadFiles((prev) => [
                                    ...prev,
                                    {
                                      name: `${user.last_name}_${selectedAssignment.subject_code}_Solution.pdf`,
                                      type: 'application/pdf',
                                      size_kb: 720,
                                    },
                                  ])
                                }
                                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Upload className="w-4 h-4 text-emerald-600" />
                                <span>Attach Sample PDF</span>
                              </button>
                            </div>

                            {uploadFiles.length > 0 && (
                              <div className="space-y-1.5 pt-2">
                                {uploadFiles.map((f, i) => (
                                  <div
                                    key={i}
                                    className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-mono"
                                  >
                                    <span>
                                      {f.name} ({f.size_kb} KB)
                                    </span>
                                    {!isSubmittedLocked && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setUploadFiles((prev) =>
                                            prev.filter((_, idx) => idx !== i)
                                          )
                                        }
                                        className="text-red-600 hover:underline"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold">
                              Student Notes / Solution Summary
                            </label>
                            <textarea
                              rows={3}
                              disabled={isSubmittedLocked}
                              value={submissionNotes}
                              onChange={(e) => setSubmissionNotes(e.target.value)}
                              placeholder="Add optional notes for your teacher..."
                              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submittingAssignment || isSubmittedLocked}
                            className={`w-full min-h-[48px] py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${
                              isSubmittedLocked
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-75'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span>
                              {isSubmittedLocked
                                ? 'Assignment Submitted (Button Disabled)'
                                : submittingAssignment
                                ? 'Uploading & Submitting...'
                                : 'Submit Assignment'}
                            </span>
                          </button>
                        </form>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* 3B. QUIZZES */}
          {taskSubTab === 'quizzes' && (
            <div className="space-y-4">
              {!activeQuizSession ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizzes.map((q) => {
                    const hasSubmitted = (q.attempts_used ?? 0) > 0;
                    const isLocked = q.can_take === false;
                    const totalItems = q.total_items ?? q.questions.length;
                    const retakeKey = `quiz_${q.id}`;
                    return (
                      <div
                        key={q.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-mono text-slate-500">
                              {q.subject_code} · {totalItems} Items · {q.time_limit_minutes} mins
                            </p>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Shuffled Questions & Choices
                            </span>
                          </div>
                          <h3 className="text-lg font-bold font-display">{q.title}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {q.description}
                          </p>

                          {hasSubmitted && (
                            <div
                              className={`p-3.5 rounded-2xl border space-y-1 ${
                                q.best_remark === 'FAILED'
                                  ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-800/80'
                                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                  Correct Score: {q.best_correct_items ?? 0} / {totalItems} items
                                </span>
                                {q.best_remark && (
                                  <span
                                    className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                                      q.best_remark === 'PASSED'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-red-600 text-white'
                                    }`}
                                  >
                                    {q.best_remark}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                Points: {q.best_score ?? 0} / {q.total_points} pts (Passing:{' '}
                                {q.passing_score} pts)
                              </p>
                            </div>
                          )}

                          {q.retake_status === 'approved' && (
                            <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                              Teacher approved your retake request! Your quiz button is now enabled.
                            </div>
                          )}
                          {q.retake_status === 'declined' && (
                            <div className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">
                              Previous retake request was declined by teacher.
                            </div>
                          )}
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleStartQuiz(q.id)}
                            className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors ${
                              isLocked
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-75'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isLocked
                              ? 'Quiz Submitted (Button Disabled)'
                              : q.active_attempt_id
                              ? 'Resume Active Quiz'
                              : q.retake_status === 'approved'
                              ? 'Retake Quiz Now (Teacher Approved)'
                              : 'Start Quiz'}
                          </button>

                          {isLocked && (
                            <div className="space-y-2">
                              {q.retake_status === 'pending' ? (
                                <button
                                  type="button"
                                  disabled
                                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold cursor-not-allowed"
                                >
                                  Retake Requested · Awaiting Teacher Approval
                                </button>
                              ) : (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    value={retakeReasons[retakeKey] || ''}
                                    onChange={(e) =>
                                      setRetakeReasons((prev) => ({
                                        ...prev,
                                        [retakeKey]: e.target.value,
                                      }))
                                    }
                                    placeholder="Reason for retake request (optional)..."
                                    className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                                  />
                                  <button
                                    type="button"
                                    disabled={requestingRetakeKey === retakeKey}
                                    onClick={() => handleRequestRetake('quiz', q.id)}
                                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold whitespace-nowrap"
                                  >
                                    {requestingRetakeKey === retakeKey
                                      ? 'Sending...'
                                      : 'Request Retake'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Interactive Quiz Interface */
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                  {quizResult ? (
                    <div className="text-center space-y-4 py-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                          quizResult.passed
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                            : 'bg-red-100 dark:bg-red-950 text-red-600'
                        }`}
                      >
                        <Award className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold font-display">Quiz Submitted!</h2>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                          Correct Score:{' '}
                          {quizResult.correct_items ?? 0} /{' '}
                          {quizResult.total_items ?? activeQuizSession.quiz.questions.length} items
                        </p>
                        <p className="text-base font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          Points: {quizResult.score} / {quizResult.total_points} pts (
                          {quizResult.percentage}%)
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-block px-4 py-1.5 rounded-xl font-mono text-xs font-bold ${
                            quizResult.passed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          REMARK: {quizResult.remark ?? (quizResult.passed ? 'PASSED' : 'FAILED')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Your quiz submission is now locked. To take this quiz again, request teacher
                        approval.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          disabled
                          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed"
                        >
                          Quiz Submitted (Disabled)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestRetake('quiz', activeQuizSession.quiz.id)}
                          className="min-h-[44px] px-5 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                          Request Retake (Needs Teacher Approval)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveQuizSession(null);
                            setQuizResult(null);
                          }}
                          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Return to Quizzes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div>
                          <p className="text-xs font-mono text-slate-500">
                            Question {quizQuestionIdx + 1} of{' '}
                            {activeQuizSession.quiz.questions.length} · Shuffled Questions & Choices
                          </p>
                          <h2 className="text-lg font-bold">{activeQuizSession.quiz.title}</h2>
                        </div>
                        <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-sm font-bold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span>{formatTimer(quizRemainingSec)}</span>
                        </div>
                      </div>

                      {(() => {
                        const q = activeQuizSession.quiz.questions[quizQuestionIdx];
                        return (
                          <div className="space-y-4">
                            <p className="text-base font-semibold leading-relaxed">
                              {quizQuestionIdx + 1}. {q.question_text} ({q.points} pts)
                            </p>
                            {q.question_type === 'short_answer' ||
                            !q.choices ||
                            q.choices.length === 0 ? (
                              <div className="space-y-2">
                                <label className="block text-xs font-mono text-slate-500">
                                  Type your answer below:
                                </label>
                                <input
                                  type="text"
                                  value={quizAnswers[q.id] || ''}
                                  onChange={(e) => handleSelectQuizAnswer(q.id, e.target.value)}
                                  placeholder="Enter your answer..."
                                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {q.choices.map((choice) => {
                                  const selected = quizAnswers[q.id] === choice.id;
                                  const label = choice.display_label || choice.id;
                                  return (
                                    <button
                                      key={choice.id}
                                      type="button"
                                      onClick={() => handleSelectQuizAnswer(q.id, choice.id)}
                                      className={`w-full min-h-[48px] p-4 rounded-2xl border text-left text-sm font-medium flex items-center justify-between transition-colors ${
                                        selected
                                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200'
                                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                      }`}
                                    >
                                      <span>
                                        <strong className="font-mono mr-2">{label}.</strong>{' '}
                                        {choice.text}
                                      </span>
                                      {selected && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={quizQuestionIdx === 0}
                          onClick={() => setQuizQuestionIdx((i) => Math.max(0, i - 1))}
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40"
                        >
                          Previous
                        </button>

                        {quizQuestionIdx < activeQuizSession.quiz.questions.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setQuizQuestionIdx((i) => i + 1)}
                            className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold"
                          >
                            Next Question
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={submittingQuiz}
                            onClick={() => setConfirmQuizSubmit(true)}
                            className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                          >
                            {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                          </button>
                        )}
                      </div>

                      {confirmQuizSubmit && (
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                            Are you sure you want to submit your quiz answers? Once submitted, the
                            quiz button will be disabled unless your teacher approves a retake.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmQuizSubmit(false)}
                              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-semibold"
                            >
                              Review Answers
                            </button>
                            <button
                              type="button"
                              disabled={submittingQuiz}
                              onClick={handleSubmitQuiz}
                              className="min-h-[40px] px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              {submittingQuiz ? 'Submitting...' : 'Confirm Submit'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3C. SERVER-AUTHORITATIVE EXAMINATION SYSTEM */}
          {taskSubTab === 'exams' && (
            <div className="space-y-4">
              {!activeExamSession ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exams.map((ex) => {
                    const hasSubmitted = (ex.attempts_used ?? 0) > 0;
                    const isLocked = ex.can_take === false;
                    const totalItems = ex.total_items ?? ex.questions.length;
                    const retakeKey = `exam_${ex.id}`;
                    return (
                      <div
                        key={ex.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                              {ex.subject_code} · {ex.duration_minutes} mins · {totalItems} Items ·{' '}
                              {ex.total_points} pts
                              {ex.active_attempt ? ' · ACTIVE ATTEMPT' : ''}
                            </p>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Shuffled Questions & Choices
                            </span>
                          </div>
                          <h3 className="text-lg font-bold font-display">{ex.title}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {ex.instructions}
                          </p>

                          {hasSubmitted && (
                            <div
                              className={`p-3.5 rounded-2xl border space-y-1 ${
                                ex.latest_remark === 'FAILED'
                                  ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-800/80'
                                  : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                  Correct Score: {ex.latest_correct_items ?? 0} / {totalItems} items
                                </span>
                                {ex.latest_remark && (
                                  <span
                                    className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                                      ex.latest_remark === 'PASSED'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-red-600 text-white'
                                    }`}
                                  >
                                    {ex.latest_remark}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                Official Points: {ex.latest_score ?? 0} / {ex.total_points} pts
                                (Passing: {ex.passing_score} pts)
                              </p>
                            </div>
                          )}

                          {ex.retake_status === 'approved' && (
                            <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                              Teacher approved your exam retake request! Your examination button is
                              now enabled.
                            </div>
                          )}
                          {ex.retake_status === 'declined' && (
                            <div className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">
                              Previous examination retake request was declined by teacher.
                            </div>
                          )}
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleStartOrResumeExam(ex.id)}
                            className={`w-full min-h-[48px] py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors ${
                              isLocked
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-75'
                                : 'bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isLocked
                              ? 'Examination Submitted (Button Disabled)'
                              : ex.active_attempt
                              ? 'Resume Active Examination (Server Auto-Saved)'
                              : ex.retake_status === 'approved'
                              ? 'Retake Examination Now (Teacher Approved)'
                              : 'Begin Departmental Examination'}
                          </button>

                          {isLocked && (
                            <div className="space-y-2">
                              {ex.retake_status === 'pending' ? (
                                <button
                                  type="button"
                                  disabled
                                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold cursor-not-allowed"
                                >
                                  Retake Requested · Awaiting Teacher Approval
                                </button>
                              ) : (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    value={retakeReasons[retakeKey] || ''}
                                    onChange={(e) =>
                                      setRetakeReasons((prev) => ({
                                        ...prev,
                                        [retakeKey]: e.target.value,
                                      }))
                                    }
                                    placeholder="Reason for exam retake request (optional)..."
                                    className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs"
                                  />
                                  <button
                                    type="button"
                                    disabled={requestingRetakeKey === retakeKey}
                                    onClick={() => handleRequestRetake('exam', ex.id)}
                                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold whitespace-nowrap"
                                  >
                                    {requestingRetakeKey === retakeKey
                                      ? 'Sending...'
                                      : 'Request Retake'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Dedicated Server-Synchronized Examination Room */
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                  {examResult ? (
                    <div className="text-center space-y-4 py-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                          examResult.passed
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                            : 'bg-red-100 dark:bg-red-950 text-red-600'
                        }`}
                      >
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold font-display">
                        Examination Officially Submitted
                      </h2>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                          Correct Score:{' '}
                          {examResult.correct_items ?? 0} /{' '}
                          {examResult.total_items ?? activeExamSession.exam.questions.length} items
                        </p>
                        <p className="text-base font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          Points: {examResult.score} / {examResult.total_points} pts (
                          {examResult.percentage}%)
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-block px-4 py-1.5 rounded-xl font-mono text-xs font-bold ${
                            examResult.passed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          REMARK: {examResult.remark ?? (examResult.passed ? 'PASSED' : 'FAILED')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Attempt ID: <span className="font-mono">{examResult.id}</span> ·
                        Examination button is now disabled unless a retake is approved by your
                        teacher.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          disabled
                          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed"
                        >
                          Examination Submitted (Disabled)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestRetake('exam', activeExamSession.exam.id)}
                          className="min-h-[44px] px-5 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                          Request Retake (Needs Teacher Approval)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveExamSession(null);
                            setExamResult(null);
                          }}
                          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Exit Examination Room
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div>
                          <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                            SERVER-AUTHORITATIVE EXAM · SHUFFLED QUESTIONS & CHOICES ·{' '}
                            {examSaveState === 'saving'
                              ? 'Syncing answer to server...'
                              : examSaveState === 'saved'
                              ? 'All answers synced to server'
                              : 'Auto-save ready'}
                          </p>
                          <h2 className="text-lg font-bold">{activeExamSession.exam.title}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-mono text-sm font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span>{formatTimer(examRemainingSec)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveExamSession(null);
                              showToast(
                                'Exam closed safely. You can resume right where you left off!',
                                'info'
                              );
                              loadTasksData();
                            }}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
                          >
                            Pause / Close App
                          </button>
                        </div>
                      </div>

                      {/* Question Navigation Grid */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {activeExamSession.exam.questions.map((q, idx) => {
                          const answered = Boolean(examAnswers[q.id]);
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setExamQuestionIdx(idx)}
                              className={`min-h-[40px] min-w-[40px] rounded-xl font-mono text-xs font-bold border transition-colors ${
                                examQuestionIdx === idx
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : answered
                                  ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-600'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      {(() => {
                        const q = activeExamSession.exam.questions[examQuestionIdx];
                        return (
                          <div className="space-y-4">
                            <p className="text-base font-semibold leading-relaxed">
                              Item {examQuestionIdx + 1} ({q.points} pts): {q.question_text}
                            </p>
                            {q.question_type === 'short_answer' ||
                            !q.choices ||
                            q.choices.length === 0 ? (
                              <div className="space-y-2">
                                <label className="block text-xs font-mono text-slate-500">
                                  Type your answer below (Auto-synced to server):
                                </label>
                                <input
                                  type="text"
                                  value={examAnswers[q.id] || ''}
                                  onChange={(e) => handleSelectExamAnswer(q.id, e.target.value)}
                                  placeholder="Enter your answer..."
                                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {q.choices.map((choice) => {
                                  const selected = examAnswers[q.id] === choice.id;
                                  const label = choice.display_label || choice.id;
                                  return (
                                    <button
                                      key={choice.id}
                                      type="button"
                                      onClick={() => handleSelectExamAnswer(q.id, choice.id)}
                                      className={`w-full min-h-[48px] p-4 rounded-2xl border text-left text-sm font-medium flex items-center justify-between transition-colors ${
                                        selected
                                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200'
                                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                      }`}
                                    >
                                      <span>
                                        <strong className="font-mono mr-2">{label}.</strong>{' '}
                                        {choice.text}
                                      </span>
                                      {selected && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={examQuestionIdx === 0}
                          onClick={() => setExamQuestionIdx((i) => Math.max(0, i - 1))}
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40"
                        >
                          Previous Item
                        </button>
                        {examQuestionIdx < activeExamSession.exam.questions.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setExamQuestionIdx((i) => i + 1)}
                            className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold"
                          >
                            Next Item
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={submittingExam}
                            onClick={() => setConfirmExamSubmit(true)}
                            className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                          >
                            {submittingExam ? 'Submitting...' : 'Submit Examination'}
                          </button>
                        )}
                      </div>

                      {confirmExamSubmit && (
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                            Submit your final examination to the TNHS server? Once submitted, the
                            button will be disabled unless your teacher approves a retake.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmExamSubmit(false)}
                              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-semibold"
                            >
                              Keep Reviewing
                            </button>
                            <button
                              type="button"
                              disabled={submittingExam}
                              onClick={handleSubmitExam}
                              className="min-h-[40px] px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              {submittingExam ? 'Submitting...' : 'Finalize Examination'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3D. MY PROGRESS & REPORT CARD */}
          {taskSubTab === 'progress' && (
            <div className="space-y-6">
              {progressAnalytics ? (
                <StudentProgressDashboard
                  analytics={progressAnalytics}
                  loading={loadingAnalytics}
                  onRefresh={loadProgressAnalytics}
                  onToggleLesson={handleToggleLesson}
                  onOpenReportCard={() => setShowReportCardModal(true)}
                  onNavigateToTasks={(tab) => setTaskSubTab(tab)}
                  darkMode={darkMode}
                />
              ) : gradesData ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-slate-500">
                      OFFICIAL ACADEMIC STANDING · SY {gradesData.school_year} · {gradesData.semester}
                    </p>
                    <h2 className="text-2xl font-bold font-display mt-1">
                      General Weighted Average:{' '}
                      <span className="font-mono text-emerald-600">
                        {gradesData.overall_average}%
                      </span>
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReportCardModal(true)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Award className="w-4 h-4" />
                    <span>Open Official Report Card (Form 138)</span>
                  </button>
                </div>
              ) : null}

              {showReportCardModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <p className="text-xs font-mono text-emerald-600">
                          REPUBLIC OF THE PHILIPPINES · DEPARTMENT OF EDUCATION
                        </p>
                        <h3 className="text-xl font-bold font-display">
                          Tudela National High School — Learner’s Progress Report Card
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Learner: {user.name} ({user.school_id}) · {user.grade_level} –{' '}
                          {user.section}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReportCardModal(false)}
                        className="min-h-[40px] px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                      >
                        Close
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                            <th className="py-2.5 pr-3">Learning Area</th>
                            <th className="py-2.5 px-2 text-right font-mono">Assignments</th>
                            <th className="py-2.5 px-2 text-right font-mono">Quizzes</th>
                            <th className="py-2.5 px-2 text-right font-mono">Exam</th>
                            <th className="py-2.5 pl-2 text-right font-mono">Final Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(gradesData?.subjects || []).map((row) => (
                            <tr key={row.subject_id}>
                              <td className="py-3 pr-3 font-medium">
                                {row.subject_code} · {row.subject_name}
                              </td>
                              <td className="py-3 px-2 text-right font-mono tabular-nums">
                                {row.assignment_avg}%
                              </td>
                              <td className="py-3 px-2 text-right font-mono tabular-nums">
                                {row.quiz_avg}%
                              </td>
                              <td className="py-3 px-2 text-right font-mono tabular-nums">
                                {row.exam_avg}%
                              </td>
                              <td className="py-3 pl-2 text-right font-mono font-bold tabular-nums text-emerald-600">
                                {row.final_grade}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-sm font-bold">
                      <span>General Average</span>
                      <span className="font-mono text-emerald-600">
                        {gradesData?.overall_average ?? progressAnalytics?.general_weighted_average ?? 0}% (PROMOTED / PASSED)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: STUDENT NOTIFICATIONS & MESSAGES INBOX
      ===================================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-display">
                Notifications & Faculty Messages
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Real-time alerts for assignments, graded submissions, exams, and faculty messages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNotifView('notifications')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                    notifView === 'notifications'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Alerts ({unreadCount} unread)
                </button>
                <button
                  type="button"
                  onClick={() => setNotifView('messages')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                    notifView === 'messages'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Messages ({messages.length})
                </button>
              </div>

              {notifView === 'notifications' && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllNotificationsRead}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {notifView === 'notifications' ? (
            <>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  'All',
                  'Assignment',
                  'Quiz',
                  'Examination',
                  'Grade',
                  'Enrollment',
                  'System',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNotifCategoryFilter(cat)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                      notifCategoryFilter === cat
                        ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {notifications
                  .filter(
                    (n) => notifCategoryFilter === 'All' || n.category === notifCategoryFilter
                  )
                  .map((n) => (
                    <div
                      key={n.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-mono text-slate-500">
                          {n.category} · {new Date(n.created_at).toLocaleString()}
                          {!n.read ? ' · UNREAD' : ''}
                        </p>
                        <h3 className="text-base font-bold">{n.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNotificationDeepLink(n)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-semibold shrink-0 transition-colors"
                      >
                        {n.target_type ? `Open ${n.target_type}` : 'Mark as read'}
                      </button>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {messages.map((m) => (
                <div key={m.id} className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      From: {m.sender_name} ({m.sender_role.toUpperCase()})
                    </span>
                    <span className="font-mono">{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-base font-bold">{m.subject}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {m.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: STUDENT PROFILE, PASSWORD CHANGE & TOKEN SECURITY
      ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 overflow-hidden flex items-center justify-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-emerald-600">{user.first_name[0]}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  STUDENT ID: {user.school_id}
                </p>
                <h1 className="text-2xl font-bold font-display">{user.name}</h1>
                <p className="text-xs text-slate-500">
                  {user.grade_level} · {user.section} · SY {user.school_year}
                </p>
              </div>
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
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Edit Personal Profile */}
            <form
              onSubmit={handleSaveProfile}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <h2 className="text-lg font-bold font-display">Personal Information</h2>
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
                  <label className="block text-xs font-semibold mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
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
              <div>
                <label className="block text-xs font-semibold mb-1">Institutional Email</label>
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
              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Profile Changes
              </button>
            </form>

            {/* Change Password & Active Token Lifecycle Inspector */}
            <div className="space-y-6">
              <form
                onSubmit={handleChangePassword}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4"
              >
                <h2 className="text-lg font-bold font-display">
                  Change Password (Reauthentication)
                </h2>
                <p className="text-xs text-slate-500">
                  Changing your password automatically invalidates all other refresh-token families.
                </p>
                <div>
                  <label className="block text-xs font-semibold mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    New Password (min. 8 characters)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold"
                >
                  Update Password & Revoke Other Sessions
                </button>
              </form>

              {/* Token Rotation & Session Security Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-base font-bold">Session & Token Security</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-600">
                    Rotations: {tokenMeta.rotationCount}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <div>RAM Access Token: {tokenMeta.accessTokenPreview || 'None'}</div>
                  <div>Active Session ID: {tokenMeta.sessionId || 'N/A'}</div>
                  <div>Active Device Sessions: {activeSessions.length}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleManualTokenRotate}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rotate Token Pair Now (/auth/refresh)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FIXED BOTTOM NAVIGATION BAR (STUDENT: 5 TABS)
      ===================================================================== */}
      <nav
        aria-label="Student Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-xl mx-auto grid grid-cols-5 items-center h-16 px-2">
          {(
            [
              { id: 'home', label: 'Home', icon: Home },
              { id: 'subjects', label: 'Subjects', icon: BookOpen },
              { id: 'tasks', label: 'Tasks', icon: ClipboardCheck },
              { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
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
                className={`min-h-[48px] flex flex-col items-center justify-center relative transition-colors ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {'badge' in item && item.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-mono flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] tracking-tight mt-1 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating QR Scanner Button (Accessible across all tabs) */}
      <button
        type="button"
        onClick={() => setShowQRScanner(true)}
        className="fixed bottom-20 right-4 sm:right-6 z-30 min-h-[48px] px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/30 hover:scale-105 active:scale-95 transition-all"
        title="Scan QR Code to join class or submit assignment"
      >
        <QrCode className="w-5 h-5" />
        <span className="hidden sm:inline">Scan QR Code</span>
      </button>

      {/* QR Code Scanner Modal Component */}
      <QRCodeScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onEnrollSuccess={async (subjectId) => {
          await loadSubjects();
          await loadDashboard();
          await loadTasksData();
          await loadProgressAnalytics();
          showToast('Subject joined and catalog updated!', 'success');
        }}
        onOpenAssignment={(assignmentId) => {
          setActiveTab('tasks');
          setTaskSubTab('assignments');
          loadTasksData().then(() => {
            const found = assignments.find((a) => a.id === assignmentId);
            if (found) {
              setSelectedAssignment(found);
              setAssignmentAnswers(found.answers || {});
              setUploadFiles(found.submitted_files || []);
              setSubmissionNotes(found.submission_notes || '');
            }
          });
        }}
        onOpenSubject={(subjectId) => {
          setActiveTab('subjects');
          setSubjectSection('enrolled');
          loadSubjects().then(() => {
            loadSubjectDetail(subjectId);
          });
        }}
        showToast={showToast}
      />
    </div>
  );
};
