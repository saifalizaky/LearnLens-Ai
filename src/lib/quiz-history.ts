import { isRecord, readJsonStorage } from "@/lib/client-storage";
import type { QuizQuestion } from "@/lib/types";

export type SubmitResult = {
  correctCount: number;
  totalQuestions: number;
  score: number;
};

export type QuizSession = {
  id: string;
  title: string;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  result: SubmitResult | null;
  currentIndex: number;
  createdAt: string;
  updatedAt: string;
};

type QuizHistory = {
  sessions: QuizSession[];
};

export function readQuizHistory(storageKey: string): QuizHistory {
  const parsed = readJsonStorage(storageKey);

  if (!isRecord(parsed)) {
    return { sessions: [] };
  }

  if (Array.isArray(parsed.sessions)) {
    return {
      sessions: parsed.sessions
        .map(toQuizSession)
        .filter((session): session is QuizSession => Boolean(session))
        .slice(0, 40),
    };
  }

  const legacyQuestions = Array.isArray(parsed.questions)
    ? parsed.questions.filter(isQuizQuestion)
    : [];

  if (!legacyQuestions.length) {
    return { sessions: [] };
  }

  const now = new Date().toISOString();
  const legacySession = createQuizSession(
    legacyQuestions,
    typeof parsed.updatedAt === "string" ? parsed.updatedAt : now,
  );

  return {
    sessions: [
      {
        ...legacySession,
        answers: filterAnswers(parsed.answers, legacyQuestions),
        result: isSubmitResult(parsed.result) ? parsed.result : null,
        currentIndex: clampIndex(parsed.currentIndex, legacyQuestions.length),
      },
    ],
  };
}

export function createQuizSession(
  questions: QuizQuestion[],
  now: string,
): QuizSession {
  return {
    id: crypto.randomUUID(),
    title: buildQuizTitle(now),
    questions,
    answers: {},
    result: null,
    currentIndex: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function getSortedQuizSessions(sessions: QuizSession[]) {
  return [...sessions].sort(
    (first, second) =>
      new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  );
}

export function getQuizSessionStatus(session: QuizSession) {
  if (session.result) {
    return `Skor ${session.result.score}%`;
  }

  return `${Object.keys(session.answers).length}/${session.questions.length} dijawab`;
}

export function getQuizQuestionExclusions(sessions: QuizSession[]) {
  return Array.from(
    new Set(
      sessions
        .flatMap((session) => session.questions.map((question) => question.question))
        .map((question) => question.trim())
        .filter(Boolean),
    ),
  ).slice(0, 80);
}

function toQuizSession(value: unknown): QuizSession | null {
  if (!isRecord(value)) {
    return null;
  }

  const questions = Array.isArray(value.questions)
    ? value.questions.filter(isQuizQuestion)
    : [];

  if (!questions.length) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: typeof value.id === "string" ? value.id : crypto.randomUUID(),
    title: typeof value.title === "string" ? value.title : "Quiz",
    questions,
    answers: filterAnswers(value.answers, questions),
    result: isSubmitResult(value.result) ? value.result : null,
    currentIndex: clampIndex(value.currentIndex, questions.length),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

function filterAnswers(value: unknown, questions: QuizQuestion[]) {
  if (!isRecord(value)) {
    return {};
  }

  const questionIds = new Set(questions.map((question) => question.id));

  return Object.fromEntries(
    Object.entries(value).filter(
      ([questionId, answer]) =>
        questionIds.has(questionId) && typeof answer === "string",
    ),
  ) as Record<string, string>;
}

function buildQuizTitle(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Quiz";
  }

  return `Quiz ${date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  })} ${date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function clampIndex(value: unknown, length: number) {
  const requestedIndex = typeof value === "number" ? Math.trunc(value) : 0;

  return Math.min(Math.max(requestedIndex, 0), length - 1);
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.question === "string" &&
    Array.isArray(value.options) &&
    value.options.every((option) => typeof option === "string") &&
    typeof value.correctAnswer === "string" &&
    typeof value.explanation === "string"
  );
}

function isSubmitResult(value: unknown): value is SubmitResult {
  return (
    isRecord(value) &&
    typeof value.correctCount === "number" &&
    typeof value.totalQuestions === "number" &&
    typeof value.score === "number"
  );
}
