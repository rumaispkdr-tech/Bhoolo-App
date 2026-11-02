import React from 'react';

export default function AdminLoading() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <div className="w-64 bg-white border-r border-[#E5E7EB] hidden lg:block p-4 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl w-3/4" />
        <div className="space-y-2 pt-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6 animate-pulse">
        <div className="h-12 bg-white border border-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-3xl" />
      </div>
    </div>
  );
}
