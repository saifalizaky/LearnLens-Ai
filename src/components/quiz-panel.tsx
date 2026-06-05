"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileQuestion, Loader2, Plus, RotateCw, Trash2 } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import {
  createQuizSession,
  getQuizQuestionExclusions,
  getQuizSessionStatus,
  getSortedQuizSessions,
  readQuizHistory,
  type QuizSession,
  type SubmitResult,
} from "@/lib/quiz-history";
import { removeStorageItem, writeJsonStorage } from "@/lib/client-storage";
import type { QuizQuestion } from "@/lib/types";

const optionLabels = ["A", "B", "C", "D"];
const quizQuestionCount = 10;
const quizStorageVersion = 2;
const quizStoragePrefix = "cloudtutor.quiz.";

export function QuizPanel({
  documentId,
  initialQuestions,
}: {
  documentId: string;
  initialQuestions: QuizQuestion[];
}) {
  const storageKey = `${quizStoragePrefix}${documentId}`;
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? null;
  const questions = activeSession?.questions ?? initialQuestions;
  const answers = activeSession?.answers ?? {};
  const result = activeSession?.result ?? null;
  const currentIndex = activeSession
    ? Math.min(activeSession.currentIndex, activeSession.questions.length - 1)
    : 0;
  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      const history = readQuizHistory(storageKey);

      setSessions(history.sessions);
      setActiveSessionId(null);
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
      version: quizStorageVersion,
      updatedAt: new Date().toISOString(),
      sessions,
    });
  }, [isHistoryLoaded, sessions, storageKey]);

  function startNewQuiz() {
    setActiveSessionId(null);
    setSubmitError("");
  }

  function openSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setSubmitError("");
  }

  function deleteSession(sessionId: string) {
    setSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );

    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setSubmitError("");
    }
  }

  async function generateQuiz() {
    setIsGenerating(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          count: quizQuestionCount,
          excludedQuestions: getQuizQuestionExclusions(sessions),
        }),
      });
      const data = (await response.json()) as {
        questions?: QuizQuestion[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Quiz gagal dibuat.");
      }

      if (data.questions?.length) {
        const now = new Date().toISOString();
        const nextSession = createQuizSession(data.questions, now);

        setSessions((current) => [nextSession, ...current]);
        setActiveSessionId(nextSession.id);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Quiz gagal dibuat.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function submitQuiz() {
    if (!activeSessionId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          answers: payload,
          questions: questions.map((question) => ({
            id: question.id,
            correctAnswer: question.correctAnswer,
          })),
        }),
      });
      const data = (await response.json()) as SubmitResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Jawaban gagal dikirim.");
      }

      updateQuizSession(activeSessionId, (session) => ({
        ...session,
        result: {
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          score: data.score,
        },
      }));
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Jawaban gagal dikirim.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function goNextOrSubmit() {
    if (!activeSessionId || !currentQuestion || !selectedAnswer) {
      return;
    }

    if (currentIndex < questions.length - 1) {
      updateQuizSession(activeSessionId, (session) => ({
        ...session,
        currentIndex: Math.min(session.currentIndex + 1, session.questions.length - 1),
      }));
      return;
    }

    if (result) {
      return;
    }

    await submitQuiz();
  }

  return (
    <section className="motion-card grid min-h-[680px] overflow-hidden rounded-lg border border-zinc-700 bg-[#0b0d10] shadow-[0_24px_70px_rgba(0,0,0,0.38)] lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b border-zinc-800 bg-[#090b0d] p-4 lg:border-b-0 lg:border-r">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">History quiz</p>
            <p className="mt-1 text-xs text-zinc-500">
              {sessions.length} quiz tersimpan
            </p>
          </div>
          <button
            type="button"
            onClick={startNewQuiz}
            className="motion-button inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-[#111315] text-zinc-100 hover:bg-zinc-800"
            title="New Quiz"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">New Quiz</span>
          </button>
        </div>
        <button
          type="button"
          onClick={startNewQuiz}
          className="motion-button mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-400"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Quiz
        </button>
        <div className="mt-5 max-h-[490px] space-y-2 overflow-y-auto pr-1">
          {sessions.length ? (
            getSortedQuizSessions(sessions).map((session) => {
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
                      <FileQuestion className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {session.title}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {getQuizSessionStatus(session)}
                        </span>
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(session.id)}
                    className="flex w-11 shrink-0 items-center justify-center border-l border-zinc-800 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-200"
                    title="Hapus history quiz"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Hapus history quiz</span>
                  </button>
                </div>
              );
            })
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-sm leading-6 text-zinc-500">
              Belum ada quiz tersimpan.
            </p>
          )}
        </div>
      </aside>

      <div className="min-h-[680px] min-w-0 bg-[#151719] p-5 sm:p-8">
        {!currentQuestion ? (
          <div className="flex min-h-[610px] items-center justify-center text-center">
            <div className="max-w-md">
              <FileQuestion className="mx-auto h-9 w-9 text-blue-300" aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-semibold text-white">New Quiz</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Generate quiz baru atau buka history di sebelah kiri untuk
                melanjutkan quiz yang sudah tersimpan.
              </p>
              <button
                type="button"
                onClick={generateQuiz}
                disabled={isGenerating}
                className="motion-button mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                )}
                Generate 10 Soal
              </button>
              {submitError ? (
                <p className="result-enter mt-5 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
                  {submitError}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <p className="text-base font-semibold text-zinc-300">
                  Question {currentIndex + 1} of {questions.length}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-700">
                  <div
                    className="smooth-progress h-full rounded-full bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {answeredCount} dari {questions.length} soal sudah dijawab.
                </p>
              </div>
              <button
                type="button"
                onClick={generateQuiz}
                disabled={isGenerating || isSubmitting}
                className="motion-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-600 bg-[#0f1113] px-4 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-500"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                )}
                Generate Baru
              </button>
            </div>

            <h2 className="mt-8 text-3xl font-semibold leading-tight text-white">
              {currentQuestion.question}
            </h2>

            <div className="mt-8 grid gap-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = result && option === currentQuestion.correctAnswer;
                const isWrongSelection = result && isSelected && !isCorrect;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (result || !activeSessionId) {
                        return;
                      }

                      updateQuizSession(activeSessionId, (session) => ({
                        ...session,
                        answers: {
                          ...session.answers,
                          [currentQuestion.id]: option,
                        },
                      }));
                      setSubmitError("");
                    }}
                    className={`quiz-option flex min-h-16 items-center gap-4 rounded-lg border px-5 py-3 text-left text-base ${
                      isCorrect
                        ? "border-emerald-400 bg-emerald-500/15 text-white"
                        : isWrongSelection
                          ? "border-red-400 bg-red-500/15 text-white"
                          : isSelected
                            ? "border-blue-400 bg-blue-500/15 text-white shadow-[0_0_0_1px_rgba(96,165,250,0.4)]"
                            : "border-zinc-600 bg-[#111315] text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-zinc-400">
                      {optionLabels[index] ?? index + 1}.
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {submitError ? (
              <p className="result-enter mt-6 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
                {submitError}
              </p>
            ) : null}

            {result ? (
              <div className="result-enter mt-6 rounded-lg border border-blue-400/30 bg-blue-500/10 p-5 text-sm leading-6 text-zinc-100">
                <p className="text-xl font-semibold text-white">
                  Quiz selesai. Skor kamu {result.score}%
                </p>
                <p className="mt-2 text-zinc-300">
                  Benar {result.correctCount} dari {result.totalQuestions} soal.
                </p>
                <div className="mt-4 rounded-lg bg-black/20 p-4">
                  <p className="mb-2 font-semibold text-white">Pembahasan soal ini</p>
                  <MarkdownContent content={currentQuestion.explanation} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeSessionId) {
                        return;
                      }

                      updateQuizSession(activeSessionId, (session) => ({
                        ...session,
                        currentIndex: 0,
                      }));
                    }}
                    className="motion-button inline-flex h-10 items-center rounded-lg border border-zinc-600 px-4 text-sm font-semibold text-zinc-100 hover:bg-zinc-800"
                  >
                    Review dari awal
                  </button>
                  <button
                    type="button"
                    onClick={generateQuiz}
                    className="motion-button inline-flex h-10 items-center rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-400"
                  >
                    Buat quiz baru
                  </button>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={goNextOrSubmit}
              disabled={
                !selectedAnswer ||
                isSubmitting ||
                (Boolean(result) && currentIndex >= questions.length - 1)
              }
              className="motion-button mt-8 inline-flex h-16 w-full items-center justify-center gap-2 rounded-lg bg-blue-500 text-lg font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              )}
              {isSubmitting
                ? "Mengirim jawaban..."
                : result && currentIndex < questions.length - 1
                  ? "Next review"
                  : currentIndex < questions.length - 1
                    ? "Next"
                    : result
                      ? "Review selesai"
                      : "Submit"}
            </button>
          </>
        )}
      </div>
    </section>
  );

  function updateQuizSession(
    sessionId: string,
    updater: (session: QuizSession) => QuizSession,
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
