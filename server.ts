import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google Gen AI client with telemetry header
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route: Generate Quiz Questions with multi-model fallback to handle 503 spikes in demand
app.post('/api/generate-questions', async (req: Request, res: Response) => {
  const {
    topic = 'General Science & Human Body',
    gradeLevel = 'Primary / Elementary (Ages 8-12)',
    language = 'English',
    difficulty = 'Mixed',
    count = 6,
    preferredModel = 'AUTO',
  } = req.body;

  // Ordered list of candidate models for fallback waterfall
  const fallbackModels = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  // If a specific model was requested and is valid, prioritize it
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
      console.log(`[Gemini API] Attempting question generation with model: ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
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
        throw new Error(`Invalid JSON array format from ${model}`);
      }

      // Assign unique IDs and format
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

      console.log(`[Gemini API] Successfully generated ${formattedQuestions.length} questions using ${model}!`);
      return res.json({
        questions: formattedQuestions,
        modelUsed: model,
      });
    } catch (err: any) {
      lastError = err;
      const is503OrRateLimit = err?.status === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('demand') ||
        err?.message?.includes('429') ||
        err?.message?.includes('quota') ||
        err?.message?.includes('unavailable');

      console.warn(`[Gemini API] Model ${model} failed (503/transient: ${is503OrRateLimit}): ${err?.message}. Falling back to next available model...`);
      // Continue to next model in the waterfall
    }
  }

  // If all models in waterfall failed
  console.error('[Gemini API] All fallback models failed:', lastError);
  return res.status(503).json({
    error: lastError?.message || 'Gemini service is experiencing high demand. Please try again in a few moments.',
    detail: 'All available fallback models (gemini-3.8-flash, gemini-3.1-flash-lite, gemini-flash-latest) were tried.',
  });
});

// Setup Vite middleware in development or serve static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
