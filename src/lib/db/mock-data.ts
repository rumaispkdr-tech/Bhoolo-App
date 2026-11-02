import { AdminUser, Student, Assessment, Assignment, AssessmentAttempt, AssessmentResult, AuditLog } from '../types';

export const INITIAL_ADMINS: (AdminUser & { passwordHash: string })[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@bhoolo.com',
    admissionNumber: '000',
    name: 'Dhdc',
    role: 'superadmin',
    passwordHash: '$2a$10$gLZz7ThbpuuQdbKN.8bE9.DSFLVrUxSSi9CsX68SwVEOuu9rIIIhO', // ADM-000
    createdAt: '2026-10-01T08:00:00Z',
  },
];

export const INITIAL_STUDENTS: (Student & { passwordHash: string })[] = [];
export const INITIAL_ASSESSMENTS: Assessment[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_ATTEMPTS: AssessmentAttempt[] = [];
export const INITIAL_RESULTS: AssessmentResult[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-init',
    actorId: 'a0000000-0000-0000-0000-000000000001',
    actorRole: 'admin',
    actorName: 'Dhdc',
    action: 'SYSTEM_INITIALIZED',
    targetType: 'system',
    targetId: 'a0000000-0000-0000-0000-000000000001',
    details: { message: 'Bhoolo Assessment Platform initialized' },
    timestamp: '2026-11-01T00:00:00Z',
  },
];
