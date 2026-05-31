import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/chat-panel";
import { getChatModelOptions, getDefaultChatModelId } from "@/lib/ai-models";
import type { ChatMessage } from "@/lib/types";
import { truncateText } from "@/lib/utils";
import { getDocumentById } from "@/server/services/document-store";
import { getCurrentSessionId } from "@/server/services/session";

export const dynamic = "force-dynamic";

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

  const initialMessages: ChatMessage[] = [
    {
      id: "welcome",
      role: "assistant",
      content: `Dokumen "${document.title}" sudah aktif. Tanyakan konsep utama dari materi ini.`,
      createdAt: new Date().toISOString(),
    },
  ];
  const modelOptions = getChatModelOptions();
  const defaultModelId = getDefaultChatModelId();

  return (
    <div className="page-enter grid gap-5 xl:grid-cols-[0.58fr_1fr]">
      <aside className="motion-card min-h-[680px] rounded-lg border border-zinc-700 bg-[#0b0d10] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
        <p className="text-lg leading-7 text-white">
          Document: {document.title}, {document.pages} halaman.
        </p>
        <p className="mt-8 text-lg leading-8 text-zinc-200">
          Context: {truncateText(document.summary, 520)}
        </p>
        <div className="mt-8 space-y-3">
          {document.keyPoints.slice(0, 4).map((point) => (
            <p
              key={point}
              className="motion-card rounded-lg border border-zinc-700 bg-[#111315] p-3 text-sm leading-6 text-zinc-300"
            >
              {point}
            </p>
          ))}
        </div>
      </aside>

      <ChatPanel
        documentId={document.id}
        initialMessages={initialMessages}
        modelOptions={modelOptions}
        defaultModelId={defaultModelId}
      />
    </div>
  );
}
