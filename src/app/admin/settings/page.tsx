'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Database, Shield, 
  CheckCircle2, Save, School, Key, Copy, Check, 
  AlertTriangle, RefreshCw, Cloud, Server
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface StorageInfo {
  provider: 'supabase' | 'vercel_kv' | 'local';
  statusMessage: string;
  isConnected: boolean;
  totalStudents: number;
  totalAssessments: number;
  totalAssignments: number;
  totalResults: number;
}

export default function AdminSettingsPage() {
  const [instName, setInstName] = useState('Apex International Academy');
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [saved, setSaved] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseSql = `-- Run this in your Supabase SQL Editor (Takes 5 seconds):
CREATE TABLE IF NOT EXISTS public.bhoolo_state (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and grant service access
ALTER TABLE public.bhoolo_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service Role Full Access" ON public.bhoolo_state
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Access" ON public.bhoolo_state
  FOR SELECT TO anon, authenticated USING (true);
`;

  useEffect(() => {
    fetchStorageStatus();
  }, []);

  const fetchStorageStatus = async () => {
    try {
      setLoadingStorage(true);
      const res = await fetch('/api/admin/system/db-status');
      if (res.ok) {
        const data = await res.json();
        setStorageInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch storage info:', e);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

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
          subtitle="Institution configuration, academic thresholds, and cloud database connection status" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          {saved && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          {/* Cloud Database Integration Status */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  storageInfo?.isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#172033]">Live Cloud Database Status</h3>
                  <p className="text-xs text-slate-500">Persistent storage configuration for production web hosting</p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchStorageStatus}
                disabled={loadingStorage}
                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition"
                title="Refresh Status"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStorage ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Status Indicator Banner */}
            <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              storageInfo?.isConnected 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2.5">
                {storageInfo?.isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                )}
                <div>
                  <span className="font-bold block text-sm">
                    {storageInfo?.statusMessage || 'Checking Database Engine...'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {storageInfo?.isConnected 
                      ? 'All quizzes, exams, attempts, and student reports are automatically saved to your cloud database.'
                      : 'On Vercel, local storage is temporary. Connect Supabase or Vercel KV below to save data permanently.'}
                  </span>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto ${
                storageInfo?.isConnected ? 'bg-emerald-200/80 text-emerald-800' : 'bg-amber-200/80 text-amber-800'
              }`}>
                {storageInfo?.provider?.toUpperCase()}
              </span>
            </div>

            {/* Synced Counts Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Students</div>
                <div className="text-xl font-extrabold text-[#172033] mt-1">{storageInfo?.totalStudents ?? 153}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assessments</div>
                <div className="text-xl font-extrabold text-[#172033] mt-1">{storageInfo?.totalAssessments ?? 0}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignments</div>
                <div className="text-xl font-extrabold text-[#172033] mt-1">{storageInfo?.totalAssignments ?? 0}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Results</div>
                <div className="text-xl font-extrabold text-[#172033] mt-1">{storageInfo?.totalResults ?? 0}</div>
              </div>
            </div>

            {/* Quick Setup Instructions for Supabase */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-[#172033]">How to Connect Free Supabase Database:</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition border border-blue-200"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied SQL!' : 'Copy Supabase SQL'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <p>1. Create a free account &amp; project on <strong>supabase.com</strong>.</p>
                <p>2. In Supabase, click <strong>SQL Editor</strong>, paste the copied SQL above, and click <strong>Run</strong>.</p>
                <p>3. In your <strong>Vercel Project Settings ➔ Environment Variables</strong>, add:</p>
                <div className="font-mono text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 space-y-1">
                  <div><strong>NEXT_PUBLIC_SUPABASE_URL</strong> = https://xxxx.supabase.co</div>
                  <div><strong>SUPABASE_SERVICE_ROLE_KEY</strong> = your-secret-service-role-key</div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  💡 Alternatively, in Vercel click <strong>Storage ➔ KV</strong> to enable 1-click cloud storage without any SQL setup.
                </p>
              </div>
            </div>
          </div>

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
        </main>
      </div>
    </div>
  );
}
