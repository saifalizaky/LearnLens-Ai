import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat-panel";
import { getChatModelOptions, getDefaultChatModelId } from "@/lib/ai-models";
import { getDocumentById } from "@/server/services/document-store";
import { getCurrentSessionId } from "@/server/services/session";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function ChatPage({
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

  const modelOptions = getChatModelOptions();
  const defaultModelId = getDefaultChatModelId();

  return (
    <div className="page-enter">
      <ChatPanel
        documentId={document.id}
        documentTitle={document.title}
        modelOptions={modelOptions}
        defaultModelId={defaultModelId}
      />
    </div>
  );
}
