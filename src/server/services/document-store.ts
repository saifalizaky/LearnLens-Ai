import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { CloudDocument, TechnicalTerm } from "@/lib/types";
import { getSupabaseAdminClient } from "@/server/services/supabase";

const storePath = join(process.cwd(), ".data", "documents.json");
const documentsTable = "documents";

export async function getDocuments(sessionId: string) {
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { data, error } = await supabase
      .from(documentsTable)
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(documentFromRow);
  }

  const uploadedDocuments = await readUploadedDocuments();
  const { documents, changed } = claimLegacyDocuments(uploadedDocuments, sessionId);

  if (changed) {
    await writeUploadedDocuments(documents);
  }

  return documents.filter((document) => document.sessionId === sessionId);
}

export async function getDocumentById(id: string, sessionId: string) {
  const documents = await getDocuments(sessionId);

  return documents.find((document) => document.id === id);
}

export async function saveUploadedDocument(
  document: CloudDocument,
  sessionId: string,
) {
  const supabase = getSupabaseAdminClient();
  const documentWithSession = { ...document, sessionId };

  if (supabase) {
    const { error } = await supabase
      .from(documentsTable)
      .upsert(documentToRow(documentWithSession), { onConflict: "id" });

    if (error) {
      throw error;
    }

    return documentWithSession;
  }

  const uploadedDocuments = await readUploadedDocuments();
  const nextDocuments = [
    documentWithSession,
    ...uploadedDocuments.filter((item) => item.id !== document.id),
  ];

  await writeUploadedDocuments(nextDocuments);

  return documentWithSession;
}

export async function deleteDocument(id: string, sessionId: string) {
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { data, error } = await supabase
      .from(documentsTable)
      .select("*")
      .eq("id", id)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const { error: deleteError } = await supabase
      .from(documentsTable)
      .delete()
      .eq("id", id)
      .eq("session_id", sessionId);

    if (deleteError) {
      throw deleteError;
    }

    return documentFromRow(data);
  }

  const uploadedDocuments = await readUploadedDocuments();
  const { documents, changed } = claimLegacyDocuments(uploadedDocuments, sessionId);
  const uploadedDocument = documents.find(
    (item) => item.id === id && item.sessionId === sessionId,
  );

  if (uploadedDocument) {
    const nextDocuments = documents.filter((item) => item.id !== id);

    await writeUploadedDocuments(nextDocuments);

    return uploadedDocument;
  }

  if (changed) {
    await writeUploadedDocuments(documents);
  }

  return null;
}

async function readUploadedDocuments(): Promise<CloudDocument[]> {
  try {
    const raw = (await readFile(storePath, "utf8")).replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as CloudDocument[];

    return Array.isArray(parsed) ? parsed.map(normalizeStoredDocument) : [];
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

async function writeUploadedDocuments(documents: CloudDocument[]) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(documents, null, 2), "utf8");
}

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function normalizeStoredDocument(document: CloudDocument): CloudDocument {
  return {
    ...document,
    pages: inferPageCount(document.extractedText) ?? document.pages,
    source: "upload",
  };
}

function claimLegacyDocuments(documents: CloudDocument[], sessionId: string) {
  let changed = false;
  const nextDocuments = documents.map((document) => {
    if (document.sessionId) {
      return document;
    }

    changed = true;

    return { ...document, sessionId };
  });

  return { documents: nextDocuments, changed };
}

function inferPageCount(text: string) {
  const matches = Array.from(text.matchAll(/--\s*\d+\s+of\s+(\d+)\s*--/gi));
  const pageCounts = matches
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0);

  return pageCounts.length ? Math.max(...pageCounts) : null;
}

type DocumentRow = {
  id: string;
  session_id?: string | null;
  title: string;
  category: string;
  file_name: string;
  pages: number;
  created_at: string;
  status: CloudDocument["status"];
  source: CloudDocument["source"];
  summary: string;
  key_points: unknown;
  technical_terms: unknown;
  extracted_text: string;
};

function documentToRow(document: CloudDocument): DocumentRow {
  return {
    id: document.id,
    session_id: document.sessionId,
    title: document.title,
    category: document.category,
    file_name: document.fileName,
    pages: document.pages,
    created_at: document.createdAt,
    status: document.status,
    source: document.source,
    summary: document.summary,
    key_points: document.keyPoints,
    technical_terms: document.technicalTerms,
    extracted_text: document.extractedText,
  };
}

function documentFromRow(row: DocumentRow): CloudDocument {
  return {
    id: row.id,
    sessionId: row.session_id ?? undefined,
    title: row.title,
    category: row.category,
    fileName: row.file_name,
    pages: row.pages,
    createdAt: row.created_at,
    status: row.status,
    source: row.source,
    summary: row.summary,
    keyPoints: asStringArray(row.key_points),
    technicalTerms: asTechnicalTerms(row.technical_terms),
    extractedText: row.extracted_text,
  };
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asTechnicalTerms(value: unknown): TechnicalTerm[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is TechnicalTerm =>
          typeof item === "object" &&
          item !== null &&
          "term" in item &&
          "definition" in item &&
          typeof item.term === "string" &&
          typeof item.definition === "string",
      )
    : [];
}
