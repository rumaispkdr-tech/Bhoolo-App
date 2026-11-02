import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { admissionNumber, password } = await req.json();

    if (!admissionNumber || !password) {
      return NextResponse.json({ error: 'Admission Number and Password are required' }, { status: 400 });
    }

    const student = await db.getStudentByAdmission(admissionNumber);
    if (!student) {
      return NextResponse.json({ error: 'Student with this admission number was not found' }, { status: 401 });
    }

    if (student.status !== 'active') {
      return NextResponse.json({ error: 'This student account has been suspended. Please contact administrator.' }, { status: 403 });
    }

    const isValid = await verifyPassword(password, student.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password. Please check your credentials.' }, { status: 401 });
    }

    const token = signAuthToken({
      id: student.id,
      role: 'student',
      name: student.name,
      admissionNumber: student.admissionNumber,
      class: student.class,
      division: student.division,
      email: student.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: student.id,
        role: 'student',
        name: student.name,
        admissionNumber: student.admissionNumber,
        class: student.class,
        division: student.division,
        email: student.email,
      },
      token,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
