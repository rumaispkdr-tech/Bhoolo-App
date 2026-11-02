# Bhoolo — Individual Quiz & Examination Management Platform

A modern, responsive educational SaaS web application designed for institutions to conduct quizzes and examinations for individually selected students, featuring real-time feedback, strict anti-cheat proctoring lockdown, Excel student cohort importing, student performance reports, and immutable grading.

**Managed by Dhdc • Powered By Rumais**

---

## 🎨 Visual Identity & System

- **Brand Name**: Bhoolo
- **Administrator Name**: Dhdc
- **Primary Color**: White (`#FFFFFF`)
- **Secondary / Accent**: Blue (`#2563EB`)
- **Dark Text**: `#172033`
- **Light Background**: `#F8FAFC`
- **Success / Passed**: `#16A34A`
- **Error / Rejected**: `#DC2626`
- **Borders & Dividers**: `#E5E7EB`

---

## 🔑 Unified Authentication (Admission Number & Password)

The platform features a **unified single-entry login interface** at `/`:
- Both administrators and students log in using their **Admission Number** and **Password**.
- The system automatically detects the role and routes the user to their respective dashboard.

### 1. Administrator Credentials
- **Admission Number**: `000`
- **Password**: `ADM-000`
- **Access**: Full Admin Console, Assessment Builder, Excel Student Import, Cohort Assignments, Student Reports, Audit Tracker.

### 2. Student Credentials (Cohort of 153 Students)
- **Password Rule**: The default password for every student is their **Admission Number repeated twice** (`admNumber + admNumber`).
- **Examples**:
  - **Student RUMAIS** (Class SS1):
    - Admission Number: `844`
    - Password: `844844`
  - **Student MUHAMMED SALIM VV** (Class S1):
    - Admission Number: `1070`
    - Password: `10701070`
  - **Student MUHAMMAD QASIM.MP** (Class S3):
    - Admission Number: `997`
    - Password: `997997`
  - **Student MUHAMMAD ANAS. AP** (Class S5):
    - Admission Number: `885`
    - Password: `885885`

---

## 🚀 Key Features

1. **Single-Attempt Policy**: Students can only take each assigned quiz/examination once. Upon submission, reattempt is strictly blocked.
2. **Proctor Tab & Navigation Lockdown**: During assessments, if a student changes tabs, switches windows, or navigates back, the exam instantly freezes. Only Admin (Dhdc) can review and unfreeze the session.
3. **Interactive Step-by-Step Question Feedback**: Multiple-choice assessments support immediate visual verification (green for correct, red for incorrect) before advancing with a dedicated Next button.
4. **Adaptive Score Celebration**: Custom celebratory sounds and animations for above-average scores, and encouraging feedback for lower scores.
5. **Excel Student Database Import**: Upload `.xlsx` rosters to import admission numbers, student names, and classes. Automatically applies the 2x admission number password algorithm.
6. **Detailed Student Reports & Export**: Dedicated student profiles allow admins to download or print formatted individual reports with assessment-by-assessment scorecards and Dhdc certification.
7. **Mobile-Responsive Side Navigation**: Full responsiveness across smartphones, tablets, and desktops with an animated hamburger drawer menu.
8. **Progressive Web App (PWA)**: Installable as a standalone app on Android, iOS, Windows, and macOS with service worker offline caching.
9. **Dhdc Work Tracker**: Admin audit log tracking every quiz creation, cohort assignment, exam unfreeze, and student submission.
10. **Gemini AI Question & Exam Generator**: Admins can upload any syllabus/textbook PDF or text document, or paste notes, and Google Gemini AI automatically generates high-quality multiple-choice questions with 4 options, correct answer keys, and pedagogical explanations.

---

## 🛠️ Getting Started & Installation

```bash
# 1. Clone repository
git clone https://github.com/rumaispkdr-tech/Bhoolo-App.git
cd Bhoolo-App

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Or build and run production server
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

© 2026 Bhoolo • Powered By Rumais
