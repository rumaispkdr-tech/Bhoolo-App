'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Award, CheckCircle2, XCircle, Clock, Calendar, 
  ArrowRight, ArrowLeft, RefreshCw, BookOpen, Sparkles, FileText,
  Frown, Volume2, Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AssessmentResult } from '@/lib/types';
import { formatDuration, calculateGrade } from '@/lib/utils';
import { playCelebrationSound, playLoseSound } from '@/lib/sound';

export default function StudentResultPage() {
  const params = useParams();
  const id = params?.id as string;

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const soundTriggered = useRef(false);

  useEffect(() => {
    if (id) {
      fetchResult();
    }
  }, [id]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/results/${id}`);
      if (!res.ok) {
        throw new Error('Could not find result');
      }
      const data = await res.json();
      setResult(data.result);

      // Trigger Celebration OR Sad audio & items based on performance
      if (!soundTriggered.current) {
        soundTriggered.current = true;
        const score = Number(data.result?.percentage || 0);

        if (score >= 70) {
          // Above Average -> Popper confetti + victory celebration sound
          setTimeout(() => {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
            playCelebrationSound();
          }, 300);
        } else {
          // Below Average or Average -> NO poppers, play lose music & display sad items
          setTimeout(() => {
            playLoseSound();
          }, 300);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading result');
    } finally {
      setLoading(false);
    }
  };

  const handleReplaySound = () => {
    if (!result) return;
    const score = Number(result.percentage || 0);
    if (score >= 70) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      playCelebrationSound();
    } else {
      playLoseSound();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-xs font-semibold text-slate-500">Calculating final assessment marks...</div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center">
        <h3 className="font-bold text-base text-[#172033] mb-2">Scorecard Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'This assessment attempt result is unavailable.'}</p>
        <Link href="/student/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const gradeInfo = calculateGrade(Number(result.percentage || 0));

  const isAboveAverage = Number(result.percentage || 0) >= 70;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Hero Result Card with Circular Progress Gauge (Inspired by Screenshot 2) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E5E7EB] shadow-card text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Official Assessment Scorecard
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mb-2">
            {result.assessment?.title || 'Assessment Completed'}
          </h2>
          <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
            {result.student?.name} &bull; Admission No: {result.student?.admissionNumber} &bull; Class {result.student?.class}-{result.student?.division}
          </p>

          {/* Circular Score Gauge (Matching Screenshot 2) */}
          <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E2E8F0"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={isAboveAverage ? '#16A34A' : '#D97706'}
                strokeWidth="8"
                strokeDasharray={`${(result.percentage / 100) * 251.2} 251.2`}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[#172033] tracking-tight">
                {result.percentage}%
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${gradeInfo.color}`}>
                Grade {result.grade}
              </span>
            </div>
          </div>

          {/* Score Badge */}
          {isAboveAverage ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Above Average Score &bull; Passed</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mt-1">
              <Frown className="w-4 h-4 text-amber-600" />
              <span>Needs Practice &bull; Below Average / Average</span>
            </div>
          )}

          {/* Celebratory or Sad Outcome Box */}
          {isAboveAverage ? (
            <div className="mt-5 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm">
                <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>🎉 Outstanding Achievement!</span>
              </div>
              <p className="text-xs text-emerald-700">
                Congratulations! You scored above average and demonstrated excellent subject mastery.
              </p>
              <button
                type="button"
                onClick={handleReplaySound}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay Victory Fanfare &amp; Confetti</span>
              </button>
            </div>
          ) : (
            <div className="mt-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-900 font-bold text-sm">
                <span className="text-2xl leading-none" role="img" aria-label="sad face">😔</span>
                <span>Keep Practicing! (Below Average / Average)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Don&apos;t be discouraged. Every attempt is an opportunity to learn. Review the explanations below and try again!
              </p>
              <button
                type="button"
                onClick={handleReplaySound}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-semibold transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-800" />
                <span>Play Sound Melody</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Detailed Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Score Obtained</span>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {result.marksObtained} <span className="text-sm font-semibold text-slate-400">/ {result.totalMarks}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Correct</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {result.correctCount} <span className="text-xs font-normal text-slate-400">questions</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">Incorrect</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {result.incorrectCount} <span className="text-xs font-normal text-slate-400">questions</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Time Taken</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {formatDuration(result.timeTakenSeconds || 0)}
            </div>
          </div>
        </div>

        {/* Actions Button Bar */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Recorded at: {new Date(result.generatedAt).toLocaleString()}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href={`/student/review/${result.id}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-500/20"
            >
              <FileText className="w-4 h-4" />
              <span>Review Questions &amp; Explanations</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
