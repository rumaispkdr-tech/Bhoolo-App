'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, FileSpreadsheet, PlusCircle, 
  HelpCircle, ClipboardList, CheckSquare, BarChart3, 
  Settings, LogOut, ChevronLeft, ChevronRight, Activity, 
  Menu, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/admin/students', icon: Users },
    { label: 'Excel Import', href: '/admin/students/import', icon: FileSpreadsheet },
    { label: 'Create Quiz', href: '/admin/assessments/create?type=quiz', icon: PlusCircle },
    { label: 'Create Exam', href: '/admin/assessments/create?type=exam', icon: HelpCircle },
    { label: 'All Assessments', href: '/admin/assessments', icon: ClipboardList },
    { label: 'Assignments', href: '/admin/assignments', icon: CheckSquare },
    { label: 'Work Tracker', href: '/admin/tracker', icon: Activity },
    { label: 'Results & Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
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
      {/* Mobile Top Hamburger Floating Trigger Button (visible on mobile only) */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
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
                  <span className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider">Dhdc Admin</span>
                </div>
              )}
            </div>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Toggle sidebar collapse"
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
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className={cn('px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider', collapsed && !mobileOpen && 'hidden')}>
              Dhdc Workspace
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href.split('?')[0];

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
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-[#E5E7EB]">
          {(!collapsed || mobileOpen) && (
            <div className="mb-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  D
                </div>
                <div>
                  <div className="text-xs font-bold text-[#172033]">Dhdc</div>
                  <div className="text-[10px] text-slate-400">Head Administrator</div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-rose-600 hover:bg-rose-50 transition group',
              collapsed && !mobileOpen && 'justify-center px-0'
            )}
            title="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-rose-500 group-hover:text-rose-600" />
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
