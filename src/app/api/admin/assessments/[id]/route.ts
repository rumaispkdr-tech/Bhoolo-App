import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const assessment = await db.getAssessmentById(params.id, true);
  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  return NextResponse.json({ assessment });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const updates = await req.json();
    const updated = await db.updateAssessment(params.id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, assessment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update assessment' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const success = await db.deleteAssessment(params.id);
  if (!success) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Assessment deleted' });
}
