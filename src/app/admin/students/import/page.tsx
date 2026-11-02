'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, Download, Upload, CheckCircle2, 
  AlertCircle, XCircle, ArrowRight, Loader2, RefreshCw 
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function ExcelImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an Excel file (.xlsx or .xls) to upload.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process Excel import');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader 
          title="Excel Student Database Import" 
          subtitle="Bulk import student cohorts with automatic password hashing and duplicate detection" 
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
          {/* Header Action & Download Template */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#172033]">Import Student Credentials &amp; Cohorts</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Upload student rosters exported from your school management system. Passwords will be securely hashed with bcrypt prior to storage.
              </p>
            </div>
            <a
              href="/api/admin/students/sample-excel"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#172033] border border-slate-200 text-xs font-semibold transition"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Download Excel Template</span>
            </a>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-white p-8 rounded-3xl border border-[#E5E7EB] shadow-card">
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 text-center transition flex flex-col items-center justify-center bg-slate-50/50">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">Select your .xlsx or .xls file</h3>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Maximum file size: 10MB &bull; Supported columns: Admission Number, Full Name, Class, Division, Password
              </p>

              <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition">
                <Upload className="w-4 h-4" />
                <span>Browse Local Files</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {file && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-500/20 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing &amp; Hashing Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Process &amp; Import Students</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Summary */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">Total Rows Evaluated</span>
                  <div className="text-2xl font-extrabold text-[#172033] mt-1">{result.totalRowsProcessed}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-xs text-emerald-600 font-medium">Successfully Imported</span>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">{result.successfulCount}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs">
                  <span className="text-xs text-rose-600 font-medium">Failed / Skipped</span>
                  <div className="text-2xl font-extrabold text-rose-600 mt-1">{result.failedCount}</div>
                </div>
              </div>

              {/* Successful List */}
              {result.successfulImports?.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card">
                  <h3 className="text-sm font-bold text-[#172033] mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Successfully Imported Students ({result.successfulImports.length})</span>
                  </h3>
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Admission No</th>
                          <th className="py-2.5 px-4">Name</th>
                          <th className="py-2.5 px-4">Class</th>
                          <th className="py-2.5 px-4">Division</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.successfulImports.map((st: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-4 font-mono font-medium text-blue-600">{st.admissionNumber}</td>
                            <td className="py-2 px-4 font-medium text-slate-800">{st.name}</td>
                            <td className="py-2 px-4 text-slate-600">Class {st.class}</td>
                            <td className="py-2 px-4 text-slate-600">Div {st.division}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Failed List */}
              {result.failedRecords?.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-card">
                  <h3 className="text-sm font-bold text-rose-700 mb-4 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Failed / Incomplete Rows ({result.failedRecords.length})</span>
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.failedRecords.map((fail: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs flex items-center justify-between">
                        <span className="font-semibold text-rose-800">Row #{fail.rowNumber}</span>
                        <span className="text-rose-600">{fail.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
