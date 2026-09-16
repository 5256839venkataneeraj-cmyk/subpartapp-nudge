// Supabase Edge Function: nudge-chat
// Deployment: supabase functions deploy nudge-chat --no-verify-jwt
// Security: Gemini API Key stored in Supabase secrets (GEMINI_API_KEY)
// Model: "gemini-3.8-flash" defined as single config constant with multi-tier fallback

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

// 1. Single configuration constant for model name with multi-tiered fallback
export const GEMINI_MODEL = "gemini-3.6-flash";
export const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

// Helper to determine whether an error is transient and retryable (503 UNAVAILABLE, 429, 500, network)
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
    message.includes("quota")
  ) {
    return true;
  }

  return false;
}

async function generateWithRetryAndFallback(
  ai: any,
  contents: any[],
  systemInstruction: string,
  preferredModel = GEMINI_MODEL
) {
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
        return {
          text,
          modelUsed: currentModel,
          fellBack: currentModel !== preferredModel,
        };
      }
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("All Gemini models failed to generate content.");
}

function generateLocalSnapshotFallback(snapshot: any, tone = "supportive_coach"): string {
  const openTasks = snapshot?.openAssignments?.filter((a: any) => !a.completed) || [];
  const topTask = openTasks[0];
  const dateStr = new Date().toISOString().split("T")[0];

  return `I'm right here with you, ${snapshot?.studentName || "Maya"}! (Traffic to the Gemini engine is currently high, but your live academic snapshot is safe and loaded!)

Here is our current priority check:
${topTask ? `• **Immediate Priority:** **${topTask.title}** for ${topTask.course} (${topTask.dueLabel || topTask.dueDate}).` : ""}
• **Streak:** You have a **${snapshot?.streaks?.habitDays || 5}-day habit streak**. Let's keep that streak alive with a light 15-minute start.

[EVENT: 15m Quick Focus Sprint | ${dateStr} | 16:00 | Light review on ${topTask?.title || "today's priorities"}]
[SUGGESTIONS: Start 15m timer ⏱️ | Need a quick 5m break ☕ | Break down assignments 📝]`;
}

// 2. In-memory Rate Limiting (15 requests per 60 seconds per IP / User)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(clientIdentifier: string) {
  const now = Date.now();
  const record = rateLimitMap.get(clientIdentifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(clientIdentifier, {
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

// 3. Parser for [EVENT: Title | YYYY-MM-DD | HH:MM | Notes] and [SUGGESTIONS: Reply 1 | Reply 2 | Reply 3]
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
  // Strip [EVENT: ...] tags from the final user-facing text for cleaner speech
  let cleanReply = text.replace(eventRegex, "").trim();

  // Parse [SUGGESTIONS: Option 1 | Option 2 | Option 3]
  const suggestionsRegex = /\[SUGGESTIONS:\s*([^\]]+)\]/i;
  const suggestionMatch = suggestionsRegex.exec(cleanReply);
  let quickReplies: string[] = [];
  if (suggestionMatch && suggestionMatch[1]) {
    quickReplies = suggestionMatch[1]
      .split("|")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
      .slice(0, 3);
    cleanReply = cleanReply.replace(suggestionsRegex, "").trim();
  }

  return { cleanReply, events, quickReplies };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  const startTime = Date.now();
  const clientIp = req.headers.get("x-forwarded-for") || "anonymous-client";

  // Check rate limits to protect Gemini API quota
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded. Too many requests. Please slow down.",
        retryAfter: rateLimit.resetIn,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": rateLimit.resetIn.toString(),
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    const { message, snapshot, history, tone } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required 'message' string in request body." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Access secret server-side key - NEVER sent to the client app
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: GEMINI_API_KEY is not set." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
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

    // 5. Build Nudge system prompt with live snapshot data attached
    const systemPrompt = `You are Nudge, an empathetic, supportive, practical AI companion and student accountability partner.

${toneInstruction}

Your goals:
1. Help students conquer procrastination, manage coursework, and build steady habits without overwhelm.
2. Be conversational, warm, concise, and pragmatic. Don't lecture or use robotic bullet overload.
3. Be proactive: when discussing study sessions or tasks, offer to schedule them.
4. Formatting: Use clean markdown for readability (bulleted/numbered lists for steps, bold for emphasis, and language-tagged code blocks for technical code or math).

CRITICAL: CURRENT LIVE STUDENT DATA SNAPSHOT (FROM DATABASE):
Today's Date: ${new Date().toISOString().split("T")[0]}
Student Name: ${snapshot?.studentName || "Student"}
Today's Classes: ${JSON.stringify(snapshot?.todayClasses || [])}
Open Assignments: ${JSON.stringify(snapshot?.openAssignments || [])}
Habit Logs Today: ${JSON.stringify(snapshot?.habitLogs || [])}
Current Streaks: Study ${snapshot?.streaks?.studyDays || 0} days, Habit ${snapshot?.streaks?.habitDays || 0} days
Current Mood: ${snapshot?.mood?.label || "Neutral"} (${snapshot?.mood?.score || 3}/5), Energy: ${snapshot?.mood?.energy || "Medium"}
Upcoming Holidays/Breaks: ${JSON.stringify(snapshot?.upcomingHolidays || [])}

CALENDAR SCHEDULING RULES:
Whenever you suggest or agree upon a concrete study session, assignment work block, habit reminder, or deadline, you MUST include an event tag formatted exactly like this:
[EVENT: Title | YYYY-MM-DD | HH:MM | Notes]
Examples:
- [EVENT: Calculus Problem Set Sprint | 2026-09-14 | 16:30 | Library 2nd floor, 45 min focus block]
- [EVENT: CS101 Lab Prep | 2026-09-15 | 10:00 | Review lecture 4 notes]
The client parses this tag to display a 1-tap "Add to Calendar" button.

CONTEXT-AWARE QUICK REPLIES RULE:
At the very end of your response, ALWAYS include exactly 3 context-aware quick replies on a single line formatted like this:
[SUGGESTIONS: Option 1 | Option 2 | Option 3]
Rules for suggestions:
- Each option should be short (2-6 words) and include an emoji.
- Option 1: An immediate affirmative/action step (e.g., "Yes, lock it in 🎯", "Start 25m focus sprint ⏱️", "Let's do this now 🚀").
- Option 2: A gentle boundary or alternative (e.g., "Need a 10m break first ☕", "Can we do 15m instead? ⏱️", "Remind me after dinner 🍲").
- Option 3: A helpful exploration or deeper question (e.g., "Help me find sources 🔍", "Give me an outline 📝", "Break into 3 small steps 💡").`;

    // 6. Build recent conversational history (up to last 6 turns)
    const formattedContents = [];
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        formattedContents.push({
          role: turn.role === "assistant" ? "model" : "user",
          parts: [{ text: turn.content }],
        });
      }
    }
    // Add current user turn
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // 7. Make the Gemini API call securely from the server with multi-tier retry & fallback
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
      rawText = generateLocalSnapshotFallback(activeSnapshot, selectedTone);
      modelUsed = "local-snapshot-fallback";
      fallbackUsed = true;
      isLocalFallback = true;
    }

    const { cleanReply, events, quickReplies } = parseEvents(rawText);

    // 8. Return response sanitized: NO API key, NO internal headers leaked
    const payload = {
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
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Error in nudge-chat Edge Function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat with AI",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
});
