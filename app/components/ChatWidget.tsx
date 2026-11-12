"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

// ─── constants ────────────────────────────────────────────────────────────────

const MAX_QUESTION_LENGTH = 500;
const SESSION_MESSAGE_CAP = 20; // user messages only
const POST_RESPONSE_COOLDOWN_MS = 1500;

// ─── types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
}

// ─── icons (inline SVG — no extra dep) ───────────────────────────────────────

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
    </svg>
  );
}

// ─── typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span
      className="flex items-center gap-1 py-1"
      aria-label="Loading response"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-lightPurple animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

// ─── message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-lightPurple text-white rounded-br-sm"
            : "bg-[#1e1030] text-pink border border-lightPurple/20 rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

// ─── welcome message content ──────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "model",
  content:
    "Hi! I'm Nithin's AI portfolio assistant, powered by Gemini. Ask me anything about his experience, projects, or skills. 👋",
};

const SUGGESTED_QUESTIONS = [
  "What's his tech stack?",
  "Tell me about his projects",
  "Where has he worked?",
];

// ─── main widget ──────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);

  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Count only user messages toward the cap
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isSessionCapped = userMessageCount >= SESSION_MESSAGE_CAP;
  const charCount = input.length;
  const isNearLimit = charCount >= MAX_QUESTION_LENGTH - 100;
  const isAtLimit = charCount >= MAX_QUESTION_LENGTH;

  // Clean up cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Avoid SSR mismatch — only render trigger button after hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, [messages, isOpen, prefersReducedMotion]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      // Small delay so the panel transition finishes first
      const id = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Convert messages to the history format the API expects (exclude welcome)
  const buildHistory = useCallback(() => {
    return messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || isLoading || isCoolingDown || isSessionCapped) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userQuestion: question,
            history: buildHistory(),
          }),
        });

        const data = (await response.json()) as {
          answer?: string;
          error?: string;
        };

        let content: string;
        if (response.status === 429) {
          content =
            "You're sending messages too quickly. Please wait a moment before trying again.";
        } else {
          content =
            data.answer ??
            data.error ??
            "Sorry, something went wrong. Please try again.";
        }

        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: "model",
          content,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "model",
            content:
              "Network error. Please check your connection and try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
        // Start cooldown after each response so the user can't rapid-fire
        setIsCoolingDown(true);
        cooldownTimerRef.current = setTimeout(() => {
          setIsCoolingDown(false);
        }, POST_RESPONSE_COOLDOWN_MS);
      }
    },
    [isLoading, isCoolingDown, isSessionCapped, buildHistory],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  if (!hasMounted) return null;

  return (
    <>
      {/* ── Floating trigger button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Chat panel */}
        <div
          role="dialog"
          aria-label="Portfolio AI chat assistant"
          aria-modal="true"
          className={`w-[340px] flex flex-col rounded-2xl border border-lightPurple/30 bg-darkPurple shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all origin-bottom-right ${
            prefersReducedMotion
              ? isOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
              : isOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-90 pointer-events-none"
          }`}
          style={{ maxHeight: "min(520px, calc(100dvh - 100px))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-mediumPurple border-b border-lightPurple/25 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-lightPurple flex items-center justify-center flex-shrink-0">
                <SparkleIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-[13px] font-semibold leading-tight">
                  Ask about Nithin
                </p>
                <p className="text-lightPurple text-[11px] flex items-center gap-1 leading-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Powered by Gemini
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-pink/60 hover:text-pink transition-colors p-1 rounded-md hover:bg-lightPurple/10"
            >
              <CloseIcon className="w-5 h-5 hover:cursor-pointer" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(129,33,208,0.4)_transparent]">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2 bg-[#1e1030] border border-lightPurple/20 rounded-2xl rounded-bl-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions — only show when just the welcome message exists */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void sendMessage(q)}
                  disabled={isCoolingDown || isSessionCapped}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-mediumPurple text-pink border border-lightPurple/30 hover:border-lightPurple/70 hover:bg-lightPurple/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-lightPurple/25 flex-shrink-0">
            {isSessionCapped ? (
              <p className="text-center text-[11px] text-pink/50 py-2">
                Session limit reached. Refresh the page to start a new chat.
              </p>
            ) : (
              <>
                <div className="flex items-end gap-2 bg-mediumPurple rounded-xl px-3 py-2 border border-lightPurple/30 focus-within:border-lightPurple/70 transition-colors">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || isCoolingDown}
                    maxLength={MAX_QUESTION_LENGTH}
                    placeholder="Ask anything about Nithin…"
                    aria-label="Chat input"
                    className="flex-1 bg-transparent text-[13px] text-pink placeholder:text-pink/35 resize-none outline-none leading-relaxed disabled:opacity-50 min-h-[20px] max-h-24"
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage(input)}
                    disabled={isLoading || isCoolingDown || !input.trim()}
                    aria-label="Send message"
                    className="w-7 h-7 rounded-lg bg-lightPurple flex items-center justify-center flex-shrink-0 self-end mb-0.5 hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    <SendIcon className="w-3.5 h-3.5 text-white hover:cursor-pointer" />
                  </button>
                </div>
                {isNearLimit && (
                  <p
                    className={`text-right text-[10px] mt-1 pr-1 ${
                      isAtLimit ? "text-red-400" : "text-pink/40"
                    }`}
                  >
                    {charCount}/{MAX_QUESTION_LENGTH}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-pink/30 pb-2 flex-shrink-0">
            Gemini 3.5 Flash Lite · RAG over resume &amp; portfolio
          </div>
        </div>

        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
          aria-expanded={isOpen}
          aria-controls="chat-panel"
          className="relative w-14 h-14 rounded-full bg-lightPurple text-white shadow-[0_4px_20px_rgba(129,33,208,0.55)] hover:shadow-[0_4px_28px_rgba(129,33,208,0.75)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
        >
          {/* Pulse rings — hidden if user prefers reduced motion */}
          {!isOpen && !prefersReducedMotion && (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-lightPurple animate-ping opacity-40" />
              <span
                className="absolute inset-0 rounded-full border-2 border-lightPurple animate-ping opacity-20"
                style={{ animationDelay: "0.6s" }}
              />
            </>
          )}
          {isOpen ? (
            <CloseIcon className="w-5 h-5 relative z-10 hover:cursor-pointer" />
          ) : (
            <ChatBubbleIcon className="w-6 h-6 relative z-10 hover:cursor-pointer" />
          )}
        </button>
      </div>
    </>
  );
}
