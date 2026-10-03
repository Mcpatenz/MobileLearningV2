export type UserRole = 'student' | 'teacher' | 'admin';

export type AccountStatus = 'active' | 'pending' | 'inactive';

export type AuthState =
  | 'BOOTING'
  | 'CHECKING_SESSION'
  | 'REFRESHING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED';

export interface User {
  id: number;
  school_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  name: string;
  email: string;
  contact_number: string;
  role: UserRole;
  status: AccountStatus;
  avatar_url?: string;
  // Student-specific
  grade_level?: string;
  section?: string;
  school_year?: string;
  // Teacher-specific
  department?: string;
  specialization?: string;
  created_at: string;
}

export interface TokenSession {
  id: string;
  family_id: string;
  user_id: number;
  user_name?: string;
  user_school_id?: string;
  user_role?: UserRole;
  device_id: string;
  platform: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  revoked_at: string | null;
  revocation_reason?: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_at: string;
  session_id: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  description: string;
  grade_level: string;
  section: string;
  room?: string;
  school_year: string;
  semester: string;
  schedule: string;
  teacher_id: number;
  teacher_name: string;
  teacher_avatar?: string;
  enrolled_count: number;
  is_enrolled?: boolean;
  progress?: number;
  modules_count: number;
  assignments_count: number;
  quizzes_count: number;
  exams_count: number;
}

export interface LessonItem {
  id: number;
  module_id: number;
  title: string;
  type: 'reading' | 'pdf' | 'docx' | 'video';
  duration_minutes: number;
  content_summary: string;
  resource_url?: string;
  completed?: boolean;
}

export interface LearningModule {
  id: number;
  subject_id: number;
  subject_code?: string;
  subject_name?: string;
  title: string;
  description: string;
  order_index: number;
  published: boolean;
  completion_percentage?: number;
  lessons: LessonItem[];
  tags?: string[];
}

export interface StudentPerformanceOverview {
  weighted_average_grade: number;
  general_weighted_average: number;
  subjects_evaluated: number;
  highest_grade: number;
  lowest_grade: number;
  academic_standing: string;
  subjects: {
    subject_id: number;
    subject_code: string;
    subject_name: string;
    final_grade: number;
    assignment_avg: number;
    quiz_avg: number;
    exam_avg: number;
    progress: number;
    remarks: 'Passed' | 'Needs Improvement';
    honors_status: string;
  }[];
}

export interface StudyResource {
  id: string | number;
  title: string;
  description: string;
  file_name: string;
  file_type: 'pdf' | 'docx' | 'sheet' | 'guide';
  file_size_kb: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  module_id: number;
  module_title: string;
  teacher_name?: string;
  download_url?: string;
  uploaded_at: string;
  preview_text?: string;
  key_topics?: string[];
}

export interface WeeklyScheduleEvent {
  id: string | number;
  type: 'assignment' | 'exam' | 'quiz' | 'class_session' | 'study_block';
  title: string;
  subject_id?: number;
  subject_code: string;
  subject_name: string;
  date: string;
  start_time?: string;
  end_time?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  duration_minutes?: number;
  points?: number;
  location_or_room?: string;
}

export interface WeeklyStudyScheduleData {
  week_label: string;
  start_date: string;
  end_date: string;
  events: WeeklyScheduleEvent[];
  total_events: number;
  assignments_due_count: number;
  exams_quizzes_count: number;
}

export interface FocusSession {
  id: string;
  user_id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  module_id: number;
  module_title: string;
  duration_minutes: number;
  mode: 'pomodoro' | 'short_break' | 'long_break' | 'custom';
  completed_at: string;
}

export interface FocusStats {
  today_minutes: number;
  total_minutes: number;
  today_sessions_count: number;
  total_sessions_count: number;
  streak_days: number;
  most_studied_subject?: string;
  sessions: FocusSession[];
}

export interface DayIntensityData {
  date: string;
  day_of_month: number;
  day_of_week: number;
  intensity_level: 0 | 1 | 2 | 3 | 4;
  study_minutes: number;
  deadlines_count: number;
  completed_lessons_count: number;
  events: {
    type: 'assignment_due' | 'exam' | 'quiz' | 'study_session' | 'lesson_completed';
    title: string;
    subject_code: string;
    detail?: string;
  }[];
}

export interface MonthlyLearningIntensity {
  year: number;
  month: number;
  month_name: string;
  days: DayIntensityData[];
  total_study_minutes: number;
  total_deadlines: number;
  peak_intensity_day: string | null;
  active_study_days: number;
}

export interface SchoolAnnouncement {
  id: string | number;
  title: string;
  message: string;
  category: 'urgent' | 'maintenance' | 'academic' | 'general';
  priority: 'high' | 'medium' | 'low';
  broadcast_to: string;
  posted_at: string;
  expires_at?: string;
  is_active: boolean;
  action_label?: string;
  action_url?: string;
  author_name: string;
}

