'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Eye, FileText, ArrowRight, CheckCircle2, Calendar, 
  HelpCircle, BookOpen, Clock, Sparkles 
} from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { AssessmentResult } from '@/lib/types';

export default function StudentAnswerReviewIndexPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
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
        setResults(data.results || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <StudentSidebar studentName={user?.name} admissionNumber={user?.admissionNumber} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <StudentHeader title="Answer Review &amp; Explanations" studentName={user?.name} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Question &amp; Answer Reviews</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any completed assessment to examine your chosen answers alongside correct answers and detailed explanations.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading review records...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-[#E5E7EB] shadow-card text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">No Reviews Available</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once you finish an assessment, question reviews and instructor explanations will be unlocked here.
              </p>
              <div className="pt-2">
                <Link
                  href="/student/quizzes"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
                >
                  Go to Quizzes
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-card hover:border-blue-400 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                        {r.assessment?.type}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {r.percentage}% &bull; Grade {r.grade}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#172033] line-clamp-1">
                      {r.assessment?.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Subject: {r.assessment?.subject} &bull; {new Date(r.generatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      {r.correctCount} Correct &bull; {r.incorrectCount} Wrong
                    </div>
                    <Link
                      href={`/student/review/${r.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Answers</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
