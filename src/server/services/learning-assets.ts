import type { CloudDocument } from "@/lib/types";
import type { LearningActivity } from "@/server/services/activity-store";

export type DocumentInsight = {
  label: string;
  value: string;
  detail: string;
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  tag: string;
};

export type StudyPlanItem = {
  day: string;
  title: string;
  focus: string;
  task: string;
};

export type ActionItem = {
  id: string;
  title: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
};

export type ProgressDetail = {
  label: string;
  value: string;
  detail: string;
};

export function buildDocumentInsights(document: CloudDocument): DocumentInsight[] {
  const wordCount = countWords(document.extractedText);
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const readinessScore = calculateReadinessScore(document);

  return [
    {
      label: "Halaman",
      value: document.pages.toLocaleString("id-ID"),
      detail: "Dibaca dari metadata PDF.",
    },
    {
      label: "Kata",
      value: wordCount.toLocaleString("id-ID"),
      detail: `${readingMinutes} menit estimasi baca.`,
    },
    {
      label: "Poin",
      value: document.keyPoints.length.toLocaleString("id-ID"),
      detail: "Poin utama hasil analisis dokumen.",
    },
    {
      label: "Readiness",
      value: `${readinessScore}%`,
      detail: "Kesiapan untuk chat, quiz, dan review.",
    },
  ];
}

export function buildFlashcards(document: CloudDocument): Flashcard[] {
  const termCards = document.technicalTerms.map((term, index) => ({
    id: `term-${index}`,
    front: `Apa itu ${term.term}?`,
    back: term.definition,
    tag: "Term",
  }));
  const pointCards = document.keyPoints.slice(0, 5).map((point, index) => ({
    id: `point-${index}`,
    front: `Poin penting ${index + 1}`,
    back: point,
    tag: "Key Point",
  }));

  return [...termCards, ...pointCards].slice(0, 10);
}

export function buildStudyPlan(document: CloudDocument): StudyPlanItem[] {
  const keyPoints = withFallback(document.keyPoints, [
    "Pahami ringkasan dokumen dan konteks utama materi.",
  ]);
  const terms = withFallback(
    document.technicalTerms.map((term) => term.term),
    ["istilah teknis utama"],
  );
  const actionItems = buildActionItems(document);

  return [
    {
      day: "Hari 1",
      title: "Orientasi Dokumen",
      focus: document.title,
      task: `Baca ringkasan dan tandai ${Math.min(keyPoints.length, 3)} poin paling penting.`,
    },
    {
      day: "Hari 2",
      title: "Konsep Utama",
      focus: keyPoints[0],
      task: "Tulis ulang poin utama dengan bahasa sendiri, lalu tanyakan bagian yang belum jelas di Chat.",
    },
    {
      day: "Hari 3",
      title: "Istilah Teknis",
      focus: terms.slice(0, 3).join(", "),
      task: "Review flashcard sampai bisa menjelaskan istilah tanpa melihat jawaban.",
    },
    {
      day: "Hari 4",
      title: "Latihan Pemahaman",
      focus: keyPoints[1] ?? keyPoints[0],
      task: "Generate quiz 10 soal dan kerjakan tanpa membuka cuplikan konteks.",
    },
    {
      day: "Hari 5",
      title: "Eksekusi Action Items",
      focus: actionItems[0]?.title ?? "Tindak lanjut dokumen",
      task: actionItems[0]?.detail ?? "Ubah isi dokumen menjadi daftar pekerjaan yang bisa diselesaikan.",
    },
    {
      day: "Hari 6",
      title: "Review Kelemahan",
      focus: "Skor quiz dan jawaban salah",
      task: "Ulangi quiz, lalu gunakan Chat untuk membahas jawaban yang masih salah.",
    },
    {
      day: "Hari 7",
      title: "Finalisasi",
      focus: "Ringkasan akhir",
      task: "Buat catatan 1 halaman berisi konsep, istilah, dan tindak lanjut dari dokumen.",
    },
  ];
}

export function buildActionItems(document: CloudDocument): ActionItem[] {
  const sentences = splitSentences(document.extractedText);
  const actionableSentences = sentences.filter((sentence) =>
    /(wajib|harus|perlu|dikumpulkan|presentasi|revisi|buat|susun|siapkan|kerjakan|upload|kumpulkan|submit)/i.test(
      sentence,
    ),
  );
  const sourceItems = actionableSentences.length
    ? actionableSentences
    : document.keyPoints;

  return sourceItems.slice(0, 8).map((item, index) => ({
    id: `action-${index}`,
    title: createActionTitle(item, index),
    detail: item,
    priority: index < 2 ? "High" : index < 5 ? "Medium" : "Low",
  }));
}

export function buildProgressDetails(
  documents: CloudDocument[],
  activities: LearningActivity[],
): ProgressDetail[] {
  const chatCount = activities.filter(
    (activity) => activity.type === "chat_question",
  ).length;
  const quizSubmitted = activities.filter(
    (activity) => activity.type === "quiz_submitted",
  );
  const quizGenerated = activities.filter(
    (activity) => activity.type === "quiz_generated",
  ).length;
  const scores = quizSubmitted
    .map((activity) => activity.score)
    .filter((score): score is number => typeof score === "number");
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const totalPages = documents.reduce((sum, document) => sum + document.pages, 0);

  return [
    {
      label: "Dokumen Aktif",
      value: documents.length.toLocaleString("id-ID"),
      detail: "File PDF real yang tersimpan.",
    },
    {
      label: "Chat Dokumen",
      value: chatCount.toLocaleString("id-ID"),
      detail: "Pertanyaan yang benar-benar dikirim.",
    },
    {
      label: "Quiz Dibuat",
      value: quizGenerated.toLocaleString("id-ID"),
      detail: "Generate quiz dari dokumen upload.",
    },
    {
      label: "Rata-rata Skor",
      value: scores.length ? `${averageScore}%` : "-",
      detail: scores.length ? `${scores.length} quiz selesai.` : "Belum ada quiz selesai.",
    },
    {
      label: "Total Halaman",
      value: totalPages.toLocaleString("id-ID"),
      detail: "Jumlah halaman dari semua dokumen.",
    },
  ];
}

function calculateReadinessScore(document: CloudDocument) {
  const score =
    (document.summary ? 25 : 0) +
    Math.min(document.keyPoints.length, 5) * 10 +
    Math.min(document.technicalTerms.length, 5) * 5;

  return Math.min(score, 100);
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35);
}

function createActionTitle(value: string, index: number) {
  const lowered = value.toLowerCase();

  if (lowered.includes("dataset")) {
    return "Siapkan Dataset";
  }

  if (lowered.includes("artikel") || lowered.includes("jurnal")) {
    return "Susun Artikel";
  }

  if (lowered.includes("presentasi") || lowered.includes("slide")) {
    return "Siapkan Presentasi";
  }

  if (lowered.includes("revisi")) {
    return "Kerjakan Revisi";
  }

  if (lowered.includes("metode") || lowered.includes("perhitungan")) {
    return "Pahami Metode";
  }

  return `Tindak Lanjut ${index + 1}`;
}

function withFallback<T>(items: T[], fallback: T[]) {
  return items.length ? items : fallback;
}
