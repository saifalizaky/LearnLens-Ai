import { NextResponse } from "next/server";
import { z } from "zod";
import { recordActivity } from "@/server/services/activity-store";
import { getDocumentById } from "@/server/services/document-store";
import { getSessionIdFromRequest } from "@/server/services/session";

const submitSchema = z.object({
  documentId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.string().min(1),
    }),
  ),
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        correctAnswer: z.string().min(1),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const sessionId = getSessionIdFromRequest(request);
  const parsed = submitSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload jawaban tidak valid.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const document = await getDocumentById(parsed.data.documentId, sessionId);

  if (!document) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
  }

  const answerMap = new Map(
    parsed.data.answers.map((answer) => [answer.questionId, answer.answer]),
  );
  const gradingQuestions = parsed.data.questions;
  const correctCount = gradingQuestions.reduce((total, question) => {
    return total + (answerMap.get(question.id) === question.correctAnswer ? 1 : 0);
  }, 0);
  const score = Math.round((correctCount / gradingQuestions.length) * 100);

  await recordActivity(sessionId, {
    type: "quiz_submitted",
    documentId: document.id,
    documentTitle: document.title,
    detail: `Quiz ${document.title} dikumpulkan dengan skor ${score}%.`,
    score,
    questionCount: gradingQuestions.length,
  });

  return NextResponse.json({
    documentId: document.id,
    correctCount,
    totalQuestions: gradingQuestions.length,
    score,
  });
}
