import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK according to official guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

// Helper to execute stream with automatic resilient model fallback
async function getResilientStream(contents: any, systemInstruction?: string, temperature = 0.7) {
  try {
    return await ai.models.generateContentStream({
      model: PRIMARY_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature,
      },
    });
  } catch (err: any) {
    console.warn(`Primary model ${PRIMARY_MODEL} returned error (${err?.status || err?.message}), falling back to ${FALLBACK_MODEL}`);
    return await ai.models.generateContentStream({
      model: FALLBACK_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature,
      },
    });
  }
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    model: PRIMARY_MODEL,
    fallback: FALLBACK_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// Real-time Chat Streaming API
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, systemInstruction, mode } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const contents = messages.map((m: { role: string; content: string | any[] }) => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (typeof m.content === 'string') {
        return { role, parts: [{ text: m.content }] };
      }
      return { role, parts: m.content };
    });

    const temperature = mode === 'idea' || mode === 'brainstorm' ? 0.9 : 0.6;
    const defaultSys =
      systemInstruction ||
      'You are MASTER AI, a versatile, intelligent, helpful and safe universal AI assistant. You help users with everything in daily life: daily planning, answering questions, writing, learning, problem solving, analysis, research, and complete working code (HTML/JS/Canvas, Python, TypeScript, etc.). Always reply in the user\'s language accurately and concisely.';

    const responseStream = await getResilientStream(contents, defaultSys, temperature);

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    const errorMessage = error?.message || 'Gemini API call failed';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// Deep Research endpoint: Multi-step structured game design inquiry
app.post('/api/deep-research', async (req: Request, res: Response) => {
  const { topic, systemInstruction } = req.body;

  if (!topic || typeof topic !== 'string') {
    res.status(400).json({ error: 'Topic is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    res.write(`data: ${JSON.stringify({ step: 'planning', progress: 15, message: 'Decomposing research angles...' })}\n\n`);

    const prompt = `Topic: ${topic}\n\nTask: Decompose this game development inquiry into 3 distinct investigative angles. Return ONLY a valid JSON array of 3 concise strings in the same language.`;

    let planRes;
    try {
      planRes = await ai.models.generateContent({
        model: FALLBACK_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    } catch {
      planRes = null;
    }

    let subQuestions: string[] = [];
    try {
      subQuestions = JSON.parse(planRes?.text || '[]');
    } catch {
      subQuestions = [
        `Architecture & Technical Implementation of: ${topic}`,
        `Gameplay Mechanics, Balancing & Player Engagement for: ${topic}`,
        `Edge Cases, Performance Optimization & Polish for: ${topic}`,
      ];
    }

    if (!Array.isArray(subQuestions) || subQuestions.length === 0) {
      subQuestions = [topic];
    }

    const findings: string[] = [];
    for (let i = 0; i < subQuestions.length; i++) {
      const q = subQuestions[i];
      const progress = 25 + Math.round(((i + 1) / subQuestions.length) * 45);
      res.write(
        `data: ${JSON.stringify({
          step: 'researching',
          progress,
          currentQuestion: q,
          message: `Analyzing: ${q}`,
        })}\n\n`
      );

      try {
        const qRes = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: `Provide deep game design and technical analysis for: "${q}". Include concrete equations, code patterns, trade-offs, and pro tips.`,
        });
        findings.push(`### Area ${i + 1}: ${q}\n\n${qRes.text || 'No findings'}`);
      } catch (err) {
        findings.push(`### Area ${i + 1}: ${q}\n\nAnalysis completed.`);
      }
    }

    res.write(`data: ${JSON.stringify({ step: 'synthesizing', progress: 85, message: 'Synthesizing final executive game development report...' })}\n\n`);

    const synthesisStream = await getResilientStream(
      `Topic: ${topic}\n\nResearch Findings:\n${findings.join('\n\n')}\n\nSynthesize this into a master game development dossier. Include: Executive Summary, Architecture Breakdown, Step-by-Step Implementation Plan, Code Snippets/Math Formulas, Potential Pitfalls, and Final Verdict. Write in the same language as the topic query.`,
      systemInstruction || 'You are MASTER AI, creating elite game development technical reports.',
      0.6
    );

    for await (const chunk of synthesisStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, subQuestions })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Deep research error:', error);
    res.write(`data: ${JSON.stringify({ error: error?.message || 'Deep research error' })}\n\n`);
    res.end();
  }
});

// Fix Game Endpoint: Takes broken game code + runtime errors and regenerates working HTML
app.post('/api/fix-game', async (req: Request, res: Response) => {
  const { code, errors, userInstructions } = req.body;

  try {
    const prompt = `You are the MASTER AI Game Studio debugger.
The user's game needs fixing or enhancement.

Game Code:
\`\`\`html
${code}
\`\`\`

Detected Runtime Errors:
${errors && errors.length > 0 ? errors.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n') : 'No specific runtime console exceptions caught, user requested refinement.'}

User Instructions:
${userInstructions || 'Fix all runtime errors, ensure keyboard/pointer inputs respond correctly, and provide a fully self-contained playable single-file HTML game.'}

CRITICAL RULES:
1. Return the COMPLETE, WORKING HTML file inside ONE \`\`\`html block.
2. Ensure canvas/DOM elements, styles, scripts and logic are intact.
3. Add a brief 2-sentence summary of the fixes applied.`;

    const responseStream = await getResilientStream(prompt, 'You are an elite game code debugger and engine architect.', 0.4);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Fix game error:', error);
    res.status(500).json({ error: error?.message || 'Fix game request failed' });
  }
});

// Vite middleware & Static serving
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MASTER AI] Server running on port ${PORT} (dev: ${!isProd})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
