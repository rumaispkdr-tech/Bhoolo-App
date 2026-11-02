import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
  }

  try {
    const { attemptId, autoSubmitted = false } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 });
    }

    const { attempt, result } = await db.submitAttempt(attemptId, session.id, Boolean(autoSubmitted));

    return NextResponse.json({
      success: true,
      attempt,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit attempt' }, { status: 400 });
  }
}
