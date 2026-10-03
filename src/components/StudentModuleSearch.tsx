import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Tag,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { LearningModule } from '../types/lms';
import { CircularProgressIndicator } from './CircularProgressIndicator';

export interface StudentModuleSearchProps {
  modules: LearningModule[];
  loading?: boolean;
  onOpenModule: (subjectId: number, moduleId: number) => void;
  onSelectSubject?: (subjectId: number) => void;
}

export const StudentModuleSearch: React.FC<StudentModuleSearchProps> = ({
  modules,
  loading = false,
  onOpenModule,
  onSelectSubject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Extract all unique subject tags from modules
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    modules.forEach((m) => {
      if (m.subject_code) set.add(m.subject_code);
      if (m.subject_name) set.add(m.subject_name);
      (m.tags || []).forEach((t) => {
        if (t.length <= 16) set.add(t);
      });
    });
    return ['All', ...Array.from(set).slice(0, 8)];
  }, [modules]);

  // Filter modules based on query and tag
  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return modules.filter((m) => {
      // Tag matching
      if (selectedTag !== 'All') {
        const matchesTag =
          m.subject_code?.toLowerCase() === selectedTag.toLowerCase() ||
          m.subject_name?.toLowerCase() === selectedTag.toLowerCase() ||
          (m.tags || []).some(
            (t) => t.toLowerCase() === selectedTag.toLowerCase()
          );
        if (!matchesTag) return false;
      }

      // Text query matching
      if (!q) return true;

      const titleMatch = m.title.toLowerCase().includes(q);
      const descMatch = m.description.toLowerCase().includes(q);
      const subjMatch =
        (m.subject_name && m.subject_name.toLowerCase().includes(q)) ||
        (m.subject_code && m.subject_code.toLowerCase().includes(q));
      const tagMatch = (m.tags || []).some((t) => t.toLowerCase().includes(q));
      const lessonMatch = (m.lessons || []).some((l) =>
        l.title.toLowerCase().includes(q)
      );

      return titleMatch || descMatch || subjMatch || tagMatch || lessonMatch;
    });
  }, [modules, searchQuery, selectedTag]);

  return (
    <div className="space-y-3.5">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter assigned modules by title or subject tags (e.g. Chemical, Polynomial, ENG10, STEM)..."
          className="w-full min-h-[46px] pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Subject Tag Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pl-1 shrink-0 flex items-center gap-1">
          <Tag className="w-3 h-3" />
          <span>Tags:</span>
        </span>
        {availableTags.map((tag) => {
          const active = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Search results summary count if query or filter applied */}
      {(searchQuery.trim() !== '' || selectedTag !== 'All') && (
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
          <span>
            Found <strong>{filteredModules.length}</strong> of{' '}
            {modules.length} assigned modules
            {selectedTag !== 'All' ? ` in "${selectedTag}"` : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('All');
            }}
            className="text-emerald-600 hover:underline font-semibold"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Filtered Modules Card Grid */}
      {(searchQuery.trim() !== '' || selectedTag !== 'All') && (
        <div className="space-y-3 pt-1">
          {filteredModules.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                No assigned modules match your filter
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for a different keyword like &quot;Lesson&quot;, subject code like
                &quot;ENG10&quot; or &quot;SCI10&quot;, or clear your filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag('All');
                }}
                className="mt-2 min-h-[36px] px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
              >
                Clear Search Query
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredModules.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        {m.subject_code} · {m.subject_name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">Progress:</span>
                        <CircularProgressIndicator
                          percentage={m.completion_percentage ?? 0}
                          size="xs"
                        />
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {m.description}
                    </p>

                    {/* Tags pill list */}
                    {m.tags && m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {m.tags.slice(0, 4).map((t, idx) => (
                          <span
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(t);
                            }}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{m.lessons.length} Lesson Resource(s)</span>
                      <span>
                        {m.lessons.filter((l) => l.completed).length}/{m.lessons.length} done
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenModule(m.subject_id, m.id)}
                        className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Open Module</span>
                      </button>

                      {onSelectSubject && (
                        <button
                          type="button"
                          onClick={() => onSelectSubject(m.subject_id)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="View Subject Classroom"
                        >
                          <span>Classroom</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
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
