const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const csvPath = path.join(__dirname, '..', 'data', 'students_cohort.csv');
const rawCsv = fs.readFileSync(csvPath, 'utf-8');

const lines = rawCsv.split(/\r?\n/).filter(line => line.trim().length > 0);

// Admin credentials:
// Admission Number: 000
// Password: ADM-000
const adminHash = bcrypt.hashSync('ADM-000', 10);
const adminUser = {
  id: 'a0000000-0000-0000-0000-000000000001',
  admissionNumber: '000',
  email: 'admin@bhoolo.com',
  name: 'Dhdc',
  role: 'superadmin',
  passwordHash: adminHash,
  createdAt: '2026-11-01T00:00:00.000Z',
};

const students = [];
const seenAdm = new Set();

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts.length < 6) continue;

  const chestNo = parts[1]?.trim() || '';
  const sibaqName = parts[2]?.trim() || '';
  const admNo = parts[3]?.trim() || '';
  const collegeName = parts[4]?.trim() || '';
  const studentClass = parts[5]?.trim() || '';

  if (!admNo || seenAdm.has(admNo)) continue;
  seenAdm.add(admNo);

  const studentName = collegeName || sibaqName;
  // User rule: "password 2times repeat of their adm number that means rumais .p studenst adm number = 844 so,password = 844844"
  const plainPassword = `${admNo}${admNo}`;
  const passwordHash = bcrypt.hashSync(plainPassword, 8); // fast round for seed

  students.push({
    id: `s-${admNo}`,
    admissionNumber: admNo,
    name: studentName,
    email: `${admNo}@bhoolo.edu`,
    class: studentClass,
    division: chestNo,
    contactNumber: '',
    status: 'active',
    passwordHash: passwordHash,
    createdAt: '2026-11-01T00:00:00.000Z',
  });
}

console.log(`Parsed ${students.length} unique students from CSV.`);

// Clean initial database without demo assessments, demo assignments, demo attempts, or demo results
const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const dbData = {
  admins: [adminUser],
  students: students,
  assessments: [],
  assignments: [],
  attempts: [],
  results: [],
  auditLogs: [
    {
      id: 'log-init',
      actorId: 'a0000000-0000-0000-0000-000000000001',
      actorRole: 'admin',
      actorName: 'Dhdc',
      action: 'SYSTEM_INITIALIZED',
      targetType: 'system',
      targetId: 'a0000000-0000-0000-0000-000000000001',
      details: { message: 'Bhoolo Assessment Platform initialized' },
      timestamp: '2026-11-01T00:00:00.000Z',
    },
  ],
};

fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
console.log('Successfully cleaned database and saved fresh state to data/db.json!');
