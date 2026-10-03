import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  HelpCircle,
  Check,
  ListChecks,
  AlignLeft,
  ToggleLeft,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import type { AssessmentQuestion, QuestionType } from '../types/lms';

export interface QuestionBankManagerProps {
  assessmentType: 'assignments' | 'quizzes' | 'exams';
  assessmentId: number;
  assessmentTitle: string;
  subjectCode: string;
  questions: AssessmentQuestion[];
  onUpdated: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  assessmentType,
  assessmentId,
  assessmentTitle,
  subjectCode,
  questions = [],
  onUpdated,
  showToast,
}) => {
  // Add / Edit form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [points, setPoints] = useState<string>('10');
  const [choiceA, setChoiceA] = useState('');
  const [choiceB, setChoiceB] = useState('');
  const [choiceC, setChoiceC] = useState('');
  const [choiceD, setChoiceD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const resetForm = () => {
    setIsAdding(false);
    setEditingQuestionId(null);
    setQuestionText('');
    setQuestionType(assessmentType === 'assignments' ? 'short_answer' : 'multiple_choice');
    setPoints('10');
    setChoiceA('');
    setChoiceB('');
    setChoiceC('');
    setChoiceD('');
    setCorrectAnswer(assessmentType === 'assignments' ? '' : 'A');
  };

  const handleOpenAdd = () => {
    setEditingQuestionId(null);
    setQuestionText('');
    const defaultType: QuestionType =
      assessmentType === 'assignments' ? 'short_answer' : 'multiple_choice';
    setQuestionType(defaultType);
    setPoints('10');
    setChoiceA('');
    setChoiceB('');
    setChoiceC('');
    setChoiceD('');
    setCorrectAnswer((defaultType as QuestionType) === 'multiple_choice' ? 'A' : (defaultType as QuestionType) === 'true_false' ? 'True' : '');
    setIsAdding(true);
  };

  const handleOpenEdit = (q: AssessmentQuestion) => {
    setIsAdding(false);
    setEditingQuestionId(q.id);
    setQuestionText(q.question_text);
    setQuestionType(q.question_type);
    setPoints(String(q.points || 10));

    if (q.question_type === 'multiple_choice') {
      const findChoice = (id: string, idx: number) =>
        q.choices?.find((c) => c.id === id)?.text || q.choices?.[idx]?.text || '';
      setChoiceA(findChoice('A', 0));
      setChoiceB(findChoice('B', 1));
      setChoiceC(findChoice('C', 2));
      setChoiceD(findChoice('D', 3));
      setCorrectAnswer(q.correct_answer || 'A');
    } else if (q.question_type === 'true_false') {
      setCorrectAnswer(q.correct_answer === 'False' ? 'False' : 'True');
    } else {
      setCorrectAnswer(q.correct_answer || '');
    }
  };

  const handleQuestionTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    if (newType === 'multiple_choice') {
      setCorrectAnswer('A');
    } else if (newType === 'true_false') {
      setCorrectAnswer('True');
    } else {
      setCorrectAnswer('');
    }
  };

  const buildPayload = () => {
    let choices: { id: string; text: string }[] = [];
    if (questionType === 'multiple_choice') {
      choices = [
        { id: 'A', text: choiceA.trim() || 'Option A' },
        { id: 'B', text: choiceB.trim() || 'Option B' },
        { id: 'C', text: choiceC.trim() || 'Option C' },
        { id: 'D', text: choiceD.trim() || 'Option D' },
      ];
    } else if (questionType === 'true_false') {
      choices = [
        { id: 'True', text: 'True' },
        { id: 'False', text: 'False' },
      ];
    }

    return {
      question_text: questionText.trim(),
      question_type: questionType,
      points: Math.max(1, Number(points) || 10),
      choices,
      correct_answer: correctAnswer.trim(),
    };
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      showToast('Please enter the question prompt text.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();

      if (editingQuestionId !== null) {
        const res = await apiRequest<{ message: string }>(
          `/api/v1/teacher/${assessmentType}/${assessmentId}/questions/${editingQuestionId}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
        showToast(res.message || 'Question updated.', 'success');
      } else {
        const res = await apiRequest<{ message: string }>(
          `/api/v1/teacher/${assessmentType}/${assessmentId}/questions`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );
        showToast(res.message || 'Question added.', 'success');
      }

      resetForm();
      onUpdated();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save question', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    setDeletingId(questionId);
    try {
      const res = await apiRequest<{ message: string }>(
        `/api/v1/teacher/${assessmentType}/${assessmentId}/questions/${questionId}`,
        {
          method: 'DELETE',
        }
      );
      showToast(res.message || 'Question deleted.', 'info');
      if (editingQuestionId === questionId) {
        resetForm();
      }
      onUpdated();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete question', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const typeLabel =
    assessmentType === 'assignments'
      ? 'Assignment'
      : assessmentType === 'quizzes'
      ? 'Quiz'
      : 'Examination';

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-semibold">
            {questions.length} {questions.length === 1 ? 'Question' : 'Questions'} · {totalPoints} Total Pts
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {subjectCode} · {typeLabel} Question Bank
          </span>
        </div>

        {!isAdding && editingQuestionId === null && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>
        )}
      </div>

      {/* Add or Edit Question Form */}
      {(isAdding || editingQuestionId !== null) && (
        <form
          onSubmit={handleSaveQuestion}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border-2 border-emerald-500/60 space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                {editingQuestionId !== null
                  ? `Update Question in ${assessmentTitle}`
                  : `Add New Question to ${assessmentTitle}`}
              </h4>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>

          {/* Question Type & Points Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Question Format
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'multiple_choice', label: 'Multiple Choice', icon: ListChecks },
                    { id: 'true_false', label: 'True / False', icon: ToggleLeft },
                    { id: 'short_answer', label: 'Short Answer', icon: AlignLeft },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = questionType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleQuestionTypeChange(item.id)}
                      className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        active
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Points Value
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold"
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Question Prompt / Problem Statement
            </label>
            <textarea
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the full question prompt, equation, or problem statement..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed"
            />
          </div>

          {/* Choices / Answer Key by Type */}
          {questionType === 'multiple_choice' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    Option A
                  </label>
                  <input
                    type="text"
                    value={choiceA}
                    onChange={(e) => setChoiceA(e.target.value)}
                    placeholder="Enter Choice A..."
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    Option B
                  </label>
                  <input
                    type="text"
                    value={choiceB}
                    onChange={(e) => setChoiceB(e.target.value)}
                    placeholder="Enter Choice B..."
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    Option C
                  </label>
                  <input
                    type="text"
                    value={choiceC}
                    onChange={(e) => setChoiceC(e.target.value)}
                    placeholder="Enter Choice C..."
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    Option D
                  </label>
                  <input
                    type="text"
                    value={choiceD}
                    onChange={(e) => setChoiceD(e.target.value)}
                    placeholder="Enter Choice D..."
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Correct Option Key
                </label>
                <div className="flex items-center gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCorrectAnswer(opt)}
                      className={`min-h-[36px] px-4 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                        correctAnswer === opt
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Option {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {questionType === 'true_false' && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Correct Truth Value
              </label>
              <div className="flex items-center gap-2">
                {(['True', 'False'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCorrectAnswer(val)}
                    className={`min-h-[38px] px-5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                      correctAnswer === val
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {questionType === 'short_answer' && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Expected Answer Key / Grading Rubric Reference
              </label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="e.g. 3/11 or Q(x) = 3x³ - 2x² - 4x + 1, R = 7"
                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {saving
                  ? 'Saving...'
                  : editingQuestionId !== null
                  ? 'Update Question'
                  : 'Save Question'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Questions List */}
      {questions.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
          <HelpCircle className="w-5 h-5 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500">
            No questions added to this {typeLabel.toLowerCase()} yet. Click{' '}
            <strong>Add Question</strong> above to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {questions.map((q, idx) => {
            const isBeingEdited = editingQuestionId === q.id;
            return (
              <div
                key={q.id}
                className={`p-3.5 rounded-2xl border transition-colors ${
                  isBeingEdited
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 font-mono text-[11px] font-bold">
                        Q{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-semibold">
                        {q.points} pts
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 uppercase">
                        {q.question_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {q.question_text}
                    </p>

                    {/* Choices preview */}
                    {q.choices && q.choices.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.choices.map((c) => {
                          const isCorrect =
                            String(q.correct_answer || '').toLowerCase() ===
                            String(c.id).toLowerCase();
                          return (
                            <div
                              key={c.id}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center justify-between gap-1.5 border ${
                                isCorrect
                                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-bold'
                                  : 'border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <span className="truncate">
                                {c.id}. {c.text}
                              </span>
                              {isCorrect && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short answer key preview */}
                    {q.question_type === 'short_answer' && q.correct_answer && (
                      <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 pt-0.5">
                        Answer Key / Rubric: {q.correct_answer}
                      </p>
                    )}
                  </div>

                  {/* Edit & Delete Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(q)}
                      title="Edit Question"
                      className="min-h-[34px] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === q.id}
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Delete Question"
                      className="min-h-[34px] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
