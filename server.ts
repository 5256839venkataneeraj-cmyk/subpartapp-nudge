import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// 1. Single configuration constant for model name with multi-tiered fallback
export const GEMINI_MODEL = "gemini-3.6-flash";
export const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

// Helper to determine whether an error is transient (503 UNAVAILABLE, 429, 500, network)
function isRetryableError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code || err?.error?.code || err?.error?.status;
  const message = String(err.message || err?.error?.message || err).toLowerCase();

  if (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === "UNAVAILABLE" ||
    status === "RESOURCE_EXHAUSTED"
  ) {
    return true;
  }

  if (
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("temporarily") ||
    message.includes("try again later") ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("resource has been exhausted")
  ) {
    return true;
  }

  return false;
}

interface GenerateResult {
  text: string;
  modelUsed: string;
  fellBack: boolean;
  isLocalFallback?: boolean;
}

// Resilient multi-tier generation with rapid automatic model failover across healthy models
async function generateWithRetryAndFallback(
  ai: GoogleGenAI,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction: string,
  preferredModel = GEMINI_MODEL
): Promise<GenerateResult> {
  const modelsToTry = [
    preferredModel,
    ...FALLBACK_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastError: any = null;

  for (let mIndex = 0; mIndex < modelsToTry.length; mIndex++) {
    const currentModel = modelsToTry[mIndex];

    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        if (currentModel !== preferredModel) {
          console.log(
            `[Gemini Failover Success] Generated response via fallback model "${currentModel}"`
          );
        }
        return {
          text,
          modelUsed: currentModel,
          fellBack: currentModel !== preferredModel,
        };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(
        `[Gemini Call] Model "${currentModel}" unavailable (${errMsg}). Failing over to next candidate...`
      );
      // Immediately proceed to the next candidate model
      continue;
    }
  }

  throw lastError || new Error("All Gemini models failed to generate content.");
}

// Emergency student snapshot fallback generator to ensure Maya never gets an empty / broken screen
function generateLocalSnapshotFallback(
  snapshot: any,
  tone = "supportive_coach"
): string {
  const openTasks = snapshot?.openAssignments?.filter((a: any) => !a.completed) || [];
  const topTask = openTasks[0];
  const todayClass = snapshot?.todayClasses?.[0];
  const dateStr = new Date().toISOString().split("T")[0];

  return `I'm right here with you, ${snapshot?.studentName || "Maya"}! (Traffic to the Gemini model is unusually heavy right now, but your live academic snapshot is active and loaded!)

Here is where we stand right now:
${topTask ? `• **Immediate Priority:** **${topTask.title}** for ${topTask.course} (${topTask.dueLabel || topTask.dueDate}).` : ""}
${todayClass ? `• **Next Class:** ${todayClass.course} at ${todayClass.time} (${todayClass.location}).` : ""}
• **Momentum:** You've built a **${snapshot?.streaks?.habitDays || 5}-day habit streak**. Let's protect your momentum with a single 15-minute start rather than letting stress take over.

Take a slow breath. What is the single smallest action step we can take right now?

[EVENT: 15m Quick Focus Sprint | ${dateStr} | 16:00 | Light review on ${topTask?.title || "today's priorities"}]
[SUGGESTIONS: Start 15m timer ⏱️ | Need a quick 5m break ☕ | Break down assignments 📝]`;
}

// In-memory rate limiting store (sliding window)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(clientIp: string) {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(clientIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: 60 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetIn = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count += 1;
  const remaining = MAX_REQUESTS_PER_WINDOW - record.count;
  const resetIn = Math.ceil((record.resetAt - now) / 1000);
  return { allowed: true, remaining, resetIn };
}

// Event and Quick Reply parsing
function parseEvents(text: string) {
  const eventRegex = /\[EVENT:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]/gi;
  const events = [];
  let match;
  while ((match = eventRegex.exec(text)) !== null) {
    events.push({
      id: "evt_" + Math.random().toString(36).substring(2, 9),
      title: match[1].trim(),
      date: match[2].trim(),
      time: match[3].trim(),
      notes: match[4].trim(),
    });
  }
  let cleanReply = text.replace(eventRegex, "").trim();

  // Parse [SUGGESTIONS: Option 1 | Option 2 | Option 3]
  const suggestionsRegex = /\[SUGGESTIONS:\s*([^\]]+)\]/i;
  const suggestionMatch = suggestionsRegex.exec(cleanReply);
  let quickReplies: string[] = [];
  if (suggestionMatch && suggestionMatch[1]) {
    quickReplies = suggestionMatch[1]
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);
    cleanReply = cleanReply.replace(suggestionsRegex, "").trim();
  }

  return { cleanReply, events, quickReplies };
}

