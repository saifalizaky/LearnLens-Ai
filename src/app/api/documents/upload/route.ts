import { NextResponse } from "next/server";
import type { CloudDocument } from "@/lib/types";
import { recordActivity } from "@/server/services/activity-store";
import { saveUploadedDocument } from "@/server/services/document-store";
import { summarizeDocument } from "@/server/services/llm";
import { extractPdfDocument } from "@/server/services/pdf";
import { getSessionIdFromRequest } from "@/server/services/session";

export const runtime = "nodejs";
export const maxDuration = 60;

const maxFileSize = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const sessionId = getSessionIdFromRequest(request);

    if (isVercelWithoutSupabase()) {
      return NextResponse.json(
        {
          error:
            "Upload di Vercel membutuhkan Supabase. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Environment Variables, lalu redeploy.",
        },
        { status: 500 },
      );
    }

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
        { error: "Ukuran PDF maksimal 4 MB untuk deployment Vercel." },
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
  } catch (error) {
    console.error("Upload PDF failed", error);

    return NextResponse.json(
      { error: toUploadErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/documents/upload",
    input: "multipart/form-data dengan field file",
    maxFileSize,
  });
}

function toUploadErrorMessage(error: unknown) {
  const message = getErrorMessage(error);

  if (
    /relation .*documents.* does not exist|schema cache|Could not find the table/i.test(
      message,
    )
  ) {
    return "Database Supabase belum siap. Jalankan supabase/schema.sql di Supabase SQL Editor, lalu redeploy.";
  }

  if (/permission denied|row-level security|invalid api key|JWT/i.test(message)) {
    return "Konfigurasi Supabase belum benar. Cek NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Vercel.";
  }

  if (/ENOENT|EROFS|read-only file system/i.test(message)) {
    return "Storage cloud belum dikonfigurasi. Isi env Supabase di Vercel agar upload tidak memakai file lokal.";
  }

  return message || "Upload gagal di server. Cek Function Logs di Vercel.";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "";
}

function isVercelWithoutSupabase() {
  return (
    Boolean(process.env.VERCEL) &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}
