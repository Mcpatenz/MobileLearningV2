import React, { useState, useMemo } from 'react';
import {
  FolderDown,
  FileText,
  Download,
  Eye,
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Printer,
  X,
  FileCode,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { StudyResource, LearningModule } from '../types/lms';
import { CircularProgressIndicator } from './CircularProgressIndicator';

export interface StudentResourceHubProps {
  resources: StudyResource[];
  modules: LearningModule[];
  loading?: boolean;
  onOpenModule?: (subjectId: number, moduleId: number) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentResourceHub: React.FC<StudentResourceHubProps> = ({
  resources,
  modules,
  loading = false,
  onOpenModule,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [previewResource, setPreviewResource] = useState<StudyResource | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  // Compute overall module completion percentage for circular indicator
  const overallModuleCompletion = useMemo(() => {
    if (modules.length === 0) return 0;
    const sum = modules.reduce((acc, m) => acc + (m.completion_percentage || 0), 0);
    return Math.round(sum / modules.length);
  }, [modules]);

  // Extract unique subjects for filter tabs
  const subjectList = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      if (r.subject_code) set.add(r.subject_code);
    });
    return ['All', ...Array.from(set)];
  }, [resources]);

  // Filtered resources list
  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources.filter((res) => {
      if (filterSubject !== 'All' && res.subject_code !== filterSubject) {
        return false;
      }
      if (filterType !== 'All' && res.file_type !== filterType) {
        return false;
      }
      if (!q) return true;

      return (
        res.title.toLowerCase().includes(q) ||
        res.description.toLowerCase().includes(q) ||
        res.file_name.toLowerCase().includes(q) ||
        res.module_title.toLowerCase().includes(q) ||
        res.subject_name.toLowerCase().includes(q) ||
        (res.key_topics || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [resources, searchQuery, filterSubject, filterType]);

  // Handle realistic file download
  const handleDownload = (resource: StudyResource) => {
    setDownloadingId(resource.id);

    try {
      // Create a readable student study material document blob
      const content = `=====================================================
TUBURAN NATIONAL HIGH SCHOOL — LEARNING MANAGEMENT SYSTEM
SUBJECT: ${resource.subject_code} — ${resource.subject_name}
MODULE: ${resource.module_title}
TITLE: ${resource.title}
TEACHER / INSTRUCTOR: ${resource.teacher_name || 'Department Faculty'}
FILE: ${resource.file_name} (${resource.file_size_kb} KB)
OFFICIAL DEPED K-12 ACADEMIC COMPANION
=====================================================

OVERVIEW:
${resource.description}

KEY TOPICS & STUDY POINTERS:
${(resource.key_topics || []).map((t) => `• ${t}`).join('\n')}

LESSON CONTENT SUMMARY:
${resource.preview_text || 'Refer to the active module lessons on the TNHS Mobile Learning Portal.'}

NOTICE: This study material is exclusively provisioned for enrolled students of Tuburan National High School. All rights reserved.`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resource.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Downloaded: ${resource.file_name}`, 'success');
    } catch {
      showToast(`Failed to trigger download for ${resource.file_name}`, 'error');
    } finally {
      setTimeout(() => setDownloadingId(null), 600);
    }
  };

  const getFileBadge = (type: string) => {
    switch (type) {
      case 'pdf':
        return {
          icon: FileText,
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          label: 'PDF Document',
        };
      case 'docx':
        return {
          icon: FileCode,
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          label: 'DOCX Worksheet',
        };
      case 'guide':
        return {
          icon: BookOpen,
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          label: 'Formula Sheet',
        };
      default:
        return {
          icon: FileText,
          bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
          label: 'Study File',
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
      {/* Top Banner: Resource Hub Header & Circular Progress Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <FolderDown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
                Resource Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {resources.length} Downloadables
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Supplementary PDFs, lecture handouts, and formula sheets for your active modules
            </p>
          </div>
        </div>

        {/* Circular Progress Indicator for Module Completion */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/60 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shrink-0 self-start md:self-auto">
          <CircularProgressIndicator
            percentage={overallModuleCompletion}
            size="md"
            sublabel="AVG"
          />
          <div className="space-y-0.5">
            <p className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
              Assigned Modules Mastery
            </p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {modules.filter((m) => (m.completion_percentage || 0) >= 100).length} of{' '}
              {modules.length} Completed
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials by title, module, or topic (e.g. Formula, Seismic, Polynomial)..."
              className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {['All', 'pdf', 'guide', 'docx'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === t
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t === 'All' ? 'All Formats' : t === 'pdf' ? 'PDFs' : t === 'guide' ? 'Formula Guides' : 'Worksheets'}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pl-1 shrink-0">
            Subject:
          </span>
          {subjectList.map((subj) => (
            <button
              key={subj}
              type="button"
              onClick={() => setFilterSubject(subj)}
              className={`min-h-[30px] px-2.5 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterSubject === subj
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            No study materials found
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or reset your subject/format filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterSubject('All');
              setFilterType('All');
            }}
            className="mt-2 min-h-[36px] px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredResources.map((res) => {
            const badge = getFileBadge(res.file_type);
            const Icon = badge.icon;
            const isDownloading = downloadingId === res.id;

            return (
              <div
                key={res.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${badge.bg}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {res.file_size_kb >= 1000
                        ? `${(res.file_size_kb / 1024).toFixed(1)} MB`
                        : `${res.file_size_kb} KB`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {res.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {res.subject_code}
                    </span>
                    <span>·</span>
                    <span className="truncate">{res.module_title}</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {res.description}
                  </p>

                  {/* Topic Badges */}
                  {res.key_topics && res.key_topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {res.key_topics.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls: Preview and Download */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    {res.teacher_name || 'Faculty Verified'}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewResource(res)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(res)}
                      disabled={isDownloading}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                      title={`Download ${res.file_name}`}
                    >
                      <Download
                        className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`}
                      />
                      <span>{isDownloading ? 'Saving...' : 'Download'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    {previewResource.subject_code} · {previewResource.file_type.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {previewResource.file_size_kb} KB
                  </span>
                </div>
                <h3 className="text-base font-bold font-display text-slate-900 dark:text-white mt-1">
                  {previewResource.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewResource.module_title} · Teacher: {previewResource.teacher_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-bold text-slate-900 dark:text-white font-mono uppercase text-[11px]">
                  Document Syllabus & Overview:
                </p>
                <p className="mt-1">{previewResource.description}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900 dark:text-white font-mono uppercase text-[11px]">
                  Summary & Key Study Points:
                </p>
                <p className="mt-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {previewResource.preview_text ||
                    'Comprehensive study material aligning with DepEd K-12 learning competencies.'}
                </p>
              </div>

              {previewResource.key_topics && (
                <div>
                  <p className="font-bold text-slate-900 dark:text-white font-mono uppercase text-[11px]">
                    Covered Concepts:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {previewResource.key_topics.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono"
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] font-mono text-slate-400">
                File: {previewResource.file_name}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleDownload(previewResource);
                    setPreviewResource(null);
                  }}
                  className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Now ({previewResource.file_size_kb} KB)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
