import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Individual Quiz Platform';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Students Template');

    sheet.columns = [
      { header: 'Admission Number', key: 'admissionNumber', width: 22 },
      { header: 'Full Name', key: 'name', width: 26 },
      { header: 'Class', key: 'class', width: 14 },
      { header: 'Division', key: 'division', width: 14 },
      { header: 'Contact Number', key: 'contactNumber', width: 20 },
      { header: 'Email Address', key: 'email', width: 26 },
      { header: 'Password (Optional)', key: 'password', width: 22 },
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }, // Master Blue #2563EB
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Add sample rows
    sheet.addRow({
      admissionNumber: 'ADM2026101',
      name: 'James Wilson',
      class: '10',
      division: 'A',
      contactNumber: '+1 555-0101',
      email: 'james.wilson@school.edu',
      password: 'StudentPass123!',
    });
    sheet.addRow({
      admissionNumber: 'ADM2026102',
      name: 'Emma Watson',
      class: '10',
      division: 'B',
      contactNumber: '+1 555-0102',
      email: 'emma.watson@school.edu',
      password: 'StudentPass123!',
    });
    sheet.addRow({
      admissionNumber: 'ADM2026103',
      name: 'Liam Neeson',
      class: '11',
      division: 'A',
      contactNumber: '+1 555-0103',
      email: 'liam.neeson@school.edu',
      password: 'StudentPass123!',
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Students_Import_Template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate Excel template' }, { status: 500 });
  }
}
