import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { admissionNumber, password } = await req.json();

    if (!admissionNumber || !password) {
      return NextResponse.json(
        { error: 'Admission Number and Password are required' },
        { status: 400 }
      );
    }

    const cleanAdm = admissionNumber.toString().trim().toUpperCase();
    const cleanPass = password.toString().trim();

    // 1. Check if Admin credentials
    // Admin Admission Number: 000 | Password: ADM-000
    if (cleanAdm === '000' || cleanAdm === 'ADM-000') {
      const admin = await db.getAdminByAdmission('000');
      let isAdminValid = false;

      if (admin) {
        isAdminValid = await verifyPassword(cleanPass, admin.passwordHash);
      }
      // Direct fallback check if hash match or literal ADM-000
      if (!isAdminValid && cleanPass === 'ADM-000') {
        isAdminValid = true;
      }

      if (isAdminValid) {
        const token = signAuthToken({
          id: admin?.id || 'a0000000-0000-0000-0000-000000000001',
          role: 'admin',
          name: admin?.name || 'Dhdc',
          email: admin?.email || 'admin@bhoolo.com',
          admissionNumber: '000',
        });

        const response = NextResponse.json({
          success: true,
          role: 'admin',
          redirectTo: '/admin/dashboard',
          user: {
            id: admin?.id || 'a0000000-0000-0000-0000-000000000001',
            role: 'admin',
            name: admin?.name || 'Dhdc',
            admissionNumber: '000',
          },
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
      } else {
        return NextResponse.json(
          { error: 'Invalid admin credentials.' },
          { status: 401 }
        );
      }
    }

    // 2. Student Authentication
    // Check against student roster by admission number
    const student = await db.getStudentByAdmission(cleanAdm);
    if (!student) {
      return NextResponse.json(
        { error: `No student found with Admission Number "${cleanAdm}".` },
        { status: 401 }
      );
    }

    if (student.status !== 'active') {
      return NextResponse.json(
        { error: 'This student account has been suspended. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Verify password (either bcrypt or default repeat check: admNo + admNo)
    let isStudentValid = await verifyPassword(cleanPass, student.passwordHash);
    if (!isStudentValid && cleanPass === `${student.admissionNumber}${student.admissionNumber}`) {
      isStudentValid = true;
    }

    if (!isStudentValid) {
      return NextResponse.json(
        { error: 'Invalid password. (Default password is your admission number twice, e.g. 844844).' },
        { status: 401 }
      );
    }

    // Sign session token
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
      role: 'student',
      redirectTo: '/student/dashboard',
      user: {
        id: student.id,
        role: 'student',
        name: student.name,
        admissionNumber: student.admissionNumber,
        class: student.class,
        division: student.division,
      },
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
    return NextResponse.json(
      { error: error.message || 'Internal server authentication error' },
      { status: 500 }
    );
  }
}
