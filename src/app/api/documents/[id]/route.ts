import { NextResponse } from "next/server";
import { recordActivity } from "@/server/services/activity-store";
import { deleteDocument } from "@/server/services/document-store";
import { getSessionIdFromRequest } from "@/server/services/session";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = getSessionIdFromRequest(request);
  const { id } = await params;
  const deletedDocument = await deleteDocument(id, sessionId);

  if (!deletedDocument) {
    return NextResponse.json(
      { error: "Dokumen tidak ditemukan." },
      { status: 404 },
    );
  }

  await recordActivity(sessionId, {
    type: "document_deleted",
    documentId: deletedDocument.id,
    documentTitle: deletedDocument.title,
    detail: `${deletedDocument.title} dihapus dari library dokumen.`,
  });

  return NextResponse.json({
    deleted: true,
    document: {
      id: deletedDocument.id,
      title: deletedDocument.title,
    },
  });
}
