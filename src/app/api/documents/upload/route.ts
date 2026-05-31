import { NextResponse } from "next/server";
import type { CloudDocument } from "@/lib/types";
import { recordActivity } from "@/server/services/activity-store";
import { saveUploadedDocument } from "@/server/services/document-store";
import { summarizeDocument } from "@/server/services/llm";
import { extractPdfDocument } from "@/server/services/pdf";
import { getSessionIdFromRequest } from "@/server/services/session";

export const runtime = "nodejs";

const maxFileSize = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const sessionId = getSessionIdFromRequest(request);
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File PDF wajib diunggah." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Format file harus PDF." }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json(
      { error: "Ukuran PDF maksimal 8 MB untuk MVP." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extractedDocument = await extractPdfDocument(buffer);
  const extractedText = extractedDocument.text;

  if (!extractedText) {
    return NextResponse.json(
      { error: "Teks PDF tidak berhasil diekstrak." },
      { status: 422 },
    );
  }

  const title = file.name.replace(/\.pdf$/i, "");
  const summary = await summarizeDocument({ title, text: extractedText });
  const document: CloudDocument = {
    id: crypto.randomUUID(),
    title,
    category: "Uploaded PDF",
    fileName: file.name,
    pages: extractedDocument.pages,
    createdAt: new Date().toISOString(),
    status: "ready",
    source: "upload",
    summary: summary.summary,
    keyPoints: summary.keyPoints,
    technicalTerms: summary.technicalTerms,
    extractedText,
  };

  await saveUploadedDocument(document, sessionId);
  await recordActivity(sessionId, {
    type: "document_uploaded",
    documentId: document.id,
    documentTitle: document.title,
    detail: `${document.title} diupload dan diproses dari file ${document.fileName}.`,
    questionCount: 0,
  });

  return NextResponse.json({
    document: {
      ...document,
      extractedTextLength: extractedText.length,
      mode: process.env.DASHSCOPE_API_KEY ? "llm" : "local-extractive",
    },
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/documents/upload",
    input: "multipart/form-data dengan field file",
    maxFileSize,
  });
}
