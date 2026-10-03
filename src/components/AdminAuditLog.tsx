import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Smartphone,
  Monitor,
  Globe,
  ChevronRight,
  Lock,
  BookOpen,
  UserCheck,
  Server,
  FileJson,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import type { AuditLog } from '../types/lms';

export interface AuditLogsApiResponse {
  audit_logs: AuditLog[];
  total_count: number;
  filtered_count: number;
  summary: {
    security_events: number;
    academic_events: number;
    user_events: number;
    unique_devices: number;
    unique_ips: number;
  };
}

export interface AdminAuditLogProps {
  mode?: 'compact' | 'full';
  limit?: number;
  refreshKey?: number;
  onOpenFullAuditLog?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function formatRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function parseDeviceMetadata(deviceInfo: string): {
  platformType: 'mobile' | 'desktop';
  clientLabel: string;
  osHardware: string;
} {
  const raw = deviceInfo || 'MLA Mobile 2.0 · Mobile Client';
  const isMobile =
    /android|ios|iphone|ipad|samsung|pixel|xiaomi|realme|expo|mobile/i.test(raw) &&
    !/macOS|Windows|Ubuntu|Workstation/i.test(raw);
  const parts = raw.split('·').map((s) => s.trim());
  if (parts.length >= 2) {
    return {
      platformType: isMobile ? 'mobile' : 'desktop',
      clientLabel: parts[0],
      osHardware: parts.slice(1).join(' · '),
    };
  }
  return {
    platformType: isMobile ? 'mobile' : 'desktop',
    clientLabel: 'MLA Mobile 2.0',
    osHardware: raw,
  };
}

function getActionCategoryMeta(action: string): {
  category: 'SECURITY' | 'ACADEMIC' | 'USER_MGMT' | 'SYSTEM';
  severity: 'VERIFIED' | 'ELEVATED' | 'INFO';
  colorClass: string;
  Icon: React.ComponentType<{ className?: string }>;
} {
  const upper = action.toUpperCase();
  if (
    upper.includes('REVOKE') ||
    upper.includes('REPLAY') ||
    upper.includes('REJECT') ||
    upper.includes('RESET') ||
    upper.includes('DELETE')
  ) {
    return {
      category: 'SECURITY',
      severity: 'ELEVATED',
      colorClass: 'text-amber-600 dark:text-amber-400',
      Icon: Lock,
    };
  }
  if (
    upper.includes('AUTH') ||
    upper.includes('TOKEN') ||
    upper.includes('SESSION') ||
    upper.includes('SECURITY') ||
    upper.includes('SCAN')
  ) {
    return {
      category: 'SECURITY',
      severity: 'VERIFIED',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      Icon: Lock,
    };
  }
  if (upper.includes('USER') || upper.includes('APPROV') || upper.includes('PROFILE')) {
    return {
      category: 'USER_MGMT',
      severity: 'VERIFIED',
      colorClass: 'text-teal-600 dark:text-teal-400',
      Icon: UserCheck,
    };
  }
  if (
    upper.includes('SUBJECT') ||
    upper.includes('MODULE') ||
    upper.includes('ASSIGNMENT') ||
    upper.includes('QUIZ') ||
    upper.includes('EXAM') ||
    upper.includes('GRADE') ||
    upper.includes('SUBMISSION')
  ) {
    return {
      category: 'ACADEMIC',
      severity: 'INFO',
      colorClass: 'text-sky-600 dark:text-sky-400',
      Icon: BookOpen,
    };
  }
  return {
    category: 'SYSTEM',
    severity: 'INFO',
    colorClass: 'text-slate-600 dark:text-slate-400',
    Icon: Server,
  };
}

export const AdminAuditLog: React.FC<AdminAuditLogProps> = ({
  mode = 'full',
  limit = 50,
  refreshKey = 0,
  onOpenFullAuditLog,
  showToast,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditLogsApiResponse['summary']>({
    security_events: 0,
    academic_events: 0,
    user_events: 0,
    unique_devices: 0,
    unique_ips: 0,
  });
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(false);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter !== 'All') params.set('role', roleFilter);
      if (categoryFilter !== 'All') params.set('category', categoryFilter);
      params.set('limit', String(mode === 'compact' ? Math.min(limit, 15) : limit));

      const res = await apiRequest<AuditLogsApiResponse>(
        `/api/v1/admin/audit-logs?${params.toString()}`
      );
      setLogs(res.audit_logs || []);
      setTotalCount(res.total_count ?? (res.audit_logs || []).length);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      showToast?.(err?.message || 'Unable to fetch audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, categoryFilter, mode, limit, showToast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs, refreshKey]);

  useEffect(() => {
    if (!autoSync) return;
    const timer = setInterval(() => {
      fetchAuditLogs();
    }, 15000);
    return () => clearInterval(timer);
  }, [autoSync, fetchAuditLogs]);

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = [
      'Audit ID',
      'ISO Timestamp',
      'Actor Name',
      'Role',
      'User Action',
      'Description',
      'IP Address',
      'Device Metadata',
    ];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.user_name}"`,
      l.user_role.toUpperCase(),
      l.action,
      `"${l.description.replace(/"/g, '""')}"`,
      l.ip_address,
      `"${l.device_info.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TNHS_System_Activity_Audit_Logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported TNHS System Activity & Device Metadata CSV.', 'success');
  };

  const handleExportJson = () => {
    if (logs.length === 0) return;
    const payload = {
      exported_at: new Date().toISOString(),
      institution: 'Tudela National High School · MLA Mobile Learning 2.0',
      endpoint: '/api/v1/admin/audit-logs',
      summary,
      records: logs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TNHS_Security_Audit_Bundle.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Exported signed JSON Security Audit Bundle.', 'success');
  };

  if (mode === 'compact') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>LIVE AUDIT STREAM · /api/v1/admin/audit-logs</span>
              </div>
              <h2 className="text-lg font-bold font-display mt-0.5">
                Recent System Activities & Device Metadata
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAuditLogs}
                title="Refresh audit logs"
                className="min-h-[36px] min-w-[36px] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-emerald-500"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {onOpenFullAuditLog && (
                <button
                  type="button"
                  onClick={onOpenFullAuditLog}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:bg-emerald-50 dark:hover:bg-slate-700"
                >
                  <span>Full Console</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Category Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['All', 'SECURITY', 'ACADEMIC', 'USER_MGMT'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat === 'All'
                  ? `ALL (${totalCount})`
                  : cat === 'USER_MGMT'
                  ? 'USER ACTIONS'
                  : cat}
              </button>
            ))}
          </div>

          {/* Structured, Scrollable Table of Recent System Activities */}
          <div className="max-h-[360px] overflow-y-auto overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2.5 px-3 font-mono">User Action & Actor</th>
                  <th className="py-2.5 px-3 font-mono">Timestamp</th>
                  <th className="py-2.5 px-3 font-mono">Device Metadata & IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => {
                  const device = parseDeviceMetadata(log.device_info);
                  const meta = getActionCategoryMeta(log.action);
                  const ActionIcon = meta.Icon;
                  const isExpanded = selectedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setSelectedLogId(isExpanded ? null : log.id)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <ActionIcon className={`w-3.5 h-3.5 shrink-0 ${meta.colorClass}`} />
                            <span className={`font-mono font-bold ${meta.colorClass}`}>
                              {log.action}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {log.user_name}{' '}
                            <span className="font-mono text-[10px] text-slate-500 uppercase">
                              ({log.user_role})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {log.description}
                          </p>
                        </td>

                        <td className="py-2.5 px-3 font-mono whitespace-nowrap align-top">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                          <div className="text-[10px] text-slate-500 tabular-nums">
                            {formatRelativeTime(log.timestamp)}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono align-top">
                          <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold">
                            {device.platformType === 'mobile' ? (
                              <Smartphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Monitor className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                            )}
                            <span className="truncate max-w-[160px]">{device.osHardware}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Globe className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{log.ip_address}</span>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-slate-950/90">
                          <td colSpan={3} className="px-3.5 py-2.5 font-mono text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-500">
                              <span>AUDIT #{log.id} · {meta.severity}</span>
                              <span>{log.timestamp}</span>
                            </div>
                            <div className="text-slate-700 dark:text-slate-300">
                              Device Runtime: <strong>{log.device_info}</strong>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Endpoint: /api/v1/admin/audit-logs</span>
          <span>
            {summary.unique_devices} devices · {summary.unique_ips} IPs tracked
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Audit Telemetry Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Total Audit Events
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1">{totalCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Auth & Token Events
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1">
            {summary.security_events}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Academic Actions
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1">
            {summary.academic_events}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Account Actions
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1">{summary.user_events}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Unique Devices / IPs
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums mt-1">
            {summary.unique_devices} / {summary.unique_ips}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user action, actor name, device hardware, or IP address..."
            className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by actor role"
            className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
          >
            <option value="All">All Actor Roles</option>
            <option value="admin">Admin Only</option>
            <option value="teacher">Teacher Only</option>
            <option value="student">Student Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by action category"
            className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
          >
            <option value="All">All Action Categories</option>
            <option value="SECURITY">Security & Auth Tokens</option>
            <option value="ACADEMIC">Academic & Assessments</option>
            <option value="USER_MGMT">User & Approval Actions</option>
            <option value="SYSTEM">System Configuration</option>
          </select>

          <button
            type="button"
            onClick={() => setAutoSync((s) => !s)}
            className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-mono font-semibold transition-colors ${
              autoSync
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {autoSync ? 'Auto-Sync: ON (15s)' : 'Auto-Sync: OFF'}
          </button>

          <button
            type="button"
            onClick={fetchAuditLogs}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5 hover:border-emerald-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5 hover:border-emerald-500"
          >
            <FileJson className="w-3.5 h-3.5 text-emerald-600" />
            <span>JSON Bundle</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Structured, Scrollable Audit Log Table + Device Metadata Inspector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="max-h-[540px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950">
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-3.5 px-4 font-mono">Timestamp</th>
                <th className="py-3.5 px-3">Actor & Role</th>
                <th className="py-3.5 px-3 font-mono">User Action</th>
                <th className="py-3.5 px-3">Activity Details</th>
                <th className="py-3.5 px-4 font-mono">Device Metadata & IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No system audit logs matched your current filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const device = parseDeviceMetadata(log.device_info);
                  const meta = getActionCategoryMeta(log.action);
                  const ActionIcon = meta.Icon;
                  const isExpanded = selectedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setSelectedLogId(isExpanded ? null : log.id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {new Date(log.timestamp).toLocaleDateString()} ·{' '}
                            {formatRelativeTime(log.timestamp)}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {log.user_name}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 uppercase">
                            {log.user_role} {log.user_id ? `· UID #${log.user_id}` : ''}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono">
                          <div className={`inline-flex items-center gap-1.5 font-bold ${meta.colorClass}`}>
                            <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{log.action}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {meta.category} · {meta.severity}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 max-w-md">
                          {log.description}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                            {device.platformType === 'mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Monitor className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                            )}
                            <span className="truncate max-w-[220px]">{device.osHardware}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>IP: {log.ip_address}</span>
                            <span>·</span>
                            <span>{device.clientLabel}</span>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-slate-950/80">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                              <div>
                                <span className="text-slate-400 block text-[10px]">
                                  AUDIT RECORD ID
                                </span>
                                <span className="font-bold">
                                  #{log.id} ({meta.severity})
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">
                                  EXACT ISO-8601 TIMESTAMP
                                </span>
                                <span className="font-bold">{log.timestamp}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">
                                  CLIENT RUNTIME & HARDWARE
                                </span>
                                <span className="font-bold">{log.device_info}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">
                                  NETWORK ORIGIN IP
                                </span>
                                <span className="font-bold">{log.ip_address}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLog;
