import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Info,
  BookOpen,
  GraduationCap,
  Building2,
  UserPlus,
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { AuthService, apiRequest } from '../services/api';
import type { AuthState, User, SchoolSection, SchoolDepartment } from '../types/lms';
import { RegisterScreen } from './RegisterScreen';

export { RegisterScreen };

interface SplashScreenProps {
  authState: AuthState;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ authState }) => {
  const statusLabel: Record<AuthState, string> = {
    BOOTING: 'Initializing MLA Mobile Learning 2.0...',
    CHECKING_SESSION: 'Reading encrypted refresh credential from SecureStore...',
    REFRESHING: 'Rotating refresh token & requesting 15m RAM access token...',
    AUTHENTICATED: 'Opening role-based portal...',
    UNAUTHENTICATED: 'Preparing sign-in...',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
          <GraduationCap className="w-10 h-10 text-emerald-400 animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-mono tracking-widest text-emerald-400">
            TNHS MOBILE LEARNING SYSTEM
          </p>
          <h1 className="text-3xl font-bold tracking-tight font-display">
            MLA Mobile Learning
          </h1>
          <p className="text-sm text-slate-400">
            Tudela National High School · Academic Portal 2.0
          </p>
        </div>
        <div className="pt-4 space-y-3">
          <div className="h-1.5 w-48 mx-auto bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-2/3 rounded-full animate-pulse" />
          </div>
          <p className="text-xs font-mono text-slate-400">{statusLabel[authState]}</p>
        </div>
      </div>
    </div>
  );
};

interface LocalToast {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface LoginScreenProps {
  onAuthenticated: (user: User) => void;
  sessionNotice?: string | null;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onAuthenticated,
  sessionNotice,
  showToast,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [schoolId, setSchoolId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showSecuritySpec, setShowSecuritySpec] = useState(false);
  const [localToasts, setLocalToasts] = useState<LocalToast[]>([]);

  const notify = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info') => {
      if (showToast) {
        showToast(text, type);
        return;
      }
      const id = Date.now() + Math.random();
      setLocalToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setLocalToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    [showToast]
  );

  useEffect(() => {
    if (sessionNotice) {
      notify(sessionNotice, 'info');
    }
  }, [sessionNotice, notify]);

  // Registration state
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');
  const [regFirstName, setRegFirstName] = useState('');
  const [regMiddleName, setRegMiddleName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regContact, setRegContact] = useState('+63 917 555 0199');
  const [regGradeLevel, setRegGradeLevel] = useState('Grade 10');
  const [regSection, setRegSection] = useState('Rizal - STE');
  const [regDepartment, setRegDepartment] = useState('Mathematics & Computational Sciences');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [availableSections, setAvailableSections] = useState<SchoolSection[]>([
    { id: 5, name: 'Sampaguita - STE', grade_level: 'Grade 7', capacity: 40, school_year: '2026-2027' },
    { id: 6, name: 'Narra', grade_level: 'Grade 7', capacity: 42, school_year: '2026-2027' },
    { id: 7, name: 'Luna - STE', grade_level: 'Grade 8', capacity: 40, school_year: '2026-2027' },
    { id: 8, name: 'Del Pilar', grade_level: 'Grade 8', capacity: 45, school_year: '2026-2027' },
    { id: 4, name: 'Mabini', grade_level: 'Grade 9', capacity: 35, school_year: '2026-2027' },
    { id: 9, name: 'Dalton - STE', grade_level: 'Grade 9', capacity: 40, school_year: '2026-2027' },
    { id: 1, name: 'Rizal - STE', grade_level: 'Grade 10', capacity: 40, school_year: '2026-2027' },
    { id: 2, name: 'Bonifacio', grade_level: 'Grade 10', capacity: 45, school_year: '2026-2027' },
    { id: 3, name: 'STEM - Faraday', grade_level: 'Grade 11', capacity: 40, school_year: '2026-2027' },
    { id: 10, name: 'HUMSS - Arendt', grade_level: 'Grade 11', capacity: 45, school_year: '2026-2027' },
    { id: 11, name: 'STEM - Maxwell', grade_level: 'Grade 12', capacity: 40, school_year: '2026-2027' },
    { id: 12, name: 'ABM - Keynes', grade_level: 'Grade 12', capacity: 45, school_year: '2026-2027' },
  ]);
  const [availableDepartments, setAvailableDepartments] = useState<SchoolDepartment[]>([
    { id: 1, code: 'MATH-SCI', name: 'Mathematics & Computational Sciences', description: '' },
    { id: 2, code: 'NAT-SCI', name: 'Natural Sciences Department', description: '' },
    { id: 3, code: 'LANG-LIT', name: 'Languages & Literature', description: '' },
    { id: 4, code: 'SOC-SCI', name: 'Social Sciences & Araling Panlipunan', description: '' },
    { id: 5, code: 'TLE-ICT', name: 'Technology, Livelihood & ICT Education', description: '' },
  ]);

