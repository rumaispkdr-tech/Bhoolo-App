import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  AdminUser, Student, Assessment, Assignment, 
  AssessmentAttempt, AssessmentResult, AuditLog, 
  Question, StudentAnswer, AssessmentOption 
} from '../types';
import { 
  INITIAL_ADMINS, INITIAL_STUDENTS, INITIAL_ASSESSMENTS, 
  INITIAL_ASSIGNMENTS, INITIAL_ATTEMPTS, INITIAL_RESULTS, 
  INITIAL_AUDIT_LOGS 
} from './mock-data';

export interface DatabaseState {
  admins: (AdminUser & { passwordHash: string })[];
  students: (Student & { passwordHash: string })[];
  assessments: Assessment[];
  assignments: Assignment[];
  attempts: AssessmentAttempt[];
  results: AssessmentResult[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
// In serverless environments (Vercel), only /tmp is writable
const TMP_FILE = path.join('/tmp', 'bhoolo_db.json');

class DatabaseEngine {
  private state: DatabaseState;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;
  private supabaseClient: SupabaseClient | null = null;

  constructor() {
    this.state = this.loadLocalFallback();
  }

  private initSupabase(): SupabaseClient | null {
    if (this.supabaseClient) return this.supabaseClient;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (url && key && url.startsWith('http')) {
      try {
        this.supabaseClient = createClient(url, key, {
          auth: { persistSession: false },
        });
        return this.supabaseClient;
      } catch (e: any) {
        console.warn('[DatabaseEngine] Failed to initialize Supabase client:', e.message);
      }
    }
    return null;
  }

  private loadLocalFallback(): DatabaseState {
    try {
      // 1. Try writable /tmp cache if present (serverless warm instance)
      if (fs.existsSync(TMP_FILE)) {
        const raw = fs.readFileSync(TMP_FILE, 'utf-8');
        return JSON.parse(raw);
      }

      // 2. Try repository data/db.json
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[DatabaseEngine] Error reading local db.json, falling back to initial data:', e);
    }

    const defaultState: DatabaseState = {
      admins: [...INITIAL_ADMINS],
      students: [...INITIAL_STUDENTS],
      assessments: [...INITIAL_ASSESSMENTS],
      assignments: [...INITIAL_ASSIGNMENTS],
      attempts: [...INITIAL_ATTEMPTS],
      results: [...INITIAL_RESULTS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
    };

    return defaultState;
  }

  public async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        // Option 1: Supabase Cloud Database (PostgreSQL Table or Storage Bucket)
        const supabase = this.initSupabase();
        if (supabase) {
          let tableLoaded = false;
          try {
            const { data, error } = await supabase
              .from('bhoolo_state')
              .select('data')
              .eq('key', 'main')
              .maybeSingle();

            if (!error && data && data.data && Array.isArray(data.data.students)) {
              this.state = data.data;
              this.isLoaded = true;
              tableLoaded = true;
              console.log('[DatabaseEngine] Loaded live state from Supabase Table');
              return;
            } else if (!error && !data) {
              console.log('[DatabaseEngine] Initializing state in Supabase Table...');
              await supabase.from('bhoolo_state').upsert({
                key: 'main',
                data: this.state,
                updated_at: new Date().toISOString(),
              });
              this.isLoaded = true;
              tableLoaded = true;
              return;
            }
          } catch (e: any) {
            console.warn('[DatabaseEngine] Supabase table read failed:', e.message);
          }

          // Fallback to Supabase Storage Bucket if table does not exist
          if (!tableLoaded) {
            try {
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('bhoolo-db')
                .download('db.json');

              if (!downloadError && fileData) {
                const text = await fileData.text();
                const parsed = JSON.parse(text);
                if (parsed && Array.isArray(parsed.students)) {
                  this.state = parsed;
                  this.isLoaded = true;
                  console.log('[DatabaseEngine] Loaded live state from Supabase Storage bucket');
                  return;
                }
              } else {
                await supabase.storage.createBucket('bhoolo-db', { public: false }).catch(() => {});
                await supabase.storage.from('bhoolo-db').upload('db.json', JSON.stringify(this.state, null, 2), {
                  upsert: true,
                  contentType: 'application/json',
                });
                this.isLoaded = true;
                return;
              }
            } catch (storageErr: any) {
              console.warn('[DatabaseEngine] Supabase storage read exception:', storageErr.message);
            }
          }
        }

        // Option 2: Vercel KV / Upstash Redis (1-Click Storage on Vercel)
        const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
        if (kvUrl && kvToken) {
          try {
            const res = await fetch(`${kvUrl}/get/bhoolo_state`, {
              headers: { Authorization: `Bearer ${kvToken}` },
              cache: 'no-store',
            });
            const json = await res.json();
            if (json && json.result) {
              const loaded = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
              if (loaded && Array.isArray(loaded.students)) {
                this.state = loaded;
                this.isLoaded = true;
                console.log('[DatabaseEngine] Loaded live state from Vercel KV / Upstash');
                return;
              }
            } else {
              // Seed initial state into KV
              await fetch(`${kvUrl}/set/bhoolo_state`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${kvToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.state),
              });
              this.isLoaded = true;
              return;
            }
          } catch (e: any) {
            console.warn('[DatabaseEngine] Vercel KV read exception:', e.message);
          }
        }

        // Option 3: Local filesystem (always has 153 cohort students embedded in memory)
        this.isLoaded = true;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  private async save(): Promise<void> {
    // 1. Write to local filesystem or /tmp for local resilience
    this.saveToFile(this.state);

    // 2. Synchronize to Supabase if available
    const supabase = this.initSupabase();
    if (supabase) {
      let tableSaved = false;
      try {
        const { error } = await supabase.from('bhoolo_state').upsert({
          key: 'main',
          data: this.state,
          updated_at: new Date().toISOString(),
        });
        if (!error) {
          tableSaved = true;
        }
      } catch (e: any) {
        console.warn('[DatabaseEngine] Supabase table save warning:', e.message);
      }

      if (!tableSaved) {
        try {
          await supabase.storage.createBucket('bhoolo-db', { public: false }).catch(() => {});
          await supabase.storage.from('bhoolo-db').upload('db.json', JSON.stringify(this.state, null, 2), {
            upsert: true,
            contentType: 'application/json',
          });
        } catch (storageErr: any) {
          console.warn('[DatabaseEngine] Supabase storage save warning:', storageErr.message);
        }
      }
    }

    // 3. Synchronize to Vercel KV / Upstash if available
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (kvUrl && kvToken) {
      try {
        await fetch(`${kvUrl}/set/bhoolo_state`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kvToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.state),
        });
      } catch (e: any) {
        console.warn('[DatabaseEngine] Vercel KV cloud save warning:', e.message);
      }
    }
  }

