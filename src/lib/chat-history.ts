import { isRecord, readJsonStorage } from "@/lib/client-storage";
import type { ChatMessage } from "@/lib/types";

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  question: string;
  createdAt: string;
  updatedAt: string;
};

type ChatHistory = {
  sessions: ChatSession[];
};

export function readChatHistory(storageKey: string): ChatHistory {
  const parsed = readJsonStorage(storageKey);

  if (!isRecord(parsed)) {
    return { sessions: [] };
  }

  if (Array.isArray(parsed.sessions)) {
    return {
      sessions: parsed.sessions.filter(isChatSession).slice(0, 40),
    };
  }

  const legacyMessages = Array.isArray(parsed.messages)
    ? parsed.messages.filter(isChatMessage)
    : [];
  const legacyQuestion =
    typeof parsed.question === "string" ? parsed.question : "";
  const hasConversation =
    legacyMessages.some((message) => message.role === "user") ||
    legacyQuestion.trim().length > 0;

  if (!hasConversation) {
    return { sessions: [] };
  }

  const now = new Date().toISOString();

  return {
    sessions: [
      {
        id: crypto.randomUUID(),
        title: buildChatTitle(
          legacyMessages.find((message) => message.role === "user")?.content ??
            legacyQuestion,
        ),
        messages: legacyMessages,
        question: legacyQuestion,
        createdAt:
          legacyMessages[0]?.createdAt ??
          (typeof parsed.updatedAt === "string" ? parsed.updatedAt : now),
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : now,
      },
    ],
  };
}

export function createChatSession({
  title,
  now,
}: {
  title: string;
  now: string;
}): ChatSession {
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    question: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function getSortedChatSessions(sessions: ChatSession[]) {
  return [...sessions].sort(
    (first, second) =>
      new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  );
}

export function buildChatTitle(value: string) {
  const trimmedValue = value.trim().replace(/\s+/g, " ");

  if (!trimmedValue) {
    return "New Chat";
  }

  return trimmedValue.length > 54
    ? `${trimmedValue.slice(0, 54).trim()}...`
    : trimmedValue;
}

function isChatSession(value: unknown): value is ChatSession {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    Array.isArray(value.messages) &&
    value.messages.every(isChatMessage) &&
    typeof value.question === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
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
