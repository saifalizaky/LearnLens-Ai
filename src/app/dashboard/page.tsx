import Link from "next/link";
import {
  BookOpenCheck,
  ClipboardCheck,
  UploadCloud,
} from "lucide-react";
import { AiFlowBeams } from "@/components/ai-flow-beams";
import { LearningActivityChart } from "@/components/charts/learning-activity-chart";
import { DashboardToolbar } from "@/components/dashboard-toolbar";
import { resolveChatModel } from "@/lib/ai-models";
import { truncateText } from "@/lib/utils";
import {
  deriveLearningTrend,
  deriveRecentRealActivities,
  getActivities,
} from "@/server/services/activity-store";
import { getDocuments } from "@/server/services/document-store";
import {
  buildActionItems,
  buildProgressDetails,
} from "@/server/services/learning-assets";
import { getCurrentSessionId } from "@/server/services/session";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

const coverStyles = [
  "from-blue-950 via-cyan-900 to-zinc-950",
  "from-amber-900 via-zinc-800 to-neutral-950",
  "from-zinc-700 via-slate-900 to-neutral-950",
  "from-indigo-950 via-violet-900 to-black",
];

export default async function DashboardPage() {
  const sessionId = await getCurrentSessionId();
  const documents = await getDocuments(sessionId);
  const activities = await getActivities(sessionId);
  const learningTrend = deriveLearningTrend(documents, activities);
  const recentActivities = deriveRecentRealActivities(documents, activities);
  const recentDocuments = documents.slice(0, 4);
  const latestDocument = documents[0];
  const progressDetails = buildProgressDetails(documents, activities);
  const dashboardActionItems = latestDocument
    ? buildActionItems(latestDocument).slice(0, 3)
    : [];
  const activeModel = resolveChatModel();
  const weeklyQuestions = learningTrend.reduce(
    (sum, item) => sum + item.questions,
    0,
  );
  const weeklyQuizzes = learningTrend.reduce((sum, item) => sum + item.quizzes, 0);
  const weeklyUploads = learningTrend.reduce((sum, item) => sum + item.uploads, 0);
  const weeklyActivities = weeklyQuestions + weeklyQuizzes + weeklyUploads;

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">
          Dashboard
        </h1>
        <DashboardToolbar
          documents={documents.map((document) => ({
            id: document.id,
            title: document.title,
            fileName: document.fileName,
            summary: document.summary,
            pages: document.pages,
          }))}
          activities={recentActivities.map((activity) => ({
            id: activity.id,
            detail: activity.detail,
            createdAt: activity.createdAt,
          }))}
        />
      </header>

      <AiFlowBeams
        documentCount={documents.length}
        weeklyActivities={weeklyActivities}
        modelLabel={`${activeModel.provider} / ${activeModel.label}`}
        latestDocumentTitle={latestDocument?.title}
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
            <Link
              href="/documents"
              className="motion-button inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 hover:border-blue-400 hover:text-white"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Dokumen
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recentDocuments.map((document, index) => (
              <Link key={document.id} href={`/documents/${document.id}`} className="group">
                <div
                  className={`motion-card flex aspect-[0.72] flex-col justify-end rounded-lg border border-zinc-600 bg-gradient-to-br ${coverStyles[index % coverStyles.length]} p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}
                >
                  <p className="text-lg font-semibold leading-tight text-white">
                    {document.title}
                  </p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/40">
                    <div className="smooth-progress h-full w-2/3 rounded-full bg-blue-400 group-hover:w-full" />
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium leading-5 text-zinc-200">
                  {document.title}
                </p>
              </Link>
            ))}
            {recentDocuments.length === 0 ? (
              <div className="col-span-full rounded-lg border border-dashed border-zinc-700 bg-[#111315] p-6 text-sm leading-6 text-zinc-400">
                Belum ada dokumen real. Upload PDF untuk mengisi dashboard.
              </div>
            ) : null}
          </div>
        </section>

        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Learning Progress</h2>
              <p className="mt-4 text-zinc-300">
                Aktivitas Belajar{" "}
                <span className="ml-4 font-semibold text-white">
                  {weeklyActivities}
                </span>{" "}
                <span className="text-zinc-500">minggu ini</span>
              </p>
            </div>
            <span className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
              Last 7 Days
            </span>
          </div>
          <div className="mt-3">
            <LearningActivityChart data={learningTrend} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr_1fr]">
        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
              <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-semibold text-white">
              Learning Progress Detail
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {progressDetails.map((detail) => (
              <article
                key={detail.label}
                className="motion-card rounded-lg border border-zinc-700 bg-[#111315] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">
                      {detail.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {detail.detail}
                    </p>
                  </div>
                  <p className="text-2xl font-semibold text-white">{detail.value}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
                <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Study Hub
                </h2>
                {latestDocument ? (
                  <p className="mt-1 text-sm text-zinc-500">
                    Focus: {latestDocument.title}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-zinc-700 bg-[#111315] p-4">
            <p className="text-sm leading-6 text-zinc-400">
              Study plan, flashcard queue, quiz score, dan timeline belajar
              sekarang dipusatkan di satu halaman supaya tidak dobel dengan detail
              dokumen.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-zinc-950 px-3 py-3">
                <p className="text-xs text-zinc-500">Dokumen</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {documents.length.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-950 px-3 py-3">
                <p className="text-xs text-zinc-500">Aktivitas Minggu Ini</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {weeklyActivities.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
          {documents.length ? (
            <Link
              href="/study"
              className="motion-button mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-400"
            >
              Buka Study Hub
            </Link>
          ) : null}
        </section>

        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-semibold text-white">Action Items Terbaru</h2>
          </div>
          <div className="mt-5 space-y-3">
            {dashboardActionItems.map((item) => (
              <article
                key={item.id}
                className="motion-card rounded-lg border border-zinc-700 bg-[#111315] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{item.title}</p>
                  <span className="rounded-full border border-blue-400/40 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-100">
                    {item.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {truncateText(item.detail, 120)}
                </p>
              </article>
            ))}
            {!latestDocument ? (
              <p className="rounded-lg border border-zinc-700 bg-[#111315] p-4 text-sm text-zinc-400">
                Upload dokumen untuk mengekstrak action items.
              </p>
            ) : null}
          </div>
          <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
            {recentActivities.slice(0, 3).map((activity) => (
              <p key={activity.id} className="text-xs leading-5 text-zinc-500">
                {activity.detail}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