// Initial in-memory student database snapshot (simulating Supabase Database)
let currentStudentSnapshot = {
  studentName: "Maya",
  academicYear: "Pre-Med & Biology (Sophomore)",
  todayClasses: [
    {
      id: "cls_1",
      name: "Bioethics 302: Hall B",
      code: "BIO 302",
      time: "09:30 AM - 10:45 AM",
      location: "North Quad, Hall B",
      instructor: "Prof. Vance",
    },
    {
      id: "cls_2",
      name: "Organic Chemistry Lab",
      code: "CHEM 220",
      time: "02:00 PM - 03:30 PM",
      location: "Science Complex 402",
      instructor: "Safety Goggles Req",
    },
    {
      id: "cls_3",
      name: "Problem Set Review",
      code: "MATH 210",
      time: "04:00 PM - 05:00 PM",
      location: "Library 2nd Floor Silent Room",
      instructor: "Math Center TA",
    },
  ],
  openAssignments: [
    {
      id: "asg_1",
      title: "Bioethics Case Study Analysis",
      course: "BIO 302",
      dueDate: "Tomorrow at 11:59 PM",
      dueLabel: "Due tomorrow",
      priority: "high" as const,
      estMinutes: 60,
      completed: false,
      progress: 40,
    },
    {
      id: "asg_2",
      title: "Psych 101 Quiz Due Tonight",
      course: "PSYC 101",
      dueDate: "Tonight at 11:59 PM",
      dueLabel: "Urgent tonight",
      priority: "high" as const,
      estMinutes: 30,
      completed: false,
      progress: 75,
    },
    {
      id: "asg_3",
      title: "45m Organic Chemistry Review",
      course: "CHEM 220",
      dueDate: "Today at 3:00 PM",
      dueLabel: "Reaction mechanisms & synthesis cards",
      priority: "medium" as const,
      estMinutes: 45,
      completed: false,
      progress: 20,
    },
  ],
  habitLogs: [
    {
      id: "hab_1",
      name: "20 min campus ride / commute",
      target: "Completed 8:30 AM",
      completed: true,
      category: "health" as const,
    },
    {
      id: "hab_2",
      name: "Laundry & tidy study desk",
      target: "Evening",
      completed: false,
      category: "mindset" as const,
    },
    {
      id: "hab_3",
      name: "2.0L Daily Hydration Target",
      target: "1.4L of 2.0L logged",
      completed: false,
      category: "health" as const,
    },
    {
      id: "hab_4",
      name: "Log coffee & midday lunch spend",
      target: "< $15 daily cap",
      completed: true,
      category: "focus" as const,
    },
  ],
  streaks: {
    studyDays: 12,
    habitDays: 5,
    bestStreak: 18,
  },
  mood: {
    score: 3,
    label: "A bit overwhelmed tbh",
    energy: "Medium" as const,
    note: "Need to find two peer-reviewed sources for section 2 of Bioethics paper",
  },
  upcomingHolidays: [
    {
      name: "Mid-Semester Fall Break",
      date: "Oct 12 - Oct 14",
      daysAway: 18,
    },
    {
      name: "Thanksgiving Recess",
      date: "Nov 25 - Nov 29",
      daysAway: 58,
    },
  ],
  lastUpdated: new Date().toISOString(),
};

// -------------------------------------------------------------
// SECURE BACKEND ENDPOINTS (Proxy to Gemini)
// -------------------------------------------------------------

// API: Get live Supabase snapshot
app.get("/api/supabase/snapshot", (req, res) => {
  res.json(currentStudentSnapshot);
});

// API: Update live Supabase snapshot (simulating database write)
app.put("/api/supabase/snapshot", (req, res) => {
  try {
    currentStudentSnapshot = {
      ...currentStudentSnapshot,
      ...req.body,
      lastUpdated: new Date().toISOString(),
    };
    res.json(currentStudentSnapshot);
  } catch (err) {
    res.status(400).json({ error: "Invalid snapshot update payload" });
  }
});

// API: Read the standalone Edge Function code for educational display
app.get("/api/supabase/edge-function-code", (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "supabase/functions/nudge-chat/index.ts");
    if (fs.existsSync(filePath)) {
      const code = fs.readFileSync(filePath, "utf-8");
      return res.json({ code });
    }
    res.json({ code: "// Edge function code file not found" });
  } catch (err) {
    res.status(500).json({ error: "Failed to read edge function code" });
  }
});

