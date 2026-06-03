import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  MessageSquareText,
} from "lucide-react";
import { ActionItemsPanel } from "@/components/action-items-panel";
import { formatDate } from "@/lib/utils";
import { getDocumentById } from "@/server/services/document-store";
import {
  buildActionItems,
  buildDocumentInsights,
} from "@/server/services/learning-assets";
import { getCurrentSessionId } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionId = await getCurrentSessionId();
  const document = await getDocumentById(id, sessionId);

  if (!document) {
    notFound();
  }

  const insights = buildDocumentInsights(document);
  const actionItems = buildActionItems(document);

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-normal text-white">
            {document.title}
          </h1>
          <p className="mt-4 text-sm text-zinc-500">
            {document.category} - {document.pages} halaman -{" "}
            {formatDate(document.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/chat/${document.id}`}
            className="motion-button inline-flex h-12 items-center gap-2 rounded-lg bg-blue-500 px-5 text-sm font-semibold text-white hover:bg-blue-400"
          >
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            Chat
          </Link>
          <Link
            href={`/quiz/${document.id}`}
            className="motion-button inline-flex h-12 items-center gap-2 rounded-lg bg-blue-500/80 px-5 text-sm font-semibold text-white hover:bg-blue-400"
          >
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            Quiz
          </Link>
          <Link
            href="/study"
            className="motion-button inline-flex h-12 items-center gap-2 rounded-lg border border-zinc-600 bg-[#0f1113] px-5 text-sm font-semibold text-zinc-200 hover:border-blue-400 hover:text-white"
          >
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
            Study Hub
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => (
          <article
            key={insight.label}
            className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
          >
            <p className="text-sm font-medium text-zinc-500">{insight.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {insight.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {insight.detail}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.48fr]">
        <div className="space-y-6">
          <section className="motion-card rounded-lg border border-blue-400/60 bg-[#08090a] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
                <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-white">AI Summary</h2>
                <p className="mt-4 text-base leading-8 text-zinc-300">
                  {document.summary}
                </p>
              </div>
            </div>
          </section>

          <section className="motion-card rounded-lg border border-blue-400/60 bg-[#08090a] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <h2 className="text-2xl font-semibold text-white">Key Points</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {document.keyPoints.map((point, index) => (
                <div key={point} className="flex gap-4">
                  <span className="text-sm font-semibold text-blue-300">
                    {String(index + 1).padStart(2, "0")}.
                  </span>
                  <p className="text-base leading-7 text-zinc-300">{point}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="motion-card rounded-lg border border-blue-400/60 bg-[#08090a] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <h2 className="text-2xl font-semibold text-white">Technical Terms</h2>
          <div className="mt-6 space-y-6">
            {document.technicalTerms.map((term) => (
              <article key={term.term}>
                <p className="font-semibold text-white">{term.term}</p>
                <p className="mt-2 text-base leading-7 text-zinc-400">
                  {term.definition}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                AI Action Items
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Daftar tindak lanjut yang diekstrak dari kalimat wajib, tenggat,
                dan instruksi dalam dokumen.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <ActionItemsPanel
              items={actionItems}
              storageKey={`cloudtutor.actionItems.${document.id}`}
            />
          </div>
        </section>

        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Document Insights
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Indikator kesiapan dokumen untuk fitur AI.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.label}
                className="motion-card flex items-center justify-between gap-4 rounded-lg border border-zinc-700 bg-[#111315] p-4"
              >
                <div>
                  <p className="font-semibold text-white">{insight.label}</p>
                  <p className="mt-1 text-sm text-zinc-500">{insight.detail}</p>
                </div>
                <p className="text-xl font-semibold text-blue-200">
                  {insight.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="motion-card rounded-lg border border-blue-400/60 bg-[#08090a] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <h2 className="text-2xl font-semibold text-white">Context Snippet</h2>
        <p className="mt-5 max-h-80 overflow-y-auto text-base leading-8 text-zinc-300">
          {document.extractedText}
        </p>
      </section>
    </div>
  );
}
