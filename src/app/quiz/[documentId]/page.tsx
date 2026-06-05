import { notFound } from "next/navigation";
import { QuizPanel } from "@/components/quiz-panel";
import { getDocumentById } from "@/server/services/document-store";
import { getCurrentSessionId } from "@/server/services/session";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const sessionId = await getCurrentSessionId();
  const document = await getDocumentById(documentId, sessionId);

  if (!document) {
    notFound();
  }

  return (
    <div className="page-enter py-4">
      <QuizPanel documentId={document.id} initialQuestions={[]} />
    </div>
  );
}
