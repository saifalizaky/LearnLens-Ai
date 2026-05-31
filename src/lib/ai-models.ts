export type ChatModelOption = {
  id: string;
  label: string;
  provider: string;
  description: string;
};

const defaultProvider = "Alibaba DashScope";
const defaultModelId = "qwen-plus";

const fallbackChatModels: ChatModelOption[] = [
  {
    id: "qwen-plus",
    label: "Qwen Plus",
    provider: defaultProvider,
    description: "Model aktif utama untuk summary, chat, dan quiz.",
  },
];

export function getDefaultChatModelId() {
  return process.env.DASHSCOPE_MODEL?.trim() || defaultModelId;
}

export function getChatModelOptions(): ChatModelOption[] {
  const defaultModel = getDefaultChatModelId();
  const uniqueModelIds = Array.from(new Set([defaultModel]));

  return uniqueModelIds.map((modelId) => {
    const knownModel = fallbackChatModels.find((model) => model.id === modelId);

    return (
      knownModel ?? {
        id: modelId,
        label: formatModelLabel(modelId),
        provider: defaultProvider,
        description: "Model dari konfigurasi environment.",
      }
    );
  });
}

export function resolveChatModel(modelId?: string) {
  const options = getChatModelOptions();
  const defaultModel = getDefaultChatModelId();

  return (
    options.find((model) => model.id === modelId) ??
    options.find((model) => model.id === defaultModel) ??
    options[0]
  );
}

function formatModelLabel(modelId: string) {
  return modelId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
