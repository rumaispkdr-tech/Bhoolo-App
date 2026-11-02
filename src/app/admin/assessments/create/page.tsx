'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Copy, ArrowUp, ArrowDown, Check, 
  HelpCircle, BookOpen, Clock, AlertCircle, Save, 
  Eye, CheckCircle2, ArrowLeft, Image as ImageIcon,
  Sparkles, UploadCloud, FileText, Loader2, Wand2, 
  FileCheck, X, File, ChevronDown, ChevronUp, RefreshCw
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
  const initialAiOpen = searchParams.get('ai') === 'true';

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

  // AI Assistant States
  const [isAiOpen, setIsAiOpen] = useState<boolean>(initialAiOpen || true);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiPromptText, setAiPromptText] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(5);
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Medium');
  const [aiAppendMode, setAiAppendMode] = useState<'replace' | 'append'>('replace');
  const [aiAutoFillMetadata, setAiAutoFillMetadata] = useState<boolean>(true);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiProgressMessage, setAiProgressMessage] = useState<string>('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAiFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAiFile(e.target.files[0]);
    }
  };

  const handleAiGenerate = async () => {
    setError('');
    setAiSuccessMessage('');

    if (!aiFile && !aiPromptText.trim()) {
      setError('Please upload a PDF / document or enter notes/topic text for Gemini AI.');
      return;
    }

    setAiGenerating(true);
    setAiProgressMessage(aiFile ? `Ingesting ${aiFile.name} & querying Gemini AI...` : 'Analyzing text & generating with Gemini AI...');

    try {
      const formData = new FormData();
      if (aiFile) {
        formData.append('file', aiFile);
      }
      formData.append('promptText', aiPromptText);
      formData.append('questionCount', String(aiQuestionCount));
      formData.append('difficulty', aiDifficulty);
      formData.append('assessmentType', assessmentType);
      formData.append('marksPerQuestion', String(marksPerQuestion));

      const res = await fetch('/api/admin/ai/generate-questions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate questions with AI.');
      }

      if (aiAutoFillMetadata) {
        if (data.title && !title) setTitle(data.title);
        if (data.subject && !subject) setSubject(data.subject);
        if (data.description && !description) setDescription(data.description);
      }

      if (aiAppendMode === 'replace') {
        setQuestions(data.questions);
      } else {
        setQuestions(prev => [...prev, ...data.questions]);
      }

      setAiSuccessMessage(`Generated ${data.questions.length} questions from ${aiFile ? aiFile.name : 'notes'} successfully!`);
    } catch (err: any) {
      setError(err.message || 'AI generation failed. Please verify the document and try again.');
    } finally {
      setAiGenerating(false);
      setAiProgressMessage('');
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
          subtitle="Configure assessment guidelines, scoring parameters, and question bank with Gemini AI assistance" 
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

          {/* AI Question & Exam Generator Section */}
          <div className="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 rounded-3xl border border-blue-200/80 p-6 sm:p-7 shadow-card relative overflow-hidden transition-all duration-300">
            {/* Header / Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-[#172033] tracking-tight">
                      Gemini AI Question Generator
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      Gemini 3.5 Flash
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload a syllabus PDF or document, or paste lecture notes to auto-generate multiple-choice questions with full options and explanations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiOpen(!isAiOpen)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition flex items-center gap-1.5 text-xs font-semibold"
              >
                <span>{isAiOpen ? 'Collapse' : 'Expand'}</span>
                {isAiOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {isAiOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="pt-5 space-y-5"
                >
                  {/* File Upload Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1.5 flex items-center justify-between">
                        <span>Upload Source Document (PDF or Text)</span>
                        <span className="text-[10px] text-slate-400 font-normal">.pdf, .txt, .md, .csv, .doc</span>
                      </label>
                      
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] ${
                          aiFile 
                            ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70' 
                            : 'border-blue-200 bg-white/70 hover:bg-blue-50/40 hover:border-blue-400'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.txt,.md,.csv,.doc,.docx"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        
                        {aiFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{aiFile.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {(aiFile.size / 1024).toFixed(1)} KB • Click to change file
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAiFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <X className="w-3 h-3" />
                              <span>Remove file</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                Click to browse or drag &amp; drop document here
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Automatically parsed and ingested by Gemini AI
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1.5 flex items-center justify-between">
                        <span>Or Paste Chapter Notes / Topic Prompt</span>
                        <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Paste study material, textbook excerpt, chapter outline, or instructions (e.g. 'Generate questions focusing on Krebs Cycle and enzyme kinetics')..."
                        value={aiPromptText}
                        onChange={(e) => setAiPromptText(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* AI Generation Parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-blue-100/70">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Questions Count
                      </label>
                      <select
                        value={aiQuestionCount}
                        onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                        <option value={20}>20 Questions</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="Easy">Easy (Foundational)</option>
                        <option value="Medium">Medium (Standard)</option>
                        <option value="Hard">Hard (Analytical)</option>
                        <option value="Mixed">Mixed (Comprehensive)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Insert Mode
                      </label>
                      <select
                        value={aiAppendMode}
                        onChange={(e) => setAiAppendMode(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="replace">Replace Current Draft</option>
                        <option value="append">Append to Questions</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={aiAutoFillMetadata}
                          onChange={(e) => setAiAutoFillMetadata(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[11px]">Auto-fill Title &amp; Subject</span>
                      </label>
                    </div>
                  </div>

                  {/* AI Status / Progress & Action Trigger */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-xs">
                      {aiGenerating && (
                        <div className="flex items-center gap-2 text-blue-600 font-semibold animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{aiProgressMessage || 'Gemini AI generating questions...'}</span>
                        </div>
                      )}
                      {aiSuccessMessage && !aiGenerating && (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{aiSuccessMessage}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={aiGenerating || (!aiFile && !aiPromptText.trim())}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-50"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Questions...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>Generate Questions with Gemini AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <span>Questions Bank ({questions.length})</span>
                {aiSuccessMessage && (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    AI Ingested
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Use Gemini AI</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question Manually</span>
                </button>
              </div>
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
                        Select the radio button to designate the correct answer
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
                <span>Add Another Question Manually</span>
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
