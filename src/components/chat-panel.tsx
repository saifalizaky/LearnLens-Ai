"use client";

import { useEffect, useState } from "react";
import { Bot, Cpu, Loader2, Send } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import type { ChatModelOption } from "@/lib/ai-models";
import type { ChatMessage } from "@/lib/types";

const chatStorageVersion = 1;
const chatStoragePrefix = "cloudtutor.chat.";

type ChatDraft = {
  messages: ChatMessage[];
  question: string;
};

export function ChatPanel({
  documentId,
  initialMessages,
  modelOptions,
  defaultModelId,
}: {
  documentId: string;
  initialMessages: ChatMessage[];
  modelOptions: ChatModelOption[];
  defaultModelId: string;
}) {
  const storageKey = `${chatStoragePrefix}${documentId}`;
  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const selectedModel =
    modelOptions.find((model) => model.id === defaultModelId) ?? modelOptions[0];

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      const draft = readChatDraft(storageKey);

      if (draft) {
        setMessages(draft.messages);
        setQuestion(draft.question);
      }

      setIsDraftLoaded(true);
    });

    return () => {
      isCancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!isDraftLoaded) {
      return;
    }

    writeChatDraft(storageKey, { messages, question });
  }, [isDraftLoaded, messages, question, storageKey]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          question: trimmedQuestion,
          model: selectedModel.id,
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string;
        model?: ChatModelOption;
      };

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: [
            `Model: ${data.model?.label ?? selectedModel.label}`,
            "",
            data.answer ?? data.error ?? "Jawaban belum tersedia.",
          ].join("\n"),
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="motion-card flex min-h-[680px] flex-col rounded-lg border border-zinc-700 bg-[#0b0d10] shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
      <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Chat with LearnLens AI</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Model aktif: {selectedModel.provider} / {selectedModel.id}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100">
          {selectedModel.label}
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message) => {
          const isAssistant = message.role === "assistant";

          return (
            <div
              key={message.id}
              className={`message-in flex gap-3 ${isAssistant ? "" : "justify-end"}`}
            >
              {isAssistant ? (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-blue-300">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </span>
              ) : null}
              <div
                className={`max-w-[78%] rounded-lg px-4 py-3 text-base leading-7 ${
                  isAssistant
                    ? "border border-zinc-600 bg-[#111315] text-zinc-100"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {isAssistant ? (
                  <MarkdownContent content={message.content} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-3 border-t border-zinc-800 p-4 sm:grid-cols-[1fr_auto_auto]"
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about your document..."
          className="h-14 rounded-lg border border-zinc-600 bg-[#0f1113] px-4 text-base text-white placeholder:text-zinc-500"
        />
        <div
          className="inline-flex h-14 items-center gap-3 rounded-full border border-zinc-700 bg-[#111315] px-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          title={selectedModel.description}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
            <Cpu className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs leading-4 text-zinc-500">Model</span>
            <span className="block truncate text-sm font-semibold text-white sm:max-w-32">
              {selectedModel.label}
            </span>
          </span>
        </div>
        <button
          type="submit"
          disabled={isSending}
          className="motion-button inline-flex h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-blue-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          title="Kirim"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="sr-only">Kirim</span>
        </button>
      </form>
    </section>
  );
}

function readChatDraft(storageKey: string): ChatDraft | null {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  try {
    const rawDraft = storage.getItem(storageKey);

    if (!rawDraft) {
      return null;
    }

    const parsed: unknown = JSON.parse(rawDraft);

    if (!isRecord(parsed)) {
      storage.removeItem(storageKey);
      return null;
    }

    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.filter(isChatMessage)
      : [];
    const question = typeof parsed.question === "string" ? parsed.question : "";

    return messages.length || question.trim() ? { messages, question } : null;
  } catch {
    storage.removeItem(storageKey);
    return null;
  }
}

function writeChatDraft(storageKey: string, draft: ChatDraft) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      storageKey,
      JSON.stringify({
        version: chatStorageVersion,
        updatedAt: new Date().toISOString(),
        ...draft,
      }),
    );
  } catch {
    // Ignore storage quota and private browsing failures.
  }
}

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.role === "assistant" || value.role === "user") &&
    typeof value.content === "string" &&
    typeof value.createdAt === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
