'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Award, ArrowRight, Clock, CheckCircle2, XCircle, 
  Sparkles, FileText, Calendar, BookOpen 
} from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { AssessmentResult } from '@/lib/types';
import { calculateGrade, formatDuration } from '@/lib/utils';

export default function LatestResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [latestResult, setLatestResult] = useState<AssessmentResult | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchLatestResult();
  }, []);

  const fetchLatestResult = async () => {
    try {
      setLoading(true);
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      const res = await fetch('/api/student/assessments');
      if (res.ok) {
        const data = await res.json();
        const results: AssessmentResult[] = data.results || [];
        if (results.length > 0) {
          // Most recent result
          const sorted = [...results].sort(
            (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
          );
          setLatestResult(sorted[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const gradeInfo = latestResult ? calculateGrade(Number(latestResult.percentage || 0)) : null;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <StudentSidebar studentName={user?.name} admissionNumber={user?.admissionNumber} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <StudentHeader title="Latest Assessment Result" studentName={user?.name} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Retrieving latest assessment scorecard...</p>
            </div>
          ) : !latestResult ? (
            <div className="bg-white rounded-3xl p-10 border border-[#E5E7EB] shadow-card text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#172033]">No Assessment Results Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not completed any quizzes or examinations yet. Once you submit an assessment, your latest scorecard will appear here.
              </p>
              <div className="pt-2">
                <Link
                  href="/student/quizzes"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                >
                  <span>Explore Available Quizzes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scorecard Hero */}
              <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] shadow-card text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  Most Recent Scorecard
                </span>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-3 mb-1">
                  {latestResult.assessment?.title}
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  {latestResult.assessment?.subject} &bull; Submitted on {new Date(latestResult.generatedAt).toLocaleDateString()}
                </p>

                {/* Score Gauge */}
                <div className="w-36 h-36 mx-auto rounded-full bg-slate-50 border-4 border-blue-600 flex flex-col items-center justify-center shadow-inner my-4">
                  <span className="text-3xl font-black text-[#172033] tracking-tight">
                    {latestResult.percentage}%
                  </span>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Grade {latestResult.grade}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <Link
                    href={`/student/results/${latestResult.id}`}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                  >
                    <span>View Full Scorecard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/student/review/${latestResult.id}`}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Review Explanations</span>
                  </Link>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">Score</span>
                  <div className="text-xl font-black text-blue-600 mt-1">
                    {latestResult.marksObtained} / {latestResult.totalMarks}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs text-center">
                  <span className="text-[11px] text-emerald-600 font-semibold block uppercase tracking-wider">Correct</span>
                  <div className="text-xl font-black text-emerald-600 mt-1">
                    {latestResult.correctCount} Qs
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs text-center">
                  <span className="text-[11px] text-rose-600 font-semibold block uppercase tracking-wider">Incorrect</span>
                  <div className="text-xl font-black text-rose-600 mt-1">
                    {latestResult.incorrectCount} Qs
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">Duration</span>
                  <div className="text-xl font-black text-slate-700 mt-1">
                    {formatDuration(latestResult.timeTakenSeconds || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
