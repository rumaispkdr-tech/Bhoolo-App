import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/db';

async function runTest() {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized: Admin session required. Please re-login.' 
      }, { status: 403 });
    }

    const result = await db.testCloudConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal connection test failure',
    }, { status: 500 });
  }
}

export async function GET() {
  return runTest();
}

export async function POST() {
  return runTest();
}
