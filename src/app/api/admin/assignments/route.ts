import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get('assessmentId') || undefined;

  const assignments = await db.listAssignments(assessmentId);
  return NextResponse.json({ assignments });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { assessmentId, studentIds, deadline, timeLimitMinutes, attemptLimit } = body;

    if (!assessmentId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Assessment ID and at least one Student ID are required' }, { status: 400 });
    }

    const assigned = await db.assignStudentsToAssessment({
      assessmentId,
      studentIds,
      deadline,
      timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
      attemptLimit: attemptLimit ? Number(attemptLimit) : 1,
    });

    return NextResponse.json({
      success: true,
      count: assigned.length,
      assignments: assigned,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to assign students' }, { status: 500 });
  }
}
