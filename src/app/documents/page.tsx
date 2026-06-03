import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { LearningFlowBeams } from "@/components/ai-flow-beams";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import { UploadPanel } from "@/components/upload-panel";
import { formatDate, truncateText } from "@/lib/utils";
import { getDocuments } from "@/server/services/document-store";
import { getCurrentSessionId } from "@/server/services/session";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function DocumentsPage() {
  const sessionId = await getCurrentSessionId();
  const documents = await getDocuments(sessionId);
  const latestDocument = documents[0];
  const totalPages = documents.reduce(
    (sum, document) => sum + document.pages,
    0,
  );

  return (
    <div className="page-enter space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-5">
          <label className="flex h-12 w-full max-w-md items-center gap-3 rounded-full border border-zinc-700 bg-[#151719] px-4 text-zinc-400 transition-colors focus-within:border-blue-400">
            <Search className="h-5 w-5" aria-hidden="true" />
            <input
              aria-label="Search documents"
              placeholder="Search documents..."
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500"
            />
          </label>
          <h1 className="text-3xl font-semibold tracking-normal text-white">
            LearnLens Document Library
          </h1>
        </div>
        <a
          href="#upload"
          className="motion-button inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-500 px-5 text-base font-semibold text-white shadow-[0_12px_32px_rgba(59,130,246,0.28)] hover:bg-blue-400"
        >
          Upload New
          <Plus className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      <LearningFlowBeams
        variant="documents"
        eyebrow="Document Intake"
        title="Upload PDF ke Pipeline AI"
        description={
          latestDocument
            ? `Dokumen terbaru: ${latestDocument.title}`
            : "Upload PDF pertama untuk memulai ekstraksi teks, ringkasan, dan fitur belajar."
        }
        stats={[
          {
            label: "Total Dokumen",
            value: documents.length.toLocaleString("id-ID"),
          },
          {
            label: "Total Halaman",
            value: totalPages.toLocaleString("id-ID"),
          },
          {
            label: "Upload Terakhir",
            value: latestDocument ? formatDate(latestDocument.createdAt) : "Belum ada",
          },
        ]}
      />

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {documents.map((document, index) => (
          <article
            key={document.id}
            className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
          >
            <div className="flex items-start gap-4">
              <span
                className={`flex h-11 w-9 shrink-0 items-center justify-center rounded border ${
                  index % 3 === 0
                    ? "border-red-400/50 text-red-300"
                    : index % 3 === 1
                      ? "border-blue-400/50 text-blue-300"
                      : "border-orange-400/50 text-orange-300"
                }`}
              >
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-medium leading-6 text-white">
                    {document.fileName || document.title}
                  </h2>
                  <MoreHorizontal className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm text-zinc-500">
                  {formatDate(document.createdAt)}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Processed
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              {truncateText(document.summary, 130)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/documents/${document.id}`}
                className="motion-button inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Detail
              </Link>
              <Link
                href={`/chat/${document.id}`}
                className="motion-button inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-600 bg-[#0f1113] px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
              >
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                Chat
              </Link>
              <DeleteDocumentButton
                documentId={document.id}
                documentTitle={document.title}
              />
            </div>
          </article>
        ))}
      </section>

      <div id="upload">
        <UploadPanel />
      </div>
    </div>
  );
}
