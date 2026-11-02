import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateGrade(percentage: number): { grade: string; color: string; label: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-600', label: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', color: 'text-blue-600', label: 'Excellent' };
  if (percentage >= 70) return { grade: 'B', color: 'text-indigo-600', label: 'Good' };
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-600', label: 'Satisfactory' };
  if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', label: 'Pass' };
  return { grade: 'F', color: 'text-rose-600', label: 'Needs Improvement' };
}
