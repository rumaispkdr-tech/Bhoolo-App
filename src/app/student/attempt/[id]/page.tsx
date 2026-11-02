'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, 
  ArrowLeft, Check, HelpCircle, Sparkles, Send, ShieldAlert,
  Lightbulb, ChevronRight, CheckSquare, Square, RefreshCw, Lock, Unlock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTimeRemaining } from '@/lib/utils';

export default function AssessmentAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [attempt, setAttempt] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  // Instant feedback state (Quiz mode)
  const [instantFeedback, setInstantFeedback] = useState<any>(null);

  // Proctoring & Anti-Cheat Freeze State (Requirement 2)
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenReason, setFrozenReason] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Examination timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [finalizingAttempt, setFinalizingAttempt] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      initiateAttempt();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assignmentId]);

  // Anti-cheat tab switch, window blur, and back navigation detection
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || isFrozen) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isFrozen) {
        triggerFreeze('Student switched tabs or minimized the browser window.');
      }
    };

    const handleWindowBlur = () => {
      if (!isFrozen) {
        triggerFreeze('Student left the active examination window.');
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (!isFrozen) {
        triggerFreeze('Student attempted browser back navigation.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [attempt, isFrozen]);

  // Auto-poll to check if admin unfroze the assessment
  useEffect(() => {
    if (!isFrozen || !attempt?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/student/attempt/status?attemptId=${attempt.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status && !data.status.isFrozen && data.status.status === 'in_progress') {
            setIsFrozen(false);
            setAttempt((prev: any) => ({ ...prev, isFrozen: false, status: 'in_progress' }));
          }
        }
      } catch (e) {
        // Silent poll error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isFrozen, attempt?.id]);

  const triggerFreeze = async (reason: string) => {
    setIsFrozen(true);
    setFrozenReason(reason);

    try {
      if (attempt?.id) {
        await fetch('/api/student/attempt/freeze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId: attempt.id, reason }),
        });
      }
    } catch (e) {
      console.error('Failed to report freeze to server:', e);
    }
  };

  const checkUnfreezeStatus = async () => {
    if (!attempt?.id) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/student/attempt/status?attemptId=${attempt.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status && !data.status.isFrozen && data.status.status === 'in_progress') {
          setIsFrozen(false);
          setAttempt((prev: any) => ({ ...prev, isFrozen: false, status: 'in_progress' }));
        } else {
          alert('Your assessment is still frozen. Please contact administrator (Dhdc) to unfreeze your session.');
        }
      }
    } catch {
      alert('Could not verify status. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const initiateAttempt = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/attempt/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        // If already submitted, redirect directly to scorecard (Requirement 1)
        if (data.resultId) {
          router.push(`/student/results/${data.resultId}`);
          return;
        }
        throw new Error(data.error || 'Failed to initialize assessment');
      }

      setAttempt(data.attempt);
      setAssessment(data.assessment);

      // Check if attempt is currently frozen
      if (data.attempt.isFrozen || data.attempt.status === 'frozen') {
        setIsFrozen(true);
        setFrozenReason(data.attempt.frozenReason || 'Tab switch or window leave detected');
      }

      // Check current question state
      const currentQ = data.assessment.questions[0];
      const existingAnswer = data.attempt.answers?.find((a: any) => a.questionId === currentQ.id);
      if (existingAnswer) {
        setSelectedOption(existingAnswer.selectedOptionKey);
        if (existingAnswer.isLocked) {
          setInstantFeedback({
            isCorrect: existingAnswer.isCorrect,
            correctOptionKey: existingAnswer.correctOptionKey,
            marksAwarded: existingAnswer.marksAwarded,
            explanation: existingAnswer.explanation,
          });
        }
      }

      // Initialize timer if exam or timed quiz
      if (data.assessment.durationMinutes) {
        const totalSecs = data.assessment.durationMinutes * 60;
        const elapsedSecs = data.attempt.startedAt 
          ? Math.floor((new Date().getTime() - new Date(data.attempt.startedAt).getTime()) / 1000)
          : 0;
        const remaining = Math.max(0, totalSecs - elapsedSecs);
        setSecondsRemaining(remaining);
        startTimer(remaining);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading attempt');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (initialSecs: number) => {
    let timeLeft = initialSecs;
    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setSecondsRemaining(timeLeft);
      if (timeLeft <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleAutoSubmit();
      }
    }, 1000);
  };

  const handleAutoSubmit = async () => {
    if (finalizingAttempt) return;
    setFinalizingAttempt(true);
    try {
      const res = await fetch('/api/student/attempt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id, autoSubmitted: true }),
      });
      const data = await res.json();
      router.push(`/student/results/${data.result.id}`);
    } catch {
      router.push('/student/dashboard');
    }
  };

  const questions = assessment?.questions || [];
  const currentQuestion = questions[currentIndex];
  const isExam = assessment?.type === 'exam';

  // Check if current question is already answered & locked
  const currentSavedAnswer = attempt?.answers?.find((a: any) => a.questionId === currentQuestion?.id);
  const isCurrentAnswerLocked = currentSavedAnswer?.isLocked;

  const handleSelectOption = async (key: 'A' | 'B' | 'C' | 'D') => {
    if (isCurrentAnswerLocked || isFrozen) return;
    setSelectedOption(key);

    // In Exam mode, silently auto-save response on select
    if (isExam && attempt) {
      try {
        await fetch('/api/student/attempt/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId: attempt.id,
            questionId: currentQuestion.id,
            selectedOptionKey: key,
          }),
        });
        const updatedAnswers = [...(attempt.answers || [])];
        const idx = updatedAnswers.findIndex(a => a.questionId === currentQuestion.id);
        if (idx >= 0) {
          updatedAnswers[idx].selectedOptionKey = key;
        } else {
          updatedAnswers.push({ questionId: currentQuestion.id, selectedOptionKey: key });
        }
        setAttempt({ ...attempt, answers: updatedAnswers });
      } catch (e) {
        console.error('Silent auto-save error:', e);
      }
    }
  };

  const handleClearAnswer = () => {
    if (isCurrentAnswerLocked || isFrozen) return;
    setSelectedOption(null);
  };

  // Submit Answer (Quiz mode with instant feedback)
  const handleSubmitAnswer = async () => {
    if (!selectedOption || isCurrentAnswerLocked || isFrozen) return;

    setSubmittingAnswer(true);
    try {
      const res = await fetch('/api/student/attempt/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          questionId: currentQuestion.id,
          selectedOptionKey: selectedOption,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit answer');
      }

      setInstantFeedback(data.instantFeedback);

      const updatedAnswers = [...(attempt.answers || [])];
      const idx = updatedAnswers.findIndex(a => a.questionId === currentQuestion.id);
      if (idx >= 0) {
        updatedAnswers[idx] = data.answer;
      } else {
        updatedAnswers.push(data.answer);
      }
      setAttempt({ ...attempt, answers: updatedAnswers });
    } catch (err: any) {
      setError(err.message || 'Error submitting answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNavigateQuestion = (index: number) => {
    if (index < 0 || index >= questions.length || isFrozen) return;
    setCurrentIndex(index);

    const targetQ = questions[index];
    const saved = attempt?.answers?.find((a: any) => a.questionId === targetQ.id);

    if (saved) {
      setSelectedOption(saved.selectedOptionKey);
      if (saved.isLocked) {
        setInstantFeedback({
          isCorrect: saved.isCorrect,
          correctOptionKey: saved.correctOptionKey,
          marksAwarded: saved.marksAwarded,
          explanation: saved.explanation,
        });
      } else {
        setInstantFeedback(null);
      }
    } else {
      setSelectedOption(null);
      setInstantFeedback(null);
    }
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setFinalizingAttempt(true);

    try {
      const res = await fetch('/api/student/attempt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to finalize assessment');
      }

      router.push(`/student/results/${data.result.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to finalize');
      setFinalizingAttempt(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/20 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold text-[#172033]">Preparing Assessment Workspace...</div>
        <p className="text-xs text-slate-400 mt-1">Synchronizing question bank and secure session</p>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-card max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#172033] mb-1">Assessment Session Alert</h3>
          <p className="text-xs text-slate-600 mb-5">{error || 'Question data could not be loaded.'}</p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const answeredQuestionsCount = (attempt?.answers || []).filter((a: any) => a.selectedOptionKey).length;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between relative">
      {/* Top Fixed Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-subtle">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isExam ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {assessment.type}
            </span>
            <div className="truncate max-w-[200px] sm:max-w-md">
              <h1 className="text-sm font-bold text-[#172033] truncate">{assessment.title}</h1>
              <span className="text-[11px] text-slate-500">{assessment.subject}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown Timer */}
            {secondsRemaining !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
                secondsRemaining < 300 
                  ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimeRemaining(secondsRemaining)}</span>
              </div>
            )}

            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
            >
              Finish Test
            </button>
          </div>
        </div>
      </header>

      {/* Main Testing View */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col justify-start space-y-5">
        {/* Exam Mode: Question Palette */}
        {isExam && (
          <div className="bg-white p-3.5 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center justify-between overflow-x-auto gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
              Questions:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {questions.map((q: any, i: number) => {
                const isAns = attempt?.answers?.some((a: any) => a.questionId === q.id && a.selectedOptionKey);
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleNavigateQuestion(i)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition flex-shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-500/30'
                        : isAns
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-500 flex-shrink-0 hidden sm:block">
              {answeredQuestionsCount}/{questions.length} Answered
            </div>
          </div>
        )}

        {/* Upgraded Quiz Card Container (Matching Image 2 Reference Layout) */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-card p-6 sm:p-8 space-y-5">
          {/* Top Line: Question X of Y (left), X points (right) */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{currentQuestion.marks} point{currentQuestion.marks > 1 ? 's' : ''}</span>
          </div>

          {/* Integrated Horizontal Progress Bar (Matching Image 2) */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Tag: MULTIPLE CHOICE • SELECT ONE ANSWER (Matching Image 2) */}
          <div className="text-[11px] font-bold text-blue-600 tracking-wider uppercase pt-1">
            MULTIPLE CHOICE &bull; SELECT ONE ANSWER
          </div>

          {/* Question Text Heading (Matching Image 2) */}
          <div className="text-base sm:text-lg font-bold text-[#172033] leading-snug">
            {currentQuestion.questionText}
          </div>

          {/* Answer Choice Cards (Matching Image 2 with Instant Feedback Integration) */}
          <div className="space-y-3 pt-1">
            {(currentQuestion.options || []).map((opt: any) => {
              const isSelected = selectedOption === opt.key;
              const hasFeedback = !isExam && !!instantFeedback;
              const isCorrectKey = instantFeedback?.correctOptionKey === opt.key;

              // Card styling matching Image 2
              let cardStyle = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40 shadow-xs';
              let badgeStyle = 'bg-slate-50 border border-slate-200 text-slate-600 font-semibold';

              if (hasFeedback) {
                if (isSelected && instantFeedback.isCorrect) {
                  // Correct Choice selected
                  cardStyle = 'border-2 border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-2 ring-emerald-400/20 shadow-xs';
                  badgeStyle = 'bg-emerald-600 text-white font-bold border-transparent';
                } else if (isSelected && !instantFeedback.isCorrect) {
                  // Wrong Choice selected
                  cardStyle = 'border-2 border-rose-500 bg-rose-50/70 text-rose-950 font-semibold ring-2 ring-rose-400/20 shadow-xs';
                  badgeStyle = 'bg-rose-600 text-white font-bold border-transparent';
                } else if (isCorrectKey) {
                  // Reveal Correct Answer
                  cardStyle = 'border-2 border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-2 ring-emerald-400/20 shadow-xs';
                  badgeStyle = 'bg-emerald-600 text-white font-bold border-transparent';
                } else {
                  cardStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-50';
                  badgeStyle = 'bg-slate-100 text-slate-400 border-slate-200';
                }
              } else if (isSelected) {
                // Selected state (Blue border and badge, matching Image 2)
                cardStyle = 'border-2 border-blue-600 bg-white ring-2 ring-blue-500/10 shadow-xs';
                badgeStyle = 'bg-blue-600 text-white font-bold border-transparent';
              }

              return (
                <div
                  key={opt.key}
                  onClick={() => !isCurrentAnswerLocked && !hasFeedback && !isFrozen && handleSelectOption(opt.key)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isCurrentAnswerLocked || hasFeedback || isFrozen ? 'cursor-default' : 'cursor-pointer'
                  } ${cardStyle}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition ${badgeStyle}`}>
                      {opt.key}
                    </div>
                    <span className="text-sm font-medium text-[#172033]">{opt.text}</span>
                  </div>

                  {/* Feedback Badges */}
                  {hasFeedback && (
                    <div className="flex items-center">
                      {isCorrectKey && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Correct</span>
                        </span>
                      )}
                      {!isCorrectKey && isSelected && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold shadow-xs">
                          <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation Card */}
          {instantFeedback?.explanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 text-xs space-y-1.5 shadow-xs"
            >
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-800 text-[11px]">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
                <span>EXPLANATION &amp; TAKEAWAY</span>
              </div>
              <p className="leading-relaxed font-medium">{instantFeedback.explanation}</p>
            </motion.div>
          )}

          {/* Bottom Action Row (Matching Image 2: < Previous, Clear Answer on left; Submit on right) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigateQuestion(currentIndex - 1)}
                disabled={currentIndex === 0 || isFrozen}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>&lsaquo; Previous</span>
              </button>

              {!instantFeedback && !isCurrentAnswerLocked && (
                <button
                  type="button"
                  onClick={handleClearAnswer}
                  disabled={!selectedOption || isFrozen}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear Answer
                </button>
              )}
            </div>

            <div className="flex items-center justify-end">
              {!instantFeedback ? (
                /* Step 1: Submit Answer Button (Matching Image 2) */
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption || submittingAnswer || isFrozen}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submittingAnswer ? (
                    <span>Submitting...</span>
                  ) : (
                    <span>Submit Answer</span>
                  )}
                </button>
              ) : (
                /* Step 2: Next Question or Finalize Button AFTER Submit */
                currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion(currentIndex + 1)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-500/20 flex items-center gap-2 animate-in fade-in"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={finalizingAttempt}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm shadow-emerald-500/20 flex items-center gap-2 animate-in fade-in"
                  >
                    <span>{finalizingAttempt ? 'Finalizing...' : 'Finish Quiz & View Results'}</span>
                    <Check className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Proctoring Anti-Cheat Freeze Lockout Overlay (Requirement 2) */}
      {isFrozen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl border border-rose-200 space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 uppercase tracking-wider">
                Anti-Cheat Proctoring Activated
              </span>
              <h2 className="text-xl font-extrabold text-[#172033] mt-3">
                Assessment Frozen by Proctoring System
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Anti-cheating detection noticed that you switched browser tabs, minimized the window, or navigated away from the exam.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Lock className="w-4 h-4" />
                <span>Session Locked By Policy</span>
              </div>
              <p className="leading-relaxed">
                Only your Administrator (<strong>Dhdc</strong>) can unfreeze this assessment. Please request your administrator to unlock your assessment session from the Admin portal.
              </p>
              {frozenReason && (
                <div className="text-[11px] text-slate-500 pt-1">
                  Reason: <em>{frozenReason}</em>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={checkUnfreezeStatus}
                disabled={checkingStatus}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                <span>{checkingStatus ? 'Checking Status with Dhdc...' : 'Check Unfreeze Status'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-[#172033] mb-2">Submit Assessment?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              You have answered <strong>{answeredQuestionsCount}</strong> out of <strong>{questions.length}</strong> questions. Once submitted, your answers will be locked and cannot be re-attempted.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Review Answers
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={finalizingAttempt}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                {finalizingAttempt ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
