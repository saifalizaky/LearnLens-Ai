import { NextResponse } from "next/server";
import { z } from "zod";
import { recordActivity } from "@/server/services/activity-store";
import { getDocumentById } from "@/server/services/document-store";
import { generateQuiz } from "@/server/services/llm";
import { getSessionIdFromRequest } from "@/server/services/session";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

const quizRequestSchema = z.object({
  documentId: z.string().min(1),
  count: z.number().int().min(1).max(10).optional(),
  excludedQuestions: z.array(z.string().trim().min(1).max(500)).max(80).optional(),
});

export async function POST(request: Request) {
  const sessionId = getSessionIdFromRequest(request);
  const parsed = quizRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload quiz tidak valid.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const document = await getDocumentById(parsed.data.documentId, sessionId);

  if (!document) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
  }

  const questions = await generateQuiz({
    title: document.title,
    context: document.extractedText,
    count: parsed.data.count,
    excludedQuestions: parsed.data.excludedQuestions,
  });

  await recordActivity(sessionId, {
    type: "quiz_generated",
    documentId: document.id,
    documentTitle: document.title,
    detail: `${questions.length} soal quiz dibuat dari dokumen ${document.title}.`,
    questionCount: questions.length,
  });

  return NextResponse.json({
    documentId: document.id,
    questions,
  });
}
