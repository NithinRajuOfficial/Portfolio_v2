import { type NextRequest } from "next/server";
import { handleChatMessage, type ChatMessage } from "../../lib/rag/agent";

// ─── in-memory rate limiter ───────────────────────────────────────────────────
// Allows MAX_REQUESTS per IP per WINDOW_MS.
// This is per-instance (Vercel serverless), which is fine for a portfolio —
// it prevents bursts rather than providing absolute accounting.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 15; // matches Gemini free-tier RPM

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

// ─── input validation ─────────────────────────────────────────────────────────

const MAX_QUESTION_LENGTH = 500;
const MAX_HISTORY_ITEMS = 10;

function isValidRole(role: unknown): role is "user" | "model" {
  return role === "user" || role === "model";
}

function sanitiseHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        isValidRole((item as Record<string, unknown>).role) &&
        typeof (item as Record<string, unknown>).content === "string",
    )
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: (item as { role: "user" | "model" }).role,
      content: String((item as { content: string }).content).slice(0, 1000),
    }));
}

// ─── route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      { status: 429 },
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { userQuestion, history } = body as {
    userQuestion?: unknown;
    history?: unknown;
  };

  // Validate question
  if (!userQuestion || typeof userQuestion !== "string" || !userQuestion.trim()) {
    return Response.json(
      { error: "userQuestion is required and must be a non-empty string." },
      { status: 400 },
    );
  }

  const cleanedQuestion = userQuestion.trim().slice(0, MAX_QUESTION_LENGTH);
  const cleanedHistory = sanitiseHistory(history);

  // Run the RAG pipeline
  try {
    const answer = await handleChatMessage({
      userQuestion: cleanedQuestion,
      history: cleanedHistory,
    });
    return Response.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/chat] RAG pipeline error:", message);
    // Return the real error in development so you can debug it
    const isDev = process.env.NODE_ENV === "development";
    return Response.json(
      { error: isDev ? message : "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
