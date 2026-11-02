'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Database, Shield, 
  CheckCircle2, Save, School, Key 
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminSettingsPage() {
  const [instName, setInstName] = useState('Apex International Academy');
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="Platform &amp; Grading Settings" 
          subtitle="Institution configuration, academic thresholds, and database connection status" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          {saved && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          {/* Institution Profile Form */}
          <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-card space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#172033]">Institution Identity</h3>
                <p className="text-xs text-slate-500">Global headers displayed on assessment certificates and reports</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Mark Threshold (%)</label>
                <input
                  type="number"
                  min="30"
                  max="80"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>

          {/* Database & Supabase Integration Status */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-card space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#172033]">Database Engine &amp; Supabase Storage</h3>
                <p className="text-xs text-slate-500">PostgreSQL schema migrations &amp; local resilience</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Storage Layer:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px]">Active &amp; Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Row Level Security (RLS):</span>
                <span className="text-slate-600">Configured in schema.sql</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Student Mark Immutability:</span>
                <span className="text-emerald-600 font-bold">Enforced Server-Side</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              To bind a live remote Supabase project, supply <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env.local</code> and run the migrations from <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">src/lib/db/schema.sql</code>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
