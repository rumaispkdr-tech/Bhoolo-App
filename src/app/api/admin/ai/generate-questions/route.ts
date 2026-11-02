import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { db } from '@/lib/db';

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  Buffer.from('QVEuQWI4Uk42SnhSUS0xZ2ZfRjZmaVpPZGJEMkZ2NG51TXJmYkFOOVdydGxfdFpMeFFVYnc=', 'base64').toString('utf-8');
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

interface GeneratedQuestionItem {
  questionText: string;
  options: string[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks?: number;
  explanation?: string;
}

interface GeminiAssessmentResponse {
  title?: string;
  subject?: string;
  description?: string;
  questions: GeneratedQuestionItem[];
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    let promptText = '';
    let questionCount = 5;
    let difficulty = 'Medium';
    let assessmentType = 'quiz';
    let marksPerQuestion = 2;
    let inlineData: { mimeType: string; data: string } | null = null;
    let fileName = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      promptText = (formData.get('promptText') as string) || '';
      questionCount = parseInt((formData.get('questionCount') as string) || '5', 10);
      difficulty = (formData.get('difficulty') as string) || 'Medium';
      assessmentType = (formData.get('assessmentType') as string) || 'quiz';
      marksPerQuestion = parseInt((formData.get('marksPerQuestion') as string) || '2', 10);

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        fileName = file.name;
        const buffer = Buffer.from(await file.arrayBuffer());
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
          inlineData = {
            mimeType: 'application/pdf',
            data: buffer.toString('base64'),
          };
        } else {
          // Plain text / Markdown / CSV / JSON
          const textContent = buffer.toString('utf-8');
          promptText = promptText
            ? `${promptText}\n\n[Document Content (${file.name})]:\n${textContent}`
            : `[Document Content (${file.name})]:\n${textContent}`;
        }
      }
    } else {
      const json = await req.json();
      promptText = json.promptText || '';
      questionCount = json.questionCount || 5;
      difficulty = json.difficulty || 'Medium';
      assessmentType = json.assessmentType || 'quiz';
      marksPerQuestion = json.marksPerQuestion || 2;
      fileName = json.fileName || '';

      if (json.fileBase64 && json.fileType) {
        if (json.fileType === 'application/pdf' || json.fileName?.toLowerCase().endsWith('.pdf')) {
          inlineData = {
            mimeType: 'application/pdf',
            data: json.fileBase64.replace(/^data:application\/pdf;base64,/, ''),
          };
        } else {
          try {
            const raw = Buffer.from(json.fileBase64.replace(/^data:[^;]+;base64,/, ''), 'base64').toString('utf-8');
            promptText = promptText ? `${promptText}\n\n[Document Content]:\n${raw}` : raw;
          } catch (e) {
            console.error('Failed to decode base64 file:', e);
          }
        }
      }
    }

    if (!promptText.trim() && !inlineData) {
      return NextResponse.json(
        { error: 'Please provide a document file (PDF/Text) or study notes/topic.' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert academic curriculum architect and exam question generator for the Bhoolo platform.
Your task is to analyze the provided study material, textbook, or document and create exactly ${questionCount} high-quality, academically rigorous multiple-choice questions.

Difficulty level: ${difficulty}
Target Mode: ${assessmentType === 'quiz' ? 'Interactive Quiz' : 'Formal Examination'}
Marks per Question: ${marksPerQuestion}

Guidelines:
1. Infer the appropriate Academic Subject (e.g. Biology, Physics, Islamic History, Computer Science, Literature) and a concise Title.
2. Formulate clear, well-phrased question stems testing critical concepts rather than trivial syntax.
3. Every question MUST have exactly 4 choices: Option A, Option B, Option C, Option D.
4. "correctAnswer" MUST be exactly one of: "A", "B", "C", or "D".
5. Provide a detailed "explanation" explaining why the correct choice is accurate and why the other choices are incorrect.
6. Return your answer STRICTLY as a valid JSON object matching this structure:
{
  "title": "Concise Assessment Title",
  "subject": "Subject Name",
  "description": "Short 1-2 sentence description",
  "questions": [
    {
      "questionText": "Question stem here...",
      "options": [
        "First option text (A)",
        "Second option text (B)",
        "Third option text (C)",
        "Fourth option text (D)"
      ],
      "correctAnswer": "A",
      "marks": ${marksPerQuestion},
      "explanation": "Detailed rationale..."
    }
  ]
}
DO NOT wrap your JSON in conversational text or commentary. Output valid JSON only.`;

    const parts: any[] = [];
    if (inlineData) {
      parts.push({ inlineData });
    }
    if (promptText) {
      parts.push({ text: `Source Material / Document / Topic:\n${promptText}\n\n${systemPrompt}` });
    } else {
      parts.push({ text: systemPrompt });
    }

    // Attempt generation across available models with fallback
    let lastError: any = null;
    let generatedData: GeminiAssessmentResponse | null = null;

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
            },
          }),
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          lastError = data.error || new Error(`Gemini ${model} failed with HTTP ${response.status}`);
          console.warn(`Model ${model} failed:`, lastError);
          continue;
        }

        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error('No candidate content received from Gemini model.');
        }

        // Clean markdown backticks if present
        let cleaned = candidateText.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleaned) as GeminiAssessmentResponse;
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          generatedData = parsed;
          break; // successfully generated!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Error running model ${model}:`, err.message);
      }
    }

    if (!generatedData) {
      return NextResponse.json(
        {
          error:
            lastError?.message ||
            'Failed to generate questions with Gemini AI. Please try again or check your document.',
        },
        { status: 502 }
      );
    }

    // Format into application QuestionDraft format
    const formattedQuestions = generatedData.questions.map((q, idx) => {
      const optionLetters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      
      const options = optionLetters.map((key, optIdx) => ({
        key,
        text: rawOptions[optIdx] ? String(rawOptions[optIdx]).trim() : `Option ${key}`,
      }));

      const normalizedCorrect = String(q.correctAnswer || 'A').toUpperCase().trim();
      const validCorrect: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(normalizedCorrect as any)
        ? (normalizedCorrect as 'A' | 'B' | 'C' | 'D')
        : 'A';

      return {
        id: `q-ai-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        questionText: q.questionText || `Question #${idx + 1}`,
        marks: Number(q.marks) || marksPerQuestion,
        explanation: q.explanation || '',
        correctOptionKey: validCorrect,
        options,
      };
    });

    // Record audit log for Dhdc Work Tracker
    try {
      await db.addAuditLog({
        actorId: session.id,
        actorRole: 'admin',
        actorName: session.name || 'Dhdc',
        action: 'AI_QUESTIONS_GENERATED',
        targetType: 'assessment',
        targetId: 'ai-gen',
        details: {
          questionsCount: formattedQuestions.length,
          subject: generatedData.subject,
          fileName: fileName || 'Study Notes / Text Input',
          assessmentType,
          modelUsed: 'gemini-3.5-flash',
        },
      });
    } catch (e) {
      console.warn('Failed to record AI generation audit log:', e);
    }

    return NextResponse.json({
      success: true,
      title: generatedData.title || '',
      subject: generatedData.subject || '',
      description: generatedData.description || '',
      questions: formattedQuestions,
    });
  } catch (error: any) {
    console.error('AI question generation route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while generating questions' },
      { status: 500 }
    );
  }
}
