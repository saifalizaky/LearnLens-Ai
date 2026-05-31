"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, FileText, Search, UserRound } from "lucide-react";

type SearchDocument = {
  id: string;
  title: string;
  fileName: string;
  summary: string;
  pages: number;
};

type ToolbarActivity = {
  id: string;
  detail: string;
  createdAt: string;
};

export function DashboardToolbar({
  documents,
  activities,
}: {
  documents: SearchDocument[];
  activities: ToolbarActivity[];
}) {
  const [query, setQuery] = useState("");
  const [activePanel, setActivePanel] = useState<"notifications" | "user" | null>(
    null,
  );
  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }

    return documents
      .filter((document) =>
        [document.title, document.fileName, document.summary]
          .join(" ")
          .toLowerCase()
          .includes(trimmedQuery),
      )
      .slice(0, 5);
  }, [documents, trimmedQuery]);

  return (
    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative">
        <label className="flex h-12 min-w-0 items-center gap-3 rounded-lg border border-zinc-700 bg-[#151719] px-4 text-zinc-400 transition-colors focus-within:border-blue-400 sm:w-72">
          <Search className="h-5 w-5" aria-hidden="true" />
          <input
            aria-label="Search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActivePanel(null);
            }}
            placeholder="Search documents..."
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500"
          />
        </label>
        {trimmedQuery ? (
          <div className="motion-popover absolute right-0 top-14 z-30 w-full rounded-lg border border-zinc-700 bg-[#111315] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:w-96">
            {searchResults.length > 0 ? (
              searchResults.map((document) => (
                <Link
                  key={document.id}
                  href={`/documents/${document.id}`}
                  className="motion-button flex gap-3 rounded-lg p-3 text-left hover:bg-zinc-800"
                  onClick={() => setQuery("")}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-400/40 text-blue-300">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {document.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-zinc-500">
                      {document.fileName} - {document.pages} halaman
                    </span>
                  </span>
                </Link>
              ))
            ) : (
              <p className="p-3 text-sm text-zinc-400">
                Tidak ada dokumen yang cocok.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="relative flex gap-3">
        <button
          type="button"
          onClick={() =>
            setActivePanel((panel) =>
              panel === "notifications" ? null : "notifications",
            )
          }
          className="motion-button relative flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-[#151719] text-zinc-300 hover:bg-zinc-800"
          title="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {activities.length > 0 ? (
            <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full bg-pink-500 shadow-[0_0_18px_rgba(236,72,153,0.8)]" />
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setActivePanel((panel) => (panel === "user" ? null : "user"))}
          className="motion-button flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white hover:bg-zinc-600"
          title="Local session"
        >
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </button>

        {activePanel === "notifications" ? (
          <div className="motion-popover absolute right-0 top-14 z-30 w-80 rounded-lg border border-zinc-700 bg-[#111315] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <p className="font-semibold text-white">Notifikasi aktivitas</p>
            <div className="mt-3 space-y-3">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <article
                    key={activity.id}
                    className="motion-card rounded-lg bg-zinc-900 p-3"
                  >
                    <p className="text-sm leading-5 text-zinc-200">{activity.detail}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {new Date(activity.createdAt).toLocaleString("id-ID")}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-zinc-400">
                  Belum ada aktivitas. Upload, chat, atau submit quiz untuk membuat
                  notifikasi real.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {activePanel === "user" ? (
          <div className="motion-popover absolute right-0 top-14 z-30 w-72 rounded-lg border border-zinc-700 bg-[#111315] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <p className="font-semibold text-white">Local Session</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Data aplikasi dibaca dari upload dan aktivitas real di workspace lokal.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-zinc-900 p-3">
                <p className="text-2xl font-semibold text-white">{documents.length}</p>
                <p className="mt-1 text-zinc-500">Dokumen</p>
              </div>
              <div className="rounded-lg bg-zinc-900 p-3">
                <p className="text-2xl font-semibold text-white">{activities.length}</p>
                <p className="mt-1 text-zinc-500">Aktivitas</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href="/documents"
                className="motion-button inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-blue-500 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Documents
              </Link>
              <Link
                href="/quiz"
                className="motion-button inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-600 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
              >
                Quiz
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
