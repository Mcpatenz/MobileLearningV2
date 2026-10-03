import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, LogOut, ShieldCheck, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import {
  AuthService,
  AuthTokenManager,
  NetworkMonitor,
  performSingleFlightRefresh,
} from './services/api';
import { SplashScreen, LoginScreen } from './components/AuthViews';
import { StudentPortal } from './components/StudentPortal';
import { TeacherPortal } from './components/TeacherPortal';
import { AdminPortal } from './components/AdminPortal';
import type { AuthState, User } from './types/lms';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('BOOTING');
  const [user, setUser] = useState<User | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(NetworkMonitor.isOffline());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  // Dark mode class toggle
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Network offline listener
  useEffect(() => {
    const unsub = NetworkMonitor.onChange((offline) => {
      setIsOffline(offline);
    });
    const handleOnline = () => setIsOffline(NetworkMonitor.isOffline());
    const handleOffline = () => setIsOffline(NetworkMonitor.isOffline());
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for forced session expiration from 401 refresh failure
  useEffect(() => {
    const unsub = AuthTokenManager.onSessionExpired((reason) => {
      setUser(null);
      setSessionNotice(reason);
      setAuthState('UNAUTHENTICATED');
    });
    return () => {
      unsub();
    };
  }, []);

  // Boot & Session Restoration State Machine
  useEffect(() => {
    let mounted = true;
    async function bootSession() {
      setAuthState('CHECKING_SESSION');
      await new Promise((r) => setTimeout(r, 350));
      if (!mounted) return;
      setAuthState('REFRESHING');
      const restored = await AuthService.restoreSessionOnBoot();
      if (!mounted) return;
      if (restored?.user) {
        setUser(restored.user);
        setAuthState('AUTHENTICATED');
      } else {
        setAuthState('UNAUTHENTICATED');
      }
    }
    bootSession();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthenticated = (loggedInUser: User) => {
    setUser(loggedInUser);
    setSessionNotice(null);
    setAuthState('AUTHENTICATED');
    showToast(`Signed in as ${loggedInUser.name} (${loggedInUser.role.toUpperCase()})`, 'success');
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setAuthState('UNAUTHENTICATED');
    showToast('Session revoked and SecureStore cleared.', 'info');
  };

  const handleQuickSwitchRole = async (schoolId: string) => {
    try {
      const res = await AuthService.login(schoolId, 'password123');
      setUser(res.user);
      setAuthState('AUTHENTICATED');
      showToast(
        `Switched portal to ${res.user.role.toUpperCase()} (${res.user.name})`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Role switch failed', 'error');
    }
  };

  if (
    authState === 'BOOTING' ||
    authState === 'CHECKING_SESSION' ||
    authState === 'REFRESHING'
  ) {
    return <SplashScreen authState={authState} />;
  }

  if (authState === 'UNAUTHENTICATED' || !user) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <LoginScreen
          onAuthenticated={handleAuthenticated}
          sessionNotice={sessionNotice}
          showToast={showToast}
        />
        <div
          aria-live="polite"
          className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        >
          {toasts.map((t) => (
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* =====================================================================
          STRICT 3-ZONE TOP BAR CONTRACT
          Zone 1: Single text wordmark | Zone 2: Clean role/demo links | Zone 3: Actions
      ===================================================================== */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => e.preventDefault()}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap"
        >
          MLA Mobile Learning
        </a>

        {/* Zone 2: Clean text links to switch/inspect Student, Teacher, Admin portals or Rotate Token */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => handleQuickSwitchRole('2026-00142')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap ${
              user.role === 'student'
                ? 'text-emerald-600 dark:text-emerald-400 underline underline-offset-4 font-semibold'
                : ''
            }`}
          >
            Student Portal
          </button>
          <button
            type="button"
            onClick={() => handleQuickSwitchRole('TCH-2026-08')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap ${
              user.role === 'teacher'
                ? 'text-emerald-600 dark:text-emerald-400 underline underline-offset-4 font-semibold'
                : ''
            }`}
          >
            Teacher Portal
          </button>
          <button
            type="button"
            onClick={() => handleQuickSwitchRole('ADM-2026-01')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap ${
              user.role === 'admin'
                ? 'text-emerald-600 dark:text-emerald-400 underline underline-offset-4 font-semibold'
                : ''
            }`}
          >
            Admin Portal
          </button>
          <button
            type="button"
            onClick={async () => {
              const rotated = await performSingleFlightRefresh();
              if (rotated) {
                showToast(
                  `Rotated refresh token & issued new 15m RAM access token.`,
                  'success'
                );
              }
            }}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rotate Token</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Contextual Actions (Offline Toggle & Sign Out) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !isOffline;
              NetworkMonitor.setSimulatedOffline(next);
              showToast(
                next
                  ? 'Offline Mode Enabled — Using encrypted SecureStore cache.'
                  : 'Back Online — Live server synchronization restored.',
                next ? 'info' : 'success'
              );
            }}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              isOffline
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isOffline ? 'Offline' : 'Online'}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* MOBILE ROLE & SECURITY SWITCHER BAR (Visible on Mobile Viewports) */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleQuickSwitchRole('2026-00142')}
            className={`whitespace-nowrap py-1 font-medium ${
              user.role === 'student'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold underline underline-offset-4'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => handleQuickSwitchRole('TCH-2026-08')}
            className={`whitespace-nowrap py-1 font-medium ${
              user.role === 'teacher'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold underline underline-offset-4'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => handleQuickSwitchRole('ADM-2026-01')}
            className={`whitespace-nowrap py-1 font-medium ${
              user.role === 'admin'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold underline underline-offset-4'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Admin
          </button>
        </div>

        <button
          type="button"
          onClick={async () => {
            const rotated = await performSingleFlightRefresh();
            if (rotated) {
              showToast('Rotated refresh token & issued new 15m RAM access token.', 'success');
            }
          }}
          className="whitespace-nowrap font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Rotate Token</span>
        </button>
      </div>

      {/* OFFLINE AWARENESS BANNER */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            You&apos;re offline. Some information may be unavailable. Displaying encrypted cached
            records.
          </span>
        </div>
      )}

      {/* ROLE-BASED PORTAL ROUTING */}
      <main>
        {user.role === 'student' && (
          <StudentPortal
            user={user}
            onUserUpdated={setUser}
            onLogout={handleLogout}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            showToast={showToast}
          />
        )}

        {user.role === 'teacher' && (
          <TeacherPortal
            user={user}
            onUserUpdated={setUser}
            onLogout={handleLogout}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            showToast={showToast}
          />
        )}

        {user.role === 'admin' && (
          <AdminPortal
            user={user}
            onUserUpdated={setUser}
            onLogout={handleLogout}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            showToast={showToast}
          />
        )}
      </main>

      {/* TOAST NOTIFICATION STACK */}
      <div
        aria-live="polite"
        className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
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
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
