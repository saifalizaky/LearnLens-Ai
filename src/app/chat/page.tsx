import Link from "next/link";
import { FileText, MessageSquareText, Search } from "lucide-react";
import { LearningFlowBeams } from "@/components/ai-flow-beams";
import { resolveChatModel } from "@/lib/ai-models";
import { formatDate, truncateText } from "@/lib/utils";
import { getDocuments } from "@/server/services/document-store";
import { getCurrentSessionId } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const sessionId = await getCurrentSessionId();
  const documents = await getDocuments(sessionId);
  const latestDocument = documents[0];
  const totalPages = documents.reduce(
    (sum, document) => sum + document.pages,
    0,
  );
  const activeModel = resolveChatModel();

  return (
    <div className="page-enter space-y-8">
      <div className="space-y-5">
        <label className="flex h-12 w-full max-w-md items-center gap-3 rounded-full border border-zinc-700 bg-[#151719] px-4 text-zinc-400 transition-colors focus-within:border-blue-400">
          <Search className="h-5 w-5" aria-hidden="true" />
          <input
            aria-label="Search chat documents"
            placeholder="Search documents..."
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500"
          />
        </label>
        <h1 className="text-3xl font-semibold tracking-normal text-white">
          Choose Document to Chat
        </h1>
      </div>

      <LearningFlowBeams
        variant="chat"
        eyebrow="Contextual Chat"
        title="Tanya Jawab Berbasis Dokumen"
        description={
          latestDocument
            ? `Pilih dokumen untuk mengirim pertanyaan ke ${activeModel.label} dengan konteks dari file kamu.`
            : "Upload dokumen dulu agar chat bisa membaca konteks PDF dari sesi kamu."
        }
        stats={[
          {
            label: "Dokumen Siap",
            value: documents.length.toLocaleString("id-ID"),
          },
          {
            label: "Total Halaman",
            value: totalPages.toLocaleString("id-ID"),
          },
          {
            label: "Model Aktif",
            value: activeModel.label,
          },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {documents.map((document) => (
          <article
            key={document.id}
            className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-9 shrink-0 items-center justify-center rounded border border-blue-400/50 text-blue-300">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-medium leading-6 text-white">
                  {document.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Upload - {formatDate(document.createdAt)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              {truncateText(document.summary, 150)}
            </p>
            <Link
              href={`/chat/${document.id}`}
              className="motion-button mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-400"
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              Chat dokumen ini
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
