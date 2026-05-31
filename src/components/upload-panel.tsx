"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  FileSearch,
  FileUp,
  GraduationCap,
  Loader2,
  MessageSquareText,
  UploadCloud,
} from "lucide-react";

type UploadResult = {
  document: {
    id: string;
    title: string;
    extractedTextLength: number;
    summary: string;
    keyPoints: string[];
  };
};

export function UploadPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const file = inputRef.current?.files?.[0];

    if (!file) {
      setError("Pilih file PDF terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Upload gagal diproses.");
      }

      setResult(data);
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload gagal diproses.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="motion-card rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Upload PDF</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
            Dokumen akan diekstrak di backend, lalu diringkas dengan LLM jika API key
            tersedia.
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-blue-300">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="motion-button flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-zinc-600 bg-[#0f1113] px-4 text-sm text-zinc-300 transition-colors hover:border-blue-400 hover:bg-zinc-800">
          <FileUp className="h-5 w-5 text-blue-300" aria-hidden="true" />
          <span className="min-w-0 truncate">
            {fileName || "Pilih file PDF dari komputer"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) =>
              setFileName(event.currentTarget.files?.[0]?.name ?? "")
            }
          />
        </label>

        <button
          type="submit"
          disabled={isUploading}
          className="motion-button inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
          )}
          Proses PDF
        </button>
      </form>

      {error ? (
        <p className="result-enter mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="result-enter mt-5 rounded-lg border border-blue-400/30 bg-blue-400/10 p-4">
          <p className="text-sm font-semibold text-white">{result.document.title}</p>
          <p className="mt-1 text-sm text-zinc-300">
            {result.document.extractedTextLength.toLocaleString("id-ID")} karakter
            teks berhasil diekstrak.
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-200">
            {result.document.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/documents/${result.document.id}`}
              className="motion-button inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-400"
            >
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              Detail
            </Link>
            <Link
              href={`/chat/${result.document.id}`}
              className="motion-button inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-600 bg-[#0f1113] px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              Chat file ini
            </Link>
            <Link
              href={`/quiz/${result.document.id}`}
              className="motion-button inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-600 bg-[#0f1113] px-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Quiz file ini
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
