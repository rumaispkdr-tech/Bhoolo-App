'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Clock, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { AssessmentResult } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

export default function StudentAssessmentHistoryPage() {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/assessments');
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setStudent(data.student);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <StudentSidebar studentName={student?.name} admissionNumber={student?.admissionNumber} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <StudentHeader title="Assessment History &amp; Records" studentName={student?.name} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card">
            <h2 className="text-lg font-bold text-[#172033]">Evaluated Test Dossier</h2>
            <p className="text-xs text-slate-500 mt-1">
              Historical record of your completed assessments, locked marks, and question reviews.
            </p>
          </div>

          <div className="space-y-4">
            {results.map((res) => (
              <div
                key={res.id}
                className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                      {res.assessment?.subject || 'Assessment'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(res.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#172033]">{res.assessment?.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span>Score: <strong>{res.marksObtained} / {res.totalMarks}</strong></span>
                    <span>&bull;</span>
                    <span>Accuracy: <strong>{res.percentage}%</strong></span>
                    <span>&bull;</span>
                    <span>Time: <strong>{formatDuration(res.timeTakenSeconds || 0)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xl font-black text-blue-600">{res.percentage}%</span>
                    <div className="text-[11px] font-bold text-emerald-600">Grade {res.grade}</div>
                  </div>

                  <Link
                    href={`/student/results/${res.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                  >
                    <span>View Scorecard</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}

            {results.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
                You have not completed any assessments yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
