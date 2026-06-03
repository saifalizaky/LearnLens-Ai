import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveChatModel } from "@/lib/ai-models";
import { recordActivity } from "@/server/services/activity-store";
import { getDocumentById } from "@/server/services/document-store";
import { answerQuestion } from "@/server/services/llm";
import { getSessionIdFromRequest } from "@/server/services/session";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

const chatRequestSchema = z.object({
  documentId: z.string().min(1),
  question: z.string().min(3).max(1000),
  model: z.string().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  const sessionId = getSessionIdFromRequest(request);
  const parsed = chatRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload chat tidak valid.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const document = await getDocumentById(parsed.data.documentId, sessionId);
  const selectedModel = resolveChatModel(parsed.data.model);

  if (!document) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
  }

  const answer = await answerQuestion({
    title: document.title,
    context: document.extractedText,
    question: parsed.data.question,
    model: selectedModel.id,
  });

  await recordActivity(sessionId, {
    type: "chat_question",
    documentId: document.id,
    documentTitle: document.title,
    detail: `Pertanyaan chat dijawab oleh ${selectedModel.label} untuk dokumen ${document.title}.`,
    questionCount: 1,
  });

  return NextResponse.json({
    documentId: document.id,
    question: parsed.data.question,
    answer,
    model: selectedModel,
  });
}
