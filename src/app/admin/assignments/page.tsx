'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckSquare, Search, Filter, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, User, Calendar, Plus, Unlock, ShieldAlert
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Assignment } from '@/lib/types';

export default function AssignmentManagementPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [unfreezingId, setUnfreezingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/assignments');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfreeze = async (assignmentId: string) => {
    try {
      setUnfreezingId(assignmentId);
      const res = await fetch('/api/admin/attempt/unfreeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });
      if (res.ok) {
        await fetchAssignments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUnfreezingId(null);
    }
  };

  const filtered = assignments.filter(asg => {
    const matchesStatus = statusFilter === 'all' || asg.status === statusFilter;
    const matchesSearch = !search || 
      asg.student?.name.toLowerCase().includes(search.toLowerCase()) ||
      asg.student?.admissionNumber.toLowerCase().includes(search.toLowerCase()) ||
      asg.assessment?.title.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string, asgId: string) => {
    switch (status) {
      case 'frozen':
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>FROZEN</span>
            </span>
            <button
              onClick={() => handleUnfreeze(asgId)}
              disabled={unfreezingId === asgId}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition"
              title="Click to unfreeze and allow student to resume assessment"
            >
              <Unlock className="w-3 h-3" />
              <span>{unfreezingId === asgId ? 'Unfreezing...' : 'Unfreeze'}</span>
            </button>
          </div>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            In Progress
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Assigned / Pending
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="Cohort Assignment Tracker" 
          subtitle="Real-time status tracking of all individually assigned assessments" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Status Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Total Assignments</span>
              <div className="text-xl font-bold text-[#172033] mt-1">{assignments.length}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-xs text-emerald-600 font-semibold">Completed</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {assignments.filter(a => a.status === 'completed').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-xs text-blue-600 font-semibold">In Progress</span>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {assignments.filter(a => a.status === 'in_progress').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-xs text-amber-600 font-semibold">Pending Attempt</span>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {assignments.filter(a => a.status === 'assigned').length}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name, admission no, or assessment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none shadow-xs"
              >
                <option value="all">All Statuses</option>
                <option value="assigned">Pending Attempt</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>

              <Link
                href="/admin/assessments"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Assignment</span>
              </Link>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-5">Assessment</th>
                    <th className="py-3.5 px-5">Deadline</th>
                    <th className="py-3.5 px-5">Attempts</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Latest Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{asg.student?.name || 'Unknown Student'}</div>
                        <div className="text-[11px] text-blue-600 font-mono">
                          {asg.student?.admissionNumber} &bull; Class {asg.student?.class}-{asg.student?.division}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800">{asg.assessment?.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {asg.assessment?.type.toUpperCase()} &bull; {asg.assessment?.subject}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {asg.deadline ? new Date(asg.deadline).toLocaleDateString() : 'No Deadline'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-slate-700">
                          {asg.attemptsUsed || 0} / {asg.attemptLimit}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {getStatusBadge(asg.status, asg.id)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-slate-800">
                        {asg.latestPercentage !== undefined ? (
                          <span className="text-blue-600 font-extrabold">{asg.latestPercentage}%</span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No assignments matching the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
