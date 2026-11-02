import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
  }

  try {
    const { attemptId, questionId, selectedOptionKey } = await req.json();

    if (!attemptId || !questionId || !selectedOptionKey) {
      return NextResponse.json({ error: 'Attempt ID, Question ID, and Selected Option are required' }, { status: 400 });
    }

    const result = await db.answerQuestion({
      attemptId,
      studentId: session.id,
      questionId,
      selectedOptionKey,
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      instantFeedback: result.instantFeedback,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record answer' }, { status: 400 });
  }
}
