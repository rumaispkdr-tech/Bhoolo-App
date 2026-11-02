import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const attemptId = searchParams.get('attemptId');

  if (!attemptId) {
    return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 });
  }

  const status = await db.getAttemptStatus(attemptId, session.id);
  if (!status) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  }

  return NextResponse.json({ status });
}
