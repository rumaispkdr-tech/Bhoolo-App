import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';
import { Assessment, Question } from '@/lib/types';

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as 'quiz' | 'exam' | null;

  const assessments = await db.listAssessments(type || undefined);
  return NextResponse.json({ assessments });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      subject,
      type,
      instructions,
      startDate,
      endDate,
      durationMinutes,
      marksPerQuestion = 1,
      negativeMarking = false,
      negativeMarkValue = 0,
      maxAttempts = 1,
      feedbackMode = 'instant',
      isPublished = true,
      questions = [],
    } = body;

    if (!title || !subject || !type) {
      return NextResponse.json({ error: 'Title, Subject, and Assessment Type are required.' }, { status: 400 });
    }

    const calculatedTotalMarks = (questions as Question[]).reduce(
      (sum, q) => sum + (Number(q.marks) || Number(marksPerQuestion) || 1), 
      0
    );

    const newAssessmentId = `${type === 'quiz' ? 'q' : 'e'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Normalize questions with ID and assessmentId
    const formattedQuestions: Question[] = questions.map((q: any, idx: number) => ({
      id: q.id || `quest-${Date.now()}-${idx + 1}`,
      assessmentId: newAssessmentId,
      questionText: q.questionText,
      explanation: q.explanation || '',
      marks: Number(q.marks) || Number(marksPerQuestion) || 1,
      negativeMarks: negativeMarking ? Number(negativeMarkValue) : 0,
      imageUrl: q.imageUrl || '',
      orderIndex: idx + 1,
      correctOptionKey: q.correctOptionKey || 'A',
      options: (q.options || []).map((opt: any, optIdx: number) => ({
        id: opt.id || `opt-${idx + 1}-${opt.key || String.fromCharCode(65 + optIdx)}`,
        key: opt.key || (['A', 'B', 'C', 'D'][optIdx] as any),
        text: opt.text || '',
        isCorrect: opt.key === q.correctOptionKey,
      })),
    }));

    const assessment: Assessment = {
      id: newAssessmentId,
      title: title.trim(),
      description: description?.trim() || '',
      subject: subject.trim(),
      type,
      instructions: instructions?.trim() || '',
      startDate,
      endDate,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      marksPerQuestion: Number(marksPerQuestion) || 1,
      totalMarks: calculatedTotalMarks,
      negativeMarking: !!negativeMarking,
      negativeMarkValue: Number(negativeMarkValue) || 0,
      maxAttempts: Number(maxAttempts) || 1,
      feedbackMode: type === 'quiz' ? feedbackMode : 'after_deadline',
      isPublished: Boolean(isPublished),
      createdBy: session.id,
      createdAt: new Date().toISOString(),
      questions: formattedQuestions,
    };

    await db.createAssessment(assessment);

    return NextResponse.json({ success: true, assessment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create assessment' }, { status: 500 });
  }
}
