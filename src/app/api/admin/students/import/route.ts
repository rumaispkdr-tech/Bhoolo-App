import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { db } from '@/lib/db';
import { getServerSession, hashPassword } from '@/lib/auth';
import { Student } from '@/lib/types';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No Excel file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: 'The uploaded Excel file has no worksheets.' }, { status: 400 });
    }

    // Determine header mapping from Row 1
    const headers: { [colIndex: number]: string } = {};
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      const val = cell.value?.toString().toLowerCase().trim() || '';
      if (val.includes('admi') || val.includes('adm') || val.includes('roll')) {
        headers[colNumber] = 'admissionNumber';
      } else if (val.includes('name') || val.includes('student')) {
        headers[colNumber] = 'name';
      } else if (val.includes('class') || val.includes('grade')) {
        headers[colNumber] = 'class';
      } else if (val.includes('div') || val.includes('sec')) {
        headers[colNumber] = 'division';
      } else if (val.includes('phone') || val.includes('contact') || val.includes('mobile')) {
        headers[colNumber] = 'contactNumber';
      } else if (val.includes('mail')) {
        headers[colNumber] = 'email';
      } else if (val.includes('pass')) {
        headers[colNumber] = 'password';
      }
    });

    const studentsToImport: (Student & { passwordHash: string })[] = [];
    const successfulImports: Array<{ admissionNumber: string; name: string; class: string; division: string }> = [];
    const failedRecords: Array<{ rowNumber: number; reason: string; data?: any }> = [];
    const seenInFile = new Set<string>();

    const defaultPassHash = await hashPassword('StudentPass123!');

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row || !row.hasValues) continue;

      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const key = headers[colNumber];
        if (key) {
          rowData[key] = cell.value?.toString().trim();
        }
      });

      // Also support positional fallback if headers were slightly unmapped
      if (!rowData.admissionNumber && row.getCell(1).value) {
        rowData.admissionNumber = row.getCell(1).value?.toString().trim();
      }
      if (!rowData.name && row.getCell(2).value) {
        rowData.name = row.getCell(2).value?.toString().trim();
      }
      if (!rowData.class && row.getCell(3).value) {
        rowData.class = row.getCell(3).value?.toString().trim();
      }
      if (!rowData.division && row.getCell(4).value) {
        rowData.division = row.getCell(4).value?.toString().trim();
      }

      if (!rowData.admissionNumber) {
        failedRecords.push({ rowNumber, reason: 'Missing Admission Number', data: rowData });
        continue;
      }

      const admClean = rowData.admissionNumber.toUpperCase();

      if (!rowData.name) {
        failedRecords.push({ rowNumber, reason: 'Missing Student Name', data: rowData });
        continue;
      }

      if (!rowData.class) {
        failedRecords.push({ rowNumber, reason: 'Missing Class specification', data: rowData });
        continue;
      }

      if (seenInFile.has(admClean)) {
        failedRecords.push({ rowNumber, reason: `Duplicate Admission Number '${admClean}' found in same sheet`, data: rowData });
        continue;
      }
      seenInFile.add(admClean);

      // Auto-generate password as admission number repeated 2 times (e.g. 844 -> 844844)
      let plainPassword = `${admClean}${admClean}`;
      if (rowData.password && rowData.password.trim().length >= 4) {
        plainPassword = rowData.password.trim();
      }
      const passwordHash = await hashPassword(plainPassword);

      const studentRecord: Student & { passwordHash: string } = {
        id: `s-import-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        admissionNumber: admClean,
        name: rowData.name,
        email: rowData.email || `${admClean.toLowerCase()}@school.edu`,
        class: String(rowData.class),
        division: (rowData.division || 'A').toUpperCase(),
        contactNumber: rowData.contactNumber || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        passwordHash,
      };

      studentsToImport.push(studentRecord);
      successfulImports.push({
        admissionNumber: studentRecord.admissionNumber,
        name: studentRecord.name,
        class: studentRecord.class,
        division: studentRecord.division,
      });
    }

    if (studentsToImport.length > 0) {
      await db.bulkCreateOrUpdateStudents(studentsToImport);
    }

    return NextResponse.json({
      success: true,
      totalRowsProcessed: worksheet.rowCount - 1,
      successfulCount: successfulImports.length,
      failedCount: failedRecords.length,
      successfulImports,
      failedRecords,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to parse Excel file' }, { status: 500 });
  }
}
