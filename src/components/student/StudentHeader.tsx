'use client';

import React from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';

interface StudentHeaderProps {
  title?: string;
  studentName?: string;
}

export function StudentHeader({ title = 'Student Dashboard', studentName = 'Angelina' }: StudentHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-subtle pl-14 lg:pl-6">
      <div className="truncate">
        <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight truncate">{title}</h1>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments or subjects..."
            className="w-56 pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <button
          aria-label="View notifications"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative"
        >
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
            {studentName.charAt(0)}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-700">{studentName}</span>
        </div>
      </div>
    </header>
  );
}
