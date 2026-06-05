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
  excludedQuestions?: string[];
}): Promise<QuizQuestion[]> {
  const count = input.count ?? 10;
  const excludedQuestions = getUniqueQuestions(input.excludedQuestions ?? []);
  const prompt = [
    `Buat ${count} soal pilihan ganda dari dokumen berikut.`,
    "Balas sebagai JSON array valid.",
    'Skema item: {"id":"quiz-1","question":"...","options":["..."],"correctAnswer":"...","explanation":"..."}.',
    "Pastikan correctAnswer sama persis dengan salah satu options.",
    "Buat pertanyaan baru yang menguji konsep berbeda, bukan sekadar mengubah urutan kata.",
    ...(excludedQuestions.length
      ? [
          "Jangan membuat soal yang sama atau terlalu mirip dengan soal yang pernah dipakai berikut.",
          `Soal yang harus dihindari:\n${excludedQuestions
            .map((question, index) => `${index + 1}. ${question}`)
            .join("\n")}`,
        ]
      : []),
    `Judul: ${input.title}`,
    `Dokumen: ${limitContext(input.context)}`,
  ].join("\n\n");

  const content = await callDashScope([
    {
      role: "system",
      content:
        "Kamu adalah pembuat quiz cloud computing. Buat soal yang relevan, tidak keluar dari dokumen, dan tidak mengulang soal lama.",
    },
    { role: "user", content: prompt },
  ], undefined, { temperature: 0.45 });

  if (!content) {
    return buildFallbackQuiz(input, count, excludedQuestions);
  }

  const parsedQuestions = parseJson<QuizQuestion[]>(content);

  if (!parsedQuestions?.length) {
    return buildFallbackQuiz(input, count, excludedQuestions);
  }

  return normalizeQuizQuestions(
    parsedQuestions,
    buildFallbackQuiz(input, count, excludedQuestions),
    count,
    excludedQuestions,
  );
}

async function callDashScope(
  messages: ChatCompletionMessage[],
  modelOverride?: string,
  options?: { temperature?: number },
) {
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
        temperature: options?.temperature ?? 0.2,
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
  excludedQuestions: string[] = [],
): QuizQuestion[] {
  const sentences = getSentences(input.context)
    .filter((sentence) =>
      !isDuplicateQuestion(
        `Pernyataan mana yang paling sesuai dengan poin ini: ${sentence}`,
        excludedQuestions,
      ),
    )
    .slice(0, Math.max(count, 4));

  return sentences.slice(0, count).map((sentence, index) => {
    const correctAnswer = sentence;

    return {
      id: `quiz-${index + 1}`,
      question: `Pernyataan mana yang paling sesuai dengan poin ${index + 1} dari dokumen "${input.title}"?`,
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
  excludedQuestions: string[] = [],
) {
  const seenQuestions = [...excludedQuestions];
  const distinctQuestions: QuizQuestion[] = [];

  for (const question of [...questions, ...fallbackQuestions]) {
    if (
      !question.question ||
      question.options.length < 2 ||
      !question.options.includes(question.correctAnswer) ||
      isDuplicateQuestion(question.question, seenQuestions)
    ) {
      continue;
    }

    distinctQuestions.push(question);
    seenQuestions.push(question.question);

    if (distinctQuestions.length >= count) {
      break;
    }
  }

  return distinctQuestions.map((question, index) => ({
    ...question,
    id: question.id || `quiz-${index + 1}`,
    options: question.options.slice(0, 4),
  }));
}

function getUniqueQuestions(questions: string[]) {
  const seen = new Set<string>();
  const uniqueQuestions: string[] = [];

  for (const question of questions) {
    const normalizedQuestion = normalizeQuestion(question);

    if (!normalizedQuestion || seen.has(normalizedQuestion)) {
      continue;
    }

    seen.add(normalizedQuestion);
    uniqueQuestions.push(question.trim());
  }

  return uniqueQuestions.slice(0, 80);
}

function isDuplicateQuestion(question: string, previousQuestions: string[]) {
  return previousQuestions.some((previousQuestion) => {
    const normalizedQuestion = normalizeQuestion(question);
    const normalizedPreviousQuestion = normalizeQuestion(previousQuestion);

    return (
      normalizedQuestion === normalizedPreviousQuestion ||
      getQuestionSimilarity(normalizedQuestion, normalizedPreviousQuestion) >= 0.82
    );
  });
}

function getQuestionSimilarity(firstQuestion: string, secondQuestion: string) {
  const firstTokens = new Set(getQuestionTokens(firstQuestion));
  const secondTokens = new Set(getQuestionTokens(secondQuestion));

  if (!firstTokens.size || !secondTokens.size) {
    return 0;
  }

  const intersectionSize = [...firstTokens].filter((token) =>
    secondTokens.has(token),
  ).length;
  const unionSize = new Set([...firstTokens, ...secondTokens]).size;

  return intersectionSize / unionSize;
}

function getQuestionTokens(question: string) {
  return question.split(" ").filter((token) => token.length > 3);
}

function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
