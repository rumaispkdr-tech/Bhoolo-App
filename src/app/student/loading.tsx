import React from 'react';

export default function StudentLoading() {
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
      <div className="flex-1 p-6 space-y-6 animate-pulse max-w-5xl mx-auto w-full">
        <div className="h-12 bg-white border border-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-3xl" />
      </div>
    </div>
  );
}
