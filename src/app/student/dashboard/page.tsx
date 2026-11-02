'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  HelpCircle, BookOpen, Clock, Award, CheckCircle2, 
  ArrowRight, Calendar, Sparkles, ChevronRight, AlertCircle 
} from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Assignment, AssessmentResult } from '@/lib/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function StudentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/assessments');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const studentName = data?.student?.name || 'Student';
  const admissionNumber = data?.student?.admissionNumber || 'ADM2026001';
  const summary = data?.summary || { totalAssigned: 0, completed: 0, pending: 0, averageScore: 0 };
  const quizzes = data?.quizzes || [];
  const exams = data?.exams || [];
  const results: AssessmentResult[] = data?.results || [];

  const chartData = [
    { name: 'Quiz 1', score: 85 },
    { name: 'Quiz 2', score: 90 },
    { name: 'Midterm', score: 80 },
    { name: 'Recent', score: summary.averageScore || 95 },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <StudentSidebar studentName={studentName} admissionNumber={admissionNumber} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <StudentHeader studentName={studentName} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Welcome Banner (Inspired by Screenshot 1) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Academic Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
                Halo, {studentName} 👋
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Let's review your assigned quizzes and complete your scheduled examinations today.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-mono bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                Admission: <strong className="text-blue-600 font-semibold">{admissionNumber}</strong>
              </span>
            </div>
          </div>

          {/* Blue Summary Report Banner (Inspired by Screenshot 1) */}
          <div className="gradient-banner p-6 sm:p-8 rounded-3xl text-white shadow-elevated relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-l-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Cohort Metrics</span>
                <h3 className="text-xl font-bold tracking-tight">Summary Report</h3>
              </div>
              <div className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-xs text-xs font-semibold">
                Class {data?.student?.class || '10'}-{data?.student?.division || 'A'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="text-xs text-blue-100">Assigned Assessments</span>
                <div className="text-3xl font-black mt-1">{summary.totalAssigned}</div>
                <div className="text-[11px] text-blue-100 mt-1">Available on your desk</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="text-xs text-blue-100">Completed Assessments</span>
                <div className="text-3xl font-black mt-1">{summary.completed}</div>
                <div className="text-[11px] text-emerald-200 mt-1">Submitted &amp; Evaluated</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="text-xs text-blue-100">Average Performance</span>
                <div className="text-3xl font-black mt-1">{summary.averageScore}%</div>
                <div className="text-[11px] text-blue-100 mt-1">Cumulative score percentage</div>
              </div>
            </div>
          </div>

          {/* Score Records & GPA Card (Inspired by Screenshot 1) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-[#172033]">Score Records</h3>
                  <p className="text-xs text-slate-500">Continuous performance progression across tests</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  +5.4% Gain
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={[50, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ fill: '#2563EB', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GPA Hero Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-card flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Grade Point Average</span>
                <div className="text-5xl font-black mt-3">
                  {(summary.averageScore ? (summary.averageScore / 25).toFixed(2) : '3.90')}
                </div>
                <div className="mt-2 text-xs text-blue-100 font-medium">
                  Ranked in Top 10% in campus division
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/20 text-xs flex items-center justify-between">
                <span>Academic Status</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                  In Good Standing
                </span>
              </div>
            </div>
          </div>

          {/* Available Quizzes & Exams Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Assigned Assessments</h3>
                <p className="text-xs text-slate-500">Select an assessment to begin your attempt</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quizzes Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-sm text-[#172033]">Available Quizzes (Instant Feedback)</h4>
                </div>

                {quizzes.map((asg: Assignment) => {
                  const isCompleted = asg.status === 'completed';
                  const isFrozen = asg.status === 'frozen';
                  return (
                    <div
                      key={asg.id}
                      className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card hover:shadow-elevated transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {asg.assessment?.subject}
                          </span>
                          <span className="text-xs text-slate-400">
                            {asg.timeLimitMinutes ? `${asg.timeLimitMinutes} Mins` : 'Untimed'}
                          </span>
                        </div>
                        <h5 className="font-bold text-base text-[#172033] mb-1">{asg.assessment?.title}</h5>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                          {asg.assessment?.description || asg.assessment?.instructions}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 py-2 border-t border-b border-slate-100">
                          <span>Total Marks: <strong>{asg.assessment?.totalMarks}</strong></span>
                          <span>&bull;</span>
                          <span>Attempts Allowed: <strong>1 Only</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          isFrozen
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {isFrozen ? '🚨 Frozen by Proctor' : isCompleted ? 'Completed & Locked' : 'Ready to Take'}
                        </span>

                        {isFrozen ? (
                          <Link
                            href={`/student/attempt/${asg.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
                          >
                            <span>Locked &bull; Check Status</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : isCompleted ? (
                          <Link
                            href={`/student/results/${asg.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          >
                            <span>View Result</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={`/student/attempt/${asg.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-500/20"
                          >
                            <span>Start Quiz</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}

                {quizzes.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
                    No quizzes assigned at this time.
                  </div>
                )}
              </div>

              {/* Exams Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-sm text-[#172033]">Examinations (Timed &amp; Lockdown)</h4>
                </div>

                {exams.map((asg: Assignment) => {
                  const isCompleted = asg.status === 'completed';
                  const isFrozen = asg.status === 'frozen';
                  return (
                    <div
                      key={asg.id}
                      className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card hover:shadow-elevated transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            {asg.assessment?.subject}
                          </span>
                          <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{asg.timeLimitMinutes || 30} Mins Strictly Timed</span>
                          </span>
                        </div>
                        <h5 className="font-bold text-base text-[#172033] mb-1">{asg.assessment?.title}</h5>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                          {asg.assessment?.description || asg.assessment?.instructions}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 py-2 border-t border-b border-slate-100">
                          <span>Total Marks: <strong>{asg.assessment?.totalMarks}</strong></span>
                          <span>&bull;</span>
                          <span>Attempts Allowed: <strong>1 Only</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          isFrozen
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {isFrozen ? '🚨 Frozen by Proctor' : isCompleted ? 'Exam Submitted & Locked' : 'Examination Ready'}
                        </span>

                        {isFrozen ? (
                          <Link
                            href={`/student/attempt/${asg.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
                          >
                            <span>Locked &bull; Check Status</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : isCompleted ? (
                          <Link
                            href={`/student/results/${asg.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          >
                            <span>View Result</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={`/student/attempt/${asg.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm shadow-purple-500/20"
                          >
                            <span>Enter Exam</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}

                {exams.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
                    No active examinations scheduled.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
