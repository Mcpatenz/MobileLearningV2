import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Flame,
  Clock,
  BookOpen,
  Sparkles,
  Coffee,
  Volume2,
  VolumeX,
  History,
} from 'lucide-react';
import type { LearningModule, FocusStats } from '../types/lms';
import { apiRequest } from '../services/api';

export interface StudentFocusTimerProps {
  modules: LearningModule[];
  stats?: FocusStats | null;
  onSessionLogged?: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'custom';

export const StudentFocusTimer: React.FC<StudentFocusTimerProps> = ({
  modules,
  stats,
  onSessionLogged,
  showToast,
}) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(
    modules.length > 0 ? modules[0].id : null
  );

  // Default minutes for each mode
  const modeMinutes: Record<TimerMode, number> = {
    pomodoro: 25,
    short_break: 5,
    long_break: 15,
    custom: 45,
  };

  const [totalSeconds, setTotalSeconds] = useState<number>(modeMinutes.pomodoro * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(modeMinutes.pomodoro * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Sync selectedModuleId if modules list updates
  useEffect(() => {
    if (!selectedModuleId && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  // Audio chime via Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // AudioContext unavailable, silent fallback
    }
  };

  // Timer interval loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      setIsRunning(false);
      playChime();
      handleCompleteSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds]);

  // Change mode
  const handleSelectMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    const secs = modeMinutes[newMode] * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    const secs = modeMinutes[mode] * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  // Log completed session to server
  const handleCompleteSession = async () => {
    const elapsedMinutes = Math.max(1, Math.round((totalSeconds - remainingSeconds) / 60));
    setSavingSession(true);
    try {
      await apiRequest('/api/v1/student/focus-sessions', {
        method: 'POST',
        body: JSON.stringify({
          module_id: selectedModuleId,
          duration_minutes: elapsedMinutes,
          mode,
        }),
      });
      showToast(`🎯 Great focus! ${elapsedMinutes} mins logged for this module.`, 'success');
      onSessionLogged?.();
    } catch {
      showToast('Could not save focus session stats to server.', 'error');
    } finally {
      setSavingSession(false);
      handleReset();
    }
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || modules[0];

  // Formatting helpers
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPct =
    totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  // Format total study minutes to human readable
  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
                Focus Session Timer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                Pomodoro
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Stay in the flow studying for your active modules and record your focus stats
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="min-h-[38px] min-w-[38px] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            title={soundEnabled ? 'Chime Enabled' : 'Chime Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showHistory
                ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Target Module Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
          <span>Active Focus Target:</span>
        </label>
        <select
          value={selectedModuleId ?? ''}
          onChange={(e) => setSelectedModuleId(Number(e.target.value))}
          className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.subject_code ? `[${m.subject_code}] ` : ''}
              {m.title}
            </option>
          ))}
        </select>
      </div>

      {/* Main Focus Dial & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        {/* Left: Interactive Circular Timer Dial */}
        <div className="md:col-span-6 flex flex-col items-center justify-center space-y-4">
          {/* Mode Pill Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {(
              [
                { id: 'pomodoro', label: '25m Focus' },
                { id: 'short_break', label: '5m Break' },
                { id: 'long_break', label: '15m Long' },
                { id: 'custom', label: '45m Deep' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMode(m.id)}
                className={`min-h-[32px] px-3 py-1 rounded-lg font-semibold transition-colors ${
                  mode === m.id
                    ? 'bg-amber-500 text-slate-950 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Circular Countdown Dial */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="5"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
              <circle
                className={`${
                  mode === 'short_break' || mode === 'long_break'
                    ? 'text-teal-500'
                    : 'text-amber-500'
                } transition-all duration-300`}
                strokeWidth="5"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - progressPct / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formattedTime}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mt-1 font-semibold">
                {isRunning ? (mode.includes('break') ? 'Break Time' : 'Focusing') : 'Paused'}
              </span>
            </div>
          </div>

          {/* Action Button Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`min-h-[46px] px-6 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                isRunning
                  ? 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-sm'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? 'Pause Timer' : 'Start Focus'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="min-h-[46px] min-w-[46px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {remainingSeconds < totalSeconds && (
              <button
                type="button"
                onClick={handleCompleteSession}
                disabled={savingSession}
                className="min-h-[46px] px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Log this session now"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Log Session</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Small Stats Display */}
        <div className="md:col-span-6 grid grid-cols-2 gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-5">
          {/* Today's Focus Minutes */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Today&apos;s Focus</span>
            </div>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatMinutes(stats?.today_minutes ?? 25)}
            </p>
            <p className="text-[10px] text-slate-400">
              {stats?.today_sessions_count ?? 1} session(s) today
            </p>
          </div>

          {/* Study Streak */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Active Streak</span>
            </div>
            <p className="text-xl font-bold font-mono text-orange-600 dark:text-orange-400">
              {stats?.streak_days ?? 3} Days
            </p>
            <p className="text-[10px] text-slate-400">Consistent effort</p>
          </div>

          {/* Total Study Time */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Total Study Time</span>
            </div>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatMinutes(stats?.total_minutes ?? 145)}
            </p>
            <p className="text-[10px] text-slate-400">
              {stats?.total_sessions_count ?? 5} total sessions
            </p>
          </div>

          {/* Most Studied Subject */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>Focus Subject</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {stats?.most_studied_subject || 'MATH10'}
            </p>
            <p className="text-[10px] text-slate-400">Highest recorded hours</p>
          </div>
        </div>
      </div>

      {/* Optional Session History Log View */}
      {showHistory && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-mono">
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span>Recent Focus Session History</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {stats?.sessions?.length || 0} recorded
            </span>
          </div>

          {(!stats?.sessions || stats.sessions.length === 0) ? (
            <p className="text-xs text-slate-400 py-2">No focus sessions recorded yet today.</p>
          ) : (
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/80">
              {stats.sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="py-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {s.subject_code}
                    </span>
                    <span className="mx-1.5">·</span>
                    <span className="truncate">{s.module_title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                      {s.duration_minutes}m
                    </span>
                    <span className="text-slate-400">
                      {new Date(s.completed_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
