'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Lock, ShieldCheck, CheckCircle2, 
  AlertCircle, Key, ArrowRight, Loader2 
} from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';

export default function StudentProfilePage() {
  const [student, setStudent] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        setStudent(json.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setMsg('Your password has been securely updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <StudentSidebar studentName={student?.name} admissionNumber={student?.admissionNumber} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <StudentHeader title="My Academic Profile" studentName={student?.name} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Profile Details Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-card flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              {student?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#172033]">{student?.name || 'Student'}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-mono text-blue-600 font-semibold">{student?.admissionNumber}</span>
                <span>&bull;</span>
                <span>Class {student?.class} (Div {student?.division})</span>
                {student?.email && (
                  <>
                    <span>&bull;</span>
                    <span>{student?.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div id="change-password" className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-card space-y-4 scroll-mt-20">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Key className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-base text-[#172033]">Update Password</h3>
                <p className="text-xs text-slate-500">Change your portal login password</p>
              </div>
            </div>

            {msg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{msg}</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Min. 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
