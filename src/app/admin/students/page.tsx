'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Filter, Plus, FileSpreadsheet, 
  ChevronRight, ArrowUpDown, CheckCircle2, UserCheck, X
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Student } from '@/lib/types';

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState('all');

  // Modal State for adding student
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmission, setNewAdmission] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('10');
  const [newDiv, setNewDiv] = useState('A');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('StudentPass123!');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedDivision]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedClass !== 'all') params.append('class', selectedClass);
      if (selectedDivision !== 'all') params.append('division', selectedDivision);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionNumber: newAdmission,
          name: newName,
          class: newClass,
          division: newDiv,
          contactNumber: newContact,
          email: newEmail,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student');
      }

      setShowAddModal(false);
      setNewAdmission('');
      setNewName('');
      fetchStudents();
    } catch (err: any) {
      setAddError(err.message || 'Error creating student');
    } finally {
      setAddLoading(false);
    }
  };

  const availableClasses = Array.from(new Set(students.map(s => s.class))).filter(Boolean).sort();
  const availableDivisions = Array.from(new Set(students.map(s => s.division))).filter(Boolean).sort();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="Student Cohort Management" 
          subtitle="Directory of enrolled students, credential mapping, and dedicated academic profiles" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Bar Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or admission number..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
              />
            </form>

            <div className="flex items-center gap-2.5">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none shadow-xs"
              >
                <option value="all">All Classes ({availableClasses.length})</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>

              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none shadow-xs"
              >
                <option value="all">All Divisions / Chest No</option>
                {availableDivisions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <Link
                href="/admin/students/import"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Excel Import</span>
              </Link>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Students Data Table */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-5">Student Name</th>
                    <th className="py-3.5 px-5">Admission No</th>
                    <th className="py-3.5 px-5">Class &amp; Div</th>
                    <th className="py-3.5 px-5">Contact Details</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center flex-shrink-0">
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                              {st.name}
                            </span>
                            <div className="text-[11px] text-slate-400">{st.email || 'No email recorded'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-semibold text-blue-600">
                        {st.admissionNumber}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700 text-[11px]">
                          Class {st.class}-{st.division}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {st.contactNumber || '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/admin/students/${st.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                        >
                          <span>View Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No students matching the criteria were found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Student Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold text-[#172033] mb-1">Add Individual Student</h3>
                <p className="text-xs text-slate-500 mb-5">Create a single student record with immediate portal access.</p>

                {addError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {addError}
                  </div>
                )}

                <form onSubmit={handleAddStudent} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ADM2026099"
                      value={newAdmission}
                      onChange={(e) => setNewAdmission(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Student Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Robert Pattinson"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
                      <input
                        type="text"
                        required
                        value={newClass}
                        onChange={(e) => setNewClass(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Division</label>
                      <input
                        type="text"
                        required
                        value={newDiv}
                        onChange={(e) => setNewDiv(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                    >
                      {addLoading ? 'Saving...' : 'Create Student'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
