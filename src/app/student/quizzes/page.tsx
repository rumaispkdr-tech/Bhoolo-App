'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowRight, Clock, Award } from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Assignment } from '@/lib/types';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Assignment[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/assessments');
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
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
        <StudentHeader title="My Assigned Quizzes" studentName={student?.name} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#172033]">Interactive Subject Quizzes</h2>
              <p className="text-xs text-slate-500 mt-1">
                Quizzes feature immediate response evaluation with instant green/red answer keys and rationale.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
              {quizzes.length} Quizzes Assigned
            </span>
          </div>

          <div className="space-y-4">
            {quizzes.map((asg) => {
              const isCompleted = asg.status === 'completed';
              const isFrozen = asg.status === 'frozen';
              return (
                <div
                  key={asg.id}
                  className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                        {asg.assessment?.subject}
                      </span>
                      <h3 className="font-bold text-base text-[#172033]">{asg.assessment?.title}</h3>
                      {isFrozen && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-300">
                          🚨 Frozen
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 max-w-xl">{asg.assessment?.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>Total Marks: <strong className="text-slate-700">{asg.assessment?.totalMarks}</strong></span>
                      <span>&bull;</span>
                      <span>Duration: <strong className="text-slate-700">{asg.timeLimitMinutes || 20} Mins</strong></span>
                      <span>&bull;</span>
                      <span>Attempts: <strong className="text-slate-700">1 Only</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isFrozen ? (
                      <Link
                        href={`/student/attempt/${asg.id}`}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm"
                      >
                        Locked &bull; Check Status
                      </Link>
                    ) : isCompleted ? (
                      <Link
                        href={`/student/results/${asg.id}`}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                      >
                        View Scorecard
                      </Link>
                    ) : (
                      <Link
                        href={`/student/attempt/${asg.id}`}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm shadow-blue-500/20"
                      >
                        <span>Start Quiz</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {quizzes.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
                You currently have no quizzes assigned.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
