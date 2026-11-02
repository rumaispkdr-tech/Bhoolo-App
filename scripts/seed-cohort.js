const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const csvPath = path.join(__dirname, '..', 'data', 'students_cohort.csv');
const rawCsv = fs.readFileSync(csvPath, 'utf-8');

const lines = rawCsv.split(/\r?\n/).filter(line => line.trim().length > 0);
const headers = lines[0].split(',').map(h => h.trim());

// Admin credentials:
// Admission Number: 000
// Password: ADM-000
const adminHash = bcrypt.hashSync('ADM-000', 10);
const adminUser = {
  id: 'a0000000-0000-0000-0000-000000000001',
  admissionNumber: '000',
  email: 'admin@quizplatform.com',
  name: 'System Administrator',
  role: 'superadmin',
  passwordHash: adminHash,
  createdAt: new Date().toISOString(),
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
    email: `${admNo}@school.edu`,
    class: studentClass,
    division: chestNo,
    contactNumber: '',
    status: 'active',
    passwordHash: passwordHash,
    createdAt: new Date().toISOString(),
  });
}

console.log(`Parsed ${students.length} unique students from CSV.`);

// Load existing db.json or fallback
const dbPath = path.join(__dirname, '..', 'data', 'db.json');
let dbData = {
  admins: [adminUser],
  students: students,
  assessments: [],
  assignments: [],
  attempts: [],
  results: [],
  auditLogs: [],
};

if (fs.existsSync(dbPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    dbData.assessments = existing.assessments || [];
    dbData.attempts = existing.attempts || [];
    dbData.results = existing.results || [];
    dbData.auditLogs = existing.auditLogs || [];
  } catch (e) {
    console.error('Error reading existing db:', e);
  }
}

// Ensure Admin is updated
dbData.admins = [adminUser];
dbData.students = students;

// Automatically assign Assessment 1 and Assessment 2 to all students (including 844 - RUMAIS)
if (dbData.assessments && dbData.assessments.length > 0) {
  const assignments = [];
  const now = new Date().toISOString();

  students.forEach((st, idx) => {
    // Assign Quiz 1
    assignments.push({
      id: `asg-q-${st.admissionNumber}`,
      assessmentId: dbData.assessments[0].id,
      studentId: st.id,
      deadline: '2026-12-31T23:59:59Z',
      timeLimitMinutes: 20,
      attemptLimit: 3,
      status: 'assigned',
      assignedAt: now,
      attemptsUsed: 0,
    });

    // Assign Exam 1 if available
    if (dbData.assessments[1]) {
      assignments.push({
        id: `asg-e-${st.admissionNumber}`,
        assessmentId: dbData.assessments[1].id,
        studentId: st.id,
        deadline: '2026-12-31T23:59:59Z',
        timeLimitMinutes: 30,
        attemptLimit: 1,
        status: 'assigned',
        assignedAt: now,
        attemptsUsed: 0,
      });
    }
  });

  dbData.assignments = assignments;
  console.log(`Created ${assignments.length} assignments for ${students.length} students.`);
}

fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
console.log('Successfully saved to data/db.json!');
