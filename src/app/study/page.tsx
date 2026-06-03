import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers3,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { ActionItemsPanel } from "@/components/action-items-panel";
import { FlashcardPanel } from "@/components/flashcard-panel";
import { formatDate, truncateText } from "@/lib/utils";
import {
  deriveLearningTrend,
  deriveRecentRealActivities,
  getActivities,
} from "@/server/services/activity-store";
import { getDocuments } from "@/server/services/document-store";
import {
  buildActionItems,
  buildDocumentInsights,
  buildFlashcards,
  buildProgressDetails,
  buildStudyPlan,
  type ActionItem,
} from "@/server/services/learning-assets";
import { getCurrentSessionId } from "@/server/services/session";

export const dynamic = "force-dynamic";

export default async function StudyHubPage() {
  const sessionId = await getCurrentSessionId();
  const documents = await getDocuments(sessionId);
  const activities = await getActivities(sessionId);
  const learningTrend = deriveLearningTrend(documents, activities);
  const recentActivities = deriveRecentRealActivities(documents, activities);
  const latestDocument = documents[0];
  const progressDetails = buildProgressDetails(documents, activities);
  const weeklyActivities = learningTrend.reduce(
    (sum, item) => sum + item.questions + item.quizzes + item.uploads,
    0,
  );
  const quizSubmissions = activities.filter(
    (activity) => activity.type === "quiz_submitted",
  );
  const generatedQuizCount = activities.filter(
    (activity) => activity.type === "quiz_generated",
  ).length;
  const chatCount = activities.filter(
    (activity) => activity.type === "chat_question",
  ).length;
  const scores = quizSubmissions
    .map((activity) => activity.score)
    .filter((score): score is number => typeof score === "number");
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const totalFlashcards = documents.reduce(
    (sum, document) => sum + buildFlashcards(document).length,
    0,
  );
  const reviewFlashcards = documents
    .flatMap((document) =>
      buildFlashcards(document).map((flashcard) => ({
        ...flashcard,
        id: `${document.id}-${flashcard.id}`,
        tag: `${flashcard.tag} - ${truncateText(document.title, 28)}`,
      })),
    )
    .slice(0, 8);
  const studyPlan = latestDocument ? buildStudyPlan(latestDocument) : [];
  const actionItems = buildHubActionItems(documents);
  const documentQueue = documents.slice(0, 4).map((document) => {
    const insights = buildDocumentInsights(document);
    const readiness =
      insights.find((insight) => insight.label === "Readiness")?.value ?? "0%";

    return {
      id: document.id,
      title: document.title,
      createdAt: document.createdAt,
      pages: document.pages,
      readiness,
      flashcards: buildFlashcards(document).length,
      actionItems: buildActionItems(document).length,
    };
  });

  return (
    <div className="page-enter space-y-6">
      <header className="relative overflow-hidden rounded-lg border border-blue-400/40 bg-[#08090a] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_38%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-blue-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Study Hub
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-normal text-white sm:text-5xl">
              Pusat belajar dari semua dokumen kamu.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Gabungkan study plan, flashcard, quiz score, dan action items dalam
              satu halaman supaya alur belajar tidak tersebar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Aktivitas Minggu Ini",
                value: weeklyActivities.toLocaleString("id-ID"),
                detail: "Upload, chat, dan quiz real.",
              },
              {
                label: "Flashcard Siap",
                value: totalFlashcards.toLocaleString("id-ID"),
                detail: "Dari istilah dan poin dokumen.",
              },
              {
                label: "Rata-rata Quiz",
                value: scores.length ? `${averageScore}%` : "-",
                detail: scores.length ? `${scores.length} quiz selesai.` : "Belum ada submit.",
              },
              {
                label: "Chat Dokumen",
                value: chatCount.toLocaleString("id-ID"),
                detail: "Pertanyaan yang sudah dikirim.",
              },
            ].map((stat) => (
              <article
                key={stat.label}
                className="motion-card rounded-lg border border-zinc-700 bg-[#111315]/90 p-4"
              >
                <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {stat.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </header>

      {latestDocument ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <article className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-200">
                    <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-blue-200">
                      Focus Document
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      {latestDocument.title}
                    </h2>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-zinc-400">
                  {truncateText(latestDocument.summary, 280)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link
                  href={`/documents/${latestDocument.id}`}
                  className="motion-button inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-600 px-3 text-sm font-semibold text-zinc-200 hover:border-blue-400 hover:text-white"
                >
                  Detail
                </Link>
                <Link
                  href={`/chat/${latestDocument.id}`}
                  className="motion-button inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-400"
                >
                  <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                  Chat
                </Link>
                <Link
                  href={`/quiz/${latestDocument.id}`}
                  className="motion-button inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500/80 px-3 text-sm font-semibold text-white hover:bg-blue-400"
                >
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                  Quiz
                </Link>
              </div>
            </div>
          </article>

          <article className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-semibold text-white">Progress Ringkas</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {progressDetails.slice(0, 4).map((detail) => (
                <div
                  key={detail.label}
                  className="rounded-lg border border-zinc-700 bg-[#111315] p-4"
                >
                  <p className="text-xs font-medium text-zinc-500">
                    {detail.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {detail.value}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-zinc-700 bg-[#151719] p-6 text-sm leading-6 text-zinc-400">
          Belum ada dokumen. Upload PDF dulu supaya Study Hub bisa membuat study
          plan, flashcard, quiz, dan action items dari data real.
          <div className="mt-4">
            <Link
              href="/documents#upload"
              className="motion-button inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-400"
            >
              Upload Dokumen
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                7-Day Study Plan
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {latestDocument
                  ? `Rencana belajar dari ${latestDocument.title}.`
                  : "Study plan akan muncul setelah ada dokumen."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {studyPlan.map((item) => (
              <article
                key={item.day}
                className="motion-card rounded-lg border border-zinc-700 bg-[#111315] p-4"
              >
                <p className="text-sm font-semibold text-blue-300">{item.day}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  <span className="text-zinc-200">Fokus:</span>{" "}
                  {truncateText(item.focus, 90)}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  <span className="text-zinc-200">Tugas:</span>{" "}
                  {truncateText(item.task, 140)}
                </p>
              </article>
            ))}
            {!studyPlan.length ? (
              <p className="rounded-lg border border-zinc-700 bg-[#111315] p-4 text-sm text-zinc-400">
                Belum ada study plan karena dokumen belum tersedia.
              </p>
            ) : null}
          </div>
        </section>

        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Action Queue
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Tindak lanjut yang diekstrak dari instruksi dan tenggat dokumen.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <ActionItemsPanel
              items={actionItems}
              storageKey="cloudtutor.actionItems.study"
            />
          </div>
        </section>
      </div>

      <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
              <Layers3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Flashcard Review Queue
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Kartu diambil dari istilah teknis dan poin penting semua dokumen.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-zinc-700 px-3 py-1 text-sm font-semibold text-zinc-300">
            {reviewFlashcards.length} dari {totalFlashcards} kartu
          </span>
        </div>
        <div className="mt-6">
          <FlashcardPanel
            flashcards={reviewFlashcards}
            storageKey="cloudtutor.flashcards.study"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-semibold text-white">
              Quiz Performance
            </h2>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Quiz Dibuat",
                value: generatedQuizCount.toLocaleString("id-ID"),
              },
              {
                label: "Submit Quiz",
                value: quizSubmissions.length.toLocaleString("id-ID"),
              },
              {
                label: "Skor Terbaik",
                value: scores.length ? `${bestScore}%` : "-",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-zinc-700 bg-[#111315] p-4"
              >
                <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {quizSubmissions.slice(0, 4).map((activity) => (
              <article
                key={activity.id}
                className="motion-card rounded-lg border border-zinc-700 bg-[#111315] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {activity.documentTitle}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-100">
                    {activity.score ?? 0}%
                  </span>
                </div>
              </article>
            ))}
            {!quizSubmissions.length ? (
              <p className="rounded-lg border border-zinc-700 bg-[#111315] p-4 text-sm leading-6 text-zinc-400">
                Belum ada quiz yang disubmit. Kerjakan quiz dari dokumen untuk
                mengisi riwayat skor di sini.
              </p>
            ) : null}
          </div>
        </section>

        <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-semibold text-white">
              Document Focus Queue
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {documentQueue.map((document) => (
              <Link
                key={document.id}
                href={`/documents/${document.id}`}
                className="motion-card block rounded-lg border border-zinc-700 bg-[#111315] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{document.title}</h3>
                    <p className="mt-2 text-sm text-zinc-500">
                      {document.pages} halaman - {formatDate(document.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {document.readiness}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <p className="rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
                    {document.flashcards} flashcard
                  </p>
                  <p className="rounded-lg bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
                    {document.actionItems} action item
                  </p>
                </div>
              </Link>
            ))}
            {!documentQueue.length ? (
              <p className="rounded-lg border border-zinc-700 bg-[#111315] p-4 text-sm text-zinc-400">
                Belum ada dokumen dalam antrean belajar.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 text-blue-300">
            <MessageSquareText className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-2xl font-semibold text-white">Learning Timeline</h2>
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {recentActivities.slice(0, 6).map((activity) => (
            <article
              key={activity.id}
              className="motion-card rounded-lg border border-zinc-700 bg-[#111315] p-4"
            >
              <p className="text-sm leading-6 text-zinc-300">
                {truncateText(activity.detail, 130)}
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                {formatDate(activity.createdAt)}
              </p>
            </article>
          ))}
          {!recentActivities.length ? (
            <p className="rounded-lg border border-zinc-700 bg-[#111315] p-4 text-sm text-zinc-400">
              Aktivitas belajar akan muncul setelah kamu upload, chat, atau submit
              quiz.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function buildHubActionItems(
  documents: Awaited<ReturnType<typeof getDocuments>>,
): ActionItem[] {
  return documents
    .flatMap((document) =>
      buildActionItems(document)
        .slice(0, 2)
        .map((item) => ({
          ...item,
          id: `${document.id}-${item.id}`,
          detail: `${truncateText(document.title, 42)}: ${item.detail}`,
        })),
    )
    .slice(0, 8);
}
