-- =========================================================================
-- INDIVIDUAL QUIZ & EXAMINATION MANAGEMENT PLATFORM
-- Supabase PostgreSQL Schema Migration with Row Level Security (RLS)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'examiner')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admission_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    class VARCHAR(100) NOT NULL,
    division VARCHAR(50) NOT NULL,
    contact_number VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ASSESSMENTS TABLE (Quizzes and Examinations)
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('quiz', 'exam')),
    instructions TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    duration_minutes INTEGER, -- null for untimed quizzes, required for exams
    marks_per_question NUMERIC(5, 2) DEFAULT 1.0,
    total_marks NUMERIC(7, 2) DEFAULT 0.0,
    negative_marking BOOLEAN DEFAULT FALSE,
    negative_mark_value NUMERIC(5, 2) DEFAULT 0.0,
    max_attempts INTEGER DEFAULT 1,
    feedback_mode VARCHAR(50) DEFAULT 'instant' CHECK (feedback_mode IN ('instant', 'after_deadline', 'never')),
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    explanation TEXT,
    marks NUMERIC(5, 2) DEFAULT 1.0,
    negative_marks NUMERIC(5, 2) DEFAULT 0.0,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_key VARCHAR(5) NOT NULL CHECK (option_key IN ('A', 'B', 'C', 'D')),
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDIVIDUAL STUDENT ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    time_limit_minutes INTEGER,
    attempt_limit INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'not_started', 'in_progress', 'completed', 'overdue')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, student_id)
);

-- 7. ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_taken_seconds INTEGER DEFAULT 0,
    score NUMERIC(7, 2) DEFAULT 0.0,
    total_marks NUMERIC(7, 2) DEFAULT 0.0,
    percentage NUMERIC(5, 2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'timed_out')),
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STUDENT ANSWERS TABLE (Locked per question upon submit in quiz mode, or on exam completion)
CREATE TABLE IF NOT EXISTS public.student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_key VARCHAR(5) CHECK (selected_option_key IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN DEFAULT FALSE,
    marks_awarded NUMERIC(5, 2) DEFAULT 0.0,
    is_locked BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- 9. RESULTS TABLE (Immutable score snapshots)
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID UNIQUE NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    total_questions INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    unanswered_count INTEGER DEFAULT 0,
    total_marks NUMERIC(7, 2) DEFAULT 0.0,
    marks_obtained NUMERIC(7, 2) DEFAULT 0.0,
    percentage NUMERIC(5, 2) DEFAULT 0.0,
    grade VARCHAR(10) DEFAULT 'F',
    passed BOOLEAN DEFAULT FALSE,
    time_taken_seconds INTEGER DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL,
    actor_role VARCHAR(50) NOT NULL CHECK (actor_role IN ('admin', 'student')),
    actor_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_students_admission ON public.students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(name);
CREATE INDEX IF NOT EXISTS idx_students_class_div ON public.students(class, division);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON public.assessments(type);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON public.assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assessment ON public.assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON public.attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment ON public.attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assignment ON public.attempts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_assessment ON public.results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: The Next.js backend accesses the database securely via service-role connection,
-- guaranteeing students can never access or modify other students' marks or admin data.
