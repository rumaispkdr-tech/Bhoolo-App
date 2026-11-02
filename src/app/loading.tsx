import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-3">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-xs font-bold text-[#172033] tracking-wide">Loading Bhoolo...</div>
    </div>
  );
}
