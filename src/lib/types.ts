export type UserRole = 'admin' | 'student';

export interface AdminUser {
  id: string;
  email: string;
  admissionNumber?: string;
  name: string;
  role: 'superadmin' | 'examiner';
  createdAt: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  email?: string;
  class: string;
  division: string;
  contactNumber?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt?: string;
}

export type AssessmentType = 'quiz' | 'exam';
export type FeedbackMode = 'instant' | 'after_deadline' | 'never';

export interface AssessmentOption {
  id: string;
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
  isCorrect?: boolean; // Hidden from student until submission/review
}

export interface Question {
  id: string;
  assessmentId: string;
  questionText: string;
  options: AssessmentOption[];
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  marks: number;
  negativeMarks?: number;
  explanation?: string;
  imageUrl?: string;
  orderIndex: number;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  subject: string;
  type: AssessmentType;
  instructions: string;
  startDate?: string;
  endDate?: string;
  durationMinutes?: number; // Optional for quizzes, required for exams
  marksPerQuestion: number;
  totalMarks: number;
  negativeMarking: boolean;
  negativeMarkValue: number;
  maxAttempts: number;
  feedbackMode: FeedbackMode;
  isPublished: boolean;
  createdBy?: string;
  createdAt: string;
  questions?: Question[];
  assignedCount?: number;
  completedCount?: number;
}

export type AssignmentStatus = 'assigned' | 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'frozen';

export interface Assignment {
  id: string;
  assessmentId: string;
  studentId: string;
  startDate?: string;
  deadline?: string;
  timeLimitMinutes?: number;
  attemptLimit: number;
  status: AssignmentStatus;
  assignedAt: string;
  assessment?: Assessment;
  student?: Student;
  attemptsUsed?: number;
  latestScore?: number;
  latestPercentage?: number;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted' | 'timed_out' | 'frozen';

export interface StudentAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionKey: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean;
  marksAwarded: number;
  answeredAt: string;
  isLocked: boolean;
  explanation?: string;
  correctOptionKey?: 'A' | 'B' | 'C' | 'D';
}

export interface AssessmentAttempt {
  id: string;
  assignmentId: string;
  assessmentId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  score: number;
  totalMarks: number;
  percentage: number;
  status: AttemptStatus;
  isFrozen?: boolean;
  frozenReason?: string;
  frozenAt?: string;
  unfrozenAt?: string;
  answers: StudentAnswer[];
  assessment?: Assessment;
  student?: Student;
}

export interface AssessmentResult {
  id: string;
  attemptId: string;
  assignmentId: string;
  studentId: string;
  assessmentId: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  passed: boolean;
  timeTakenSeconds: number;
  generatedAt: string;
  assessment?: Assessment;
  student?: Student;
  answersReview?: {
    questionId: string;
    questionText: string;
    options: AssessmentOption[];
    studentAnswerKey: 'A' | 'B' | 'C' | 'D' | null;
    correctAnswerKey: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    marksAwarded: number;
    explanation?: string;
  }[];
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: 'admin' | 'student';
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
  timestamp: string;
}
