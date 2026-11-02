import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized: Student login required' }, { status: 403 });
  }

  const assignments = await db.getAssignmentsByStudentId(session.id);
  const results = await db.listResults({ studentId: session.id });

  const quizzes = assignments.filter(a => a.assessment?.type === 'quiz');
  const exams = assignments.filter(a => a.assessment?.type === 'exam');

  return NextResponse.json({
    student: session,
    quizzes,
    exams,
    results,
    summary: {
      totalAssigned: assignments.length,
      completed: assignments.filter(a => a.status === 'completed').length,
      pending: assignments.filter(a => a.status === 'assigned' || a.status === 'in_progress').length,
      averageScore: results.length > 0 
        ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length * 10) / 10 
        : 0,
    }
  });
}
