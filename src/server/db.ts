import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  User,
  TokenSession,
  Subject,
  LearningModule,
  VideoLesson,
  Assignment,
  AssignmentSubmission,
  Quiz,
  Exam,
  AssessmentAttempt,
  RetakeRequest,
  SubjectGradeSummary,
  AppNotification,
  DirectMessage,
  AuditLog,
  SystemSettings,
  Room,
  SchoolSection,
  SchoolDepartment,
  SchoolAnnouncement,
} from '../types/lms';

export interface UserRecord extends User {
  password_hash: string;
}

export interface RefreshTokenRecord extends TokenSession {
  refresh_token_hash: string;
}

export interface PasswordResetRecord {
  id: string;
  user_id: number;
  school_id_or_email: string;
  code: string;
  expires_at: string;
  used: boolean;
}

export interface DatabaseSchema {
  users: UserRecord[];
  token_sessions: RefreshTokenRecord[];
  password_reset_tokens: PasswordResetRecord[];
  rooms: Room[];
  sections: SchoolSection[];
  departments: SchoolDepartment[];
  subjects: Subject[];
  student_subjects: {
    id: number;
    student_id: number;
    subject_id: number;
    progress: number;
    assignment_avg: number;
    quiz_avg: number;
    exam_avg: number;
    final_grade: number;
    enrolled_at: string;
    remarks?: string;
  }[];
  modules: LearningModule[];
  videos: VideoLesson[];
  video_progress: {
    user_id: number;
    video_id: number;
    watched_seconds: number;
    completed: boolean;
    updated_at: string;
  }[];
  lesson_progress: {
    user_id: number;
    lesson_id: number;
    completed: boolean;
    updated_at: string;
  }[];
  assignments: Assignment[];
  assignment_submissions: AssignmentSubmission[];
  quizzes: Quiz[];
  exams: Exam[];
  assessment_attempts: AssessmentAttempt[];
  retake_requests: RetakeRequest[];
  notifications: AppNotification[];
  messages: DirectMessage[];
  audit_logs: AuditLog[];
  system_settings: SystemSettings;
  focus_sessions?: {
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
  }[];
  announcements?: SchoolAnnouncement[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mla-db.json');

export function hashPassword(password: string): string {
  const salt = 'tnhs_mla_v2_salt_2026';
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const computed = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createInitialDatabase(): DatabaseSchema {
  const defaultPassword = hashPassword('password123');

  const users: UserRecord[] = [
    {
      id: 1,
      school_id: '2026-00142',
      first_name: 'Maria Clara',
      middle_name: 'Delos',
      last_name: 'Santos',
      name: 'Maria Clara D. Santos',
      email: 'maria.santos@tnhs.edu.ph',
      contact_number: '+63 917 482 9104',
      role: 'student',
      status: 'active',
      avatar_url: '/src/assets/images/avatar_student_maria_1790597967645.jpg',
      grade_level: 'Grade 10',
      section: 'Rizal - STE',
      school_year: '2026-2027',
      created_at: '2026-06-10T08:00:00Z',
      password_hash: defaultPassword,
    },
    {
      id: 2,
      school_id: '2026-00188',
      first_name: 'Juan Miguel',
      middle_name: 'Cruz',
      last_name: 'Bautista',
      name: 'Juan Miguel C. Bautista',
      email: 'juan.bautista@tnhs.edu.ph',
      contact_number: '+63 918 339 1120',
      role: 'student',
      status: 'active',
      grade_level: 'Grade 10',
      section: 'Rizal - STE',
      school_year: '2026-2027',
      created_at: '2026-06-11T09:15:00Z',
      password_hash: defaultPassword,
    },
    {
      id: 3,
      school_id: '2026-00215',
      first_name: 'Angela Mae',
      middle_name: 'Villanueva',
      last_name: 'Mendoza',
      name: 'Angela Mae V. Mendoza',
      email: 'angela.mendoza@tnhs.edu.ph',
      contact_number: '+63 919 841 5521',
      role: 'student',
      status: 'active',
      grade_level: 'Grade 10',
      section: 'Rizal - STE',
      school_year: '2026-2027',
      created_at: '2026-06-12T10:30:00Z',
      password_hash: defaultPassword,
    },
    {
      id: 4,
      school_id: '2026-00309',
      first_name: 'Paolo Gabriel',
      middle_name: 'Luna',
      last_name: 'Aquino',
      name: 'Paolo Gabriel L. Aquino',
      email: 'paolo.aquino@tnhs.edu.ph',
      contact_number: '+63 927 601 8832',
      role: 'student',
      status: 'pending',
      grade_level: 'Grade 10',
      section: 'Bonifacio',
      school_year: '2026-2027',
      created_at: '2026-09-26T14:20:00Z',
      password_hash: defaultPassword,
    },
    {
      id: 5,
      school_id: '2026-00344',
      first_name: 'Katrina Joy',
      middle_name: 'Ramos',
      last_name: 'Navarro',
      name: 'Katrina Joy R. Navarro',
      email: 'katrina.navarro@tnhs.edu.ph',
      contact_number: '+63 915 772 3901',
      role: 'student',
      status: 'pending',
      grade_level: 'Grade 11',
      section: 'STEM - Faraday',
      school_year: '2026-2027',
      created_at: '2026-09-27T11:05:00Z',
      password_hash: defaultPassword,
    },
    {
      id: 10,
      school_id: 'TCH-2026-08',
      first_name: 'Roberto',
      middle_name: 'Alonzo',
      last_name: 'Reyes',
      name: 'Engr. Roberto A. Reyes',
      email: 'roberto.reyes@tnhs.edu.ph',
      contact_number: '+63 917 890 2231',
      role: 'teacher',
      status: 'active',
      avatar_url: '/src/assets/images/avatar_teacher_reyes_1790597986957.jpg',
      department: 'Mathematics & Computational Sciences',
      specialization: 'Secondary Mathematics & STEM',
      school_year: '2026-2027',
      created_at: '2025-05-15T08:00:00Z',
      password_hash: defaultPassword,
    },
    {
      id: 11,
      school_id: 'TCH-2026-14',
      first_name: 'Elena',
      middle_name: 'Soriano',
      last_name: 'Valdez',
      name: 'Dr. Elena S. Valdez',
      email: 'elena.valdez@tnhs.edu.ph',
      contact_number: '+63 918 512 4409',
      role: 'teacher',
      status: 'active',
      department: 'Natural Sciences Department',
      specialization: 'Earth Science & Biology',
      school_year: '2026-2027',
      created_at: '2025-05-18T08:00:00Z',
      password_hash: defaultPassword,
    },
    {
      id: 12,
      school_id: 'TCH-2026-21',
      first_name: 'Marco',
      middle_name: 'Diaz',
      last_name: 'Salazar',
      name: 'Prof. Marco D. Salazar',
      email: 'marco.salazar@tnhs.edu.ph',
      contact_number: '+63 920 419 7782',
      role: 'teacher',
      status: 'pending',
      department: 'Languages & Literature',
      specialization: 'World Literature & Rhetoric',
      school_year: '2026-2027',
      created_at: '2026-09-27T16:45:00Z',
      password_hash: defaultPassword,
    },
    {
      id: 99,
      school_id: 'ADM-2026-01',
      first_name: 'Lourdes',
      middle_name: 'Mercado',
      last_name: 'Panganiban',
      name: 'Dr. Lourdes M. Panganiban',
      email: 'admin.registrar@tnhs.edu.ph',
      contact_number: '+63 917 100 9900',
      role: 'admin',
      status: 'active',
      department: 'Office of the Principal & ICT Division',
      school_year: '2026-2027',
      created_at: '2024-01-01T08:00:00Z',
      password_hash: defaultPassword,
    },
  ];

  const subjects: Subject[] = [
    {
      id: 101,
      code: 'MATH-10A',
      name: 'Mathematics 10: Sequences, Polynomials & Circles',
      description:
        'Comprehensive study of arithmetic and geometric sequences, polynomial equations, tangent-secant theorems on circles, and coordinate geometry proofs for Grade 10 STE learners.',
      grade_level: 'Grade 10',
      section: 'Rizal - STE',
      school_year: '2026-2027',
      semester: '1st Semester',
      schedule: 'Mon / Wed / Fri · 07:30 AM – 08:30 AM',
      teacher_id: 10,
      teacher_name: 'Engr. Roberto A. Reyes',
      teacher_avatar: '/src/assets/images/avatar_teacher_reyes_1790597986957.jpg',
      enrolled_count: 34,
      modules_count: 3,
      assignments_count: 2,
      quizzes_count: 2,
      exams_count: 1,
    },
    {
      id: 102,
      code: 'SCI-10A',
      name: 'Science 10: Plate Tectonics, Electromagnetism & Genetics',
      description:
        'Investigates lithospheric plate boundaries, seismic wave triangulation, electromagnetic spectrum applications, and molecular heredity.',
      grade_level: 'Grade 10',
      section: 'Rizal - STE',
      school_year: '2026-2027',
      semester: '1st Semester',
      schedule: 'Tue / Thu · 09:00 AM – 10:30 AM',
      teacher_id: 11,
      teacher_name: 'Dr. Elena S. Valdez',
      enrolled_count: 34,
      modules_count: 2,
      assignments_count: 2,
      quizzes_count: 1,
      exams_count: 1,
    },
    {
      id: 103,
      code: 'COMP-10S',
      name: 'Applied Research & Mobile Computing Fundamentals',
      description:
        'Covers structured algorithms, relational data modeling, REST API design principles, and quantitative research statistics for Science, Technology & Engineering students.',
      grade_level: 'Grade 10',
      section: 'Rizal - STE',
      school_year: '2026-2027',
      semester: '1st Semester',
      schedule: 'Mon / Wed · 01:00 PM – 02:30 PM',
      teacher_id: 10,
      teacher_name: 'Engr. Roberto A. Reyes',
      teacher_avatar: '/src/assets/images/avatar_teacher_reyes_1790597986957.jpg',
      enrolled_count: 31,
      modules_count: 2,
      assignments_count: 1,
      quizzes_count: 1,
      exams_count: 1,
    },
    {
      id: 104,
      code: 'ENG-10A',
      name: 'English 10: World Literature & Argumentative Rhetoric',
      description:
        'Critical analysis of Greco-Roman classics, Dante, Shakespearean tragedy, and formal synthesis essays with APA 7th citation standards.',
      grade_level: 'Grade 10',
      section: 'Rizal - STE',
      school_year: '2026-2027',
      semester: '1st Semester',
      schedule: 'Tue / Thu · 01:00 PM – 02:30 PM',
      teacher_id: 11,
      teacher_name: 'Dr. Elena S. Valdez',
      enrolled_count: 29,
      modules_count: 2,
      assignments_count: 1,
      quizzes_count: 1,
      exams_count: 0,
    },
    {
      id: 105,
      code: 'STAT-10E',
      name: 'Advanced Data Analytics & Probability Lab (Elective)',
      description:
        'Elective laboratory course covering combinatorics, normal distributions, hypothesis testing, and exploratory data visualization.',
      grade_level: 'Grade 10',
      section: 'Rizal - STE',
      school_year: '2026-2027',
      semester: '1st Semester',
      schedule: 'Fri · 02:00 PM – 04:00 PM',
      teacher_id: 10,
      teacher_name: 'Engr. Roberto A. Reyes',
      teacher_avatar: '/src/assets/images/avatar_teacher_reyes_1790597986957.jpg',
      enrolled_count: 22,
      modules_count: 2,
      assignments_count: 1,
      quizzes_count: 1,
      exams_count: 0,
    },
  ];

  const student_subjects = [
    {
      id: 1,
      student_id: 1,
      subject_id: 101,
      progress: 82,
      assignment_avg: 94,
      quiz_avg: 90,
      exam_avg: 92,
      final_grade: 92,
      enrolled_at: '2026-06-15T08:00:00Z',
    },
    {
      id: 2,
      student_id: 1,
      subject_id: 102,
      progress: 74,
      assignment_avg: 88,
      quiz_avg: 85,
      exam_avg: 89,
      final_grade: 87,
      enrolled_at: '2026-06-15T08:05:00Z',
    },
    {
      id: 3,
      student_id: 1,
      subject_id: 103,
      progress: 91,
      assignment_avg: 96,
      quiz_avg: 95,
      exam_avg: 94,
      final_grade: 95,
      enrolled_at: '2026-06-15T08:10:00Z',
    },
    {
      id: 4,
      student_id: 2,
      subject_id: 101,
      progress: 68,
      assignment_avg: 85,
      quiz_avg: 82,
      exam_avg: 84,
      final_grade: 84,
      enrolled_at: '2026-06-15T09:00:00Z',
    },
    {
      id: 5,
      student_id: 2,
      subject_id: 102,
      progress: 79,
      assignment_avg: 90,
      quiz_avg: 88,
      exam_avg: 86,
      final_grade: 88,
      enrolled_at: '2026-06-15T09:05:00Z',
    },
    {
      id: 6,
      student_id: 3,
      subject_id: 101,
      progress: 95,
      assignment_avg: 97,
      quiz_avg: 96,
      exam_avg: 95,
      final_grade: 96,
      enrolled_at: '2026-06-15T09:10:00Z',
    },
  ];

  const modules: LearningModule[] = [
    {
      id: 201,
      subject_id: 101,
      title: 'Module 1: Arithmetic & Geometric Sequences',
      description: 'Deriving nth-term formulas, arithmetic means, geometric series, and infinite convergence.',
      order_index: 1,
      published: true,
      completion_percentage: 100,
      lessons: [
        {
          id: 2001,
          module_id: 201,
          title: 'Lesson 1.1: Patterns, Inductive Reasoning & Explicit Formulas',
          type: 'reading',
          duration_minutes: 20,
          content_summary:
            'An arithmetic sequence has a constant difference d = a_n - a_{n-1}. The nth term is given by a_n = a_1 + (n - 1)d.',
          completed: true,
        },
        {
          id: 2002,
          module_id: 201,
          title: 'Lesson 1.2: Sum of Finite & Infinite Geometric Series (PDF)',
          type: 'pdf',
          duration_minutes: 25,
          content_summary:
            'Derivation of S_n = a_1(1 - r^n)/(1 - r) for r != 1 and S_inf = a_1/(1 - r) when |r| < 1.',
          resource_url: '/docs/TNHS_Math10_Module1_Geometric_Series.pdf',
          completed: true,
        },
      ],
    },
    {
      id: 202,
      subject_id: 101,
      title: 'Module 2: Polynomial Division, Remainder & Factor Theorems',
      description: 'Synthetic division, finding rational roots, and sketching polynomial functions.',
      order_index: 2,
      published: true,
      completion_percentage: 65,
      lessons: [
        {
          id: 2003,
          module_id: 202,
          title: 'Lesson 2.1: Long Division vs. Synthetic Division of Polynomials',
          type: 'video',
          duration_minutes: 18,
          content_summary:
            'Step-by-step walkthrough of synthetic division and evaluating P(c) using the Remainder Theorem.',
          completed: true,
        },
        {
          id: 2004,
          module_id: 202,
          title: 'Lesson 2.2: Rational Root Theorem & Descartes Rule of Signs',
          type: 'pdf',
          duration_minutes: 30,
          content_summary:
            'Identifying all possible rational zeros p/q of higher-degree polynomial equations.',
          resource_url: '/docs/TNHS_Math10_Module2_Rational_Roots.pdf',
          completed: false,
        },
      ],
    },
    {
      id: 203,
      subject_id: 101,
      title: 'Module 3: Chords, Arcs, Central Angles & Tangent-Secant Theorems',
      description: 'Geometric proofs on circles, inscribed angles, power of a point, and distance formula.',
      order_index: 3,
      published: true,
      completion_percentage: 30,
      lessons: [
        {
          id: 2005,
          module_id: 203,
          title: 'Lesson 3.1: Inscribed Angles & Intercepted Arcs',
          type: 'reading',
          duration_minutes: 22,
          content_summary:
            'Proving that the measure of an inscribed angle is half the measure of its intercepted arc.',
          completed: false,
        },
      ],
    },
    {
      id: 204,
      subject_id: 102,
      title: 'Module 1: Earth Lithosphere & Seismic Triangulation',
      description: 'Locating earthquake epicenters using P-wave and S-wave arrival time lags across Philippine stations.',
      order_index: 1,
      published: true,
      completion_percentage: 85,
      lessons: [
        {
          id: 2006,
          module_id: 204,
          title: 'Lesson 1.1: Primary (P) and Secondary (S) Seismic Waves',
          type: 'video',
          duration_minutes: 16,
          content_summary:
            'Calculating epicentral distance from PHIVOLCS seismogram data in Tagaytay, Davao, and Baguio.',
          completed: true,
        },
        {
          id: 2007,
          module_id: 204,
          title: 'Lesson 1.2: Convergent, Divergent & Transform Plate Boundaries',
          type: 'pdf',
          duration_minutes: 25,
          content_summary: 'Formation of the Philippine Trench, Manila Trench, and volcanic island arcs.',
          completed: true,
        },
      ],
    },
    {
      id: 205,
      subject_id: 103,
      title: 'Module 1: Client-Server Architecture & Token Security',
      description: 'Understanding REST APIs, HTTP status codes, and short-lived access tokens with rotating refresh tokens.',
      order_index: 1,
      published: true,
      completion_percentage: 90,
      lessons: [
        {
          id: 2008,
          module_id: 205,
          title: 'Lesson 1.1: Why Mobile Apps Never Connect Directly to MySQL',
          type: 'reading',
          duration_minutes: 15,
          content_summary:
            'Three-tier architecture: Mobile Client -> Authenticated REST API -> Relational Database.',
          completed: true,
        },
      ],
    },
  ];

  const videos: VideoLesson[] = [
    {
      id: 301,
      subject_id: 101,
      subject_name: 'Mathematics 10: Sequences, Polynomials & Circles',
      module_id: 202,
      module_title: 'Module 2: Polynomial Division, Remainder & Factor Theorems',
      title: 'Synthetic Division & Remainder Theorem Masterclass',
      description:
        'Engr. Roberto Reyes demonstrates how to divide 4th-degree polynomials in under 60 seconds using synthetic division and verify roots with the Remainder Theorem.',
      teacher_name: 'Engr. Roberto A. Reyes',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration_seconds: 15,
      watched_seconds: 9,
      completed: false,
      last_watched_at: '2026-09-27T19:30:00Z',
    },
    {
      id: 302,
      subject_id: 101,
      subject_name: 'Mathematics 10: Sequences, Polynomials & Circles',
      module_id: 201,
      module_title: 'Module 1: Arithmetic & Geometric Sequences',
      title: 'Visualizing Infinite Geometric Series Convergence',
      description:
        'Geometric proof showing why 1/2 + 1/4 + 1/8 + 1/16 converges to 1, with practical applications in physics and finance.',
      teacher_name: 'Engr. Roberto A. Reyes',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      duration_seconds: 15,
      watched_seconds: 15,
      completed: true,
      last_watched_at: '2026-09-24T15:10:00Z',
    },
    {
      id: 303,
      subject_id: 102,
      subject_name: 'Science 10: Plate Tectonics, Electromagnetism & Genetics',
      module_id: 204,
      module_title: 'Module 1: Earth Lithosphere & Seismic Triangulation',
      title: 'Triangulating Earthquake Epicenters Using PHIVOLCS Data',
      description:
        'Dr. Elena Valdez walks through reading P-wave and S-wave time-distance graphs and drawing triangulation circles on the Philippine fault map.',
      teacher_name: 'Dr. Elena S. Valdez',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      duration_seconds: 60,
      watched_seconds: 24,
      completed: false,
      last_watched_at: '2026-09-26T10:15:00Z',
    },
  ];

  const video_progress = [
    {
      user_id: 1,
      video_id: 301,
      watched_seconds: 9,
      completed: false,
      updated_at: '2026-09-27T19:30:00Z',
    },
    {
      user_id: 1,
      video_id: 302,
      watched_seconds: 15,
      completed: true,
      updated_at: '2026-09-24T15:10:00Z',
    },
    {
      user_id: 1,
      video_id: 303,
      watched_seconds: 24,
      completed: false,
      updated_at: '2026-09-26T10:15:00Z',
    },
  ];

  const assignments: Assignment[] = [
    {
      id: 401,
      subject_id: 101,
      subject_name: 'Mathematics 10: Sequences, Polynomials & Circles',
      subject_code: 'MATH-10A',
      teacher_id: 10,
      teacher_name: 'Engr. Roberto A. Reyes',
      title: 'Problem Set #3: Polynomial Roots & Synthetic Division',
      description:
        'Solve 5 multi-step polynomial factorizations and model a box-volume optimization problem using a cubic polynomial function.',
      instructions:
        '1. Download the attached Problem Set worksheet.\n2. Show complete synthetic division tables and Rational Root tests.\n3. Upload a clear PDF scan, document, or photo of your handwritten/typed solution before the deadline.',
      due_date: '2026-10-02T23:59:00Z',
      max_score: 50,
      published: true,
      attachments: ['TNHS_Math10_ProblemSet3_Polynomials.pdf', 'Rubric_Mathematical_Proofs.pdf'],
      questions: [
        {
          id: 4001,
          question_text:
            'Use synthetic division to divide P(x) = 3x⁴ - 8x³ + 9x + 5 by (x - 2). State the quotient Q(x) and remainder R.',
          question_type: 'short_answer',
          points: 20,
          choices: [],
          correct_answer: 'Q(x) = 3x³ - 2x² - 4x + 1, R = 7',
        },
        {
          id: 4002,
          question_text:
            'Find all rational roots of x³ - 7x - 6 = 0 using the Rational Root Theorem and factor the polynomial completely.',
          question_type: 'short_answer',
          points: 15,
          choices: [],
          correct_answer: '(x + 1)(x + 2)(x - 3) = 0; roots: -1, -2, 3',
        },
        {
          id: 4003,
          question_text:
            'An open-top box is constructed from a 12 in × 16 in rectangular sheet by cutting congruent squares of side x from each corner. Which cubic function V(x) models its volume?',
          question_type: 'multiple_choice',
          points: 15,
          choices: [
            { id: 'A', text: 'V(x) = 4x³ - 56x² + 192x' },
            { id: 'B', text: 'V(x) = x³ - 28x² + 192x' },
            { id: 'C', text: 'V(x) = 4x³ - 28x² + 192' },
            { id: 'D', text: 'V(x) = 2x³ - 56x² + 96x' },
          ],
          correct_answer: 'A',
        },
      ],
    },
    {
      id: 402,
      subject_id: 102,
      subject_name: 'Science 10: Plate Tectonics, Electromagnetism & Genetics',
      subject_code: 'SCI-10A',
      teacher_id: 11,
      teacher_name: 'Dr. Elena S. Valdez',
      title: 'Lab Activity #2: Philippine Fault System Epicenter Triangulation',
      description:
        'Compute time lag (Td) between P and S waves from three seismic stations and plot the epicenter coordinates.',
      instructions:
        'Complete Table 2.1 in your lab manual and upload your scaled compass map alongside your conclusion paragraph.',
      due_date: '2026-09-30T17:00:00Z',
      max_score: 40,
      published: true,
      attachments: ['PHIVOLCS_Seismogram_Dataset_2026.pdf'],
      questions: [
        {
          id: 4004,
          question_text:
            'Given a P-S arrival time difference of 32 seconds at the Tagaytay seismic station, compute the epicentral distance using d = (Td / 8 s) × 100 km.',
          question_type: 'short_answer',
          points: 20,
          choices: [],
          correct_answer: '400 km',
        },
        {
          id: 4005,
          question_text:
            'Explain why tectonic earthquakes occur frequently along the Philippine Mobile Belt.',
          question_type: 'short_answer',
          points: 20,
          choices: [],
          correct_answer: 'Opposing subduction of the Eurasian/Sunda Plate and Philippine Sea Plate.',
        },
      ],
    },
    {
      id: 403,
      subject_id: 101,
      subject_name: 'Mathematics 10: Sequences, Polynomials & Circles',
      subject_code: 'MATH-10A',
      teacher_id: 10,
      teacher_name: 'Engr. Roberto A. Reyes',
      title: 'Problem Set #2: Infinite Geometric Series & Harmonic Means',
      description:
        'Derivation of repeating decimals as rational fractions and computing bouncing-ball total vertical distance.',
      instructions: 'Submit your completed solution sheet in PDF or high-resolution image format.',
      due_date: '2026-09-20T23:59:00Z',
      max_score: 50,
      published: true,
      attachments: ['TNHS_Math10_ProblemSet2_Series.pdf'],
      questions: [
        {
          id: 4006,
          question_text:
            'Express the repeating decimal 0.272727... as a simplified rational fraction using the infinite geometric series formula S = a₁ / (1 - r).',
          question_type: 'short_answer',
          points: 25,
          choices: [],
          correct_answer: '3/11',
        },
        {
          id: 4007,
          question_text:
            'A rubber ball is dropped from a height of 18 meters and rebounds 2/3 of its previous height on each bounce. Find the total vertical distance traveled before coming to rest.',
          question_type: 'short_answer',
          points: 25,
          choices: [],
          correct_answer: '90 meters',
        },
      ],
    },
    {
      id: 404,
      subject_id: 103,
      subject_name: 'Applied Research & Mobile Computing Fundamentals',
      subject_code: 'COMP-10S',
      teacher_id: 10,
      teacher_name: 'Engr. Roberto A. Reyes',
      title: 'Database Normalization Exercise (1NF to 3NF)',
      description:
        'Normalize the legacy school library spreadsheet into 3rd Normal Form (3NF) with primary and foreign key constraints.',
      instructions: 'Upload your Entity-Relationship Diagram (ERD) and normalized table definitions.',
      due_date: '2026-09-25T23:59:00Z',
      max_score: 100,
      published: true,
      attachments: ['Legacy_Library_Unnormalized_Schema.pdf'],
      questions: [
        {
          id: 4008,
          question_text:
            'Identify all repeating groups and partial dependencies in the unnormalized Student_Library_Loans table and decompose into 2NF.',
          question_type: 'short_answer',
          points: 50,
          choices: [],
          correct_answer: 'Separate Students, Books, and Loan_Items tables with composite/foreign keys.',
        },
        {
          id: 4009,
          question_text:
            'Eliminate transitive dependencies (e.g., Publisher_City depending on Publisher_ID) to achieve 3rd Normal Form (3NF).',
          question_type: 'short_answer',
          points: 50,
          choices: [],
          correct_answer: 'Extract Publishers table referenced by Books.publisher_id.',
        },
      ],
    },
  ];

  const assignment_submissions: AssignmentSubmission[] = [
    {
      id: 501,
      assignment_id: 403,
      assignment_title: 'Problem Set #2: Infinite Geometric Series & Harmonic Means',
      subject_name: 'Mathematics 10: Sequences, Polynomials & Circles',
      max_score: 50,
      student_id: 1,
      student_name: 'Maria Clara D. Santos',
      student_school_id: '2026-00142',
      student_section: 'Rizal - STE',
      submitted_at: '2026-09-19T18:42:00Z',
      status: 'Graded',
      files: [{ name: 'Santos_MariaClara_Math10_PS2.pdf', type: 'application/pdf', size_kb: 842 }],
      notes: 'Completed all 6 problems including the bonus harmonic sequence proof.',
      score: 48,
      feedback:
        'Exemplary work, Maria Clara! Your proof for the repeating decimal 0.272727... = 3/11 is crystal clear.',
      graded_at: '2026-09-21T10:15:00Z',
    },
    {
      id: 502,
      assignment_id: 404,
      assignment_title: 'Database Normalization Exercise (1NF to 3NF)',
      subject_name: 'Applied Research & Mobile Computing Fundamentals',
      max_score: 100,
      student_id: 1,
      student_name: 'Maria Clara D. Santos',
      student_school_id: '2026-00142',
      student_section: 'Rizal - STE',
      submitted_at: '2026-09-24T20:10:00Z',
      status: 'Submitted',
      files: [{ name: 'Santos_ERD_3NF_Schema.pdf', type: 'application/pdf', size_kb: 1120 }],
      notes: 'Separated Student_Borrowings into a junction table to eliminate transitive dependencies.',
      score: null,
      feedback: '',
    },
    {
      id: 503,
      assignment_id: 403,
      assignment_title: 'Problem Set #2: Infinite Geometric Series & Harmonic Means',
      subject_name: 'Mathematics 10: Sequences, Polynomials & Circles',
      max_score: 50,
      student_id: 2,
      student_name: 'Juan Miguel C. Bautista',
      student_school_id: '2026-00188',
      student_section: 'Rizal - STE',
      submitted_at: '2026-09-20T21:05:00Z',
      status: 'Submitted',
      files: [{ name: 'Bautista_Juan_PS2_Scan.jpg', type: 'image/jpeg', size_kb: 640 }],
      notes: 'Here is my scanned solution sheet.',
      score: null,
      feedback: '',
    },
  ];

  const quizzes: Quiz[] = [
    {
      id: 601,
      subject_id: 101,
      subject_name: 'Mathematics 10: Sequences, Polynomials & Circles',
      subject_code: 'MATH-10A',
      title: 'Quiz #2: Remainder Theorem, Factor Theorem & Synthetic Division',
      description: 'Short diagnostic quiz covering polynomial division and root verification.',
      time_limit_minutes: 15,
      max_attempts: 2,
      passing_score: 15,
      start_date: '2026-09-25T00:00:00Z',
      end_date: '2026-10-10T23:59:00Z',
      published: true,
      total_points: 25,
      questions: [
        {
          id: 6001,
          question_text: 'What is the remainder when P(x) = 2x³ - 5x² + 3x - 7 is divided by (x - 2)?',
          question_type: 'multiple_choice',
          points: 5,
          choices: [
            { id: 'A', text: '-5' },
            { id: 'B', text: '3' },
            { id: 'C', text: '-9' },
            { id: 'D', text: '11' },
          ],
          correct_answer: 'A',
        },
        {
          id: 6002,
          question_text:
            'By the Factor Theorem, (x - c) is a factor of polynomial P(x) if and only if P(c) = 0.',
          question_type: 'true_false',
          points: 5,
          choices: [
            { id: 'True', text: 'True' },
            { id: 'False', text: 'False' },
          ],
          correct_answer: 'True',
        },
        {
          id: 6003,
          question_text: 'Which of the following is a factor of x³ - 6x² + 11x - 6?',
          question_type: 'multiple_choice',
          points: 5,
          choices: [
            { id: 'A', text: 'x + 1' },
            { id: 'B', text: 'x - 3' },
            { id: 'C', text: 'x + 2' },
            { id: 'D', text: 'x - 4' },
          ],
          correct_answer: 'B',
        },
        {
          id: 6004,
          question_text: 'What is the degree of the quotient when a 5th-degree polynomial is divided by (x + 4)?',
          question_type: 'multiple_choice',
          points: 5,
          choices: [
            { id: 'A', text: '3' },
            { id: 'B', text: '4' },
            { id: 'C', text: '5' },
            { id: 'D', text: '6' },
          ],
          correct_answer: 'B',
        },
        {
          id: 6005,
          question_text: 'Find the 7th term of the geometric sequence: 3, 6, 12, 24, ...',
          question_type: 'multiple_choice',
          points: 5,
          choices: [
            { id: 'A', text: '96' },
            { id: 'B', text: '144' },
            { id: 'C', text: '192' },
            { id: 'D', text: '384' },
          ],
          correct_answer: 'C',
        },
      ],
    },
    {
      id: 602,
      subject_id: 102,
      subject_name: 'Science 10: Plate Tectonics, Electromagnetism & Genetics',
      subject_code: 'SCI-10A',
      title: 'Quiz #1: Lithospheric Plates & Seismic Wave Propagation',
      description: 'Assess your mastery of crust types, subduction zones, and P/S wave velocity differences.',
      time_limit_minutes: 10,
      max_attempts: 2,
      passing_score: 10,
      start_date: '2026-09-20T00:00:00Z',
      end_date: '2026-10-08T23:59:00Z',
      published: true,
      total_points: 15,
      questions: [
        {
          id: 6006,
          question_text: 'Which seismic body wave travels fastest through Earth’s interior and arrives first at a seismograph station?',
          question_type: 'multiple_choice',
          points: 5,
          choices: [
            { id: 'A', text: 'Primary (P) wave' },
            { id: 'B', text: 'Secondary (S) wave' },
            { id: 'C', text: 'Love surface wave' },
            { id: 'D', text: 'Rayleigh wave' },
          ],
          correct_answer: 'A',
        },
        {
          id: 6007,
          question_text: 'Secondary (S) waves can travel through both solid mantle rock and the liquid outer core.',
          question_type: 'true_false',
          points: 5,
          choices: [
            { id: 'True', text: 'True' },
            { id: 'False', text: 'False' },
          ],
          correct_answer: 'False',
        },
        {
          id: 6008,
          question_text: 'How many seismic recording stations are minimally required to triangulate an earthquake epicenter?',
          question_type: 'multiple_choice',
          points: 5,
          choices: [
            { id: 'A', text: '1 station' },
            { id: 'B', text: '2 stations' },
            { id: 'C', text: '3 stations' },
            { id: 'D', text: '5 stations' },
          ],
          correct_answer: 'C',
        },
      ],
    },
  ];

  const exams: Exam[] = [
    {
      id: 701,
      subject_id: 101,
      subject_name: 'Mathematics 10: Sequences, Polynomials & Circles',
      subject_code: 'MATH-10A',
      title: 'First Quarter Departmental Examination — Mathematics 10',
      instructions:
        'SERVER-MONITORED EXAMINATION: Read each item carefully. Every answer selection is automatically synchronized to the TNHS server in real time. If your connection drops or the app closes, your progress and remaining server timer will resume automatically while the exam window is active.',
      duration_minutes: 45,
      total_points: 40,
      passing_score: 24,
      start_date: '2026-09-25T00:00:00Z',
      end_date: '2026-10-15T23:59:00Z',
      max_attempts: 1,
      published: true,
      questions: [
        {
          id: 7001,
          question_text:
            'An auditorium has 20 seats in the first row, 24 seats in the second row, 28 seats in the third row, and so on. How many seats are there in all if the auditorium has 15 rows?',
          question_type: 'multiple_choice',
          points: 10,
          choices: [
            { id: 'A', text: '680 seats' },
            { id: 'B', text: '720 seats' },
            { id: 'C', text: '760 seats' },
            { id: 'D', text: '810 seats' },
          ],
          correct_answer: 'B',
        },
        {
          id: 7002,
          question_text:
            'Find the value of k so that (x + 2) is a factor of P(x) = x³ + kx² - 4x + 4.',
          question_type: 'multiple_choice',
          points: 10,
          choices: [
            { id: 'A', text: 'k = -1' },
            { id: 'B', text: 'k = 1' },
            { id: 'C', text: 'k = -3' },
            { id: 'D', text: 'k = 2' },
          ],
          correct_answer: 'A',
        },
        {
          id: 7003,
          question_text:
            'The sum of an infinite geometric series is 18 and its first term is 12. What is the common ratio r?',
          question_type: 'multiple_choice',
          points: 10,
          choices: [
            { id: 'A', text: 'r = 1/4' },
            { id: 'B', text: 'r = 1/3' },
            { id: 'C', text: 'r = 2/3' },
            { id: 'D', text: 'r = 1/2' },
          ],
          correct_answer: 'B',
        },
        {
          id: 7004,
          question_text:
            'In circle O, an inscribed angle intercepts a semicircle (180° arc). The inscribed angle is always a right angle (90°).',
          question_type: 'true_false',
          points: 10,
          choices: [
            { id: 'True', text: 'True (Thales’ Theorem)' },
            { id: 'False', text: 'False' },
          ],
          correct_answer: 'True',
        },
      ],
    },
    {
      id: 702,
      subject_id: 102,
      subject_name: 'Science 10: Plate Tectonics, Electromagnetism & Genetics',
      subject_code: 'SCI-10A',
      title: 'First Quarter Departmental Examination — Earth & Space Science 10',
      instructions:
        'Answer all questions thoroughly. Your selections are saved automatically to the server on tap.',
      duration_minutes: 40,
      total_points: 30,
      passing_score: 18,
      start_date: '2026-09-25T00:00:00Z',
      end_date: '2026-10-15T23:59:00Z',
      max_attempts: 1,
      published: true,
      questions: [
        {
          id: 7005,
          question_text:
            'What geological feature is formed when a dense oceanic plate subducts beneath a continental plate?',
          question_type: 'multiple_choice',
          points: 10,
          choices: [
            { id: 'A', text: 'Mid-ocean ridge and rift valley' },
            { id: 'B', text: 'Deep ocean trench and continental volcanic arc' },
            { id: 'C', text: 'Transform fault line without volcanism' },
            { id: 'D', text: 'Hotspot mantle plume' },
          ],
          correct_answer: 'B',
        },
        {
          id: 7006,
          question_text:
            'Which driving mechanism in the asthenosphere is primarily responsible for the movement of lithospheric plates?',
          question_type: 'multiple_choice',
          points: 10,
          choices: [
            { id: 'A', text: 'Mantle convection currents, slab pull, and ridge push' },
            { id: 'B', text: 'Coriolis effect and ocean tides' },
            { id: 'C', text: 'Solar radiation pressure' },
            { id: 'D', text: 'Magnetic pole reversals' },
          ],
          correct_answer: 'A',
        },
        {
          id: 7007,
          question_text:
            'Oceanic crust is younger, thinner, and denser (basaltic) than continental crust (granitic).',
          question_type: 'true_false',
          points: 10,
          choices: [
            { id: 'True', text: 'True' },
            { id: 'False', text: 'False' },
          ],
          correct_answer: 'True',
        },
      ],
    },
  ];

  const assessment_attempts: AssessmentAttempt[] = [
    {
      id: 'att_quiz_602_stu1',
      assessment_type: 'quiz',
      assessment_id: 602,
      student_id: 1,
      student_name: 'Maria Clara D. Santos',
      started_at: '2026-09-25T14:00:00Z',
      expires_at: '2026-09-25T14:10:00Z',
      submitted_at: '2026-09-25T14:06:12Z',
      status: 'submitted',
      answers: { 6006: 'A', 6007: 'False', 6008: 'C' },
      score: 15,
      total_points: 15,
      correct_items: 3,
      total_items: 3,
      percentage: 100,
      passed: true,
      remark: 'PASSED',
    },
  ];

  const retake_requests: RetakeRequest[] = [];

  const notifications: AppNotification[] = [
    {
      id: 801,
      user_id: 1,
      category: 'Assignment',
      title: 'New Assignment Published',
      message: 'Engr. Roberto Reyes posted "Problem Set #3: Polynomial Roots & Synthetic Division" in MATH-10A.',
      created_at: '2026-09-28T07:30:00Z',
      read: false,
      target_type: 'assignment',
      target_id: 401,
    },
    {
      id: 802,
      user_id: 1,
      category: 'Examination',
      title: 'First Quarter Examination Window Open',
      message: 'The First Quarter Departmental Examination for Mathematics 10 is now available. Server auto-save is active.',
      created_at: '2026-09-27T16:00:00Z',
      read: false,
      target_type: 'exam',
      target_id: 701,
    },
    {
      id: 803,
      user_id: 1,
      category: 'Grade',
      title: 'Your Assignment Has Been Graded',
      message: 'You scored 48/50 (96%) on Problem Set #2: Infinite Geometric Series in MATH-10A.',
      created_at: '2026-09-21T10:16:00Z',
      read: true,
      target_type: 'assignment',
      target_id: 403,
    },
    {
      id: 804,
      user_id: 1,
      category: 'Quiz',
      title: 'New Quiz Available',
      message: 'Quiz #2: Remainder Theorem & Synthetic Division is open until Oct 10.',
      created_at: '2026-09-25T08:00:00Z',
      read: false,
      target_type: 'quiz',
      target_id: 601,
    },
    {
      id: 805,
      user_id: 10,
      category: 'Assignment',
      title: '2 Pending Submissions Ready for Grading',
      message: 'Maria Clara Santos and Juan Miguel Bautista submitted assignments awaiting your evaluation.',
      created_at: '2026-09-27T11:20:00Z',
      read: false,
    },
    {
      id: 806,
      user_id: 99,
      category: 'System',
      title: '3 Account Registrations Pending Approval',
      message: 'New student and faculty accounts require registrar verification before login access is granted.',
      created_at: '2026-09-28T06:00:00Z',
      read: false,
    },
  ];

  const messages: DirectMessage[] = [
    {
      id: 901,
      recipient_id: 1,
      sender_id: 10,
      sender_name: 'Engr. Roberto A. Reyes',
      sender_role: 'teacher',
      subject: 'Regional Math Olympiad Qualifier Invitation',
      body: 'Good day Maria Clara! Based on your 96% performance on Problem Set #2, I am nominating you to represent TNHS Grade 10 STE in the upcoming Division Mathematics Olympiad. Please review Module 2 Lesson 2.2 before Friday.',
      created_at: '2026-09-27T15:40:00Z',
      read: false,
    },
    {
      id: 902,
      recipient_id: 1,
      sender_id: 99,
      sender_name: 'Dr. Lourdes M. Panganiban (Registrar)',
      sender_role: 'admin',
      subject: '1st Quarter Departmental Examination Guidelines',
      body: 'Reminder to all TNHS learners: Ensure your MLA Mobile Learning app is updated. All departmental exams automatically sync answers per question to the school server.',
      created_at: '2026-09-25T09:00:00Z',
      read: true,
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      id: 1010,
      user_id: 99,
      user_name: 'Dr. Lourdes M. Panganiban',
      user_role: 'admin',
      action: 'SYSTEM_SECURITY_POLICY',
      description: 'Enforced 15-minute short-lived access tokens + 30-day rotating refresh tokens with family revocation.',
      ip_address: '10.24.0.12',
      device_info: 'macOS Web Client · Chrome 134.0 (TNHS Registrar Workstation)',
      timestamp: '2026-09-28T06:10:00Z',
    },
    {
      id: 1009,
      user_id: 10,
      user_name: 'Engr. Roberto A. Reyes',
      user_role: 'teacher',
      action: 'ASSIGNMENT_CREATED',
      description: 'Published Problem Set #3: Polynomial Roots & Synthetic Division (MATH-10A).',
      ip_address: '172.16.4.88',
      device_info: 'Android Mobile · Samsung SM-S928B (Android 15 · MLA 2.0)',
      timestamp: '2026-09-28T05:45:00Z',
    },
    {
      id: 1008,
      user_id: 1,
      user_name: 'Maria Clara D. Santos',
      user_role: 'student',
      action: 'TOKEN_REFRESH_ROTATED',
      description: 'Rotated 30-day refresh token and issued new 15-minute access token for active mobile session.',
      ip_address: '112.198.74.21',
      device_info: 'iOS Mobile · iPhone 15 Pro (iOS 18.2 · Expo SecureStore)',
      timestamp: '2026-09-28T05:12:30Z',
    },
    {
      id: 1007,
      user_id: 11,
      user_name: 'Dr. Elena S. Valdez',
      user_role: 'teacher',
      action: 'EXAM_CREATED',
      description: 'Published First Quarter Departmental Examination — Earth & Space Science 10 (SCI-10A).',
      ip_address: '172.16.4.104',
      device_info: 'Windows Web Client · Edge 133.0 (Science Dept Lab)',
      timestamp: '2026-09-27T21:18:00Z',
    },
    {
      id: 1006,
      user_id: 1,
      user_name: 'Maria Clara D. Santos',
      user_role: 'student',
      action: 'ASSIGNMENT_SUBMITTED',
      description: 'Uploaded Santos_ERD_3NF_Schema.pdf (1,120 KB) for Database Normalization Exercise (COMP-10S).',
      ip_address: '112.198.74.21',
      device_info: 'iOS Mobile · iPhone 15 Pro (iOS 18.2 · MLA 2.0)',
      timestamp: '2026-09-27T19:40:15Z',
    },
    {
      id: 1005,
      user_id: 99,
      user_name: 'Dr. Lourdes M. Panganiban',
      user_role: 'admin',
      action: 'USER_APPROVED',
      description: 'Verified and approved student account for Angela Mae V. Mendoza (2026-00215 · Grade 10 Rizal - STE).',
      ip_address: '10.24.0.12',
      device_info: 'macOS Web Client · Chrome 134.0 (TNHS Registrar Workstation)',
      timestamp: '2026-09-27T15:05:44Z',
    },
    {
      id: 1004,
      user_id: 10,
      user_name: 'Engr. Roberto A. Reyes',
      user_role: 'teacher',
      action: 'ASSIGNMENT_GRADED',
      description: 'Graded (48/50) submission by Maria Clara D. Santos for Problem Set #2: Infinite Geometric Series.',
      ip_address: '172.16.4.88',
      device_info: 'Android Mobile · Samsung SM-S928B (Android 15 · MLA 2.0)',
      timestamp: '2026-09-26T16:22:10Z',
    },
    {
      id: 1003,
      user_id: 1,
      user_name: 'Maria Clara D. Santos',
      user_role: 'student',
      action: 'QUIZ_SUBMITTED',
      description: 'Submitted Quiz #1: Lithospheric Plates & Seismic Wave Propagation with score 15/15 (100%).',
      ip_address: '112.198.74.21',
      device_info: 'iOS Mobile · iPhone 15 Pro (iOS 18.2 · MLA 2.0)',
      timestamp: '2026-09-25T14:06:12Z',
    },
    {
      id: 1002,
      user_id: 2,
      user_name: 'Juan Miguel C. Bautista',
      user_role: 'student',
      action: 'USER_LOGIN',
      description: 'Authenticated session established (15m Access Token + 30d Rotating Refresh Token).',
      ip_address: '120.29.108.54',
      device_info: 'Android Mobile · Xiaomi Redmi Note 13 (Android 14 · MLA 2.0)',
      timestamp: '2026-09-25T08:19:04Z',
    },
    {
      id: 1001,
      user_id: 99,
      user_name: 'Dr. Lourdes M. Panganiban',
      user_role: 'admin',
      action: 'SUBJECT_CREATED',
      description: 'Created subject STAT-10E (Advanced Data Analytics & Probability Lab) and assigned to Engr. Roberto A. Reyes.',
      ip_address: '10.24.0.12',
      device_info: 'macOS Web Client · Chrome 134.0 (TNHS Registrar Workstation)',
      timestamp: '2026-09-24T11:30:00Z',
    },
  ];

  const system_settings: SystemSettings = {
    school_name: 'Tudela National High School (TNHS)',
    school_subtitle: 'MLA Mobile Learning System 2.0',
    school_year: '2026-2027',
    semester: '1st Semester',
    grade_levels: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    access_token_ttl_minutes: 15,
    refresh_token_ttl_days: 30,
    rate_limit_per_minute: 5,
    push_notifications_enabled: true,
    email_notifications_enabled: true,
    sms_alerts_enabled: false,
    maintenance_mode: false,
  };

  const rooms: Room[] = [
    {
      id: 1,
      code: 'RM-101',
      name: 'Rizal STE Lecture Hall',
      building: 'Main Academic Building · 1F',
      capacity: 40,
      type: 'Lecture Room',
      status: 'Available',
    },
    {
      id: 2,
      code: 'SCI-LAB-2',
      name: 'Natural Sciences & Biology Lab',
      building: 'Science & Technology Wing · 2F',
      capacity: 35,
      type: 'Science Laboratory',
      status: 'Available',
    },
    {
      id: 3,
      code: 'COMP-LAB-1',
      name: 'ICT & Robotics Laboratory',
      building: 'Science & Technology Wing · 1F',
      capacity: 40,
      type: 'Computer Lab',
      status: 'Available',
    },
    {
      id: 4,
      code: 'RM-204',
      name: 'Bonifacio Lecture Room',
      building: 'Main Academic Building · 2F',
      capacity: 45,
      type: 'Lecture Room',
      status: 'Available',
    },
    {
      id: 5,
      code: 'AVR-1',
      name: 'TNHS Audio-Visual Conference Hall',
      building: 'Administration & Library Complex · 2F',
      capacity: 80,
      type: 'Audio-Visual Room',
      status: 'Available',
    },
  ];

  const sections: SchoolSection[] = [
    {
      id: 1,
      name: 'Rizal - STE',
      grade_level: 'Grade 10',
      adviser_id: 10,
      adviser_name: 'Engr. Roberto A. Reyes',
      room_id: 1,
      room_name: 'RM-101 · Rizal STE Lecture Hall',
      capacity: 40,
      school_year: '2026-2027',
    },
    {
      id: 2,
      name: 'Bonifacio',
      grade_level: 'Grade 10',
      adviser_id: 11,
      adviser_name: 'Dr. Elena S. Valdez',
      room_id: 4,
      room_name: 'RM-204 · Bonifacio Lecture Room',
      capacity: 45,
      school_year: '2026-2027',
    },
    {
      id: 3,
      name: 'STEM - Faraday',
      grade_level: 'Grade 11',
      adviser_id: 10,
      adviser_name: 'Engr. Roberto A. Reyes',
      room_id: 3,
      room_name: 'COMP-LAB-1 · ICT & Robotics Laboratory',
      capacity: 40,
      school_year: '2026-2027',
    },
    {
      id: 4,
      name: 'Mabini',
      grade_level: 'Grade 9',
      adviser_id: 11,
      adviser_name: 'Dr. Elena S. Valdez',
      room_id: 2,
      room_name: 'SCI-LAB-2 · Natural Sciences & Biology Lab',
      capacity: 35,
      school_year: '2026-2027',
    },
    {
      id: 5,
      name: 'Sampaguita - STE',
      grade_level: 'Grade 7',
      adviser_id: 11,
      adviser_name: 'Dr. Elena S. Valdez',
      room_id: 1,
      room_name: 'RM-101 · Rizal STE Lecture Hall',
      capacity: 40,
      school_year: '2026-2027',
    },
    {
      id: 6,
      name: 'Narra',
      grade_level: 'Grade 7',
      adviser_id: 10,
      adviser_name: 'Engr. Roberto A. Reyes',
      room_id: 4,
      room_name: 'RM-204 · Bonifacio Lecture Room',
      capacity: 42,
      school_year: '2026-2027',
    },
    {
      id: 7,
      name: 'Luna - STE',
      grade_level: 'Grade 8',
      adviser_id: 10,
      adviser_name: 'Engr. Roberto A. Reyes',
      room_id: 2,
      room_name: 'SCI-LAB-2 · Natural Sciences & Biology Lab',
      capacity: 40,
      school_year: '2026-2027',
    },
    {
      id: 8,
      name: 'Del Pilar',
      grade_level: 'Grade 8',
      adviser_id: 11,
      adviser_name: 'Dr. Elena S. Valdez',
      room_id: 4,
      room_name: 'RM-204 · Bonifacio Lecture Room',
      capacity: 45,
      school_year: '2026-2027',
    },
    {
      id: 9,
      name: 'Dalton - STE',
      grade_level: 'Grade 9',
      adviser_id: 10,
      adviser_name: 'Engr. Roberto A. Reyes',
      room_id: 2,
      room_name: 'SCI-LAB-2 · Natural Sciences & Biology Lab',
      capacity: 40,
      school_year: '2026-2027',
    },
    {
      id: 10,
      name: 'HUMSS - Arendt',
      grade_level: 'Grade 11',
      adviser_id: 11,
      adviser_name: 'Dr. Elena S. Valdez',
      room_id: 5,
      room_name: 'AVR-1 · TNHS Audio-Visual Conference Hall',
      capacity: 45,
      school_year: '2026-2027',
    },
    {
      id: 11,
      name: 'STEM - Maxwell',
      grade_level: 'Grade 12',
      adviser_id: 10,
      adviser_name: 'Engr. Roberto A. Reyes',
      room_id: 3,
      room_name: 'COMP-LAB-1 · ICT & Robotics Laboratory',
      capacity: 40,
      school_year: '2026-2027',
    },
    {
      id: 12,
      name: 'ABM - Keynes',
      grade_level: 'Grade 12',
      adviser_id: 11,
      adviser_name: 'Dr. Elena S. Valdez',
      room_id: 4,
      room_name: 'RM-204 · Bonifacio Lecture Room',
      capacity: 45,
      school_year: '2026-2027',
    },
  ];

  const departments: SchoolDepartment[] = [
    {
      id: 1,
      code: 'MATH-SCI',
      name: 'Mathematics & Computational Sciences',
      head_teacher_id: 10,
      head_teacher_name: 'Engr. Roberto A. Reyes',
      description: 'Junior & Senior High School Mathematics, Statistics, Robotics, and Computing.',
    },
    {
      id: 2,
      code: 'NAT-SCI',
      name: 'Natural Sciences Department',
      head_teacher_id: 11,
      head_teacher_name: 'Dr. Elena S. Valdez',
      description: 'Earth Science, Biology, Chemistry, and Physics laboratory instruction.',
    },
    {
      id: 3,
      code: 'LANG-LIT',
      name: 'Languages & Literature',
      head_teacher_id: 12,
      head_teacher_name: 'Prof. Marco D. Salazar',
      description: 'English, Filipino, World Literature, Journalism, and Academic Rhetoric.',
    },
    {
      id: 4,
      code: 'SOC-SCI',
      name: 'Social Sciences & Araling Panlipunan',
      head_teacher_id: 11,
      head_teacher_name: 'Dr. Elena S. Valdez',
      description: 'Philippine History, Asian Studies, Economics, and Contemporary Issues.',
    },
    {
      id: 5,
      code: 'TLE-ICT',
      name: 'Technology, Livelihood & ICT Education',
      head_teacher_id: 10,
      head_teacher_name: 'Engr. Roberto A. Reyes',
      description: 'Computer Systems Servicing, Digital Media, and Technical-Vocational Track.',
    },
  ];

  return {
    users,
    token_sessions: [],
    password_reset_tokens: [],
    rooms,
    sections,
    departments,
    subjects,
    student_subjects,
    modules,
    videos,
    video_progress,
    lesson_progress: [
      { user_id: 1, lesson_id: 2001, completed: true, updated_at: '2026-06-20T08:00:00Z' },
      { user_id: 1, lesson_id: 2002, completed: true, updated_at: '2026-06-22T08:00:00Z' },
      { user_id: 1, lesson_id: 2003, completed: true, updated_at: '2026-06-25T08:00:00Z' },
    ],
    assignments,
    assignment_submissions,
    quizzes,
    exams,
    assessment_attempts,
    retake_requests,
    notifications,
    messages,
    audit_logs,
    system_settings,
  };
}

let dbCache: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (dbCache) return dbCache;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      const seed = createInitialDatabase();
      if (!parsed.audit_logs || parsed.audit_logs.length < 8) {
        const existingIds = new Set((parsed.audit_logs || []).map((l) => l.id));
        const merged = [
          ...(parsed.audit_logs || []),
          ...seed.audit_logs.filter((l) => !existingIds.has(l.id)),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        parsed.audit_logs = merged;
      }
      if (!Array.isArray(parsed.retake_requests)) {
        parsed.retake_requests = [];
      }
      if (!Array.isArray(parsed.rooms) || parsed.rooms.length === 0) {
        parsed.rooms = seed.rooms;
      }
      if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        parsed.sections = seed.sections;
      } else if (parsed.sections.length < 6) {
        const existingNames = new Set(
          parsed.sections.map((s) => `${s.grade_level}::${s.name}`.toLowerCase())
        );
        for (const s of seed.sections) {
          const key = `${s.grade_level}::${s.name}`.toLowerCase();
          if (!existingNames.has(key)) {
            const nextId =
              parsed.sections.length > 0
                ? Math.max(...parsed.sections.map((sec) => sec.id)) + 1
                : 1;
            parsed.sections.push({ ...s, id: nextId });
          }
        }
      }
      if (!Array.isArray(parsed.departments) || parsed.departments.length === 0) {
        parsed.departments = seed.departments;
      }
      if (!Array.isArray(parsed.lesson_progress)) {
        parsed.lesson_progress = seed.lesson_progress || [];
      }
      if (Array.isArray(parsed.assignments)) {
        parsed.assignments = parsed.assignments.map((a) => {
          if (!Array.isArray(a.questions)) {
            const seedMatch = seed.assignments.find((sa) => sa.id === a.id);
            return {
              ...a,
              questions: seedMatch?.questions || [],
            };
          }
          return a;
        });
      }
      dbCache = parsed;
      saveDb();
      return dbCache;
    } catch {
      // Fallback to fresh seed if corrupted
    }
  }
  dbCache = createInitialDatabase();
  saveDb();
  return dbCache;
}

export function saveDb(): void {
  if (!dbCache) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
}

export function appendAuditLog(params: {
  user: User | null;
  action: string;
  description: string;
  ip?: string;
  device?: string;
}): void {
  const db = getDb();
  const nextId = db.audit_logs.length > 0 ? Math.max(...db.audit_logs.map((l) => l.id)) + 1 : 1001;
  db.audit_logs.unshift({
    id: nextId,
    user_id: params.user ? params.user.id : null,
    user_name: params.user ? params.user.name : 'System / Unauthenticated',
    user_role: params.user ? params.user.role : 'system',
    action: params.action,
    description: params.description,
    ip_address: params.ip || '127.0.0.1',
    device_info: params.device || 'MLA-Mobile-Client',
    timestamp: new Date().toISOString(),
  });
  if (db.audit_logs.length > 250) {
    db.audit_logs = db.audit_logs.slice(0, 250);
  }
  saveDb();
}

export function sanitizeUser(u: UserRecord): User {
  const { password_hash: _ignored, ...safe } = u;
  return safe;
}
