import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS and preflight handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize GoogleGenAI SDK according to official guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Use ultra-fast gemini-3.1-flash-lite as primary to avoid 503 high-demand delays
const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-3.8-flash';

// Helper generator to stream with automatic model fallback and unary safety net
async function* streamWithFallback(contents: any, systemInstruction?: string, temperature = 0.7) {
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: any = null;

  for (const model of models) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction,
          temperature,
        },
      });

      let hasYielded = false;
      for await (const chunk of responseStream) {
        if (chunk.text) {
          hasYielded = true;
          yield chunk.text;
        }
      }

      if (hasYielded) {
        return;
      }
    } catch (err: any) {
      console.warn(`Model ${model} stream failed (${err?.status || err?.message || 'unknown error'}), trying next option...`);
      lastError = err;
    }
  }

  // Unary fallback if streaming encountered issues
  try {
    const unaryRes = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature,
      },
    });
    if (unaryRes.text) {
      yield unaryRes.text;
      return;
    }
  } catch (unaryErr) {
    throw lastError || unaryErr;
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

  // Set SSE Headers with anti-buffering
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const contents = messages.map((m: { role: string; content?: string | any[]; parts?: any[] }) => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (m.parts && Array.isArray(m.parts)) {
        return { role, parts: m.parts };
      }
      if (Array.isArray(m.content)) {
        return { role, parts: m.content };
      }
      return { role, parts: [{ text: String(m.content || '') }] };
    });

    const temperature = mode === 'idea' || mode === 'brainstorm' ? 0.9 : 0.6;
    const defaultSys =
      systemInstruction ||
      'You are MASTER AI, a versatile, intelligent, helpful and safe universal AI assistant. You help users with everything in daily life: daily planning, answering questions, writing, learning, problem solving, analysis, research, and complete working code (HTML/JS/Canvas, Python, TypeScript, etc.). Always reply in the user\'s language accurately and concisely.';

    for await (const text of streamWithFallback(contents, defaultSys, temperature)) {
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

    const synthesisStream = streamWithFallback(
      `Topic: ${topic}\n\nResearch Findings:\n${findings.join('\n\n')}\n\nSynthesize this into a master game development dossier. Include: Executive Summary, Architecture Breakdown, Step-by-Step Implementation Plan, Code Snippets/Math Formulas, Potential Pitfalls, and Final Verdict. Write in the same language as the topic query.`,
      systemInstruction || 'You are MASTER AI, creating elite game development technical reports.',
      0.6
    );

    for await (const text of synthesisStream) {
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
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

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    for await (const text of streamWithFallback(prompt, 'You are an elite game code debugger and engine architect.', 0.4)) {
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Fix game error:', error);
    res.status(500).json({ error: error?.message || 'Fix game request failed' });
  }
});

// Lyria Music Generation Endpoint (lyria-3-clip-preview and lyria-3-pro-preview)
app.post('/api/music/generate', async (req: Request, res: Response) => {
  const { prompt, model = 'lyria-3-clip-preview', imageBase64, mimeType = 'image/jpeg' } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Music prompt is required' });
    return;
  }

  try {
    const targetModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    let contents: any;
    if (imageBase64) {
      contents = {
        parts: [
          { text: prompt },
          { inlineData: { data: imageBase64, mimeType } },
        ],
      };
    } else {
      contents = prompt;
    }

    const responseStream = await ai.models.generateContentStream({
      model: targetModel,
      contents,
      config: {
        responseModalities: [Modality.AUDIO],
      },
    });

    let audioBase64 = '';
    let lyrics = '';
    let audioMimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            audioMimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      throw new Error('No audio data received from Lyria model.');
    }

    res.json({
      success: true,
      audio: audioBase64,
      mimeType: audioMimeType,
      lyrics,
      model: targetModel,
    });
  } catch (error: any) {
    console.error('Lyria music error:', error);
    res.status(500).json({
      error: error?.message || 'Music generation failed. Lyria requires a paid API key or billing-enabled project.',
    });
  }
});