  // System-generated School ID state: [4 letters of last name][year][month][number of student or teacher]
  const [roleNextNumber, setRoleNextNumber] = useState<number>(6);
  const [serverGeneratedId, setServerGeneratedId] = useState<string>('');

  // Photo Upload & Live Camera with Preview state
  const [regAvatarUrl, setRegAvatarUrl] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'upload' | 'camera' | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compute local preview of system-generated School ID: 4 letters of last name + year + month + number of student/teacher
  const nowDate = new Date();
  const idYear = String(nowDate.getFullYear());
  const idMonth = String(nowDate.getMonth() + 1).padStart(2, '0');
  const cleanLastLetters = regLastName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const idLast4 = (cleanLastLetters || 'XXXX').padEnd(4, 'X').slice(0, 4);
  const idRoleSeq = String(roleNextNumber).padStart(3, '0');
  const computedSchoolId = serverGeneratedId || `${idLast4}${idYear}${idMonth}${idRoleSeq}`;

  // Filter sections matching the selected Grade Level
  const gradeLevelSections = availableSections.filter(
    (s) => s.grade_level.toLowerCase() === regGradeLevel.toLowerCase()
  );

  // Sync regSection whenever regGradeLevel or availableSections changes
  useEffect(() => {
    const matching = availableSections.filter(
      (s) => s.grade_level.toLowerCase() === regGradeLevel.toLowerCase()
    );
    if (matching.length > 0 && !matching.some((s) => s.name === regSection)) {
      setRegSection(matching[0].name);
    }
  }, [regGradeLevel, availableSections, regSection]);

  // Sync regDepartment whenever availableDepartments changes
  useEffect(() => {
    if (
      availableDepartments.length > 0 &&
      !availableDepartments.some((d) => d.name === regDepartment)
    ) {
      setRegDepartment(availableDepartments[0].name);
    }
  }, [availableDepartments, regDepartment]);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Fetch accurate next student/teacher number, generated School ID, sections, and departments from backend
  useEffect(() => {
    if (mode !== 'register') {
      stopCameraStream();
      return;
    }
    let cancelled = false;
    apiRequest<{
      school_id: string;
      role_number: number;
      sections?: SchoolSection[];
      departments?: SchoolDepartment[];
    }>(
      `/api/v1/auth/next-school-id?role=${regRole}&last_name=${encodeURIComponent(regLastName)}`
    )
      .then((res) => {
        if (!cancelled) {
          setRoleNextNumber(res.role_number);
          setServerGeneratedId(res.school_id);
          if (Array.isArray(res.sections) && res.sections.length > 0) {
            setAvailableSections(res.sections);
          }
          if (Array.isArray(res.departments) && res.departments.length > 0) {
            setAvailableDepartments(res.departments);
          }
        }
      })
      .catch(() => {
        setServerGeneratedId('');
      });
    return () => {
      cancelled = true;
    };
  }, [mode, regRole, regLastName, stopCameraStream]);

