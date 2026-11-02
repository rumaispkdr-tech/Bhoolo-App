import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const identifier = body.attemptId || body.assignmentId || body.id;
    if (!identifier) {
      return NextResponse.json({ error: 'Attempt or Assignment ID is required' }, { status: 400 });
    }

    const unfrozen = await db.unfreezeAttempt(identifier);

    return NextResponse.json({
      success: true,
      unfrozen: true,
      attempt: unfrozen,
      message: 'Assessment attempt successfully unfrozen by Dhdc admin.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to unfreeze attempt' }, { status: 500 });
  }
}
