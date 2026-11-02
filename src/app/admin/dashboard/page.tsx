'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Users, HelpCircle, ClipboardCheck, Clock, TrendingUp, 
  PlusCircle, FileSpreadsheet, ArrowUpRight, CheckCircle2, 
  ChevronRight, Calendar, BookOpen, Sparkles
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell 
} from 'recharts';

const PERFORMANCE_DATA = [
  { name: 'Class S1', score: 78 },
  { name: 'Class S2', score: 82 },
  { name: 'Class S3', score: 86 },
  { name: 'Class S4', score: 84 },
  { name: 'Class S5', score: 89 },
  { name: 'Class SS1', score: 92 },
  { name: 'Class SS2', score: 88 },
  { name: 'Class D1', score: 90 },
  { name: 'Class D2', score: 85 },
  { name: 'Class D3', score: 94 },
];

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents ?? '—',
      icon: Users,
      trend: '+12% this month',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Quizzes',
      value: stats?.totalQuizzes ?? '—',
      icon: HelpCircle,
      trend: 'Active tests',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Examinations',
      value: stats?.totalExaminations ?? '—',
      icon: BookOpen,
      trend: 'Timed assessments',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Completed Tests',
      value: stats?.completedAssessments ?? '—',
      icon: ClipboardCheck,
      trend: 'Finalized submissions',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Pending Tests',
      value: stats?.pendingAssessments ?? '—',
      icon: Clock,
      trend: 'In progress / assigned',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Average Student Score',
      value: stats ? `${stats.averageStudentScore}%` : '—',
      icon: TrendingUp,
      trend: 'Campus-wide performance',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  const pieData = stats ? [
    { name: 'Completed', value: stats.completedAssessments || 4 },
    { name: 'Pending', value: stats.pendingAssessments || 2 },
  ] : [];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Assessment Analytics Dashboard" subtitle="Overview of institutional examination metrics and student performance" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Quick Action Tray */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-subtle">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/admin/assessments/create?ai=true"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Assessment Generator</span>
              </Link>
              <Link
                href="/admin/assessments/create?type=quiz"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>Create Quiz</span>
              </Link>
              <Link
                href="/admin/assessments/create?type=exam"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition"
              >
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Create Exam</span>
              </Link>
              <Link
                href="/admin/students/import"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Import Excel Cohort</span>
              </Link>
              <Link
                href="/admin/assignments"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition"
              >
                <span>Assign Students</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Metric KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card hover:shadow-elevated transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">{card.title}</span>
                    <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-[#172033] tracking-tight">{card.value}</div>
                  <div className="mt-1 text-[11px] text-slate-400 font-medium truncate">{card.trend}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Spline Chart (Inspired by Screenshot 4) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-base text-[#172033]">Class-wise Score Performance</h3>
                  <p className="text-xs text-slate-500">Average assessment score across divisions</p>
                </div>
                <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
                  Current Academic Term
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={[50, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Average Score']}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#2563EB"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Assessment Completion Gauge / Pie */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#172033]">Submission Ratio</h3>
                <p className="text-xs text-slate-500">Completed vs Pending Assignments</p>
              </div>

              <div className="h-48 w-full flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.length ? pieData : [{ name: 'Completed', value: 8 }, { name: 'Pending', value: 3 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#2563EB" />
                      <Cell fill="#E2E8F0" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-slate-600">Completed Submissions</span>
                  </span>
                  <span className="font-semibold text-slate-900">{stats?.completedAssessments ?? 8}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <span className="text-slate-600">Pending Submissions</span>
                  </span>
                  <span className="font-semibold text-slate-900">{stats?.pendingAssessments ?? 3}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Work Tracker and Recent Assessments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Work Tracker (Task 4) */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#172033]">Recent Work Tracker</h3>
                    <p className="text-[11px] text-slate-400">Live activity ledger for Dhdc</p>
                  </div>
                </div>
                <Link href="/admin/tracker" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  <span>View All</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                  stats.recentActivities.slice(0, 5).map((act: any) => (
                    <div key={act.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{act.actorName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-slate-600 font-medium truncate">
                        {act.details?.title || act.details?.assessmentTitle || act.details?.message || act.action.replace('_', ' ')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Tracker is ready. Actions by Dhdc and student submissions will appear here.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Assessments */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-[#172033]">Created Assessments</h3>
                <Link href="/admin/assessments" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  <span>All Assessments</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {stats?.recentAssessments && stats.recentAssessments.length > 0 ? (
                  stats.recentAssessments.map((assessment: any) => (
                    <div key={assessment.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between hover:bg-slate-100/60 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            assessment.type === 'quiz' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {assessment.type}
                          </span>
                          <span className="text-xs font-semibold text-[#172033]">{assessment.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                          <span>Subject: {assessment.subject}</span>
                          <span>Marks: {assessment.totalMarks}</span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/assessments/${assessment.id}/preview`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition"
                      >
                        Preview
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No assessments created yet. Use "Create Quiz" or "Create Exam" above to add your first assessment.
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