  const startCamera = useCallback(
    async (facing: 'user' | 'environment' = cameraFacingMode) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        notify('Camera API is not supported on this browser. Please use Upload Photo.', 'error');
        return;
      }
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });
        streamRef.current = mediaStream;
        setCameraOpen(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(() => {});
          }
        }, 50);
      } catch (err: any) {
        notify(
          err?.message ||
            'Unable to access camera. Please check camera permissions or upload a photo file.',
          'error'
        );
        setCameraOpen(false);
      }
    },
    [cameraFacingMode, notify]
  );

  const handleCaptureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 480;
    const height = video.videoHeight || 480;
    const size = Math.min(width, height);
    const sx = (width - size) / 2;
    const sy = (height - size) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setRegAvatarUrl(dataUrl);
      setPhotoSource('camera');
      notify('Camera photo captured and preview updated.', 'success');
    }
    stopCameraStream();
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Please select a valid image file (JPG, PNG, WEBP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 320, 320);
          setRegAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
          setPhotoSource('upload');
        } else {
          setRegAvatarUrl(String(reader.result));
          setPhotoSource('upload');
        }
        notify('Profile photo uploaded and preview ready.', 'success');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Forgot Password 5-step state
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [demoDispatchedCode, setDemoDispatchedCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId.trim() || !password) {
      notify('Please enter both your Email and Password.', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await AuthService.login(schoolId.trim(), password);
      onAuthenticated(response.user);
    } catch (err: any) {
      notify(err?.message || 'Unable to sign in. Please verify your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim() || !regPassword) {
      notify('Please fill in First Name, Last Name, Email, and Password.', 'error');
      return;
    }
    if (regPassword.length < 8) {
      notify('Password must be at least 8 characters long.', 'error');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      notify('Password confirmation does not match.', 'error');
      return;
    }
    stopCameraStream();
    setLoading(true);
    try {
      const response = await AuthService.register({
        school_id: computedSchoolId,
        first_name: regFirstName.trim(),
        middle_name: regMiddleName.trim(),
        last_name: regLastName.trim(),
        email: regEmail.trim(),
        contact_number: regContact.trim(),
        role: regRole,
        grade_level: regRole === 'student' ? regGradeLevel : undefined,
        section: regRole === 'student' ? regSection : undefined,
        department: regRole === 'teacher' ? regDepartment : undefined,
        avatar_url: regAvatarUrl || undefined,
        password: regPassword,
        confirm_password: regConfirmPassword,
      });
      if (response.requires_approval || response.user.status === 'pending') {
        notify(
          response.message ||
            `Registration submitted (School ID: ${response.user.school_id}). Your account must be approved by the Administrator before signing in.`,
          'info'
        );
        setSchoolId(response.user.email);
        setPassword('');
        setRegFirstName('');
        setRegMiddleName('');
        setRegLastName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegAvatarUrl(null);
        setPhotoSource(null);
        setMode('login');
      } else {
        notify(
          `Account registered with School ID ${response.user.school_id}. Welcome, ${response.user.name}!`,
          'success'
        );
        onAuthenticated(response.user);
      }
    } catch (err: any) {
      notify(err?.message || 'Registration failed. Please verify your details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 -> Step 2 & 3: Request verification code
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) {
      notify('Please enter your School ID or institutional email address.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<{
        message: string;
        demo_verification_code: string;
      }>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ identifier: resetIdentifier }),
      });
      setDemoDispatchedCode(res.demo_verification_code);
      setVerificationCode(res.demo_verification_code);
      setForgotMessage(res.message);
      setForgotStep(3);
      notify(`Verification code ${res.demo_verification_code} dispatched.`, 'success');
    } catch (err: any) {
      notify(err?.message || 'Failed to send verification code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> Step 4: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('/api/v1/auth/verify-reset-code', {
        method: 'POST',
        body: JSON.stringify({
          identifier: resetIdentifier,
          code: verificationCode,
        }),
      });
      setForgotStep(4);
      notify('Verification code confirmed. Enter your new password.', 'success');
    } catch (err: any) {
      notify(err?.message || 'Invalid or expired verification code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 4 -> Step 5: Set new password & confirm
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      notify('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify('Password confirmation does not match.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          identifier: resetIdentifier,
          code: verificationCode,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      setForgotMessage(res.message);
      setForgotStep(5);
      notify(res.message || 'Password updated and previous sessions revoked.', 'success');
    } catch (err: any) {
      notify(err?.message || 'Could not reset password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const floatingInputClass =
    'peer w-full min-h-[52px] px-3.5 pt-5 pb-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all';
  const floatingLabelClass =
    'pointer-events-none absolute left-3.5 top-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row">
      {/* Left Hero / Institutional Identity Panel (Visible on Desktop, Compact Header on Mobile) */}
      <div className="relative lg:w-7/12 bg-slate-900 text-white flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden">
        <img
          src="/src/assets/images/tnhs_campus_banner_1790597951475.jpg"
          alt="Tudela National High School Campus Courtyard"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/60" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block leading-none">
                MLA Mobile Learning
              </span>
              <span className="text-xs text-slate-300 mt-1 block">
                TNHS Mobile Learning System · v2.0
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSecuritySpec(!showSecuritySpec)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-emerald-300 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Auth Security Spec</span>
          </button>
        </div>

        <div className="relative z-10 my-8 lg:my-0 max-w-xl space-y-5">
          <p className="text-xs font-mono text-emerald-400 tracking-wider">
            SINGLE APPLICATION · ROLE-BASED PORTALS
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display leading-tight">
            Unified mobile learning for TNHS students, faculty, and administration.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Built on a zero-trust mobile architecture: 15-minute in-memory access tokens,
            30-day rotating refresh tokens in encrypted SecureStore, token-family reuse
            revocation, and server-authoritative examination timers.
          </p>

          {showSecuritySpec && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-xs space-y-2.5">
              <div className="font-semibold text-emerald-400 flex items-center justify-between">
                <span>Active Token Lifecycle Specification</span>
                <span className="font-mono">Sanctum / HMAC + AES-256-GCM</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                <div>· Access Token: 15 min (RAM only)</div>
                <div>· Refresh Token: 30 days (SecureStore)</div>
                <div>· Refresh Policy: Rotate on every call</div>
                <div>· Reuse Detection: Revokes token family</div>
                <div>· Exam Timing: Server-authoritative</div>
                <div>· Rate Limit: 5 attempts / min / IP</div>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 hidden sm:flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-5">
          <span>Tudela National High School · School Year 2026–2027</span>
          <span>1st Semester · DepEd K–12 STE & SHS Curriculum</span>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {mode === 'login' ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Sign In / Register Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Register</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight font-display">
                  Sign in to MLA Portal
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter your Email and password to access your role workspace.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    id="school_id_input"
                    type="text"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    placeholder=" "
                    autoComplete="email"
                    className={floatingInputClass}
                  />
                  <label htmlFor="school_id_input" className={floatingLabelClass}>
                    Email
                  </label>
                </div>

                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      id="password_input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=" "
                      autoComplete="current-password"
                      className={`${floatingInputClass} pr-12`}
                    />
                    <label htmlFor="password_input" className={floatingLabelClass}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberSession}
                        onChange={(e) => setRememberSession(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Remember session (30d)
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotStep(1);
                      }}
                      className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline min-h-[32px] flex items-center"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 whitespace-nowrap"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Authenticating & Issuing Tokens...' : 'Sign In to Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                    Don’t have an institutional account yet?
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="w-full min-h-[46px] py-2.5 px-4 rounded-xl border border-emerald-600/40 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register New Account</span>
                  </button>
                </div>
              </form>
            </div>
          ) : mode === 'register' ? (
            <RegisterScreen
              onSuccess={(registeredUser, finalSchoolId) => {
                setSchoolId(registeredUser.email || finalSchoolId);
                notify(
                  `Account created successfully! Auto-Generated School ID: ${finalSchoolId}. You may now sign in.`,
                  'success'
                );
              }}
              onNavigateToLogin={() => setMode('login')}
              showToast={(msg, type) => notify(msg, type)}
            />
          ) : (
            /* 5-Step Forgot Password Flow */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-xs font-mono text-slate-500">
                  Step {forgotStep} of 5
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight font-display">
                  Account Recovery
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {forgotStep === 1 &&
                    'Step 1: Enter your registered School ID or institutional email.'}
                  {forgotStep === 3 &&
                    'Step 2 & 3: Enter the 6-digit verification code sent to your account.'}
                  {forgotStep === 4 &&
                    'Step 4: Create and confirm your new password (revokes old sessions).'}
                  {forgotStep === 5 && 'Step 5: Password reset complete.'}
                </p>
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleSendResetCode} className="space-y-4">
                  <div className="relative">
                    <input
                      id="reset_identifier_input"
                      type="text"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder=" "
                      className={`${floatingInputClass} font-mono`}
                    />
                    <label htmlFor="reset_identifier_input" className={floatingLabelClass}>
                      School ID or Email Address
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                  </button>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  {demoDispatchedCode && (
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      Dispatched code: <strong>{demoDispatchedCode}</strong> (expires in 10m)
                    </p>
                  )}
                  <div className="relative">
                    <input
                      id="verification_code_input"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      placeholder=" "
                      className={`${floatingInputClass} font-mono tracking-widest`}
                    />
                    <label htmlFor="verification_code_input" className={floatingLabelClass}>
                      6-Digit Verification Code
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </form>
              )}

              {forgotStep === 4 && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      id="new_password_input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder=" "
                      className={floatingInputClass}
                    />
                    <label htmlFor="new_password_input" className={floatingLabelClass}>
                      New Password (8+ characters)
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="confirm_new_password_input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder=" "
                      className={floatingInputClass}
                    />
                    <label htmlFor="confirm_new_password_input" className={floatingLabelClass}>
                      Confirm New Password
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
                  >
                    {loading ? 'Updating Password...' : 'Save New Password & Revoke Sessions'}
                  </button>
                </form>
              )}

              {forgotStep === 5 && (
                <div className="space-y-4 text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {forgotMessage || 'Password updated and all previous sessions invalidated.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setSchoolId(resetIdentifier);
                      setPassword(newPassword);
                    }}
                    className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
                  >
                    Return to Sign In
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fallback Local Toast Notification Stack when rendered standalone */}
      {localToasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        >
          {localToasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-lg text-xs font-medium flex items-center gap-2.5 backdrop-blur-md ${
                t.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100'
                  : t.type === 'error'
                  ? 'bg-red-950/95 border-red-500/40 text-red-100'
                  : 'bg-slate-900/95 border-slate-700 text-white'
              }`}
            >
              {t.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-emerald-400 shrink-0" />}
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
