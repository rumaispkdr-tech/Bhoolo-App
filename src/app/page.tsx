'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hash, Lock, ArrowRight, AlertCircle, Loader2, ShieldCheck, 
  Sparkles, Award, BookOpen, Clock, ShieldAlert, BarChart3, 
  CheckCircle2, GraduationCap, HelpCircle
} from 'lucide-react';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionNumber: admissionNumber.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Smoothly navigate based on returned role
      if (data.redirectTo) {
        router.push(data.redirectTo);
      } else if (data.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between relative overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Neat Blue Grid Pattern with Radial Falloff Opacity (Requirement 1) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(37, 99, 235, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37, 99, 235, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 48%, #000 35%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 48%, #000 35%, transparent 85%)',
        }}
      />

      {/* 2. Ambient Soft Glowing Orbs */}
      <div className="absolute top-10 right-1/4 w-[420px] h-[420px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mt-20" />
      <div className="absolute bottom-10 left-1/4 w-[420px] h-[420px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -mb-20" />

      {/* Subtle Top Brand Header */}
      <header className="w-full bg-white/85 backdrop-blur-md border-b border-[#E5E7EB] py-3.5 px-6 sm:px-8 relative z-20 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Bhoolo Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-xs"
            />
            <div>
              <span className="font-bold text-lg text-[#172033] tracking-tight">Bhoolo</span>
              <span className="ml-2 text-xs text-blue-600 font-medium hidden sm:inline">
                Assessment &amp; Examination Platform
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Academic Portal 2026</span>
          </div>
        </div>
      </header>

      {/* Main Unified Login Area with Floating Content Elements */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Floating Content Elements (Related to Quizzes, Exams & Proctoring) */}
        
        {/* Top-Left Floating Feature Badge: Quizzes */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden xl:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 border border-blue-100 shadow-card absolute left-12 top-28 backdrop-blur-xs select-none pointer-events-none"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#172033]">Instant Quiz Feedback</div>
            <div className="text-[10px] text-slate-400">Step-by-step evaluations</div>
          </div>
        </motion.div>

        {/* Bottom-Left Floating Feature Badge: Anti-Cheat Proctoring */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="hidden xl:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 border border-rose-100 shadow-card absolute left-16 bottom-24 backdrop-blur-xs select-none pointer-events-none"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#172033]">Proctor Lockdown</div>
            <div className="text-[10px] text-slate-400">Anti-cheat tab monitoring</div>
          </div>
        </motion.div>

        {/* Top-Right Floating Feature Badge: Instant Scorecard */}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="hidden xl:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 border border-emerald-100 shadow-card absolute right-14 top-28 backdrop-blur-xs select-none pointer-events-none"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#172033]">Certified Scorecards</div>
            <div className="text-[10px] text-slate-400">Audio celebrations &amp; grades</div>
          </div>
        </motion.div>

        {/* Bottom-Right Floating Feature Badge: Detailed Analytics */}
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
          className="hidden xl:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 border border-indigo-100 shadow-card absolute right-16 bottom-24 backdrop-blur-xs select-none pointer-events-none"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#172033]">Dhdc Work Tracker</div>
            <div className="text-[10px] text-slate-400">Real-time audit log oversight</div>
          </div>
        </motion.div>

        {/* Center Login Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card Header with Mascot Eye Animation */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ rotate: [0, -6, 6, 0], scale: 1.05 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
              className="inline-flex w-16 h-16 rounded-3xl items-center justify-center mb-3 shadow-lg shadow-blue-500/10 bg-white border border-slate-100 p-1 cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="Bhoolo Mascot"
                className="w-14 h-14 rounded-2xl object-contain drop-shadow-xs"
              />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              Sign In to Bhoolo
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
              Individual Quiz &amp; Examination Portal managed by Dhdc
            </p>
          </div>

          {/* Unified Login Card with Elevated Border and Shadow */}
          <div className="bg-white/95 backdrop-blur-md p-7 sm:p-9 rounded-3xl border border-[#E5E7EB] shadow-card hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            {/* Subtle Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                  Admission Number
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    placeholder="Enter Admission Number"
                    autoComplete="username"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Educational Trust Indicators underneath Login Card */}
          <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-slate-500 select-none">
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>153 Students Enrolled</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Encrypted Session</span>
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
