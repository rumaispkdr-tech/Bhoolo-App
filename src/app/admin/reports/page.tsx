'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Filter, Search, FileSpreadsheet, 
  FileText, Award, TrendingUp, CheckCircle2, XCircle 
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AssessmentResult } from '@/lib/types';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReportsAnalyticsPage() {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [gradeDistribution, setGradeDistribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, [selectedClass]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.append('class', selectedClass);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setMetrics(data.metrics);
        setGradeDistribution(data.gradeDistribution);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(r => {
    const matchesSearch = !searchQuery || 
      r.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student?.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.assessment?.title.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesScore = true;
    if (scoreFilter === '90plus') matchesScore = r.percentage >= 90;
    else if (scoreFilter === '75to90') matchesScore = r.percentage >= 75 && r.percentage < 90;
    else if (scoreFilter === '50to75') matchesScore = r.percentage >= 50 && r.percentage < 75;
    else if (scoreFilter === 'below50') matchesScore = r.percentage < 50;

    return matchesSearch && matchesScore;
  });

  // Export to Excel (.xlsx) using ExcelJS
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Assessment Results');

    sheet.columns = [
      { header: 'Admission No', key: 'admissionNumber', width: 18 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Class', key: 'class', width: 12 },
      { header: 'Assessment', key: 'assessment', width: 30 },
      { header: 'Marks Obtained', key: 'marksObtained', width: 15 },
      { header: 'Total Marks', key: 'totalMarks', width: 14 },
      { header: 'Percentage', key: 'percentage', width: 14 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'Passed', key: 'passed', width: 12 },
      { header: 'Date', key: 'date', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

    filteredResults.forEach(r => {
      sheet.addRow({
        admissionNumber: r.student?.admissionNumber || '',
        name: r.student?.name || '',
        class: `${r.student?.class || ''}-${r.student?.division || ''}`,
        assessment: r.assessment?.title || '',
        marksObtained: r.marksObtained,
        totalMarks: r.totalMarks,
        percentage: `${r.percentage}%`,
        grade: r.grade,
        passed: r.passed ? 'Yes' : 'No',
        date: new Date(r.generatedAt).toLocaleDateString(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Assessment_Reports_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to PDF using jsPDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Assessment & Examination Performance Report', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${filteredResults.length}`, 14, 25);

    const tableData = filteredResults.map(r => [
      r.student?.admissionNumber || '',
      r.student?.name || '',
      `Class ${r.student?.class || ''}-${r.student?.division || ''}`,
      r.assessment?.title || '',
      `${r.marksObtained}/${r.totalMarks}`,
      `${r.percentage}%`,
      r.grade,
      r.passed ? 'Pass' : 'Fail',
    ]);

    (doc as any).autoTable({
      head: [['Adm No', 'Student Name', 'Cohort', 'Assessment', 'Score', 'Percentage', 'Grade', 'Result']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 },
    });

    doc.save(`Assessment_Report_${Date.now()}.pdf`);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Admission Number,Name,Class,Division,Assessment,Marks Obtained,Total Marks,Percentage,Grade,Passed,Date'];
    const rows = filteredResults.map(r => [
      `"${r.student?.admissionNumber || ''}"`,
      `"${r.student?.name || ''}"`,
      `"${r.student?.class || ''}"`,
      `"${r.student?.division || ''}"`,
      `"${r.assessment?.title || ''}"`,
      r.marksObtained,
      r.totalMarks,
      `${r.percentage}%`,
      r.grade,
      r.passed ? 'Pass' : 'Fail',
      `"${new Date(r.generatedAt).toISOString()}"`,
    ].join(','));

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Results_Export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="Results &amp; Analytics Reports" 
          subtitle="Comprehensive assessment metrics, class comparisons, and multi-format exports" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Metrics Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Evaluated Attempts</span>
              <div className="text-2xl font-extrabold text-[#172033] mt-1">{metrics?.totalResults ?? 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-xs text-emerald-600 font-medium">Highest Score</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics?.highestScore ?? 0}%</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs">
              <span className="text-xs text-rose-600 font-medium">Lowest Score</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">{metrics?.lowestScore ?? 0}%</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-xs text-blue-600 font-medium">Average Marks</span>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">{metrics?.averageScore ?? 0}%</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs">
              <span className="text-xs text-purple-600 font-medium">Pass Percentage</span>
              <div className="text-2xl font-extrabold text-purple-600 mt-1">{metrics?.passRate ?? 0}%</div>
            </div>
          </div>

          {/* Export & Filter Toolbar */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter student or assessment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">All Classes</option>
                <option value="S1">Class S1</option>
                <option value="S2">Class S2</option>
                <option value="S3">Class S3</option>
                <option value="S4">Class S4</option>
                <option value="S5">Class S5</option>
                <option value="SS1">Class SS1</option>
                <option value="SS2">Class SS2</option>
                <option value="D1">Class D1</option>
                <option value="D2">Class D2</option>
                <option value="D3">Class D3</option>
              </select>

              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">All Scores</option>
                <option value="90plus">90% and above</option>
                <option value="75to90">75% - 89%</option>
                <option value="50to75">50% - 74%</option>
                <option value="below50">Below 50%</option>
              </select>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={exportToPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
              >
                <FileText className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-5">Assessment</th>
                    <th className="py-3.5 px-5">Score (Obtained / Total)</th>
                    <th className="py-3.5 px-5">Percentage</th>
                    <th className="py-3.5 px-5">Grade</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{r.student?.name}</div>
                        <div className="text-[11px] text-blue-600 font-mono">
                          {r.student?.admissionNumber} &bull; Class {r.student?.class}-{r.student?.division}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800">{r.assessment?.title}</div>
                        <div className="text-[11px] text-slate-400">{r.assessment?.subject}</div>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-medium text-slate-700">
                        {r.marksObtained} / {r.totalMarks}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-blue-600">
                        {r.percentage}%
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-black text-slate-800 px-2 py-0.5 rounded bg-slate-100">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {r.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <a
                          href={`/student/results/${r.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:text-blue-600 hover:border-blue-300 transition"
                        >
                          View Breakdown
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No results matching the active filters.
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
