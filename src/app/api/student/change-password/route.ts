import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession, hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 403 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    const student = await db.getStudentById(session.id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const isMatch = await verifyPassword(currentPassword, (student as any).passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await db.updateStudentPassword(session.id, newHash);

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to change password' }, { status: 500 });
  }
}