  private saveToFile(state: DatabaseState): void {
    // Try writing to data/db.json first (local dev)
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
      return;
    } catch {
      // In serverless environments, DATA_DIR may be read-only
    }

    // Fallback to /tmp (writable in serverless)
    try {
      fs.writeFileSync(TMP_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[DatabaseEngine] Local file write skipped:', e);
    }
  }

  public async getStorageInfo() {
    await this.ensureLoaded();

    const hasSupabase = !!(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
    );
    const hasKv = !!(
      (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
      (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
    );

    let provider: 'supabase' | 'vercel_kv' | 'local' = 'local';
    let statusMessage = 'Local File System (Ephemeral on Vercel)';
    let isConnected = false;

    if (hasSupabase) {
      provider = 'supabase';
      statusMessage = 'Connected to Supabase PostgreSQL Cloud';
      isConnected = true;
    } else if (hasKv) {
      provider = 'vercel_kv';
      statusMessage = 'Connected to Vercel KV / Upstash Redis';
      isConnected = true;
    }

    return {
      provider,
      statusMessage,
      isConnected,
      totalStudents: this.state.students.length,
      totalAssessments: this.state.assessments.length,
      totalAssignments: this.state.assignments.length,
      totalAttempts: this.state.attempts.length,
      totalResults: this.state.results.length,
      totalAuditLogs: this.state.auditLogs.length,
    };
  }

  public async testCloudConnection() {
    const supabase = this.initSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('bhoolo_state').select('key').eq('key', 'main').maybeSingle();
        if (error) {
          return {
            success: false,
            provider: 'supabase',
            message: `Supabase Table Error: "${error.message}". Did you run the SQL snippet in Supabase SQL Editor to create the "bhoolo_state" table?`,
            code: error.code,
          };
        }

        const { error: writeErr } = await supabase.from('bhoolo_state').upsert({
          key: 'main',
          data: this.state,
          updated_at: new Date().toISOString(),
        });

        if (writeErr) {
          return {
            success: false,
            provider: 'supabase',
            message: `Supabase Write Error: "${writeErr.message}". Your RLS policy might be blocking writes. Run the updated SQL policy in Supabase SQL Editor!`,
            code: writeErr.code,
          };
        }

        return {
          success: true,
          provider: 'supabase',
          message: 'Supabase Cloud Database verified successfully! Read & write access is working.',
        };
      } catch (e: any) {
        return {
          success: false,
          provider: 'supabase',
          message: `Supabase connection exception: ${e.message}`,
        };
      }
    }

    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (kvUrl && kvToken) {
      try {
        await fetch(`${kvUrl}/set/bhoolo_ping`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` },
          body: 'pong',
        });
        const res = await fetch(`${kvUrl}/get/bhoolo_ping`, {
          headers: { Authorization: `Bearer ${kvToken}` },
        });
        const json = await res.json();
        if (json.result === 'pong') {
          return {
            success: true,
            provider: 'vercel_kv',
            message: 'Vercel KV / Upstash connected and verified! Read & write is active.',
          };
        }
      } catch (e: any) {
        return {
          success: false,
          provider: 'vercel_kv',
          message: `Vercel KV connection error: ${e.message}`,
        };
      }
    }

    return {
      success: false,
      provider: 'local',
      message: 'No cloud database environment variables found. On Vercel, created quizzes and student projects will be lost after page refreshes until Supabase or Vercel KV is connected.',
    };
  }

  // --- ADMIN OPERATIONS ---
  async getAdminByEmail(email: string) {
    await this.ensureLoaded();
    return this.state.admins.find(a => a.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getAdminByAdmission(admNumber: string) {
    await this.ensureLoaded();
    return this.state.admins.find(a => (a.admissionNumber || '000').toUpperCase() === admNumber.toUpperCase()) || null;
  }

  async getAdminById(id: string) {
    await this.ensureLoaded();
    return this.state.admins.find(a => a.id === id) || null;
  }

  // --- STUDENT OPERATIONS ---
  async getStudentByAdmission(admNumber: string) {
    await this.ensureLoaded();
    return this.state.students.find(s => s.admissionNumber.toUpperCase() === admNumber.toUpperCase()) || null;
  }

  async getStudentById(id: string) {
    await this.ensureLoaded();
    return this.state.students.find(s => s.id === id) || null;
  }

  async listStudents(filter?: { query?: string; class?: string; division?: string }) {
    await this.ensureLoaded();
    let list = [...this.state.students];

    if (filter?.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.admissionNumber.toLowerCase().includes(q)
      );
    }

    if (filter?.class && filter.class !== 'all') {
      list = list.filter(s => s.class === filter.class);
    }

    if (filter?.division && filter.division !== 'all') {
      list = list.filter(s => s.division === filter.division);
    }

    return list;
  }

  async createStudent(student: Student & { passwordHash: string }) {
    await this.ensureLoaded();
    this.state.students.push(student);
    await this.save();
    return student;
  }

  async bulkCreateOrUpdateStudents(students: (Student & { passwordHash: string })[]) {
    await this.ensureLoaded();
    const created: string[] = [];
    const updated: string[] = [];

    for (const st of students) {
      const existingIdx = this.state.students.findIndex(s => s.admissionNumber.toUpperCase() === st.admissionNumber.toUpperCase());
      if (existingIdx >= 0) {
        this.state.students[existingIdx] = {
          ...this.state.students[existingIdx],
          name: st.name,
          class: st.class,
          division: st.division,
          contactNumber: st.contactNumber || this.state.students[existingIdx].contactNumber,
          updatedAt: new Date().toISOString(),
        };
        updated.push(st.admissionNumber);
      } else {
        this.state.students.push(st);
        created.push(st.admissionNumber);
      }
    }
    await this.save();
    return { created, updated };
  }

  async updateStudentPassword(studentId: string, newPasswordHash: string) {
    await this.ensureLoaded();
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return false;
    student.passwordHash = newPasswordHash;
    student.updatedAt = new Date().toISOString();
    await this.save();
    return true;
  }

  // --- ASSESSMENT OPERATIONS ---
  async listAssessments(type?: 'quiz' | 'exam') {
    await this.ensureLoaded();
    let list = this.state.assessments;
    if (type) {
      list = list.filter(a => a.type === type);
    }

    return list.map(a => {
      const asg = this.state.assignments.filter(x => x.assessmentId === a.id);
      const completed = asg.filter(x => x.status === 'completed');
      return {
        ...a,
        assignedCount: asg.length,
        completedCount: completed.length,
      };
    });
  }

  async getAssessmentById(id: string, includeAnswers = true) {
    await this.ensureLoaded();
    const assessment = this.state.assessments.find(a => a.id === id);
    if (!assessment) return null;

    if (includeAnswers) {
      return assessment;
    }

    // Sanitize correct answers for student client consumption
    return {
      ...assessment,
      questions: assessment.questions?.map(q => ({
        ...q,
        correctOptionKey: undefined as any,
        explanation: undefined as any,
        options: q.options.map(opt => ({
          ...opt,
          isCorrect: undefined,
        }))
      }))
    };
  }

  async createAssessment(assessment: Assessment) {
    await this.ensureLoaded();
    this.state.assessments.unshift(assessment);
    this.addAuditLog({
      actorId: 'a0000000-0000-0000-0000-000000000001',
      actorRole: 'admin',
      actorName: 'Dhdc',
      action: 'ASSESSMENT_CREATED',
      targetType: assessment.type,
      targetId: assessment.id,
      details: { title: assessment.title, subject: assessment.subject, totalMarks: assessment.totalMarks },
    });
    await this.save();
    return assessment;
  }

  async updateAssessment(id: string, updates: Partial<Assessment>) {
    await this.ensureLoaded();
    const idx = this.state.assessments.findIndex(a => a.id === id);
    if (idx < 0) return null;

    this.state.assessments[idx] = {
      ...this.state.assessments[idx],
      ...updates,
    };
    await this.save();
    return this.state.assessments[idx];
  }

  async deleteAssessment(id: string) {
    await this.ensureLoaded();
    const idx = this.state.assessments.findIndex(a => a.id === id);
    if (idx < 0) return false;

    this.state.assessments.splice(idx, 1);
    this.state.assignments = this.state.assignments.filter(asg => asg.assessmentId !== id);
    await this.save();
    return true;
  }

  // --- ASSIGNMENT OPERATIONS ---
  async listAssignments(assessmentId?: string) {
    await this.ensureLoaded();
    let list = [...this.state.assignments];
    if (assessmentId) {
      list = list.filter(a => a.assessmentId === assessmentId);
    }

    return list.map(asg => {
      const student = this.state.students.find(s => s.id === asg.studentId);
      const assessment = this.state.assessments.find(a => a.id === asg.assessmentId);
      return {
        ...asg,
        student,
        assessment,
      };
    });
  }

  async getAssignmentsByStudentId(studentId: string) {
    await this.ensureLoaded();
    const assignments = this.state.assignments.filter(a => a.studentId === studentId);
    return assignments.map(asg => {
      const assessment = this.state.assessments.find(a => a.id === asg.assessmentId);
      return {
        ...asg,
        assessment,
      };
    });
  }

  async assignStudentsToAssessment(params: {
    assessmentId: string;
    studentIds: string[];
    deadline?: string;
    timeLimitMinutes?: number;
    attemptLimit?: number;
  }) {
    await this.ensureLoaded();
    const { assessmentId, studentIds, deadline, timeLimitMinutes, attemptLimit = 1 } = params;
    const added: Assignment[] = [];

    for (const studentId of studentIds) {
      const existing = this.state.assignments.find(
        a => a.assessmentId === assessmentId && a.studentId === studentId
      );

      if (existing) {
        existing.deadline = deadline || existing.deadline;
        existing.timeLimitMinutes = timeLimitMinutes || existing.timeLimitMinutes;
        existing.attemptLimit = attemptLimit || existing.attemptLimit;
        added.push(existing);
      } else {
        const newAssignment: Assignment = {
          id: `asg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          assessmentId,
          studentId,
          deadline,
          timeLimitMinutes,
          attemptLimit,
          status: 'assigned',
          assignedAt: new Date().toISOString(),
          attemptsUsed: 0,
        };
        this.state.assignments.push(newAssignment);
        added.push(newAssignment);
      }
    }

    const assessment = this.state.assessments.find(a => a.id === assessmentId);
    this.addAuditLog({
      actorId: 'a0000000-0000-0000-0000-000000000001',
      actorRole: 'admin',
      actorName: 'Dhdc',
      action: 'STUDENTS_ASSIGNED',
      targetType: 'assignment',
      targetId: assessmentId,
      details: {
        assessmentTitle: assessment?.title || 'Assessment',
        count: studentIds.length,
        deadline,
      },
    });

    await this.save();
    return added;
  }

