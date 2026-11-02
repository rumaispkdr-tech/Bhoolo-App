import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession, hashPassword } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || undefined;
  const studentClass = searchParams.get('class') || undefined;
  const division = searchParams.get('division') || undefined;

  const students = await db.listStudents({ query, class: studentClass, division });
  return NextResponse.json({ students });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { admissionNumber, name, email, class: studentClass, division, contactNumber, password } = body;

    if (!admissionNumber || !name || !studentClass || !division) {
      return NextResponse.json({ error: 'Admission Number, Name, Class, and Division are required.' }, { status: 400 });
    }

    const existing = await db.getStudentByAdmission(admissionNumber);
    if (existing) {
      return NextResponse.json({ error: `Student with admission number ${admissionNumber} already exists.` }, { status: 400 });
    }

    const initialPassword = password || 'StudentPass123!';
    const passwordHash = await hashPassword(initialPassword);

    const newStudent = await db.createStudent({
      id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      admissionNumber: admissionNumber.trim().toUpperCase(),
      name: name.trim(),
      email: email?.trim(),
      class: studentClass.trim(),
      division: division.trim().toUpperCase(),
      contactNumber: contactNumber?.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      passwordHash,
    });

    return NextResponse.json({ success: true, student: newStudent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 });
  }
}