// API: Edge Function Proxy Endpoint
// 1. App sends message + live snapshot + recent chat turns
// 2. Server verifies rate-limiting
// 3. Server attaches secret GEMINI_API_KEY and Nudge system prompt
// 4. Calls Gemini using GEMINI_MODEL ("gemini-3.7-flash")
// 5. Extracts [EVENT] tags and returns clean reply + parsed events (NEVER exposing key)
app.post("/api/functions/nudge-chat", async (req, res) => {
  const startTime = Date.now();
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

  // Rate Limiting check
  const rateLimit = checkRateLimit(clientIp);
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
  res.setHeader("X-RateLimit-Remaining", rateLimit.remaining.toString());

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded (Max 20 requests/minute). Slow down to protect API quotas.",
      retryAfter: rateLimit.resetIn,
    });
  }

  const { message, snapshot, history, tone } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required and must be a string." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server misconfiguration: GEMINI_API_KEY is not defined in server environment.",
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Dynamic Tone Directives based on student preference
    const toneDirectives: Record<string, string> = {
      strict_mentor: `PERSONALITY & TONE DIRECTIVE (STRICT MENTOR MODE):
- Voice: Direct, razor-sharp, disciplined, and uncompromisingly honest.
- Approach: Cut through rationalizations, excuses, and procrastination loops. High standards and clear boundaries.
- Strategy: Push for immediate action right now. Demand specific start times and verifiable deliverables. Keep answers short, firm, and focused on execution and accountability. Never baby or coddle.`,

      casual_friend: `PERSONALITY & TONE DIRECTIVE (CASUAL FRIEND MODE):
- Voice: Super chill, conversational, relatable, and humorous—like a close campus friend sitting across the table in the student lounge.
- Approach: Zero corporate or academic lecturing. Low-pressure, honest peer solidarity.
- Strategy: Speak with casual colloquialisms, light humor, and honest buddy camaraderie while still keeping an eye on upcoming assignments and classes so Maya doesn't fall behind.`,

      supportive_coach: `PERSONALITY & TONE DIRECTIVE (SUPPORTIVE COACH MODE):
- Voice: Warm, deeply empathetic, encouraging, and emotionally attuned.
- Approach: Meet the student with validation first. Acknowledge academic stress, validate feelings of overwhelm or tiredness, and celebrate micro-progress.
- Strategy: Break daunting tasks into tiny, friendly steps. Encourage self-compassion, healthy breaks, and consistent habits over toxic perfectionism.`,
    };

    const selectedTone = (tone as string) || "supportive_coach";
    const toneInstruction = toneDirectives[selectedTone] || toneDirectives.supportive_coach;

    // Use current in-memory snapshot if client didn't supply one
    const activeSnapshot = snapshot || currentStudentSnapshot;

    // Structured system instruction with live student data and calendar extraction rules
    const systemPrompt = `You are Nudge, an empathetic, pragmatic, and encouraging AI companion for college and high-school students.

${toneInstruction}

Your core mission:
1. Help students break paralysis, stop doom-scrolling, tackle academic deadlines, and cultivate steady wellness habits.
2. Keep responses punchy (2-4 paragraphs max). Do NOT lecture, patronize, or dump generic productivity listicles.
3. Formatting: Use clean markdown for readability. Use bulleted or numbered lists for sequential steps, bold key terms, blockquotes for quick reminders or encouragement, and markdown code blocks with language tags when explaining technical topics (CS algorithms, formulas, or bash commands).
4. Ground your thinking directly in the student's CURRENT LIVE DATA:
   - Today's Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
   - Student Name: ${activeSnapshot.studentName} (${activeSnapshot.academicYear})
   - Today's Classes: ${JSON.stringify(activeSnapshot.todayClasses)}
   - Open Assignments: ${JSON.stringify(activeSnapshot.openAssignments)}
   - Habit Logs: ${JSON.stringify(activeSnapshot.habitLogs)}
   - Streaks: Study ${activeSnapshot.streaks?.studyDays || 0} days, Habits ${activeSnapshot.streaks?.habitDays || 0} days
   - Mood & Energy: ${activeSnapshot.mood?.label} (Score: ${activeSnapshot.mood?.score}/5, Energy: ${activeSnapshot.mood?.energy}). Note: ${activeSnapshot.mood?.note || "None"}
   - Upcoming Holidays: ${JSON.stringify(activeSnapshot.upcomingHolidays)}

CALENDAR SCHEDULING RULE:
Whenever you propose a specific study session, break, sprint, or reminder, ALWAYS include an event block on a new line using this format:
[EVENT: Title | YYYY-MM-DD | HH:MM | Notes]
Examples:
- [EVENT: CS 210 BST Balancing Sprint | ${new Date().toISOString().split("T")[0]} | 16:30 | 45 min pomodoro block before dinner]
- [EVENT: MATH 240 Problem Set Prep | ${new Date().toISOString().split("T")[0]} | 19:00 | Library 2nd floor silent room]
The mobile/web client automatically parses this tag into a 1-tap "Add to Calendar" confirmation button.

CONTEXT-AWARE QUICK REPLIES RULE:
At the very end of your response, ALWAYS include exactly 3 context-aware quick replies on a single line formatted like this:
[SUGGESTIONS: Option 1 | Option 2 | Option 3]
Rules for suggestions:
- Each option should be short (2-6 words) and include an emoji.
- Option 1: An immediate affirmative/action step (e.g., "Yes, lock it in 🎯", "Start 25m focus sprint ⏱️", "Let's do this now 🚀").
- Option 2: A gentle boundary or alternative (e.g., "Need a 10m break first ☕", "Can we do 15m instead? ⏱️", "Remind me after dinner 🍲").
- Option 3: A helpful exploration or deeper question (e.g., "Help me find sources 🔍", "Give me an outline 📝", "Break into 3 small steps 💡").`;

    // Multi-turn conversational history (last 6 turns for context coherence)
    const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        formattedContents.push({
          role: turn.role === "assistant" ? "model" : "user",
          parts: [{ text: turn.content }],
        });
      }
    }

    // Add current user prompt
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let rawText = "";
    let modelUsed = GEMINI_MODEL;
    let fallbackUsed = false;
    let isLocalFallback = false;

    try {
      const genResult = await generateWithRetryAndFallback(
        ai,
        formattedContents,
        systemPrompt,
        GEMINI_MODEL
      );
      rawText = genResult.text;
      modelUsed = genResult.modelUsed;
      fallbackUsed = genResult.fellBack;
    } catch (genError) {
      console.error(
        "All remote Gemini models failed or hit high-demand spikes. Engaging contextual snapshot fallback:",
        genError
      );
      // Emergency graceful contextual fallback so student conversation never breaks
      rawText = generateLocalSnapshotFallback(activeSnapshot, selectedTone);
      modelUsed = "local-snapshot-fallback";
      fallbackUsed = true;
      isLocalFallback = true;
    }

    const { cleanReply, events, quickReplies } = parseEvents(rawText);

    // Return sanitized payload: never the API key or raw headers
    return res.json({
      reply: cleanReply,
      events,
      quickReplies,
      model: modelUsed,
      fallbackUsed,
      isLocalFallback,
      rateLimit: {
        limit: MAX_REQUESTS_PER_WINDOW,
        remaining: rateLimit.remaining,
        resetInSeconds: rateLimit.resetIn,
      },
      cachedContextUsed: false,
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unhandled error in proxy handler:", error);
    return res.status(500).json({
      error: "Failed to communicate with AI proxy",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API: Audio Transcription Endpoint (Transcribe user's recorded microphone audio with Gemini)
app.post("/api/functions/transcribe-audio", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not defined in server environment." });
  }

  const { audioBase64, mimeType } = req.body;
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return res.status(400).json({ error: "Missing or invalid audioBase64 data." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const cleanMimeType = mimeType || "audio/webm";
    // Strip data URL scheme prefix if client included it
    const pureBase64 = audioBase64.includes(",")
      ? audioBase64.split(",")[1]
      : audioBase64;

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType.split(";")[0],
        data: pureBase64,
      },
    };

    const promptPart = {
      text: "Transcribe the spoken speech in this audio file verbatim into clean text. If there is no discernible speech or only silence/background noise, return an empty string. Output ONLY the transcribed words with proper capitalization and punctuation. Do not add explanations, conversational quotes, or commentary.",
    };

    // Candidate models with rapid fallback
    const candidateModels = ["gemini-3.5-transcribe", "gemini-3.8-flash", "gemini-3.6-flash"];
    let transcript = "";

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [audioPart, promptPart] },
        });

        if (response.text !== undefined) {
          transcript = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`[Transcription] Model ${modelName} failed (${err?.message || err}). Trying fallback...`);
      }
    }

    return res.json({ transcript });
  } catch (error) {
    console.error("Audio transcription error:", error);
    return res.status(500).json({
      error: "Failed to transcribe audio",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nudge secure server running on http://0.0.0.0:${PORT}`);
    console.log(`Gemini proxy model configured: ${GEMINI_MODEL}`);
  });
}

startServer();