export interface VideoLesson {
  id: number;
  subject_id: number;
  subject_name: string;
  module_id: number;
  module_title: string;
  title: string;
  description: string;
  teacher_name: string;
  video_url: string;
  duration_seconds: number;
  watched_seconds: number;
  completed: boolean;
  last_watched_at?: string;
}

export type AssignmentStatus = 'Pending' | 'Submitted' | 'Late' | 'Graded' | 'Returned';

export interface Assignment {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  teacher_id: number;
  teacher_name: string;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  max_score: number;
  published: boolean;
  attachments: string[];
  questions?: AssessmentQuestion[];
  // Student perspective
  status?: AssignmentStatus;
  score?: number | null;
  correct_items?: number | null;
  total_items?: number;
  passed?: boolean | null;
  remark?: 'PASSED' | 'FAILED' | null;
  answers?: Record<number, string>;
  feedback?: string;
  submitted_at?: string;
  submitted_files?: { name: string; type: string; size_kb: number }[];
  submission_notes?: string;
  submissions_count?: number;
  graded_count?: number;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  assignment_title: string;
  subject_name: string;
  max_score: number;
  student_id: number;
  student_name: string;
  student_school_id: string;
  student_section: string;
  submitted_at: string;
  status: AssignmentStatus;
  files: { name: string; type: string; size_kb: number }[];
  notes: string;
  answers?: Record<number, string>;
  score: number | null;
  correct_items?: number | null;
  total_items?: number;
  passed?: boolean | null;
  remark?: 'PASSED' | 'FAILED' | null;
  remarks?: string;
  feedback: string;
  graded_at?: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface AssessmentQuestion {
  id: number;
  question_text: string;
  question_type: QuestionType;
  points: number;
  choices: { id: string; text: string; display_label?: string }[];
  correct_answer?: string;
}

export type RetakeStatus = 'none' | 'pending' | 'approved' | 'declined' | 'used';

export interface RetakeRequest {
  id: number;
  assessment_type: 'quiz' | 'exam';
  assessment_id: number;
  assessment_title: string;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  student_id: number;
  student_name: string;
  student_school_id: string;
  student_section: string;
  reason: string;
  previous_score: number | null;
  previous_total_points: number;
  previous_correct_items: number | null;
  previous_total_items: number;
  previous_remark: 'PASSED' | 'FAILED' | null;
  status: 'pending' | 'approved' | 'declined' | 'used';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  teacher_note?: string;
}

export interface Quiz {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  max_attempts: number;
  passing_score: number;
  start_date: string;
  end_date: string;
  published: boolean;
  questions: AssessmentQuestion[];
  // Student perspective
  attempts_used?: number;
  best_score?: number | null;
  best_correct_items?: number | null;
  total_items?: number;
  best_passed?: boolean | null;
  best_remark?: 'PASSED' | 'FAILED' | null;
  latest_attempt?: AssessmentAttempt | null;
  total_points: number;
  active_attempt_id?: string | null;
  retake_status?: RetakeStatus;
  retake_request?: RetakeRequest | null;
  can_take?: boolean;
}

export interface Exam {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  title: string;
  instructions: string;
  duration_minutes: number;
  total_points: number;
  passing_score: number;
  start_date: string;
  end_date: string;
  max_attempts: number;
  published: boolean;
  questions: AssessmentQuestion[];
  // Student perspective
  attempts_used?: number;
  latest_score?: number | null;
  latest_correct_items?: number | null;
  total_items?: number;
  latest_passed?: boolean | null;
  latest_remark?: 'PASSED' | 'FAILED' | null;
  latest_attempt?: AssessmentAttempt | null;
  active_attempt?: AssessmentAttempt | null;
  retake_status?: RetakeStatus;
  retake_request?: RetakeRequest | null;
  can_take?: boolean;
}

export interface AssessmentAttempt {
  id: string;
  assessment_type: 'quiz' | 'exam';
  assessment_id: number;
  student_id: number;
  student_name: string;
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
  status: 'in_progress' | 'submitted' | 'expired';
  answers: Record<number, string>;
  score: number | null;
  total_points: number;
  correct_items?: number | null;
  total_items?: number;
  percentage: number | null;
  passed: boolean | null;
  remark?: 'PASSED' | 'FAILED' | null;
  remarks?: string;
  max_score?: number;
  assessment_title?: string;
  shuffle_seed?: string;
}

export interface SubjectGradeSummary {
  student_subject_id: number;
  student_id: number;
  student_name: string;
  student_school_id: string;
  grade_level: string;
  section: string;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  teacher_name: string;
  assignment_avg: number;
  quiz_avg: number;
  exam_avg: number;
  final_grade: number;
  progress: number;
  remarks: 'Passed' | 'Needs Improvement' | 'In Progress';
}

export type NotificationCategory =
  | 'Assignment'
  | 'Quiz'
  | 'Examination'
  | 'Announcement'
  | 'Grade'
  | 'Enrollment'
  | 'System';

export interface AppNotification {
  id: number;
  user_id: number;
  category: NotificationCategory;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  target_type?: 'assignment' | 'quiz' | 'exam' | 'subject' | 'grades';
  target_id?: number;
}

export interface DirectMessage {
  id: number;
  recipient_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: UserRole;
  subject: string;
  body: string;
  created_at: string;
  read: boolean;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string;
  user_role: string;
  action: string;
  description: string;
  ip_address: string;
  device_info: string;
  timestamp: string;
}

export interface AdminUserGrowthPoint {
  period: string;
  students: number;
  teachers: number;
  admins: number;
  total_users: number;
}

export interface AdminActiveSubjectMetric {
  code: string;
  name: string;
  section: string;
  teacher_name: string;
  enrolled_students: number;
  modules_count: number;
  assessments_count: number;
  avg_progress: number;
  avg_grade: number;
}

export interface AdminSubmissionCompletionMetric {
  subject_code: string;
  subject_name: string;
  completion_rate: number;
  graded_rate: number;
  submitted_count: number;
  total_expected: number;
}

export interface AdminSubmissionStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface AdminDashboardAnalytics {
  user_growth: AdminUserGrowthPoint[];
  active_subjects: AdminActiveSubjectMetric[];
  submission_completion_by_subject: AdminSubmissionCompletionMetric[];
  submission_status_breakdown: AdminSubmissionStatusBreakdown[];
  overall_completion_rate: number;
  overall_graded_rate: number;
}

export interface Room {
  id: number;
  code: string;
  name: string;
  building: string;
  capacity: number;
  type: 'Lecture Room' | 'Science Laboratory' | 'Computer Lab' | 'Audio-Visual Room';
  status: 'Available' | 'Under Maintenance';
}

export interface SchoolSection {
  id: number;
  name: string;
  grade_level: string;
  adviser_id?: number;
  adviser_name?: string;
  room_id?: number;
  room_name?: string;
  capacity: number;
  school_year: string;
}

export interface SchoolDepartment {
  id: number;
  code: string;
  name: string;
  head_teacher_id?: number;
  head_teacher_name?: string;
  description: string;
}

export interface SystemSettings {
  school_name: string;
  school_subtitle: string;
  school_year: string;
  semester: string;
  grade_levels: string[];
  access_token_ttl_minutes: number;
  refresh_token_ttl_days: number;
  rate_limit_per_minute: number;
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  sms_alerts_enabled: boolean;
  maintenance_mode: boolean;
}

export interface LessonProgressItem {
  id: number;
  module_id: number;
  module_title: string;
  subject_id: number;
  subject_code: string;
  title: string;
  type: 'reading' | 'pdf' | 'docx' | 'video';
  duration_minutes: number;
  completed: boolean;
  resource_url?: string;
}

export interface SubjectLessonProgress {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  total_lessons: number;
  completed_lessons: number;
  completion_rate: number;
  modules: {
    id: number;
    title: string;
    total_lessons: number;
    completed_lessons: number;
    completion_rate: number;
    lessons: LessonProgressItem[];
  }[];
}

export interface QuizScoreItem {
  id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  title: string;
  score: number | null;
  total_points: number;
  percentage: number | null;
  passing_score: number;
  passing_percentage: number;
  correct_items: number | null;
  total_items: number;
  status: 'Completed' | 'Pending';
  passed: boolean | null;
  remark: 'PASSED' | 'FAILED' | 'PENDING';
}

export interface ExamScoreItem {
  id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  title: string;
  score: number | null;
  total_points: number;
  percentage: number | null;
  passing_score: number;
  passing_percentage: number;
  correct_items: number | null;
  total_items: number;
  status: 'Completed' | 'Pending';
  passed: boolean | null;
  remark: 'PASSED' | 'FAILED' | 'PENDING';
}

export interface SubjectComparisonItem {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  lesson_completion_rate: number;
  quiz_avg: number;
  exam_avg: number;
  final_grade: number;
  remarks: 'Passed' | 'Needs Improvement';
}

export interface StudentProgressAnalytics {
  overall_lesson_completion_rate: number;
  total_lessons_assigned: number;
  total_lessons_completed: number;
  overall_quiz_average: number;
  quizzes_passed_count: number;
  total_quizzes_count: number;
  overall_exam_average: number;
  exams_passed_count: number;
  total_exams_count: number;
  general_weighted_average: number;
  subjects_lesson_progress: SubjectLessonProgress[];
  quiz_scores: QuizScoreItem[];
  exam_scores: ExamScoreItem[];
  subject_comparisons: SubjectComparisonItem[];
}

export type QRScanType = 'class_join' | 'assignment_submit' | 'unknown';

export interface QRClassJoinPayload {
  type: 'class_join';
  subject_id: number;
  code: string;
  name?: string;
  school_year?: string;
}

export interface QRAssignmentPayload {
  type: 'assignment_submit';
  assignment_id: number;
  code?: string;
  subject_id?: number;
}

export interface QRScanResult {
  type: QRScanType;
  raw_data: string;
  message: string;
  success: boolean;
  subject?: Subject & { is_enrolled?: boolean };
  assignment?: Assignment;
  submission?: AssignmentSubmission | null;
  enrolled?: boolean;
  already_enrolled?: boolean;
}

