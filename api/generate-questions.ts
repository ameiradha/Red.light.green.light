import { GoogleGenAI, Type } from '@google/genai';

// Vercel Serverless Function Handler for /api/generate-questions
export default async function handler(req: any, res: any) {
  // Enable CORS for Vercel deployments & previews
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in Vercel environment variables.',
      instruction: 'Go to your Vercel Dashboard -> Project Settings -> Environment Variables, and add GEMINI_API_KEY with your Google Gemini API key.',
    });
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-vercel',
      },
    },
  });

  const {
    topic = 'General Science & Human Body',
    gradeLevel = 'Primary / Elementary (Ages 8-12)',
    language = 'English',
    difficulty = 'Mixed',
    count = 6,
    preferredModel = 'AUTO',
  } = req.body || {};

  // Candidate models for automatic failover
  const fallbackModels = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  let modelsToTry = [...fallbackModels];
  if (preferredModel && preferredModel !== 'AUTO' && fallbackModels.includes(preferredModel)) {
    modelsToTry = [preferredModel, ...fallbackModels.filter(m => m !== preferredModel)];
  }

  const prompt = `You are an expert educator and classroom quiz master creating fun, engaging multiple-choice quiz questions for students.
Create exactly ${count} multiple-choice quiz questions on the topic: "${topic}".

Target Audience/Grade: ${gradeLevel}
Language: ${language} (Write all questions, options, and explanations in this language)
Difficulty Level: ${difficulty}

Requirements:
1. Every question MUST have 4 options: A, B, C, and D.
2. Exactly one option MUST be the correct answer (correctAnswer: 'A' | 'B' | 'C' | 'D').
3. movementSteps: Assign 1 for Easy questions, 2 for Medium questions, and 3 for Hard/Challenging questions.
4. points: Assign 10 points for Easy, 20 points for Medium, 30 points for Hard.
5. explanation: A concise, educational explanation (1-2 sentences) explaining why the correct answer is right so students learn from the question.
6. difficulty: 'Easy', 'Medium', or 'Hard'.
7. category: A short 1-3 word category name.

Return the questions matching the required JSON schema strictly.`;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Vercel Serverless] Generating questions with model: ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.OBJECT,
                  properties: {
                    A: { type: Type.STRING },
                    B: { type: Type.STRING },
                    C: { type: Type.STRING },
                    D: { type: Type.STRING },
                  },
                  required: ['A', 'B', 'C', 'D'],
                },
                correctAnswer: {
                  type: Type.STRING,
                  enum: ['A', 'B', 'C', 'D'],
                },
                difficulty: {
                  type: Type.STRING,
                  enum: ['Easy', 'Medium', 'Hard'],
                },
                category: { type: Type.STRING },
                movementSteps: { type: Type.INTEGER },
                points: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctAnswer', 'difficulty', 'movementSteps', 'points'],
            },
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error(`Empty response received from ${model}`);
      }

      const parsedQuestions = JSON.parse(text);
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error(`Invalid JSON format from ${model}`);
      }

      const formattedQuestions = parsedQuestions.map((q: any, idx: number) => ({
        id: `ai-q-${Date.now()}-${idx + 1}`,
        question: q.question,
        options: {
          A: q.options?.A || 'Option A',
          B: q.options?.B || 'Option B',
          C: q.options?.C || 'Option C',
          D: q.options?.D || 'Option D',
        },
        correctAnswer: (['A', 'B', 'C', 'D'].includes(q.correctAnswer?.toUpperCase())
          ? q.correctAnswer.toUpperCase()
          : 'A') as 'A' | 'B' | 'C' | 'D',
        difficulty: q.difficulty || 'Easy',
        category: q.category || topic,
        movementSteps: Math.max(1, Math.min(3, q.movementSteps || 1)),
        points: q.points || 10,
        explanation: q.explanation || '',
      }));

      return res.status(200).json({
        questions: formattedQuestions,
        modelUsed: model,
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`[Vercel Serverless] Model ${model} failed:`, err?.message);
    }
  }

  return res.status(503).json({
    error: lastError?.message || 'Gemini service is experiencing high demand. Please try again.',
    detail: 'All available fallback models were tried on Vercel serverless.',
  });
}
