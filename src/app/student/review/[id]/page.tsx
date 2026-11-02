'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, XCircle, Lightbulb, 
  HelpCircle, ShieldCheck, Award 
} from 'lucide-react';
import { AssessmentResult } from '@/lib/types';

export default function AnswerReviewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchReview();
    }
  }, [id]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/results/${id}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="text-xs font-semibold text-slate-500">Loading answer review dossier...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <p className="text-xs text-slate-500 mb-4">Review records not found.</p>
        <Link href="/student/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const reviewQuestions = result.answersReview || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/student/results/${result.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Scorecard</span>
          </Link>

          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Immutable Result Snapshot</span>
          </span>
        </div>

        {/* Title Header */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Answer Review</span>
            <h2 className="text-xl font-bold text-[#172033] mt-0.5">{result.assessment?.title}</h2>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-blue-600">{result.percentage}%</span>
            <div className="text-xs text-slate-400">{result.marksObtained} / {result.totalMarks} Marks</div>
          </div>
        </div>

        {/* Questions Detailed Breakdown */}
        <div className="space-y-4">
          {reviewQuestions.map((q, idx) => {
            return (
              <div
                key={q.questionId}
                className={`bg-white p-6 sm:p-8 rounded-3xl border shadow-card space-y-4 transition ${
                  q.isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-500">Question #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    {q.isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+{q.marksAwarded} Marks</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{q.marksAwarded} Marks</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm sm:text-base font-bold text-[#172033]">
                  {q.questionText}
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {(q.options || []).map((opt) => {
                    const isStudentChoice = q.studentAnswerKey === opt.key;
                    const isCorrect = q.correctAnswerKey === opt.key;

                    let optBg = 'bg-slate-50 border-slate-200 text-slate-700';

                    if (isCorrect) {
                      optBg = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500';
                    } else if (isStudentChoice && !q.isCorrect) {
                      optBg = 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-1 ring-rose-500';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${optBg}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isStudentChoice
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isStudentChoice && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-slate-300">
                              Your Answer
                            </span>
                          )}
                          {isCorrect && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                              Correct Choice
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-slate-900">Explanation: </strong>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
