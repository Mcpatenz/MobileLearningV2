import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileSpreadsheet,
  Settings,
  CheckCircle2,
  XCircle,
  Search,
  UserPlus,
  KeyRound,
  ShieldAlert,
  Download,
  Trash2,
  LogOut,
  Moon,
  Sun,
  RefreshCw,
  User as UserIcon,
  Upload,
  Edit3,
  Building2,
  Layers,
  Briefcase,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import type {
  User,
  UserRole,
  Subject,
  TokenSession,
  AuditLog,
  SystemSettings,
  Room,
  SchoolSection,
  SchoolDepartment,
} from '../types/lms';
import { AdminDashboard, AdminDashboardStats } from './AdminDashboardStats';
import { AdminAuditLog } from './AdminAuditLog';

export { AdminDashboard, AdminDashboardStats, AdminAuditLog };

interface AdminPortalProps {
  user: User;
  onUserUpdated?: (user: User) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type AdminTab = 'dashboard' | 'users' | 'academics' | 'reports' | 'settings' | 'profile';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  user,
  onUserUpdated,
  onLogout,
  darkMode,
  onToggleDarkMode,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Admin Profile Update State
  const [profFirstName, setProfFirstName] = useState(user.first_name || '');
  const [profMiddleName, setProfMiddleName] = useState(user.middle_name || '');
  const [profLastName, setProfLastName] = useState(user.last_name || '');
  const [profEmail, setProfEmail] = useState(user.email || '');
  const [profContact, setProfContact] = useState(user.contact_number || '');
  const [profDept, setProfDept] = useState(user.department || 'Office of the Principal & ICT');
  const [profAvatar, setProfAvatar] = useState<string | undefined>(user.avatar_url);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Dashboard
  const [dashboard, setDashboard] = useState<any>(null);
  const [auditRefreshKey, setAuditRefreshKey] = useState<number>(0);

