import type { AiSummary, QuizQuestion } from "@/lib/types";

type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type SummarizeInput = {
  title: string;
  text: string;
};

export async function summarizeDocument(input: SummarizeInput): Promise<AiSummary> {
  const prompt = [
    "Buat ringkasan dokumen cloud computing berikut dalam format JSON valid.",
    'Gunakan skema: {"summary":"...","keyPoints":["..."],"technicalTerms":[{"term":"...","definition":"..."}]}.',
    "Tulis dalam Bahasa Indonesia yang ringkas dan akademik.",
    `Judul: ${input.title}`,
    `Dokumen: ${limitContext(input.text)}`,
  ].join("\n\n");

  const content = await callDashScope([
    {
      role: "system",
      content:
        "Kamu adalah asisten pembelajaran cloud computing. Jawab hanya berdasarkan dokumen.",
    },
    { role: "user", content: prompt },
  ]);

  if (!content) {
    return buildFallbackSummary(input);
  }

  return parseJson<AiSummary>(content) ?? buildFallbackSummary(input);
}

export async function answerQuestion(input: {
  title: string;
  context: string;
  question: string;
  model?: string;
}) {
  const content = await callDashScope(
    [
      {
        role: "system",
        content:
          "Kamu adalah tutor cloud computing. Jawab hanya dari konteks dokumen. Jika tidak ada di konteks, katakan informasinya tidak tersedia di dokumen.",
      },
      {
        role: "user",
        content: [
          `Judul dokumen: ${input.title}`,
          `Konteks: ${limitContext(input.context)}`,
          `Pertanyaan: ${input.question}`,
        ].join("\n\n"),
      },
    ],
    input.model,
  );

  if (content) {
    return content;
  }

  return buildExtractiveAnswer(input.context, input.question);
}

export async function generateQuiz(input: {
  title: string;
  context: string;
  count?: number;
}): Promise<QuizQuestion[]> {
  const count = input.count ?? 10;
  const prompt = [
    `Buat ${count} soal pilihan ganda dari dokumen berikut.`,
    "Balas sebagai JSON array valid.",
    'Skema item: {"id":"quiz-1","question":"...","options":["..."],"correctAnswer":"...","explanation":"..."}.',
    "Pastikan correctAnswer sama persis dengan salah satu options.",
    `Judul: ${input.title}`,
    `Dokumen: ${limitContext(input.context)}`,
  ].join("\n\n");

  const content = await callDashScope([
    {
      role: "system",
      content:
        "Kamu adalah pembuat quiz cloud computing. Buat soal yang relevan dan tidak keluar dari dokumen.",
    },
    { role: "user", content: prompt },
  ]);

  if (!content) {
    return buildFallbackQuiz(input, count);
  }

  const parsedQuestions = parseJson<QuizQuestion[]>(content);

  if (!parsedQuestions?.length) {
    return buildFallbackQuiz(input, count);
  }

  return normalizeQuizQuestions(parsedQuestions, buildFallbackQuiz(input, count), count);
}

async function callDashScope(messages: ChatCompletionMessage[], modelOverride?: string) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseUrl =
    process.env.DASHSCOPE_BASE_URL ??
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
  const model = modelOverride ?? process.env.DASHSCOPE_MODEL ?? "qwen-plus";

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ChatCompletionResponse;

    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

function limitContext(value: string, maxLength = 12000) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function parseJson<T>(value: string) {
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const objectStart = cleaned.indexOf("{");
    const objectEnd = cleaned.lastIndexOf("}");
    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");

    const jsonCandidate =
      arrayStart >= 0 && arrayEnd > arrayStart
        ? cleaned.slice(arrayStart, arrayEnd + 1)
        : objectStart >= 0 && objectEnd > objectStart
          ? cleaned.slice(objectStart, objectEnd + 1)
          : "";

    if (!jsonCandidate) {
      return null;
    }

    try {
      return JSON.parse(jsonCandidate) as T;
    } catch {
      return null;
    }
  }
}

function buildFallbackSummary(input: SummarizeInput): AiSummary {
  const sentences = getSentences(input.text);
  const summarySentences = sentences.slice(0, 3);
  const keyPoints = sentences.slice(0, 5);
  const technicalTerms = extractTechnicalTerms(input.text);

  return {
    summary:
      summarySentences.join(". ") ||
      `Dokumen ${input.title} berhasil diterima, tetapi teksnya terlalu pendek untuk diringkas secara otomatis.`,
    keyPoints:
      keyPoints.length > 0
        ? keyPoints
        : ["Teks dokumen berhasil diekstrak, namun poin utama belum dapat diidentifikasi."],
    technicalTerms,
  };
}

function buildExtractiveAnswer(context: string, question: string) {
  const questionTerms = question
    .toLowerCase()
    .split(/\W+/)
    .filter((term) => term.length > 3);
  const relevantSentences = getSentences(context)
    .map((sentence) => ({
      sentence,
      score: questionTerms.reduce(
        (total, term) => total + (sentence.toLowerCase().includes(term) ? 1 : 0),
        0,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 3)
    .map((item) => item.sentence);

  if (!relevantSentences.length) {
    return "Informasi itu tidak ditemukan secara eksplisit di dokumen yang dipilih.";
  }

  return relevantSentences.join(". ");
}

function buildFallbackQuiz(
  input: {
    title: string;
    context: string;
  },
  count: number,
): QuizQuestion[] {
  const sentences = getSentences(input.context).slice(0, Math.max(count, 4));

  return Array.from({ length: count }, (_, index) => {
    const correctAnswer =
      sentences[index % Math.max(sentences.length, 1)] ??
      `Dokumen ${input.title} belum memiliki teks yang cukup untuk membuat opsi.`;

    return {
      id: `quiz-${index + 1}`,
      question: `Pernyataan mana yang paling sesuai dengan isi dokumen "${input.title}"?`,
      options: shuffleOptions([
        correctAnswer,
        "Informasi tersebut tidak disebutkan sebagai bagian utama dokumen.",
        "Dokumen tidak menyediakan konteks yang mendukung pernyataan tersebut.",
        "Pernyataan tersebut tidak dapat disimpulkan dari teks yang tersedia.",
      ]),
      correctAnswer,
      explanation: correctAnswer,
    };
  });
}

function normalizeQuizQuestions(
  questions: QuizQuestion[],
  fallbackQuestions: QuizQuestion[],
  count: number,
) {
  return [...questions, ...fallbackQuestions].slice(0, count).map((question, index) => ({
    ...question,
    id: question.id || `quiz-${index + 1}`,
    options: question.options.slice(0, 4),
  }));
}

function getSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim().replace(/[.!?]+$/g, ""))
    .filter((sentence) => sentence.length > 40);
}

function extractTechnicalTerms(text: string) {
  const sentences = getSentences(text);
  const terms = Array.from(
    new Set(
      text.match(/\b[A-Z][A-Za-z0-9+-]*(?:\s+[A-Z][A-Za-z0-9+-]*){0,3}\b/g) ?? [],
    ),
  )
    .filter((term) => term.length > 2 && !/^(The|And|For|This|That)$/i.test(term))
    .slice(0, 5);

  return terms.map((term) => ({
    term,
    definition:
      sentences.find((sentence) => sentence.includes(term)) ??
      `Istilah "${term}" muncul di dalam dokumen yang diunggah.`,
  }));
}

function shuffleOptions(options: string[]) {
  return options
    .map((option, index) => ({ option, sort: (index * 17 + option.length) % 7 }))
    .sort((first, second) => first.sort - second.sort)
    .map((item) => item.option);
}