  // --- ATTEMPT & QUIZ/EXAM SESSIONS ---
  async startAttempt(assignmentId: string, studentId: string) {
    await this.ensureLoaded();
    const assignment = this.state.assignments.find(a => a.id === assignmentId && a.studentId === studentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    const assessment = this.state.assessments.find(a => a.id === assignment.assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Check if student has already submitted / completed (Requirement 1: single attempt policy)
    const submittedAttempt = this.state.attempts.find(
      att => att.assignmentId === assignmentId && att.studentId === studentId && (att.status === 'submitted' || att.status === 'auto_submitted')
    );
    if (assignment.status === 'completed' || (assignment.attemptsUsed && assignment.attemptsUsed >= (assignment.attemptLimit || 1)) || submittedAttempt) {
      const existingRes = this.state.results.find(r => r.assignmentId === assignmentId || r.attemptId === submittedAttempt?.id);
      const err: any = new Error('You have already submitted this assessment. Reattempts are not allowed.');
      err.code = 'ALREADY_SUBMITTED';
      err.resultId = existingRes?.id;
      throw err;
    }

    // Check if there is an existing frozen attempt
    const existingFrozen = this.state.attempts.find(
      att => att.assignmentId === assignmentId && att.studentId === studentId && (att.status === 'frozen' || att.isFrozen)
    );
    if (existingFrozen) {
      return { attempt: existingFrozen, assessment };
    }

    // Check if there is an in-progress attempt
    const existingInProgress = this.state.attempts.find(
      att => att.assignmentId === assignmentId && att.studentId === studentId && att.status === 'in_progress'
    );
    if (existingInProgress) {
      return { attempt: existingInProgress, assessment };
    }

    // Check attempt limits
    const existingAttempts = this.state.attempts.filter(
      att => att.assignmentId === assignmentId && att.studentId === studentId
    );
    if (existingAttempts.length >= assignment.attemptLimit) {
      throw new Error(`Maximum attempts (${assignment.attemptLimit}) reached for this assessment.`);
    }

    const newAttempt: AssessmentAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      assignmentId,
      assessmentId: assessment.id,
      studentId,
      attemptNumber: existingAttempts.length + 1,
      startedAt: new Date().toISOString(),
      score: 0,
      totalMarks: assessment.totalMarks || (assessment.questions?.length || 0) * assessment.marksPerQuestion,
      percentage: 0,
      status: 'in_progress',
      isFrozen: false,
      answers: [],
    };

    assignment.status = 'in_progress';
    this.state.attempts.push(newAttempt);
    await this.save();

    return { attempt: newAttempt, assessment };
  }

  async freezeAttempt(attemptId: string, studentId: string, reason?: string) {
    await this.ensureLoaded();
    const attempt = this.state.attempts.find(a => a.id === attemptId && a.studentId === studentId);
    if (!attempt || attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
      return null;
    }

    attempt.status = 'frozen';
    attempt.isFrozen = true;
    attempt.frozenReason = reason || 'Tab switch or window unfocused detected during assessment';
    attempt.frozenAt = new Date().toISOString();

    const assignment = this.state.assignments.find(a => a.id === attempt.assignmentId);
    if (assignment) {
      assignment.status = 'frozen';
    }

    const student = this.state.students.find(s => s.id === studentId);
    const assessment = this.state.assessments.find(a => a.id === attempt.assessmentId);

    this.addAuditLog({
      actorId: studentId,
      actorRole: 'student',
      actorName: student?.name || 'Student',
      action: 'ATTEMPT_FROZEN',
      targetType: assessment?.type || 'assessment',
      targetId: assessment?.id || attempt.id,
      details: {
        attemptId: attempt.id,
        studentName: student?.name,
        admissionNumber: student?.admissionNumber,
        reason: attempt.frozenReason,
      },
    });

    await this.save();
    return attempt;
  }

  async unfreezeAttempt(identifier: string) {
    await this.ensureLoaded();
    const attempt = this.state.attempts.find(a => a.id === identifier || a.assignmentId === identifier);
    if (!attempt) {
      // Also check if assignment itself is frozen
      const asg = this.state.assignments.find(a => a.id === identifier);
      if (asg) {
        asg.status = 'in_progress';
        await this.save();
        return null;
      }
      throw new Error('Attempt or assignment not found');
    }

    attempt.status = 'in_progress';
    attempt.isFrozen = false;
    attempt.unfrozenAt = new Date().toISOString();

    const assignment = this.state.assignments.find(a => a.id === attempt.assignmentId);
    if (assignment && assignment.status === 'frozen') {
      assignment.status = 'in_progress';
    }

    const student = this.state.students.find(s => s.id === attempt.studentId);
    const assessment = this.state.assessments.find(a => a.id === attempt.assessmentId);

    this.addAuditLog({
      actorId: 'a0000000-0000-0000-0000-000000000001',
      actorRole: 'admin',
      actorName: 'Dhdc',
      action: 'ATTEMPT_UNFROZEN',
      targetType: assessment?.type || 'assessment',
      targetId: assessment?.id || attempt.id,
      details: {
        attemptId: attempt.id,
        studentName: student?.name,
        admissionNumber: student?.admissionNumber,
      },
    });

    await this.save();
    return attempt;
  }

  async getAttemptStatus(attemptId: string, studentId: string) {
    await this.ensureLoaded();
    const attempt = this.state.attempts.find(a => a.id === attemptId && a.studentId === studentId);
    if (!attempt) return null;
    return {
      id: attempt.id,
      status: attempt.status,
      isFrozen: !!attempt.isFrozen,
      frozenReason: attempt.frozenReason,
      frozenAt: attempt.frozenAt,
    };
  }

  async answerQuestion(params: {
    attemptId: string;
    studentId: string;
    questionId: string;
    selectedOptionKey: 'A' | 'B' | 'C' | 'D';
  }) {
    await this.ensureLoaded();
    const { attemptId, studentId, questionId, selectedOptionKey } = params;

    const attempt = this.state.attempts.find(a => a.id === attemptId && a.studentId === studentId);
    if (!attempt || attempt.status !== 'in_progress' || attempt.isFrozen) {
      if (attempt?.isFrozen) {
        throw new Error('This assessment is frozen by administrator proctoring. Only Dhdc can unfreeze it.');
      }
      throw new Error('Active attempt not found or already submitted');
    }

    const assessment = this.state.assessments.find(a => a.id === attempt.assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const question = assessment.questions?.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const existingAnswer = attempt.answers.find(ans => ans.questionId === questionId);
    if (existingAnswer && existingAnswer.isLocked) {
      throw new Error('This answer is already locked and cannot be changed');
    }

    const isCorrect = question.correctOptionKey === selectedOptionKey;
    let marksAwarded = 0;
    if (isCorrect) {
      marksAwarded = question.marks || assessment.marksPerQuestion;
    } else if (assessment.negativeMarking && assessment.negativeMarkValue > 0) {
      marksAwarded = -assessment.negativeMarkValue;
    }

    // In quiz mode with instant feedback, lock the answer immediately
    const isLocked = assessment.type === 'quiz' && assessment.feedbackMode === 'instant';

    const answerRecord: StudentAnswer = {
      id: existingAnswer ? existingAnswer.id : `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      attemptId,
      questionId,
      selectedOptionKey,
      isCorrect,
      marksAwarded,
      answeredAt: new Date().toISOString(),
      isLocked,
      // Include explanations & correct keys if instant feedback is active
      ...(isLocked ? {
        correctOptionKey: question.correctOptionKey,
        explanation: question.explanation,
      } : {}),
    };

    if (existingAnswer) {
      const idx = attempt.answers.findIndex(ans => ans.questionId === questionId);
      attempt.answers[idx] = answerRecord;
    } else {
      attempt.answers.push(answerRecord);
    }

    await this.save();

    return {
      answer: answerRecord,
      feedbackMode: assessment.feedbackMode,
      type: assessment.type,
      instantFeedback: isLocked ? {
        isCorrect,
        correctOptionKey: question.correctOptionKey,
        marksAwarded,
        explanation: question.explanation,
      } : null,
    };
  }

  async submitAttempt(attemptId: string, studentId: string, autoSubmitted = false) {
    await this.ensureLoaded();
    const attempt = this.state.attempts.find(a => a.id === attemptId && a.studentId === studentId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.status !== 'in_progress') {
      // Return existing result
      const existingResult = this.state.results.find(r => r.attemptId === attemptId);
      return { attempt, result: existingResult };
    }

    const assessment = this.state.assessments.find(a => a.id === attempt.assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const questions = assessment.questions || [];
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalMarksObtained = 0;

    const answersReview = questions.map(q => {
      const studentAns = attempt.answers.find(ans => ans.questionId === q.id);
      const isAnswered = !!studentAns && !!studentAns.selectedOptionKey;
      const isCorrect = isAnswered && studentAns.selectedOptionKey === q.correctOptionKey;

      let marks = 0;
      if (isAnswered) {
        if (isCorrect) {
          marks = q.marks || assessment.marksPerQuestion;
          correctCount++;
        } else {
          incorrectCount++;
          if (assessment.negativeMarking && assessment.negativeMarkValue > 0) {
            marks = -assessment.negativeMarkValue;
          }
        }
      } else {
        unansweredCount++;
      }

      totalMarksObtained += marks;

      // Lock all answers on final submission
      if (studentAns) {
        studentAns.isLocked = true;
        studentAns.isCorrect = isCorrect;
        studentAns.marksAwarded = marks;
        studentAns.correctOptionKey = q.correctOptionKey;
        studentAns.explanation = q.explanation;
      }

      return {
        questionId: q.id,
        questionText: q.questionText,
        options: q.options,
        studentAnswerKey: studentAns?.selectedOptionKey || null,
        correctAnswerKey: q.correctOptionKey,
        isCorrect,
        marksAwarded: marks,
        explanation: q.explanation,
      };
    });

    // Ensure score doesn't fall below zero
    const finalScore = Math.max(0, totalMarksObtained);
    const totalPossibleMarks = assessment.totalMarks || (questions.length * assessment.marksPerQuestion);
    const percentage = totalPossibleMarks > 0 
      ? Math.round((finalScore / totalPossibleMarks) * 100 * 10) / 10 
      : 0;

    const now = new Date();
    const startTime = new Date(attempt.startedAt);
    const timeTakenSeconds = Math.max(1, Math.round((now.getTime() - startTime.getTime()) / 1000));

    attempt.submittedAt = now.toISOString();
    attempt.timeTakenSeconds = timeTakenSeconds;
    attempt.score = finalScore;
    attempt.totalMarks = totalPossibleMarks;
    attempt.percentage = percentage;
    attempt.status = autoSubmitted ? 'auto_submitted' : 'submitted';

    // Update assignment status
    const assignment = this.state.assignments.find(a => a.id === attempt.assignmentId);
    if (assignment) {
      assignment.status = 'completed';
      assignment.attemptsUsed = (assignment.attemptsUsed || 0) + 1;
      assignment.latestScore = finalScore;
      assignment.latestPercentage = percentage;
    }

    // Determine grade
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const resultRecord: AssessmentResult = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      attemptId,
      assignmentId: attempt.assignmentId,
      studentId: attempt.studentId,
      assessmentId: assessment.id,
      totalQuestions: questions.length,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalMarks: totalPossibleMarks,
      marksObtained: finalScore,
      percentage,
      grade,
      passed: percentage >= 50,
      timeTakenSeconds,
      generatedAt: now.toISOString(),
      answersReview,
    };

    // Replace or push result
    const existingResIdx = this.state.results.findIndex(r => r.attemptId === attemptId);
    if (existingResIdx >= 0) {
      this.state.results[existingResIdx] = resultRecord;
    } else {
      this.state.results.push(resultRecord);
    }

    const student = this.state.students.find(s => s.id === attempt.studentId);

    this.addAuditLog({
      actorId: attempt.studentId,
      actorRole: 'student',
      actorName: student?.name || 'Student',
      action: 'ASSESSMENT_SUBMITTED',
      targetType: assessment.type,
      targetId: assessment.id,
      details: {
        assessmentTitle: assessment.title,
        score: finalScore,
        totalMarks: totalPossibleMarks,
        percentage,
        grade,
      },
    });

    await this.save();

    return { attempt, result: resultRecord };
  }

  // --- RESULTS & ANALYTICS ---
  async getResultByAttemptId(attemptId: string) {
    await this.ensureLoaded();
    const result = this.state.results.find(r => r.attemptId === attemptId);
    if (!result) return null;

    const student = this.state.students.find(s => s.id === result.studentId);
    const assessment = this.state.assessments.find(a => a.id === result.assessmentId);

    return {
      ...result,
      student,
      assessment,
    };
  }

  async getResultById(id: string) {
    await this.ensureLoaded();
    const result = this.state.results.find(r => r.id === id);
    if (!result) return null;

    const student = this.state.students.find(s => s.id === result.studentId);
    const assessment = this.state.assessments.find(a => a.id === result.assessmentId);

    return {
      ...result,
      student,
      assessment,
    };
  }

  async getResultByAssignmentId(assignmentId: string) {
    await this.ensureLoaded();
    const result = this.state.results.find(r => r.assignmentId === assignmentId);
    if (!result) return null;

    const student = this.state.students.find(s => s.id === result.studentId);
    const assessment = this.state.assessments.find(a => a.id === result.assessmentId);

    return {
      ...result,
      student,
      assessment,
    };
  }

  async listResults(filter?: { studentId?: string; assessmentId?: string }) {
    await this.ensureLoaded();
    let list = this.state.results;
    if (filter?.studentId) {
      list = list.filter(r => r.studentId === filter.studentId);
    }
    if (filter?.assessmentId) {
      list = list.filter(r => r.assessmentId === filter.assessmentId);
    }

    return list.map(r => {
      const student = this.state.students.find(s => s.id === r.studentId);
      const assessment = this.state.assessments.find(a => a.id === r.assessmentId);
      return {
        ...r,
        student,
        assessment,
      };
    });
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    if (!this.state.auditLogs) this.state.auditLogs = [];
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.state.auditLogs.unshift(newLog);
    // Keep last 100 entries
    if (this.state.auditLogs.length > 100) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 100);
    }
    this.save();
  }

  async listAuditLogs() {
    await this.ensureLoaded();
    return this.state.auditLogs || [];
  }

  async getAdminStats() {
    await this.ensureLoaded();
    const totalStudents = this.state.students.length;
    const totalQuizzes = this.state.assessments.filter(a => a.type === 'quiz').length;
    const totalExaminations = this.state.assessments.filter(a => a.type === 'exam').length;
    const completedAssignments = this.state.assignments.filter(a => a.status === 'completed').length;
    const pendingAssignments = this.state.assignments.filter(a => a.status === 'assigned' || a.status === 'in_progress').length;

    const totalPercentageSum = this.state.results.reduce((acc, r) => acc + r.percentage, 0);
    const averageScore = this.state.results.length > 0 
      ? Math.round((totalPercentageSum / this.state.results.length) * 10) / 10 
      : 0;

    return {
      totalStudents,
      totalQuizzes,
      totalExaminations,
      completedAssessments: completedAssignments,
      pendingAssessments: pendingAssignments,
      averageStudentScore: averageScore,
      recentActivities: (this.state.auditLogs || []).slice(0, 10),
      recentResults: this.state.results.slice(-6).reverse().map(r => {
        const student = this.state.students.find(s => s.id === r.studentId);
        const assessment = this.state.assessments.find(a => a.id === r.assessmentId);
        return { ...r, student, assessment };
      }),
      recentAssessments: this.state.assessments.slice(-5).reverse(),
    };
  }
}

// Singleton database instance
export const db = new DatabaseEngine();
