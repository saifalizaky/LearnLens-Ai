"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RotateCw } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import type { QuizQuestion } from "@/lib/types";

const optionLabels = ["A", "B", "C", "D"];
const quizQuestionCount = 10;
const quizStorageVersion = 1;
const quizStoragePrefix = "cloudtutor.quiz.";

type SubmitResult = {
  correctCount: number;
  totalQuestions: number;
  score: number;
};

type QuizDraft = {
  questions: QuizQuestion[];
  answers: Record<string, string>;
  result: SubmitResult | null;
  currentIndex: number;
};

export function QuizPanel({
  documentId,
  initialQuestions,
}: {
  documentId: string;
  initialQuestions: QuizQuestion[];
}) {
  const storageKey = `${quizStoragePrefix}${documentId}`;
  const [questions, setQuestions] = useState(initialQuestions);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      const draft = readQuizDraft(storageKey);

      if (draft) {
        setQuestions(draft.questions);
        setAnswers(draft.answers);
        setResult(draft.result);
        setCurrentIndex(draft.currentIndex);
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

    if (!questions.length) {
      removeLocalStorageItem(storageKey);
      return;
    }

    writeQuizDraft(storageKey, {
      questions,
      answers,
      result,
      currentIndex: Math.min(currentIndex, questions.length - 1),
    });
  }, [answers, currentIndex, isDraftLoaded, questions, result, storageKey]);

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const progress =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  async function generateQuiz() {
    setIsGenerating(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, count: quizQuestionCount }),
      });
      const data = (await response.json()) as {
        questions?: QuizQuestion[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Quiz gagal dibuat.");
      }

      if (data.questions?.length) {
        setQuestions(data.questions);
        setAnswers({});
        setResult(null);
        setCurrentIndex(0);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Quiz gagal dibuat.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function submitQuiz() {
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

      setResult({
        correctCount: data.correctCount,
        totalQuestions: data.totalQuestions,
        score: data.score,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Jawaban gagal dikirim.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function goNextOrSubmit() {
    if (!currentQuestion || !selectedAnswer) {
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    if (result) {
      return;
    }

    await submitQuiz();
  }

  if (!currentQuestion) {
    return (
      <section className="motion-card mx-auto max-w-2xl rounded-lg border border-zinc-700 bg-[#151719] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Quiz otomatis</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Belum ada soal untuk dokumen ini. Klik Generate untuk membuat 10 soal
              dari file yang dipilih.
            </p>
          </div>
          <button
            type="button"
            onClick={generateQuiz}
            disabled={isGenerating}
            className="motion-button inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCw className="h-4 w-4" aria-hidden="true" />
            )}
            Generate 10 Soal
          </button>
        </div>
        {submitError ? (
          <p className="result-enter mt-5 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
            {submitError}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="motion-card mx-auto max-w-3xl rounded-lg border border-zinc-700 bg-[#151719] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
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
          Generate Ulang
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
                if (result) {
                  return;
                }

                setAnswers((current) => ({
                  ...current,
                  [currentQuestion.id]: option,
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
              <span className="text-zinc-400">{optionLabels[index] ?? index + 1}.</span>
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
              onClick={() => setCurrentIndex(0)}
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
    </section>
  );
}

function readQuizDraft(storageKey: string): QuizDraft | null {
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

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter(isQuizQuestion)
      : [];

    if (!questions.length) {
      storage.removeItem(storageKey);
      return null;
    }

    const questionIds = new Set(questions.map((question) => question.id));
    const answers: Record<string, string> = isRecord(parsed.answers)
      ? (Object.fromEntries(
          Object.entries(parsed.answers).filter(
            ([questionId, answer]) =>
              questionIds.has(questionId) && typeof answer === "string",
          ),
        ) as Record<string, string>)
      : {};
    const requestedIndex =
      typeof parsed.currentIndex === "number" ? Math.trunc(parsed.currentIndex) : 0;
    const currentIndex = Math.min(
      Math.max(requestedIndex, 0),
      questions.length - 1,
    );
    const result = isSubmitResult(parsed.result) ? parsed.result : null;

    return {
      questions,
      answers,
      result,
      currentIndex,
    };
  } catch {
    storage.removeItem(storageKey);
    return null;
  }
}

function writeQuizDraft(storageKey: string, draft: QuizDraft) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      storageKey,
      JSON.stringify({
        version: quizStorageVersion,
        updatedAt: new Date().toISOString(),
        ...draft,
      }),
    );
  } catch {
    // Ignore storage quota and private browsing failures.
  }
}

function removeLocalStorageItem(storageKey: string) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(storageKey);
  } catch {
    // Ignore private browsing failures.
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
