import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
  }

  try {
    const { assignmentId } = await req.json();
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const { attempt, assessment } = await db.startAttempt(assignmentId, session.id);

    // Sanitize questions: strip correct answers and explanations for in-progress attempt
    const sanitizedQuestions = (assessment.questions || []).map(q => {
      // Find if student has already locked an answer in this attempt
      const lockedAnswer = attempt.answers.find(a => a.questionId === q.id && a.isLocked);

      return {
        id: q.id,
        orderIndex: q.orderIndex,
        questionText: q.questionText,
        marks: q.marks,
        imageUrl: q.imageUrl,
        options: q.options.map(opt => ({
          id: opt.id,
          key: opt.key,
          text: opt.text,
        })),
        // Reveal explanation & correct key ONLY if already submitted and locked
        explanation: lockedAnswer ? q.explanation : undefined,
        correctOptionKey: lockedAnswer ? q.correctOptionKey : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      attempt,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        subject: assessment.subject,
        type: assessment.type,
        instructions: assessment.instructions,
        durationMinutes: assessment.durationMinutes,
        totalMarks: assessment.totalMarks,
        negativeMarking: assessment.negativeMarking,
        feedbackMode: assessment.feedbackMode,
        questions: sanitizedQuestions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to start assessment attempt',
      code: error.code,
      resultId: error.resultId
    }, { status: 400 });
  }
}
