import { NextResponse } from "next/server";
import { getDocumentById } from "@/server/services/document-store";
import { summarizeDocument } from "@/server/services/llm";
import { getSessionIdFromRequest } from "@/server/services/session";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = getSessionIdFromRequest(request);
  const { id } = await params;
  const document = await getDocumentById(id, sessionId);

  if (!document) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
  }

  const summary = await summarizeDocument({
    title: document.title,
    text: document.extractedText,
  });

  return NextResponse.json({
    documentId: document.id,
    ...summary,
  });
}