// Omni Flash Video Generation Endpoint (gemini-omni-1.1-flash)
app.post('/api/video/generate', async (req: Request, res: Response) => {
  const { prompt, aspectRatio = '16:9', duration = '5s', resolution = '720p', imageBase64, mimeType = 'image/png' } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Video prompt is required' });
    return;
  }

  try {
    let input: any;
    if (imageBase64) {
      input = [
        {
          type: 'image',
          mime_type: mimeType,
          data: imageBase64,
        },
        {
          type: 'text',
          text: prompt,
        },
      ];
    } else {
      input = prompt;
    }

    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input,
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio as '16:9' | '9:16',
          duration: duration as '5s' | '10s',
          resolution: resolution as '720p' | '360p' | '1080p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      res.json({
        success: true,
        video: videoPart.data,
        mimeType: videoPart.mime_type || 'video/mp4',
        aspectRatio,
        duration,
      });
      return;
    }

    throw new Error('Video generation completed without video data.');
  } catch (error: any) {
    console.error('Omni Flash video error:', error);
    res.status(500).json({
      error: error?.message || 'Video generation failed. Gemini Omni Flash requires a paid API key or quota.',
    });
  }
});

// Google Maps Grounding Endpoint (gemini-3.8-flash with google_maps tool)
app.post('/api/maps/search', async (req: Request, res: Response) => {
  const { query, location } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  try {
    const inputPrompt = location ? `${query} (User location: ${location})` : query;
    const interaction = await ai.interactions.create({
      model: 'gemini-3.8-flash',
      input: inputPrompt,
      tools: [{ type: 'google_maps' }],
    });

    let textOutput = interaction.output_text || '';
    if (!textOutput) {
      for (const step of interaction.steps || []) {
        if (step.type === 'model_output') {
          const tc: any = step.content?.find((c: any) => c.type === 'text');
          if (tc && typeof tc.text === 'string') textOutput += tc.text;
        }
      }
    }

    res.json({
      success: true,
      text: textOutput,
      steps: interaction.steps,
    });
  } catch (error: any) {
    console.warn('Maps grounding interaction notice, falling back:', error?.message);
    try {
      const fallbackRes = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: `Provide detailed geographical, mapping and local places guidance for: "${query}". Include coordinates, recommended places, addresses, directions, and nearby amenities if relevant. Formatted clearly with Markdown.`,
      });
      res.json({
        success: true,
        text: fallbackRes.text || 'Location search completed.',
        fallback: true,
      });
    } catch (fbErr: any) {
      res.status(500).json({ error: error?.message || 'Maps search request failed.' });
    }
  }
});

// Live Voice Turn Endpoint (gemini-3.8-live / fast TTS)
app.post('/api/voice/turn', async (req: Request, res: Response) => {
  const { text, lang = 'tr' } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text prompt is required' });
    return;
  }

  try {
    const sysPrompt =
      lang === 'tr'
        ? 'Sen MASTER AI canlı sesli asistanısın. Kısa, doğal, sıcak ve doğrudan 1-3 cümlelik konuşma diliyle yanıt ver. Samimi ve enerjik ol.'
        : 'You are MASTER AI live voice assistant. Reply in concise, natural, warm 1-3 sentences suitable for direct speech audio.';

    const genRes = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: text,
      config: {
        systemInstruction: sysPrompt,
        temperature: 0.7,
      },
    });

    const replyText =
      genRes.text ||
      (lang === 'tr' ? 'Sizi dinliyorum, nasıl yardımcı olabilirim?' : 'I am listening, how can I help?');

    let audioBase64: string | null = null;
    try {
      const ttsInteraction = await ai.interactions.create({
        model: 'gemini-3.8-flash-lite-tts',
        input: [
          {
            type: 'text',
            text: replyText,
            annotations: [
              {
                type: 'speech_metadata',
                style: 'Natural, friendly conversational AI assistant',
              },
            ],
          },
        ],
        response_format: { type: 'audio' },
        generation_config: {
          speech_config: [
            {
              language: lang === 'tr' ? 'tr-TR' : 'en-US',
              voice: 'Kore',
            },
          ],
        },
      });

      const audioPart = ttsInteraction.output_audio;
      if (audioPart?.data) {
        audioBase64 = audioPart.data;
      }
    } catch (ttsErr) {
      console.warn('Voice TTS fallback notice:', ttsErr);
    }

    res.json({
      success: true,
      text: replyText,
      audio: audioBase64,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Voice turn error:', error);
    res.status(500).json({ error: error?.message || 'Voice request failed' });
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
