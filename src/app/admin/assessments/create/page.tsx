'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Copy, ArrowUp, ArrowDown, Check, 
  HelpCircle, BookOpen, Clock, AlertCircle, Save, 
  Eye, CheckCircle2, ArrowLeft, Image as ImageIcon
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AssessmentType, FeedbackMode } from '@/lib/types';

interface QuestionDraft {
  id: string;
  questionText: string;
  marks: number;
  explanation: string;
  imageUrl?: string;
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
}

function CreateAssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = (searchParams.get('type') as AssessmentType) || 'quiz';

  const [assessmentType, setAssessmentType] = useState<AssessmentType>(defaultType);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(defaultType === 'exam' ? 45 : 20);
  const [marksPerQuestion, setMarksPerQuestion] = useState(2);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState(0.5);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>(defaultType === 'quiz' ? 'instant' : 'after_deadline');
  const [isPublished, setIsPublished] = useState(true);

  // Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      id: `q-draft-${Date.now()}-1`,
      questionText: 'What is the primary function of mitochondria in eukaryotic cells?',
      marks: 2,
      explanation: 'Mitochondria generate ATP through oxidative phosphorylation.',
      correctOptionKey: 'C',
      options: [
        { key: 'A', text: 'Photosynthesis' },
        { key: 'B', text: 'Protein Synthesis' },
        { key: 'C', text: 'Cellular ATP Respiration' },
        { key: 'D', text: 'Lipid Digestion' },
      ],
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Total marks auto calculation
  const totalCalculatedMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || marksPerQuestion), 0);

  const handleAddQuestion = () => {
    const newQ: QuestionDraft = {
      id: `q-draft-${Date.now()}-${questions.length + 1}`,
      questionText: '',
      marks: marksPerQuestion,
      explanation: '',
      correctOptionKey: 'A',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
    };
    setQuestions([...questions, newQ]);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const clone: QuestionDraft = {
      ...target,
      id: `q-draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      options: target.options.map(o => ({ ...o })),
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, clone);
    setQuestions(updated);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      setError('An assessment must have at least one question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === questions.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIdx: number, optKey: 'A' | 'B' | 'C' | 'D', text: string) => {
    const updated = [...questions];
    const opt = updated[qIdx].options.find(o => o.key === optKey);
    if (opt) {
      opt.text = text;
      setQuestions(updated);
    }
  };

  const handleSaveAssessment = async () => {
    setError('');

    if (!title.trim()) {
      setError('Assessment title is required.');
      return;
    }

    if (!subject.trim()) {
      setError('Subject name is required.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        setError(`Question #${i + 1} is missing question text.`);
        return;
      }
      for (const opt of questions[i].options) {
        if (!opt.text.trim()) {
          setError(`Question #${i + 1} Option ${opt.key} is empty.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          subject,
          type: assessmentType,
          instructions,
          startDate,
          endDate,
          durationMinutes: Number(durationMinutes),
          marksPerQuestion,
          totalMarks: totalCalculatedMarks,
          negativeMarking,
          negativeMarkValue: Number(negativeMarkValue),
          maxAttempts: Number(maxAttempts),
          feedbackMode: assessmentType === 'quiz' ? feedbackMode : 'after_deadline',
          isPublished,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save assessment');
      }

      router.push(`/admin/assessments/${data.assessment.id}/assign`);
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving assessment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title={assessmentType === 'quiz' ? 'Create Interactive Quiz' : 'Create Examination'} 
          subtitle="Configure assessment guidelines, scoring parameters, and question bank" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
          <div className="flex items-center justify-between">
            <Link
              href="/admin/assessments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Assessments</span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Total Marks: <strong className="text-blue-600 text-sm font-bold">{totalCalculatedMarks}</strong>
              </span>
              <button
                onClick={handleSaveAssessment}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save & Assign Students'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle & Core Details */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-card space-y-6">
            <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => { setAssessmentType('quiz'); setFeedbackMode('instant'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  assessmentType === 'quiz' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-[#172033]'
                }`}
              >
                Quiz Mode (Instant Feedback)
              </button>
              <button
                type="button"
                onClick={() => { setAssessmentType('exam'); setFeedbackMode('after_deadline'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  assessmentType === 'exam' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-600 hover:text-[#172033]'
                }`}
              >
                Examination Mode (Strict Timer &amp; Auto-Submit)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Title</label>
                <input
                  type="text"
                  placeholder="e.g. Molecular Genetics &amp; Cellular Biology Quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Discipline</label>
                <input
                  type="text"
                  placeholder="e.g. Biology, History, Computer Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions for Students</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Select the single best option. Once submitted, answers are permanently locked."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Assessment Parameters & Negative Marking */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Marks Per Question</label>
                <input
                  type="number"
                  min="1"
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Permitted Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Negative Marking</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={negativeMarking}
                      onChange={(e) => setNegativeMarking(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  {negativeMarking && (
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={negativeMarkValue}
                      onChange={(e) => setNegativeMarkValue(Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-xs"
                      placeholder="-0.5"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Question Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#172033]">
                Questions ({questions.length})
              </h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card space-y-4 relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-extrabold text-sm text-[#172033] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span>Question #{idx + 1}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        disabled={idx === questions.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        title="Duplicate Question"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Question Prompt</label>
                    <textarea
                      rows={2}
                      placeholder="Type the question text..."
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[idx].questionText = e.target.value;
                        setQuestions(updated);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Answer Options &amp; Correct Key
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Click the radio button to designate the correct answer
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {q.options.map((opt) => {
                        const isCorrect = q.correctOptionKey === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center gap-2.5 ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-shrink-0">
                              <label className="cursor-pointer flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={isCorrect}
                                  onChange={() => {
                                    const updated = [...questions];
                                    updated[idx].correctOptionKey = opt.key;
                                    setQuestions(updated);
                                  }}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-white border border-slate-200 text-slate-700'
                                  }`}
                                >
                                  Option {opt.key}
                                </span>
                              </label>
                            </div>

                            <div className="flex-1 flex items-center gap-2 w-full">
                              <input
                                type="text"
                                placeholder={`Enter text for Option ${opt.key}...`}
                                value={opt.text}
                                onChange={(e) => handleOptionTextChange(idx, opt.key, e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                              />
                              {isCorrect && (
                                <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-700 px-2 py-1 rounded-lg bg-emerald-100 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Correct</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Marks & Explanation */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Marks for this Question</label>
                      <input
                        type="number"
                        min="1"
                        value={q.marks}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].marks = Number(e.target.value);
                          setQuestions(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Explanation (Revealed to student)</label>
                      <input
                        type="text"
                        placeholder="Detailed reasoning why the correct option is right..."
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].explanation = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 text-blue-600 text-xs font-bold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Question</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CreateAssessmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <CreateAssessmentForm />
    </Suspense>
  );
}