  // Users, Approvals & Device Sessions
  const [userSubView, setUserSubView] = useState<'directory' | 'approvals' | 'sessions'>(
    'directory'
  );
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<TokenSession[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Create User Form
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newSchoolId, setNewSchoolId] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newMiddleName, setNewMiddleName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newGradeLevel, setNewGradeLevel] = useState('Grade 10');
  const [newSection, setNewSection] = useState('Rizal - STE');

  // Academics Sub-view (Subjects, Sections, Rooms, Departments)
  const [academicSubView, setAcademicSubView] = useState<
    'subjects' | 'sections' | 'rooms' | 'departments'
  >('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [departments, setDepartments] = useState<SchoolDepartment[]>([]);

  // Subject Add / Update Form State
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjDesc, setSubjDesc] = useState('');
  const [subjGrade, setSubjGrade] = useState('Grade 10');
  const [subjSection, setSubjSection] = useState('Rizal - STE');
  const [subjRoom, setSubjRoom] = useState('RM-101 · Rizal STE Lecture Hall');
  const [subjTeacherId, setSubjTeacherId] = useState<number>(10);
  const [subjSchedule, setSubjSchedule] = useState('Mon / Wed / Fri · 10:00 AM – 11:00 AM');

  // Section Add / Update Form State
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [secName, setSecName] = useState('');
  const [secGrade, setSecGrade] = useState('Grade 10');
  const [secAdviserId, setSecAdviserId] = useState<number>(10);
  const [secRoomId, setSecRoomId] = useState<number>(1);
  const [secCapacity, setSecCapacity] = useState<number>(40);

  // Room Add / Update Form State
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomBuilding, setRoomBuilding] = useState('Main Academic Building · 1F');
  const [roomCapacity, setRoomCapacity] = useState<number>(40);
  const [roomType, setRoomType] = useState<Room['type']>('Lecture Room');
  const [roomStatus, setRoomStatus] = useState<Room['status']>('Available');

  // Department Add / Update Form State
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptHeadTeacherId, setDeptHeadTeacherId] = useState<number>(10);
  const [deptDesc, setDeptDesc] = useState('');

  // Reports & Audit Logs
  const [reportsData, setReportsData] = useState<{
    audit_logs: AuditLog[];
    enrollments_by_subject: any[];
    grade_distribution: any[];
  } | null>(null);
  const [reportView, setReportView] = useState<'audit' | 'enrollment' | 'grades'>('audit');

  // System Settings
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/admin/dashboard');
      setDashboard(data);
    } catch (err: any) {
      showToast(err?.message || 'Error loading admin dashboard', 'error');
    }
  }, [showToast]);

  const loadUsersAndSessions = useCallback(async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        apiRequest<{ users: User[] }>('/api/v1/admin/users'),
        apiRequest<{ sessions: TokenSession[] }>('/api/v1/admin/sessions'),
      ]);
      setUsers(uRes.users);
      setSessions(sRes.sessions);
    } catch (err: any) {
      showToast(err?.message || 'Error loading users', 'error');
    }
  }, [showToast]);

  const loadAcademics = useCallback(async () => {
    try {
      const data = await apiRequest<{
        subjects: Subject[];
        teachers: User[];
        rooms?: Room[];
        sections?: SchoolSection[];
        departments?: SchoolDepartment[];
      }>('/api/v1/admin/subjects');
      setSubjects(data.subjects);
      setTeachers(data.teachers);
      if (data.rooms) setRooms(data.rooms);
      if (data.sections) setSections(data.sections);
      if (data.departments) setDepartments(data.departments);
      if (data.teachers.length > 0) {
        setSubjTeacherId((prev) => prev || data.teachers[0].id);
        setSecAdviserId((prev) => prev || data.teachers[0].id);
        setDeptHeadTeacherId((prev) => prev || data.teachers[0].id);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error loading academic data', 'error');
    }
  }, [showToast]);

  const loadReports = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/admin/reports');
      setReportsData(data);
    } catch (err: any) {
      showToast(err?.message || 'Error loading reports', 'error');
    }
  }, [showToast]);

  const loadSettings = useCallback(async () => {
    try {
      const data = await apiRequest<{ settings: SystemSettings }>('/api/v1/admin/settings');
      setSettings(data.settings);
    } catch (err: any) {
      showToast(err?.message || 'Error loading system settings', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === 'users') loadUsersAndSessions();
    if (activeTab === 'academics') loadAcademics();
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab, loadUsersAndSessions, loadAcademics, loadReports, loadSettings]);

  const handleApproveUser = async (userId: number) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/v1/admin/approvals/${userId}/approve`, {
        method: 'POST',
      });
      showToast(res.message, 'success');
      setAuditRefreshKey((k) => k + 1);
      loadDashboard();
      loadUsersAndSessions();
    } catch (err: any) {
      showToast(err?.message || 'Approval failed', 'error');
    }
  };

  const handleRejectUser = async (userId: number) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/v1/admin/approvals/${userId}/reject`, {
        method: 'POST',
      });
      showToast(res.message, 'info');
      setAuditRefreshKey((k) => k + 1);
      loadDashboard();
      loadUsersAndSessions();
    } catch (err: any) {
      showToast(err?.message || 'Rejection failed', 'error');
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ message: string }>('/api/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          school_id: newSchoolId,
          first_name: newFirstName,
          middle_name: newMiddleName,
          last_name: newLastName,
          email: newEmail,
          role: newRole,
          grade_level: newGradeLevel,
          section: newSection,
        }),
      });
      showToast(res.message, 'success');
      setShowCreateUser(false);
      setNewSchoolId('');
      setNewFirstName('');
      setNewMiddleName('');
      setNewLastName('');
      setNewEmail('');
      loadUsersAndSessions();
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create user', 'error');
    }
  };

  const handleToggleUserStatus = async (target: User) => {
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await apiRequest<{ message: string }>(`/api/v1/admin/users/${target.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      showToast(res.message, 'success');
      loadUsersAndSessions();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleResetUserPassword = async (target: User) => {
    try {
      const res = await apiRequest<{ message: string }>(
        `/api/v1/admin/users/${target.id}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({ new_password: 'password123' }),
        }
      );
      showToast(res.message, 'success');
      loadUsersAndSessions();
    } catch (err: any) {
      showToast(err?.message || 'Password reset failed', 'error');
    }
  };

  const handleDeleteUser = async (target: User) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/v1/admin/users/${target.id}`, {
        method: 'DELETE',
      });
      showToast(res.message, 'success');
      setAuditRefreshKey((k) => k + 1);
      loadUsersAndSessions();
      loadAcademics();
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete user account', 'error');
    }
  };

  const handleAdminPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfAvatar(reader.result);
        showToast('Administrator profile photo ready to save.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ user: User; message: string }>('/api/v1/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: profFirstName,
          middle_name: profMiddleName,
          last_name: profLastName,
          email: profEmail,
          contact_number: profContact,
          department: profDept,
          avatar_url: profAvatar || '',
        }),
      });
      onUserUpdated?.(res.user);
      showToast(res.message || 'Administrator profile updated.', 'success');
      setAuditRefreshKey((k) => k + 1);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update administrator profile', 'error');
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newAdminPassword) {
      showToast('Enter both your current password and new password.', 'error');
      return;
    }
    if (newAdminPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      showToast('New password confirmation does not match.', 'error');
      return;
    }
    try {
      const res = await apiRequest<{ message: string }>('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newAdminPassword,
        }),
      });
      setCurrentPassword('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      showToast(res.message || 'Administrator password changed.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to change password', 'error');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await apiRequest<{ message: string }>(
        `/api/v1/admin/sessions/${sessionId}/revoke`,
        { method: 'POST' }
      );
      showToast(res.message, 'success');
      loadUsersAndSessions();
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to revoke session', 'error');
    }
  };

  const handleStartEditSubject = (s: Subject) => {
    setEditingSubjectId(s.id);
    setSubjCode(s.code);
    setSubjName(s.name);
    setSubjDesc(s.description || '');
    setSubjGrade(s.grade_level);
    setSubjSection(s.section);
    setSubjRoom(s.room || '');
    setSubjTeacherId(s.teacher_id);
    setSubjSchedule(s.schedule);
  };

  const handleCancelEditSubject = () => {
    setEditingSubjectId(null);
    setSubjCode('');
    setSubjName('');
    setSubjDesc('');
    setSubjGrade('Grade 10');
    setSubjSection(sections[0]?.name || 'Rizal - STE');
    setSubjRoom(rooms[0] ? `${rooms[0].code} · ${rooms[0].name}` : '');
    setSubjSchedule('Mon / Wed / Fri · 10:00 AM – 11:00 AM');
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubjectId !== null) {
        const res = await apiRequest<{ message: string }>(
          `/api/v1/admin/subjects/${editingSubjectId}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              code: subjCode,
              name: subjName,
              description: subjDesc,
              grade_level: subjGrade,
              section: subjSection,
              room: subjRoom,
              teacher_id: subjTeacherId,
              schedule: subjSchedule,
            }),
          }
        );
        showToast(res.message, 'success');
      } else {
        const res = await apiRequest<{ message: string }>('/api/v1/admin/subjects', {
          method: 'POST',
          body: JSON.stringify({
            code: subjCode,
            name: subjName,
            description: subjDesc,
            grade_level: subjGrade,
            section: subjSection,
            room: subjRoom,
            teacher_id: subjTeacherId,
            schedule: subjSchedule,
          }),
        });
        showToast(res.message, 'success');
      }
      handleCancelEditSubject();
      setAuditRefreshKey((k) => k + 1);
      loadAcademics();
      loadDashboard();
    } catch (err: any) {
      showToast(err?.message || 'Could not save subject', 'error');
    }
  };

  // Section CRUD Handlers
  const handleStartEditSection = (sec: SchoolSection) => {
    setEditingSectionId(sec.id);
    setSecName(sec.name);
    setSecGrade(sec.grade_level);
    setSecAdviserId(sec.adviser_id || teachers[0]?.id || 10);
    setSecRoomId(sec.room_id || rooms[0]?.id || 1);
    setSecCapacity(sec.capacity || 40);
  };

  const handleCancelEditSection = () => {
    setEditingSectionId(null);
    setSecName('');
    setSecGrade('Grade 10');
    setSecCapacity(40);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSectionId !== null) {
        const res = await apiRequest<{ message: string }>(
          `/api/v1/admin/sections/${editingSectionId}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              name: secName,
              grade_level: secGrade,
              adviser_id: secAdviserId,
              room_id: secRoomId,
              capacity: secCapacity,
            }),
          }
        );
        showToast(res.message, 'success');
      } else {
        const res = await apiRequest<{ message: string }>('/api/v1/admin/sections', {
          method: 'POST',
          body: JSON.stringify({
            name: secName,
            grade_level: secGrade,
            adviser_id: secAdviserId,
            room_id: secRoomId,
            capacity: secCapacity,
          }),
        });
        showToast(res.message, 'success');
      }
      handleCancelEditSection();
      setAuditRefreshKey((k) => k + 1);
      loadAcademics();
    } catch (err: any) {
      showToast(err?.message || 'Could not save section', 'error');
    }
  };

  const handleDeleteSection = async (id: number) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/v1/admin/sections/${id}`, {
        method: 'DELETE',
      });
      showToast(res.message, 'info');
      if (editingSectionId === id) handleCancelEditSection();
      setAuditRefreshKey((k) => k + 1);
      loadAcademics();
    } catch (err: any) {
      showToast(err?.message || 'Could not delete section', 'error');
    }
  };

  // Room CRUD Handlers
  const handleStartEditRoom = (r: Room) => {
    setEditingRoomId(r.id);
    setRoomCode(r.code);
    setRoomName(r.name);
    setRoomBuilding(r.building);
    setRoomCapacity(r.capacity);
    setRoomType(r.type);
    setRoomStatus(r.status);
  };

  const handleCancelEditRoom = () => {
    setEditingRoomId(null);
    setRoomCode('');
    setRoomName('');
    setRoomBuilding('Main Academic Building · 1F');
    setRoomCapacity(40);
    setRoomType('Lecture Room');
    setRoomStatus('Available');
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoomId !== null) {
        const res = await apiRequest<{ message: string }>(
          `/api/v1/admin/rooms/${editingRoomId}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              code: roomCode,
              name: roomName,
              building: roomBuilding,
              capacity: roomCapacity,
              type: roomType,
              status: roomStatus,
            }),
          }
        );
        showToast(res.message, 'success');
      } else {
        const res = await apiRequest<{ message: string }>('/api/v1/admin/rooms', {
          method: 'POST',
          body: JSON.stringify({
            code: roomCode,
            name: roomName,
            building: roomBuilding,
            capacity: roomCapacity,
            type: roomType,
            status: roomStatus,
          }),
        });
        showToast(res.message, 'success');
      }
      handleCancelEditRoom();
      setAuditRefreshKey((k) => k + 1);
      loadAcademics();
    } catch (err: any) {
      showToast(err?.message || 'Could not save room', 'error');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/v1/admin/rooms/${id}`, {
        method: 'DELETE',
      });
      showToast(res.message, 'info');
      if (editingRoomId === id) handleCancelEditRoom();
      setAuditRefreshKey((k) => k + 1);
      loadAcademics();
    } catch (err: any) {
      showToast(err?.message || 'Could not delete room', 'error');
    }
  };

  // Department CRUD Handlers
  const handleStartEditDept = (d: SchoolDepartment) => {
    setEditingDeptId(d.id);
    setDeptCode(d.code);
    setDeptName(d.name);
    setDeptHeadTeacherId(d.head_teacher_id || teachers[0]?.id || 10);
    setDeptDesc(d.description || '');
  };

  const handleCancelEditDept = () => {
    setEditingDeptId(null);
    setDeptCode('');
    setDeptName('');
    setDeptHeadTeacherId(teachers[0]?.id || 10);
    setDeptDesc('');
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDeptId !== null) {
        const res = await apiRequest<{ message: string }>(
          `/api/v1/admin/departments/${editingDeptId}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              code: deptCode,
              name: deptName,
              head_teacher_id: deptHeadTeacherId,
              description: deptDesc,
            }),
          }
        );
        showToast(res.message, 'success');
      } else {
        const res = await apiRequest<{ message: string }>('/api/v1/admin/departments', {
          method: 'POST',
          body: JSON.stringify({
            code: deptCode,
            name: deptName,
            head_teacher_id: deptHeadTeacherId,
            description: deptDesc,
          }),
        });
        showToast(res.message, 'success');
      }
      handleCancelEditDept();
      setAuditRefreshKey((k) => k + 1);
      loadAcademics();
    } catch (err: any) {
      showToast(err?.message || 'Could not save department', 'error');
    }
  };

  const handleDeleteDept = async (id: number) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/v1/admin/departments/${id}`, {
        method: 'DELETE',
      });
      showToast(res.message, 'info');
      if (editingDeptId === id) handleCancelEditDept();
      setAuditRefreshKey((k) => k + 1);
      loadAcademics();
    } catch (err: any) {
      showToast(err?.message || 'Could not delete department', 'error');
    }
  };

  const handleExportAuditCsv = () => {
    if (!reportsData?.audit_logs) return;
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Description', 'IP', 'Device'];
    const rows = reportsData.audit_logs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.user_name}"`,
      l.user_role,
      l.action,
      `"${l.description.replace(/"/g, '""')}"`,
      l.ip_address,
      `"${l.device_info}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TNHS_Security_Audit_Logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported TNHS Security & Activity Audit Log CSV.', 'success');
  };

  return (
    <div className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
      {/* =====================================================================
          TAB 1: ADMIN DASHBOARD
      ===================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                SYSTEM ADMINISTRATOR · {user.school_id} · {user.department}
              </p>
              <h1 className="text-2xl font-bold font-display">
                TNHS Institutional Command Center
              </h1>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span>Admin Profile</span>
              </button>
              <button
                type="button"
                onClick={loadDashboard}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Console</span>
              </button>
            </div>
          </div>

          {/* Recharts AdminDashboardStats Panel: User Growth, Total Active Subjects & Submission Completion Rates */}
          <AdminDashboardStats
            analytics={dashboard?.analytics}
            statistics={dashboard?.statistics}
            darkMode={darkMode}
            showToast={showToast}
            onAuditScanCompleted={() => {
              setAuditRefreshKey((k) => k + 1);
              loadDashboard();
            }}
            onNavigateTab={(tab, subView) => {
              setActiveTab(tab);
              if (tab === 'users' && subView) {
                setUserSubView(subView);
              }
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Approvals Queue */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display">Account Approvals Queue</h2>
                <span className="text-xs font-mono text-amber-600">
                  {(dashboard?.pending_approvals || []).length} awaiting action
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(dashboard?.pending_approvals || []).length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    No accounts currently pending approval.
                  </p>
                ) : (
                  (dashboard?.pending_approvals || []).map((u: User) => (
                    <div
                      key={u.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-mono text-slate-500">
                          {u.role.toUpperCase()} · {u.school_id} · {u.grade_level || u.department}
                        </p>
                        <p className="text-sm font-bold">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApproveUser(u.id)}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectUser(u.id)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-red-300 text-red-600 text-xs font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Admin Audit Log Component fetching from /api/v1/admin/audit-logs */}
            <AdminAuditLog
              mode="compact"
              limit={12}
              refreshKey={auditRefreshKey}
              onOpenFullAuditLog={() => {
                setActiveTab('reports');
                setReportView('audit');
              }}
              showToast={showToast}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: USER MANAGEMENT, PENDING APPROVALS & SESSION MANAGEMENT
      ===================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">
                Accounts, Approvals & Token Sessions
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage students, teachers, administrators, and active device refresh-token families.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUserSubView('directory')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    userSubView === 'directory'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Users ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserSubView('approvals')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    userSubView === 'approvals'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Approvals ({users.filter((u) => u.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserSubView('sessions')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    userSubView === 'sessions'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Device Sessions ({sessions.filter((s) => !s.revoked_at).length})
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateUser(!showCreateUser)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create User</span>
              </button>
            </div>
          </div>

          {showCreateUser && (
            <form
              onSubmit={handleCreateUserSubmit}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-emerald-600 space-y-4"
            >
              <h2 className="text-lg font-bold font-display">Create Institutional Account</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">School / Employee ID</label>
                  <input
                    type="text"
                    value={newSchoolId}
                    onChange={(e) => setNewSchoolId(e.target.value)}
                    placeholder="e.g. 2026-00412"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  >
                    <option value="student">STUDENT</option>
                    <option value="teacher">TEACHER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@tnhs.edu.ph"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="First Name"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
                <input
                  type="text"
                  value={newMiddleName}
                  onChange={(e) => setNewMiddleName(e.target.value)}
                  placeholder="Middle Name"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Last Name"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                >
                  Create Active Account
                </button>
              </div>
            </form>
          )}

          {userSubView === 'directory' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, School ID, or email..."
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="All">All Roles</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="All">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {users
                  .filter((u) => {
                    const matchText =
                      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.school_id.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase());
                    const matchRole = roleFilter === 'All' || u.role === roleFilter;
                    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
                    return matchText && matchRole && matchStatus;
                  })
                  .map((u) => (
                    <div
                      key={u.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name}
                            className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {u.first_name?.[0]}
                            {u.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-mono text-slate-500">
                            {u.role.toUpperCase()} · {u.school_id} · Status:{' '}
                            <span
                              className={
                                u.status === 'pending'
                                  ? 'text-amber-600 font-semibold'
                                  : u.status === 'active'
                                  ? 'text-emerald-600 font-semibold'
                                  : 'text-red-500 font-semibold'
                              }
                            >
                              {u.status.toUpperCase()}
                            </span>
                          </p>
                          <h3 className="text-base font-bold mt-0.5">{u.name}</h3>
                          <p className="text-xs text-slate-500">
                            {u.email} · {u.grade_level ? `${u.grade_level} (${u.section})` : u.department}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {u.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveUser(u.id)}
                              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectUser(u.id)}
                              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-amber-300 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleResetUserPassword(u)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reset Password</span>
                        </button>
                        {u.id !== user.id && u.status !== 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                              u.status === 'active'
                                ? 'border border-amber-300 text-amber-700 dark:text-amber-400'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {u.id !== user.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{u.role === 'teacher' ? 'Delete Teacher' : 'Delete'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {userSubView === 'approvals' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {users.filter((u) => u.status === 'pending').length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  All pending accounts have been processed.
                </div>
              ) : (
                users
                  .filter((u) => u.status === 'pending')
                  .map((u) => (
                    <div
                      key={u.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs font-mono text-amber-600">
                          PENDING APPROVAL · {u.role.toUpperCase()} · {u.school_id}
                        </p>
                        <h3 className="text-base font-bold mt-0.5">{u.name}</h3>
                        <p className="text-xs text-slate-500">
                          {u.email} · {u.contact_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveUser(u.id)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Approve Account
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectUser(u.id)}
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-red-300 text-red-600 text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Section 13: Admin Session Management (Safe metadata only) */}
          {userSubView === 'sessions' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-3">Device / Platform</th>
                    <th className="py-3.5 px-3 font-mono">IP Address</th>
                    <th className="py-3.5 px-3 font-mono">Last Active</th>
                    <th className="py-3.5 px-3 font-mono">Expires</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold">{s.user_name}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {s.user_school_id} · {s.user_role?.toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div>{s.platform}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          Device: {s.device_id} · Family: {s.family_id}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono">{s.ip_address}</td>
                      <td className="py-3.5 px-3 font-mono">
                        {new Date(s.last_used_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 px-3 font-mono">
                        {new Date(s.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 font-mono">
                        {s.revoked_at ? (
                          <span className="text-slate-400">
                            Revoked ({s.revocation_reason || 'REVOKED'})
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Active</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!s.revoked_at && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(s.id)}
                            className="min-h-[36px] px-3 py-1 rounded-lg border border-red-300 text-red-600 font-semibold"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: ACADEMICS (SUBJECTS, SECTIONS, ROOMS & DEPARTMENTS)
      ===================================================================== */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">
                Subjects, Sections, Rooms & Departments
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add, update, and delete curriculum subjects, class sections, campus rooms, and faculty departments.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setAcademicSubView('subjects')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  academicSubView === 'subjects'
                    ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Subjects ({subjects.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAcademicSubView('sections')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  academicSubView === 'sections'
                    ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sections ({sections.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAcademicSubView('rooms')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  academicSubView === 'rooms'
                    ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rooms ({rooms.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAcademicSubView('departments')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  academicSubView === 'departments'
                    ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span>Departments ({departments.length})</span>
              </button>
            </div>
          </div>

          {/* SUB-VIEW 1: SUBJECTS (ADD, UPDATE, DELETE) */}
          {academicSubView === 'subjects' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveSubject}
                className={`lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border ${
                  editingSubjectId !== null
                    ? 'border-2 border-emerald-600'
                    : 'border-slate-200 dark:border-slate-800'
                } space-y-4 self-start`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold font-display">
                    {editingSubjectId !== null
                      ? 'Update Subject & Assignment'
                      : 'Create Subject & Assign Teacher'}
                  </h2>
                  {editingSubjectId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditSubject}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Subject Code</label>
                    <input
                      type="text"
                      value={subjCode}
                      onChange={(e) => setSubjCode(e.target.value)}
                      placeholder="e.g. PHYS-10A"
                      required
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Grade Level</label>
                    <select
                      value={subjGrade}
                      onChange={(e) => setSubjGrade(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={subjName}
                    onChange={(e) => setSubjName(e.target.value)}
                    placeholder="e.g. Applied Robotics & Electronics 10"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    value={subjDesc}
                    onChange={(e) => setSubjDesc(e.target.value)}
                    placeholder="Curriculum overview & competencies"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Section</label>
                    <select
                      value={subjSection}
                      onChange={(e) => setSubjSection(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.name}>
                          {sec.name} ({sec.grade_level})
                        </option>
                      ))}
                      {!sections.some((sec) => sec.name === subjSection) && subjSection && (
                        <option value={subjSection}>{subjSection}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Assigned Room</label>
                    <select
                      value={subjRoom}
                      onChange={(e) => setSubjRoom(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      <option value="">Unassigned Room</option>
                      {rooms.map((r) => {
                        const label = `${r.code} · ${r.name}`;
                        return (
                          <option key={r.id} value={label}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Assign Faculty Instructor</label>
                  <select
                    value={subjTeacherId}
                    onChange={(e) => setSubjTeacherId(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.school_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Class Schedule</label>
                  <input
                    type="text"
                    value={subjSchedule}
                    onChange={(e) => setSubjSchedule(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {editingSubjectId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditSubject}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {editingSubjectId !== null
                      ? 'Update Subject Changes'
                      : 'Save Subject & Faculty Assignment'}
                  </button>
                </div>
              </form>

              <div className="lg:col-span-7 space-y-3">
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border ${
                      editingSubjectId === s.id
                        ? 'border-2 border-emerald-600'
                        : 'border-slate-200 dark:border-slate-800'
                    } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                  >
                    <div>
                      <p className="text-xs font-mono text-emerald-600">
                        {s.code} · {s.grade_level} · {s.section} · SY {s.school_year}
                      </p>
                      <h3 className="text-base font-bold mt-0.5">{s.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Assigned Teacher: <strong>{s.teacher_name}</strong> · {s.enrolled_count}{' '}
                        enrolled
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {s.schedule} {s.room ? `· ${s.room}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditSubject(s)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiRequest(`/api/v1/admin/subjects/${s.id}`, { method: 'DELETE' });
                          showToast('Subject removed.', 'info');
                          if (editingSubjectId === s.id) handleCancelEditSubject();
                          loadAcademics();
                          loadDashboard();
                        }}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: SECTIONS (ADD, UPDATE, DELETE) */}
          {academicSubView === 'sections' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveSection}
                className={`lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border ${
                  editingSectionId !== null
                    ? 'border-2 border-emerald-600'
                    : 'border-slate-200 dark:border-slate-800'
                } space-y-4 self-start`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold font-display">
                    {editingSectionId !== null ? 'Update Section' : 'Add New Class Section'}
                  </h2>
                  {editingSectionId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditSection}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Section Name</label>
                  <input
                    type="text"
                    value={secName}
                    onChange={(e) => setSecName(e.target.value)}
                    placeholder="e.g. Rizal - STE or Newton"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Grade Level</label>
                    <select
                      value={secGrade}
                      onChange={(e) => setSecGrade(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Class Capacity</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={secCapacity}
                      onChange={(e) => setSecCapacity(Number(e.target.value) || 40)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Class Adviser (Teacher)</label>
                  <select
                    value={secAdviserId}
                    onChange={(e) => setSecAdviserId(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.school_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Homeroom / Assigned Room</label>
                  <select
                    value={secRoomId}
                    onChange={(e) => setSecRoomId(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  >
                    <option value={0}>No Assigned Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} · {r.name} ({r.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {editingSectionId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditSection}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {editingSectionId !== null ? 'Update Section' : 'Add Section'}
                  </button>
                </div>
              </form>

              <div className="lg:col-span-7 space-y-3">
                {sections.map((sec) => (
                  <div
                    key={sec.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border ${
                      editingSectionId === sec.id
                        ? 'border-2 border-emerald-600'
                        : 'border-slate-200 dark:border-slate-800'
                    } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                  >
                    <div>
                      <p className="text-xs font-mono text-emerald-600">
                        {sec.grade_level} · SY {sec.school_year} · Capacity: {sec.capacity}
                      </p>
                      <h3 className="text-base font-bold mt-0.5">{sec.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Adviser: <strong>{sec.adviser_name || 'Unassigned'}</strong> · Room:{' '}
                        <strong>{sec.room_name || 'Unassigned'}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditSection(sec)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: ROOMS (ADD, UPDATE, DELETE) */}
          {academicSubView === 'rooms' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveRoom}
                className={`lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border ${
                  editingRoomId !== null
                    ? 'border-2 border-emerald-600'
                    : 'border-slate-200 dark:border-slate-800'
                } space-y-4 self-start`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold font-display">
                    {editingRoomId !== null ? 'Update Campus Room' : 'Add New Campus Room'}
                  </h2>
                  {editingRoomId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditRoom}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Room Code</label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="e.g. RM-102"
                      required
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Capacity (Seats)</label>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={roomCapacity}
                      onChange={(e) => setRoomCapacity(Number(e.target.value) || 40)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Galileo Physics Laboratory"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Building & Floor</label>
                  <input
                    type="text"
                    value={roomBuilding}
                    onChange={(e) => setRoomBuilding(e.target.value)}
                    placeholder="e.g. Science & Technology Wing · 2F"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Room Type</label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value as Room['type'])}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      <option value="Lecture Room">Lecture Room</option>
                      <option value="Science Laboratory">Science Laboratory</option>
                      <option value="Computer Lab">Computer Lab</option>
                      <option value="Audio-Visual Room">Audio-Visual Room</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Room Status</label>
                    <select
                      value={roomStatus}
                      onChange={(e) => setRoomStatus(e.target.value as Room['status'])}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    >
                      <option value="Available">Available</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingRoomId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditRoom}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {editingRoomId !== null ? 'Update Room' : 'Add Room'}
                  </button>
                </div>
              </form>

              <div className="lg:col-span-7 space-y-3">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border ${
                      editingRoomId === r.id
                        ? 'border-2 border-emerald-600'
                        : 'border-slate-200 dark:border-slate-800'
                    } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                  >
                    <div>
                      <p className="text-xs font-mono text-emerald-600">
                        {r.code} · {r.type} ·{' '}
                        <span
                          className={
                            r.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'
                          }
                        >
                          {r.status}
                        </span>
                      </p>
                      <h3 className="text-base font-bold mt-0.5">{r.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.building} · Capacity: <strong>{r.capacity} seats</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditRoom(r)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(r.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: DEPARTMENTS (ADD, UPDATE, DELETE) */}
          {academicSubView === 'departments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveDept}
                className={`lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border ${
                  editingDeptId !== null
                    ? 'border-2 border-emerald-600'
                    : 'border-slate-200 dark:border-slate-800'
                } space-y-4 self-start`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold font-display">
                    {editingDeptId !== null
                      ? 'Update Faculty Department'
                      : 'Add Faculty Department'}
                  </h2>
                  {editingDeptId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditDept}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Department Code</label>
                  <input
                    type="text"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="e.g. MATH-SCI or HUMSS"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Department Name</label>
                  <input
                    type="text"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="e.g. Mathematics & Computational Sciences"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Department Head / Coordinator
                  </label>
                  <select
                    value={deptHeadTeacherId}
                    onChange={(e) => setDeptHeadTeacherId(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  >
                    <option value={0}>Unassigned Head</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.school_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    value={deptDesc}
                    onChange={(e) => setDeptDesc(e.target.value)}
                    placeholder="Faculty scope & academic focus"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {editingDeptId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEditDept}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {editingDeptId !== null ? 'Update Department' : 'Add Department'}
                  </button>
                </div>
              </form>

              <div className="lg:col-span-7 space-y-3">
                {departments.map((d) => (
                  <div
                    key={d.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border ${
                      editingDeptId === d.id
                        ? 'border-2 border-emerald-600'
                        : 'border-slate-200 dark:border-slate-800'
                    } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                  >
                    <div>
                      <p className="text-xs font-mono text-emerald-600">
                        {d.code} · Head: {d.head_teacher_name || 'Unassigned'}
                      </p>
                      <h3 className="text-base font-bold mt-0.5">{d.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{d.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditDept(d)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDept(d.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: ADMIN REPORTS & AUDIT LOGS
      ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">
                Institutional Reports & Security Audit Logs
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Inspect comprehensive audit trails, enrollment metrics, and export CSV reports.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReportView('audit')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    reportView === 'audit'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Audit Logs
                </button>
                <button
                  type="button"
                  onClick={() => setReportView('enrollment')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    reportView === 'enrollment'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Enrollment Report
                </button>
                <button
                  type="button"
                  onClick={() => setReportView('grades')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    reportView === 'grades'
                      ? 'bg-white dark:bg-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Grade Report
                </button>
              </div>
              <button
                type="button"
                onClick={handleExportAuditCsv}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {reportView === 'audit' && (
            <AdminAuditLog mode="full" limit={100} showToast={showToast} />
          )}

          {reportView === 'enrollment' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="text-lg font-bold font-display">Subject Enrollment Breakdown</h2>
              <div className="space-y-3">
                {(reportsData?.enrollments_by_subject || []).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">
                        {item.code} — {item.name} ({item.teacher})
                      </span>
                      <span className="font-mono font-bold">{item.enrolled} learners</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${Math.min(100, item.enrolled * 2.5)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportView === 'grades' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="text-lg font-bold font-display">School-Wide Grade Summary</h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(reportsData?.grade_distribution || []).map((g, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <span>
                      <strong>{g.student_name}</strong> ({g.school_id}) · {g.subject_code}
                    </span>
                    <span className="font-mono font-bold text-emerald-600">
                      Final Grade: {g.final_grade}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: SYSTEM SETTINGS
      ===================================================================== */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">System & Security Configuration</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Configure TNHS academic year parameters, token lifetimes, and notification channels.
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
                const res = await apiRequest<{ message: string; settings: SystemSettings }>(
                  '/api/v1/admin/settings',
                  {
                    method: 'PUT',
                    body: JSON.stringify(settings),
                  }
                );
                setSettings(res.settings);
                showToast(res.message, 'success');
              } catch (err: any) {
                showToast(err?.message || 'Failed to save settings', 'error');
              }
            }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 max-w-2xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">School Name</label>
                <input
                  type="text"
                  value={settings.school_name}
                  onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">System Subtitle</label>
                <input
                  type="text"
                  value={settings.school_subtitle}
                  onChange={(e) => setSettings({ ...settings, school_subtitle: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">School Year</label>
                <input
                  type="text"
                  value={settings.school_year}
                  onChange={(e) => setSettings({ ...settings, school_year: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Active Semester</label>
                <select
                  value={settings.semester}
                  onChange={(e) => setSettings({ ...settings, semester: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Access Token TTL (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.access_token_ttl_minutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      access_token_ttl_minutes: Number(e.target.value) || 15,
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Refresh Token TTL (Days)
                </label>
                <input
                  type="number"
                  value={settings.refresh_token_ttl_days}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      refresh_token_ttl_days: Number(e.target.value) || 30,
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Login Rate Limit (/min)
                </label>
                <input
                  type="number"
                  value={settings.rate_limit_per_minute}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rate_limit_per_minute: Number(e.target.value) || 5,
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  checked={settings.push_notifications_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, push_notifications_enabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>Enable Push Notifications (FCM / Expo Push Service)</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  checked={settings.email_notifications_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, email_notifications_enabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>Enable Transactional Email Alerts</span>
              </label>
            </div>

            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Save System Settings
            </button>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 6: ADMINISTRATOR PROFILE & CREDENTIALS
      ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">Administrator Profile</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Update your institutional administrator profile, photo, contact details, and security password.
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleUpdateAdminProfile}
              className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5"
            >
              <h2 className="text-lg font-bold font-display">Personal & Institutional Details</h2>

              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                {profAvatar ? (
                  <img
                    src={profAvatar}
                    alt={user.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-600 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-bold text-xl flex items-center justify-center border border-emerald-500/30 shrink-0">
                    {profFirstName?.[0] || 'A'}
                    {profLastName?.[0] || 'D'}
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-mono text-slate-500">
                    ADMIN ID: <strong className="text-slate-900 dark:text-white">{user.school_id}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAdminPhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Photo</span>
                    </button>
                    {profAvatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfAvatar(undefined);
                          showToast('Profile photo removed. Click Save Profile Changes to apply.', 'info');
                        }}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl border border-red-300 text-red-600 text-xs font-semibold"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    value={profFirstName}
                    onChange={(e) => setProfFirstName(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={profMiddleName}
                    onChange={(e) => setProfMiddleName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profLastName}
                    onChange={(e) => setProfLastName(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">Institutional Email</label>
                  <input
                    type="email"
                    value={profEmail}
                    onChange={(e) => setProfEmail(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={profContact}
                    onChange={(e) => setProfContact(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Office / Administrative Department</label>
                <input
                  type="text"
                  value={profDept}
                  onChange={(e) => setProfDept(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>

              <button
                type="submit"
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Profile Changes
              </button>
            </form>

            <form
              onSubmit={handleChangeAdminPassword}
              className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 self-start"
            >
              <h2 className="text-lg font-bold font-display">Change Administrator Password</h2>
              <p className="text-xs text-slate-500">
                Updating your password immediately revokes any other active device sessions.
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
                <label className="block text-xs font-semibold mb-1">New Password (min. 8 chars)</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          FIXED BOTTOM NAVIGATION BAR (ADMIN: 6 TABS)
      ===================================================================== */}
      <nav
        aria-label="Administrator Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-2xl mx-auto grid grid-cols-6 items-center h-16 px-2">
          {(
            [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'academics', label: 'Academics', icon: BookOpen },
              { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
              { id: 'settings', label: 'Settings', icon: Settings },
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
    </div>
  );
};
