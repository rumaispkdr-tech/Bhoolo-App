'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, Clock, User, CheckCircle2, PlusCircle, 
  BookOpen, FileSpreadsheet, ArrowLeft, RefreshCw, Filter 
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AuditLog } from '@/lib/types';

export default function AdminWorkTrackerPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tracker');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ASSESSMENT_CREATED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Assessment Created
          </span>
        );
      case 'STUDENTS_ASSIGNED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Cohort Assigned
          </span>
        );
      case 'ASSESSMENT_SUBMITTED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Test Submitted
          </span>
        );
      case 'STUDENTS_IMPORTED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Excel Import
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {action.replace('_', ' ')}
          </span>
        );
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterAction === 'all') return true;
    return log.action === filterAction;
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="Recent Work Tracker" 
          subtitle="Real-time timeline tracking all administrator actions, student assignments, and submissions" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#172033]">Activity &amp; Work Audit Timeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological ledger of institutional activities managed by Dhdc
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none shadow-xs"
              >
                <option value="all">All Activities ({logs.length})</option>
                <option value="ASSESSMENT_CREATED">Assessments Created</option>
                <option value="STUDENTS_ASSIGNED">Cohorts Assigned</option>
                <option value="ASSESSMENT_SUBMITTED">Test Submissions</option>
              </select>

              <button
                onClick={fetchLogs}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shadow-xs transition"
                title="Refresh log"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timeline Cards */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-card p-6 divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {getActionBadge(log.action)}
                      <span className="text-xs font-bold text-[#172033]">
                        by {log.actorName} ({log.actorRole})
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      {log.details?.title && <span>Title: <strong>{log.details.title}</strong> &bull; </span>}
                      {log.details?.assessmentTitle && <span>Assessment: <strong>{log.details.assessmentTitle}</strong> &bull; </span>}
                      {log.details?.count && <span>Students: <strong>{log.details.count}</strong> &bull; </span>}
                      {log.details?.score !== undefined && (
                        <span>Score: <strong className="text-blue-600">{log.details.score}/{log.details.totalMarks} ({log.details.percentage}%)</strong> &bull; </span>
                      )}
                      {log.details?.message && <span>{log.details.message}</span>}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && !loading && (
              <div className="py-12 text-center text-slate-400 text-xs">
                No recent activities recorded yet. Actions will populate here as assessments are created and assigned.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
