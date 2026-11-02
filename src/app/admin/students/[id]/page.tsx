'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  GraduationCap, Mail, Phone, Calendar, ArrowLeft, 
  CheckCircle2, Clock, Award, BookOpen, AlertCircle, ChevronRight, 
  BarChart2, Download, Printer, FileSpreadsheet, FileText, Check, Shield
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Student, Assignment, AssessmentResult } from '@/lib/types';
import { calculateGrade } from '@/lib/utils';

export default function StudentProfileAdminPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      loadStudentProfile();
    }
  }, [studentId]);

  const loadStudentProfile = async () => {
    try {
      setLoading(true);
      // Fetch students to find this one
      const res = await fetch(`/api/admin/students`);
      if (res.ok) {
        const data = await res.json();
        const found = data.students?.find((s: Student) => s.id === studentId);
        setStudent(found || null);
      }

      // Fetch assignments & reports
      const repRes = await fetch(`/api/admin/reports?studentId=${studentId}`);
      if (repRes.ok) {
        const repData = await repRes.json();
        setResults(repData.results || []);
      }

      const asgRes = await fetch(`/api/admin/assignments`);
      if (asgRes.ok) {
        const asgData = await asgRes.json();
        const studentAsg = (asgData.assignments || []).filter((a: any) => a.studentId === studentId);
        setAssignments(studentAsg);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (!student) return;
    const headers = ['Assessment Title', 'Subject', 'Type', 'Total Marks', 'Marks Obtained', 'Percentage', 'Grade', 'Status', 'Date'];
    const rows = assignments.map(asg => {
      const res = results.find(r => r.assessmentId === asg.assessmentId);
      return [
        `"${asg.assessment?.title || 'Assessment'}"`,
        `"${asg.assessment?.subject || ''}"`,
        `"${asg.assessment?.type || ''}"`,
        asg.assessment?.totalMarks || 0,
        res?.marksObtained || 0,
        res ? `${res.percentage}%` : 'N/A',
        res?.grade || 'N/A',
        asg.status,
        res ? new Date(res.generatedAt).toLocaleDateString() : 'N/A',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${student.admissionNumber}_${student.name.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <AdminSidebar />
        <div className="flex-1 p-8 text-center text-slate-500">Loading student dossier...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <AdminSidebar />
        <div className="flex-1 p-8 text-center text-slate-500">Student not found.</div>
      </div>
    );
  }

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const pendingCount = assignments.filter(a => a.status === 'assigned' || a.status === 'in_progress').length;
  const averagePercentage = results.length > 0 
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length * 10) / 10 
    : 0;

  const gradeInfo = calculateGrade(averagePercentage);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="Student Academic Profile" 
          subtitle={`Dossier for ${student.name} (${student.admissionNumber})`} 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Students</span>
          </Link>

          {/* Student Hero Card (Inspired by Screenshot 1) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                {student.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-bold text-[#172033]">{student.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Student
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                  <span className="font-mono text-blue-600 font-semibold">{student.admissionNumber}</span>
                  <span>&bull;</span>
                  <span>Class {student.class} (Div {student.division})</span>
                  {student.contactNumber && (
                    <>
                      <span>&bull;</span>
                      <span>{student.contactNumber}</span>
                    </>
                  )}
                  {student.email && (
                    <>
                      <span>&bull;</span>
                      <span>{student.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* GPA Score Badge */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Average</span>
                <div className="text-2xl font-extrabold text-[#172033]">{averagePercentage}%</div>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-lg ${gradeInfo.color} shadow-xs`}>
                {gradeInfo.grade}
              </div>
            </div>
          </div>

          {/* Stat Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Assigned Assessments</span>
              <div className="text-2xl font-extrabold text-[#172033] mt-1">{assignments.length}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-emerald-600 font-medium">Completed</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{completedCount}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-amber-600 font-medium">Pending</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-blue-600 font-medium">Academic Rating</span>
              <div className="text-sm font-bold text-blue-600 mt-2">{gradeInfo.label}</div>
            </div>
          </div>

          {/* Assessment-wise History & Downloadable Report Section (Requirement 5) */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Official Academic Record</span>
                <h3 className="text-lg font-bold text-[#172033]">Student Academic Performance Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assessment results, marks scored, and certified grading breakdown
                </p>
              </div>

              {/* Download & Export Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-500/20 active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download / Print PDF Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Official Report Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Assessment Title</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Max Marks</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((asg) => {
                    const result = results.find(r => r.assessmentId === asg.assessmentId);
                    const isCompleted = asg.status === 'completed';

                    return (
                      <tr key={asg.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {asg.assessment?.title || 'Assessment'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {asg.assessment?.subject}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            asg.assessment?.type === 'quiz' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {asg.assessment?.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {asg.assessment?.totalMarks || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          {result ? result.marksObtained : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-slate-800">
                          {result ? `${result.percentage}%` : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          {result ? (
                            <span className="font-bold text-emerald-700">{result.grade}</span>
                          ) : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              {asg.status === 'in_progress' ? 'In Progress' : 'Pending'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {result ? (
                            <Link
                              href={`/student/results/${result.id}`}
                              className="text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                            >
                              Scorecard &rarr;
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Awaiting</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                        No assessments recorded for this student yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Report Summary & Dhdc Certification Footer */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Certified by <strong>Dhdc Administrator</strong> &bull; Bhoolo Platform</span>
              </div>
              <div>
                Report generated on: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
