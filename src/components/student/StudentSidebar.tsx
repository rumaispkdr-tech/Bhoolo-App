'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Sparkles, ClipboardList, Award, 
  Eye, History, User, Key, LogOut, ChevronLeft, ChevronRight, Menu, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentSidebarProps {
  studentName?: string;
  admissionNumber?: string;
}

export function StudentSidebar({ studentName = 'Student', admissionNumber = '844' }: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Exact navigation order and items matching Image 1
  const navItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Quizzes', href: '/student/quizzes', icon: Sparkles },
    { label: 'My Examinations', href: '/student/exams', icon: ClipboardList },
    { label: 'Latest Result', href: '/student/latest-result', icon: Award },
    { label: 'Answer Review', href: '/student/review', icon: Eye },
    { label: 'Assessment History', href: '/student/history', icon: History },
    { label: 'My Profile', href: '/student/profile', icon: User },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch {
      router.push('/');
    }
  };

  return (
    <>
      {/* Mobile Top Hamburger Floating Trigger Button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle student navigation menu"
          className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 shadow-md hover:bg-slate-50 transition flex items-center justify-center"
        >
          {mobileOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-blue-600" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'bg-white border-r border-[#E5E7EB] h-screen sticky top-0 flex flex-col justify-between transition-all duration-300 z-40 select-none shadow-subtle',
          // Desktop behavior
          collapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile drawer overlay behavior
          mobileOpen 
            ? 'fixed inset-y-0 left-0 w-72 flex translate-x-0' 
            : 'fixed lg:sticky -translate-x-full lg:translate-x-0'
        )}
      >
        <div>
          {/* Header Branding */}
          <div className="h-16 border-b border-[#E5E7EB] flex items-center justify-between px-4">
            <div className="flex items-center space-x-3 overflow-hidden">
              <img
                src="/logo.png"
                alt="Bhoolo Logo"
                className="w-10 h-10 rounded-xl object-contain flex-shrink-0 drop-shadow-xs"
              />
              {(!collapsed || mobileOpen) && (
                <div className="flex flex-col">
                  <span className="font-bold text-base text-[#172033] tracking-tight truncate">Bhoolo</span>
                  <span className="text-[11px] text-blue-600 font-medium">Student Desk</span>
                </div>
              )}
            </div>

            {/* Desktop toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Toggle student sidebar collapse"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition hidden lg:block"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close mobile navigation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation List */}
          <nav className="p-3 space-y-1">
            <div className={cn('px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider', collapsed && !mobileOpen && 'hidden')}>
              Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group relative',
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                  )}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-colors',
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />
                  )}
                </Link>
              );
            })}

            {/* Prominent Change Password Button (Matching Image 1 Reference) */}
            <div className="pt-3 px-1">
              <Link
                href="/student/profile#change-password"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95',
                  collapsed && !mobileOpen && 'px-0 justify-center'
                )}
                title="Change Password"
              >
                <Key className="w-4 h-4 flex-shrink-0" />
                {(!collapsed || mobileOpen) && <span>Change Password</span>}
              </Link>
            </div>
          </nav>
        </div>

        {/* User profile footer & Logout */}
        <div className="p-3 border-t border-[#E5E7EB]">
          {(!collapsed || mobileOpen) && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {studentName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-[#172033] truncate">{studentName}</div>
                  <div className="text-[10px] text-blue-600 font-mono truncate">{admissionNumber}</div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs text-rose-600 hover:bg-rose-50 transition group',
              collapsed && !mobileOpen && 'justify-center px-0'
            )}
            title="Logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-rose-500 group-hover:text-rose-600" />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
