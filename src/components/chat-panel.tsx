"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Cpu,
  Loader2,
  MessageSquareText,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import type { ChatModelOption } from "@/lib/ai-models";
import {
  removeStorageItem,
  writeJsonStorage,
} from "@/lib/client-storage";
import {
  buildChatTitle,
  createChatSession,
  getSortedChatSessions,
  readChatHistory,
  type ChatSession,
} from "@/lib/chat-history";
import type { ChatMessage } from "@/lib/types";

const chatStorageVersion = 2;
const chatStoragePrefix = "cloudtutor.chat.";

export function ChatPanel({
  documentId,
  documentTitle,
  modelOptions,
  defaultModelId,
}: {
  documentId: string;
  documentTitle: string;
  modelOptions: ChatModelOption[];
  defaultModelId: string;
}) {
  const storageKey = `${chatStoragePrefix}${documentId}`;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedModel =
    modelOptions.find((model) => model.id === defaultModelId) ?? modelOptions[0];
  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      const history = readChatHistory(storageKey);

      setSessions(history.sessions);
      setActiveSessionId(null);
      setQuestion("");

      setIsHistoryLoaded(true);
    });

    return () => {
      isCancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!isHistoryLoaded) {
      return;
    }

    if (!sessions.length) {
      removeStorageItem(storageKey);
      return;
    }

    writeJsonStorage(storageKey, {
      version: chatStorageVersion,
      updatedAt: new Date().toISOString(),
      sessions,
    });
  }, [isHistoryLoaded, sessions, storageKey]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container || !messages.length) {
      return;
    }

    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight;
    };

    requestAnimationFrame(() => {
      scrollToBottom();
      window.setTimeout(scrollToBottom, 80);
    });
  }, [activeSessionId, messages.length]);

  function startNewChat() {
    setActiveSessionId(null);
    setQuestion("");
  }

  function openSession(sessionId: string) {
    const session = sessions.find((item) => item.id === sessionId);

    setActiveSessionId(sessionId);
    setQuestion(session?.question ?? "");
  }

  function deleteSession(sessionId: string) {
    setSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );

    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setQuestion("");
    }
  }

  function updateQuestion(value: string) {
    setQuestion(value);

    if (!activeSessionId) {
      return;
    }

    updateChatSession(activeSessionId, (session) => ({
      ...session,
      question: value,
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    const now = new Date().toISOString();
    const session =
      activeSession ??
      createChatSession({
        title: buildChatTitle(trimmedQuestion),
        now,
      });
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
      createdAt: now,
    };

    setActiveSessionId(session.id);
    upsertChatSession({
      ...session,
      messages: [...session.messages, userMessage],
      question: "",
      updatedAt: now,
    });
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
      const responseAt = new Date().toISOString();
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: [
          `Model: ${data.model?.label ?? selectedModel.label}`,
          "",
          data.answer ?? data.error ?? "Jawaban belum tersedia.",
        ].join("\n"),
        createdAt: responseAt,
      };

      updateChatSession(session.id, (current) => ({
        ...current,
        messages: [...current.messages, assistantMessage],
      }));
    } catch {
      const failedAt = new Date().toISOString();
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Jawaban belum tersedia. Coba kirim pertanyaan lagi.",
        createdAt: failedAt,
      };

      updateChatSession(session.id, (current) => ({
        ...current,
        messages: [...current.messages, assistantMessage],
      }));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="motion-card grid h-[calc(100dvh-9rem)] min-h-[640px] grid-rows-[180px_minmax(0,1fr)] overflow-hidden rounded-lg border border-zinc-700 bg-[#0b0d10] shadow-[0_24px_70px_rgba(0,0,0,0.38)] lg:h-[calc(100vh-3rem)] lg:min-h-[680px] lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-none">
      <aside className="flex min-h-0 flex-col border-b border-zinc-800 bg-[#090b0d] p-4 lg:border-b-0 lg:border-r">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">History chat</p>
            <p className="mt-1 truncate text-xs text-zinc-500">{documentTitle}</p>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="motion-button inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-[#111315] text-zinc-100 hover:bg-zinc-800"
            title="New Chat"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">New Chat</span>
          </button>
        </div>
        <button
          type="button"
          onClick={startNewChat}
          className="motion-button mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-400"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Chat
        </button>
        <div className="mt-5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {sessions.length ? (
            getSortedChatSessions(sessions).map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <div
                  key={session.id}
                  className={`group flex items-stretch rounded-lg border transition-colors ${
                    isActive
                      ? "border-blue-400 bg-blue-500/15 text-white"
                      : "border-zinc-800 bg-[#111315] text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openSession(session.id)}
                    className="min-w-0 flex-1 px-3 py-3 text-left"
                  >
                    <span className="flex items-start gap-2">
                      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {session.title}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {session.messages.length} pesan
                        </span>
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(session.id)}
                    className="flex w-11 shrink-0 items-center justify-center border-l border-zinc-800 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-200"
                    title="Hapus history chat"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Hapus history chat</span>
                  </button>
                </div>
              );
            })
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-sm leading-6 text-zinc-500">
              Belum ada percakapan tersimpan.
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="shrink-0 flex flex-col gap-3 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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

        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5"
        >
          {messages.length ? (
            messages.map((message) => {
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
            })
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center text-center">
              <div>
                <Bot className="mx-auto h-8 w-8 text-blue-300" aria-hidden="true" />
                <p className="mt-3 text-base font-semibold text-white">
                  New Chat
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  Mulai percakapan baru atau buka history di sebelah kiri.
                </p>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className="grid shrink-0 grid-cols-[1fr_auto] gap-3 border-t border-zinc-800 p-4 sm:grid-cols-[1fr_auto_auto]"
        >
          <input
            value={question}
            onChange={(event) => updateQuestion(event.target.value)}
            placeholder="Ask a question about your document..."
            className="h-14 rounded-lg border border-zinc-600 bg-[#0f1113] px-4 text-base text-white placeholder:text-zinc-500"
          />
          <div
            className="hidden h-14 items-center gap-3 rounded-full border border-zinc-700 bg-[#111315] px-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:inline-flex"
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
            className="motion-button inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-blue-500 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 sm:min-w-14 sm:px-4"
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
      </div>
    </section>
  );

  function upsertChatSession(nextSession: ChatSession) {
    setSessions((current) => {
      const existingIndex = current.findIndex(
        (session) => session.id === nextSession.id,
      );

      if (existingIndex < 0) {
        return [nextSession, ...current];
      }

      return current.map((session) =>
        session.id === nextSession.id ? nextSession : session,
      );
    });
  }

  function updateChatSession(
    sessionId: string,
    updater: (session: ChatSession) => ChatSession,
  ) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? { ...updater(session), updatedAt: new Date().toISOString() }
          : session,
      ),
    );
  }
}
