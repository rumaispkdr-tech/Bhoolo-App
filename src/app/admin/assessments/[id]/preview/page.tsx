'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, HelpCircle, Eye } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Assessment } from '@/lib/types';

export default function AssessmentPreviewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (id) {
      fetchAssessment();
    }
  }, [id]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`/api/admin/assessments/${id}`);
      if (!res.ok) {
        throw new Error('Assessment preview data is not available.');
      }
      const data = await res.json();
      setAssessment(data.assessment);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error loading preview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <AdminSidebar />
        <div className="flex-1 p-8 text-center text-slate-500 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-semibold">Loading assessment preview...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !assessment) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <AdminSidebar />
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card max-w-md w-full">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="font-bold text-base text-[#172033] mb-1">Assessment Preview</h3>
            <p className="text-xs text-slate-500 mb-5">{errorMsg || 'Assessment not found.'}</p>
            <Link
              href="/admin/assessments"
              className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Back to Assessments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const questions = assessment.questions || [];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="Assessment Preview" 
          subtitle="Educator preview with answer keys and detailed explanations" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/admin/assessments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Assessments</span>
            </Link>

            <Link
              href={`/admin/assessments/${assessment.id}/assign`}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition"
            >
              Assign Students to this Assessment
            </Link>
          </div>

          {/* Assessment Overview Banner */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                assessment.type === 'quiz' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {assessment.type || 'Assessment'}
              </span>
              <span className="text-xs font-semibold text-slate-400">{assessment.subject || 'General'}</span>
            </div>

            <h2 className="text-2xl font-bold text-[#172033] mb-2">{assessment.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">{assessment.description || assessment.instructions}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Total Questions</span>
                <span className="font-bold text-slate-800">{questions.length}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Marks</span>
                <span className="font-bold text-blue-600">{assessment.totalMarks || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Duration</span>
                <span className="font-bold text-slate-800">{assessment.durationMinutes ? `${assessment.durationMinutes} Mins` : 'Untimed'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Feedback Mode</span>
                <span className="font-bold text-slate-800 capitalize">
                  {assessment.feedbackMode ? assessment.feedbackMode.replace('_', ' ') : 'Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Question Bank</h3>

            {questions.map((q, idx) => (
              <div key={q.id || idx} className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Question #{idx + 1}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                    {q.marks || 1} Mark{(q.marks || 1) > 1 ? 's' : ''}
                  </span>
                </div>

                <p className="text-sm font-semibold text-[#172033] leading-relaxed">{q.questionText}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(q.options || []).map((opt) => {
                    const isCorrect = q.correctOptionKey === opt.key;
                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Explanation: </strong>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
