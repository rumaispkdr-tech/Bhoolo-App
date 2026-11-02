import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId') || undefined;
  const assessmentId = searchParams.get('assessmentId') || undefined;
  const studentClass = searchParams.get('class') || undefined;

  let results = await db.listResults({ studentId, assessmentId });

  if (studentClass && studentClass !== 'all') {
    results = results.filter(r => r.student?.class === studentClass);
  }

  const totalResults = results.length;
  const scores = results.map(r => r.percentage);
  const highestScore = scores.length ? Math.max(...scores) : 0;
  const lowestScore = scores.length ? Math.min(...scores) : 0;
  const averageScore = scores.length 
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 
    : 0;

  const passedCount = results.filter(r => r.passed).length;
  const passRate = totalResults > 0 ? Math.round((passedCount / totalResults) * 100) : 0;

  // Grade breakdown
  const gradeDistribution = {
    'A+': results.filter(r => r.grade === 'A+').length,
    'A': results.filter(r => r.grade === 'A').length,
    'B': results.filter(r => r.grade === 'B').length,
    'C': results.filter(r => r.grade === 'C').length,
    'D': results.filter(r => r.grade === 'D').length,
    'F': results.filter(r => r.grade === 'F').length,
  };

  return NextResponse.json({
    metrics: {
      totalResults,
      highestScore,
      lowestScore,
      averageScore,
      passRate,
    },
    gradeDistribution,
    results,
  });
}
