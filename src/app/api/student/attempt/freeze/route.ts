import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
  }

  try {
    const { attemptId, reason } = await req.json();
    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 });
    }

    const frozen = await db.freezeAttempt(attemptId, session.id, reason);

    return NextResponse.json({
      success: true,
      frozen: true,
      attempt: frozen,
      message: 'Assessment frozen due to tab switch or window leave.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to freeze attempt' }, { status: 500 });
  }
}
