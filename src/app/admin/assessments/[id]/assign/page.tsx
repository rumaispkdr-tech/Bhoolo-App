'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Users, Search, Filter, CheckSquare, Square, 
  Calendar, Clock, ShieldCheck, ArrowRight, ArrowLeft, 
  AlertCircle, CheckCircle2, UserCheck, Loader2
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Assessment, Student } from '@/lib/types';

export default function AssignStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState('all');

  // Assignment Settings
  const [deadline, setDeadline] = useState('2026-11-30T23:59');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [attemptLimit, setAttemptLimit] = useState(1);

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [assessmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch assessment details
      const aRes = await fetch(`/api/admin/assessments/${assessmentId}`);
      if (aRes.ok) {
        const aData = await aRes.json();
        setAssessment(aData.assessment);
        if (aData.assessment.durationMinutes) {
          setTimeLimitMinutes(aData.assessment.durationMinutes);
        }
      }

      // Fetch all students
      const sRes = await fetch(`/api/admin/students`);
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(sData.students || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = Array.from(new Set(students.map(s => s.class))).filter(Boolean).sort();
  const availableDivisions = Array.from(new Set(students.map(s => s.division))).filter(Boolean).sort();

  // Filtered student list
  const filteredStudents = students.filter(st => {
    const matchesQuery = !searchQuery || 
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || st.class === selectedClass;
    const matchesDiv = selectedDivision === 'all' || st.division === selectedDivision;
    return matchesQuery && matchesClass && matchesDiv;
  });

  const toggleSelectStudent = (id: string) => {
    const updated = new Set(selectedStudentIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedStudentIds(updated);
  };

  const handleSelectAllFiltered = () => {
    const updated = new Set(selectedStudentIds);
    filteredStudents.forEach(st => updated.add(st.id));
    setSelectedStudentIds(updated);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  const handleConfirmAssignment = async () => {
    setError('');
    setSuccessMsg('');

    if (selectedStudentIds.size === 0) {
      setError('Please select at least one student to assign.');
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          studentIds: Array.from(selectedStudentIds),
          deadline,
          timeLimitMinutes,
          attemptLimit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete student assignment');
      }

      setSuccessMsg(`Successfully assigned ${data.count} student(s) to this assessment!`);
      setTimeout(() => {
        router.push('/admin/assignments');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error assigning students');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="Individual Student Assignment" 
          subtitle="Assign quizzes and exams with targeted individual student selection" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          <Link
            href="/admin/assessments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assessments</span>
          </Link>

          {/* Assessment Target Card */}
          {assessment && (
            <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    assessment.type === 'quiz' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {assessment.type}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Subject: {assessment.subject}</span>
                </div>
                <h2 className="text-xl font-bold text-[#172033]">{assessment.title}</h2>
                <div className="text-xs text-slate-500 mt-1">
                  {assessment.questions?.length || 0} Questions &bull; Total Marks: {assessment.totalMarks}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Selected Students</span>
                  <span className="text-xl font-black text-blue-600">{selectedStudentIds.size}</span>
                </div>
                <button
                  onClick={handleConfirmAssignment}
                  disabled={assigning || selectedStudentIds.size === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm &amp; Publish Assignment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Assignment Settings Bar */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Submission Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time Limit (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permitted Attempts
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={attemptLimit}
                onChange={(e) => setAttemptLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Student Selector Interface */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-card p-6 space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="all">All Classes ({availableClasses.length})</option>
                  {availableClasses.map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>

                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="all">All Divisions / Chest No</option>
                  {availableDivisions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                >
                  Select All Filtered
                </button>

                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Students Table with Checkboxes */}
            <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Admission No</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4">Division</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st) => {
                    const isSelected = selectedStudentIds.has(st.id);
                    return (
                      <tr
                        key={st.id}
                        onClick={() => toggleSelectStudent(st.id)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(st.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-800">
                          {st.name}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-blue-600">
                          {st.admissionNumber}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">Class {st.class}</td>
                        <td className="py-2.5 px-4 text-slate-600">Div {st.division}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
