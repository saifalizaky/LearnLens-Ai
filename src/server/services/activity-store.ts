import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { CloudDocument } from "@/lib/types";
import { getSupabaseAdminClient } from "@/server/services/supabase";

export type ActivityType =
  | "document_uploaded"
  | "document_deleted"
  | "chat_question"
  | "quiz_generated"
  | "quiz_submitted";

export type LearningActivity = {
  id: string;
  sessionId?: string;
  type: ActivityType;
  documentId: string;
  documentTitle: string;
  detail: string;
  createdAt: string;
  score?: number;
  questionCount?: number;
};

export type LearningTrendDatum = {
  day: string;
  questions: number;
  quizzes: number;
  uploads: number;
};

const storePath = join(process.cwd(), ".data", "activities.json");
const activitiesTable = "activities";

export async function recordActivity(
  sessionId: string,
  activity: Omit<LearningActivity, "id" | "createdAt" | "sessionId"> & {
    createdAt?: string;
  },
) {
  if (activity.type === "document_uploaded") {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const nextActivity = {
    ...activity,
    sessionId,
    id: crypto.randomUUID(),
    createdAt: activity.createdAt ?? new Date().toISOString(),
  };

  if (supabase) {
    const { error } = await supabase
      .from(activitiesTable)
      .insert(activityToRow(nextActivity));

    if (error) {
      throw error;
    }

    return;
  }

  const activities = (await readActivities()).filter(
    (activity) => activity.type !== "document_uploaded",
  );
  const nextActivities = [
    nextActivity,
    ...activities,
  ].slice(0, 500);

  await writeActivities(nextActivities);
}

export async function getActivities(sessionId: string) {
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { data, error } = await supabase
      .from(activitiesTable)
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      throw error;
    }

    return (data ?? []).map(activityFromRow);
  }

  return readActivitiesForSession(sessionId);
}

export async function getRecentRealActivities(
  sessionId: string,
  documents: CloudDocument[],
) {
  const activities = (await getActivities(sessionId)).filter(
    (activity) => activity.type !== "document_uploaded",
  );
  const uploadActivities = documents.map((document) => ({
    id: `upload-${document.id}`,
    type: "document_uploaded" as const,
    documentId: document.id,
    documentTitle: document.title,
    detail: `${document.title} diupload dan siap dipakai untuk summary, chat, dan quiz.`,
    createdAt: document.createdAt,
  }));

  return [...activities, ...uploadActivities]
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    )
    .slice(0, 5);
}

export async function getLearningTrend(
  sessionId: string,
  documents: CloudDocument[],
): Promise<LearningTrendDatum[]> {
  const activities = await getActivities(sessionId);
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);

    return date;
  });

  return days.map((date) => {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const dayActivities = activities.filter((activity) =>
      isDateInRange(activity.createdAt, date, nextDate),
    );
    const dayUploads = documents.filter((document) =>
      isDateInRange(document.createdAt, date, nextDate),
    );
    const uploadIds = new Set([
      ...dayUploads.map((document) => document.id),
      ...dayActivities
        .filter((activity) => activity.type === "document_uploaded")
        .map((activity) => activity.documentId),
    ]);

    return {
      day: formatDayLabel(date),
      questions: dayActivities.filter((activity) => activity.type === "chat_question")
        .length,
      quizzes: dayActivities.filter(
        (activity) =>
          activity.type === "quiz_generated" || activity.type === "quiz_submitted",
      ).length,
      uploads: uploadIds.size,
    };
  });
}

async function readActivities(): Promise<LearningActivity[]> {
  try {
    const raw = (await readFile(storePath, "utf8")).replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as LearningActivity[];

    return Array.isArray(parsed)
      ? parsed.filter((activity) => isLearningActivity(activity))
      : [];
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

async function readActivitiesForSession(sessionId: string) {
  const activities = await readActivities();
  const { activities: sessionActivities, changed } = claimLegacyActivities(
    activities,
    sessionId,
  );

  if (changed) {
    await writeActivities(sessionActivities);
  }

  return sessionActivities.filter((activity) => activity.sessionId === sessionId);
}

async function writeActivities(activities: LearningActivity[]) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(activities, null, 2), "utf8");
}

function claimLegacyActivities(activities: LearningActivity[], sessionId: string) {
  let changed = false;
  const nextActivities = activities.map((activity) => {
    if (activity.sessionId) {
      return activity;
    }

    changed = true;

    return { ...activity, sessionId };
  });

  return { activities: nextActivities, changed };
}

function isLearningActivity(value: unknown): value is LearningActivity {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "documentId" in value &&
    "documentTitle" in value &&
    "detail" in value &&
    "createdAt" in value
  );
}

function isDateInRange(value: string, start: Date, end: Date) {
  const date = new Date(value);

  return date >= start && date < end;
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date);
}

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

type ActivityRow = {
  id: string;
  session_id?: string | null;
  type: ActivityType;
  document_id: string;
  document_title: string;
  detail: string;
  created_at: string;
  score?: number | null;
  question_count?: number | null;
};

function activityToRow(activity: LearningActivity): ActivityRow {
  return {
    id: activity.id,
    session_id: activity.sessionId,
    type: activity.type,
    document_id: activity.documentId,
    document_title: activity.documentTitle,
    detail: activity.detail,
    created_at: activity.createdAt,
    score: activity.score,
    question_count: activity.questionCount,
  };
}

function activityFromRow(row: ActivityRow): LearningActivity {
  return {
    id: row.id,
    sessionId: row.session_id ?? undefined,
    type: row.type,
    documentId: row.document_id,
    documentTitle: row.document_title,
    detail: row.detail,
    createdAt: row.created_at,
    score: row.score ?? undefined,
    questionCount: row.question_count ?? undefined,
  };
}
