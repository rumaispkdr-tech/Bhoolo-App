import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Can be resultId, attemptId, or assignmentId
  let result = await db.getResultById(params.id);
  if (!result) {
    result = await db.getResultByAttemptId(params.id);
  }
  if (!result) {
    result = await db.getResultByAssignmentId(params.id);
  }

  if (!result) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  }

  // Security check: if student, they can only view their own result
  if (session.role === 'student' && result.studentId !== session.id) {
    return NextResponse.json({ error: 'Access denied to this result' }, { status: 403 });
  }

  return NextResponse.json({ result });
}
