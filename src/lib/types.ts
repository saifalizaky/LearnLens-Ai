export type DocumentStatus = "ready" | "processing" | "needs-review";

export type TechnicalTerm = {
  term: string;
  definition: string;
};

export type CloudDocument = {
  id: string;
  sessionId?: string;
  title: string;
  category: string;
  fileName: string;
  pages: number;
  createdAt: string;
  status: DocumentStatus;
  source: "upload";
  summary: string;
  keyPoints: string[];
  technicalTerms: TechnicalTerm[];
  extractedText: string;
};

export type AiSummary = {
  summary: string;
  keyPoints: string[];
  technicalTerms: TechnicalTerm[];
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type DashboardStat = {
  label: string;
  value: string;
  detail: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
};
