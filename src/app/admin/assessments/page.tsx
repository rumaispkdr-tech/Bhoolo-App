'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, Plus, HelpCircle, BookOpen, 
  Users, Eye, Trash2, ArrowUpRight, Search, Sparkles 
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Assessment } from '@/lib/types';

export default function AllAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'exam'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/assessments');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment? All associated assignments will also be removed.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/assessments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAssessments(assessments.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = assessments.filter(a => {
    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesSearch = !search || 
      a.title.toLowerCase().includes(search.toLowerCase()) || 
      a.subject.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="All Assessments" 
          subtitle="Directory of created quizzes, examinations, and individual cohort assignments" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterType === 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'
                  }`}
                >
                  All ({assessments.length})
                </button>
                <button
                  onClick={() => setFilterType('quiz')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterType === 'quiz' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'
                  }`}
                >
                  Quizzes
                </button>
                <button
                  onClick={() => setFilterType('exam')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterType === 'exam' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'
                  }`}
                >
                  Exams
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/assessments/create?ai=true"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200 text-xs font-bold transition shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Generator</span>
              </Link>
              <Link
                href="/admin/assessments/create?type=quiz"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Quiz</span>
              </Link>
              <Link
                href="/admin/assessments/create?type=exam"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Exam</span>
              </Link>
            </div>
          </div>

          {/* Assessment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card hover:shadow-elevated transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      item.type === 'quiz' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{item.subject}</span>
                  </div>

                  <h3 className="font-bold text-base text-[#172033] mb-2 leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {item.description || item.instructions || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-slate-50 border border-slate-100 text-center mb-5">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Questions</span>
                      <span className="text-xs font-bold text-slate-800">{item.questions?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                      <span className="text-xs font-bold text-slate-800">{item.durationMinutes ? `${item.durationMinutes}m` : 'Untimed'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Marks</span>
                      <span className="text-xs font-bold text-blue-600">{item.totalMarks}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-medium">
                    <span className="text-blue-600 font-bold">{item.assignedCount ?? 0}</span> Assigned &bull;{' '}
                    <span className="text-emerald-600 font-bold">{item.completedCount ?? 0}</span> Done
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/assessments/${item.id}/assign`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                      title="Assign Students"
                    >
                      Assign
                    </Link>
                    <Link
                      href={`/admin/assessments/${item.id}/preview`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
                No assessments found in this view.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
