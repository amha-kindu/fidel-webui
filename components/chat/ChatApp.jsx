"use client";

import { useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { models } from "@/app/data/models";
import ChatEmptyState from "@/components/chat/ChatEmptyState";
import MessageInput from "@/components/chat/MessageInput";
import MessageList from "@/components/chat/MessageList";
import { useChat } from "@/components/contexts/ChatProvider";
import { useRequestState } from "@/components/contexts/RequestStateProvider";
import { resolveApiBaseUrl } from "@/lib/apiUtils.mjs";
import { useChatComposer } from "@/components/chat/useChatComposer";

export default function ChatApp() {
  const params = useParams();
  const scrollRef = useRef(null);

  const apiUrl = resolveApiBaseUrl();
  const chatIdParam = Array.isArray(params?.id) ? params.id[0] : params?.id ?? null;
  const { error, setError } = useRequestState();
  const { draftInput, setDraftInput } = useChat();

  const selectedModel = models[0]?.id || "";
  const [scrollRoot, setScrollRoot] = useState(null);

  const { activeChatId, handleRegenerate, handleSend, handleStop } = useChatComposer({
    apiUrl,
    chatIdParam,
    selectedModel,
  });

  const setScrollContainer = useCallback((node) => {
    scrollRef.current = node;
    setScrollRoot(node);
  }, []);

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore clipboard failures.
    }
  }, []);

  const handleSubmit = useCallback(() => {
    void handleSend(draftInput).then((didSend) => {
      if (didSend) {
        setDraftInput("");
      }
    });
  }, [draftInput, handleSend, setDraftInput]);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {error && (
        <div className="px-3 py-2 sm:px-6">
          <div
            data-testid="chat-error-alert"
            className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            role="alert"
          >
            <span className="truncate">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-2 shrink-0 rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] text-red-700 hover:bg-red-100"
            >
              ዝጋ
            </button>
          </div>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        <div
          ref={setScrollContainer}
          className="brand-soft-surface flex-1 overflow-y-auto overflow-x-hidden pb-32 sm:pb-40"
        >
          <div className="mx-auto w-full max-w-4xl space-y-6 p-3 sm:space-y-8 sm:p-4">
            <MessageList
              apiUrl={apiUrl}
              chatId={activeChatId}
              onCopy={handleCopy}
              onRegenerate={handleRegenerate}
              scrollRef={scrollRef}
              scrollRoot={scrollRoot}
            />
          </div>

          {activeChatId === null && <ChatEmptyState onSelectPrompt={setDraftInput} />}
        </div>

        <MessageInput
          value={draftInput}
          onChange={setDraftInput}
          onSubmit={handleSubmit}
          onStop={handleStop}
        />
      </div>
    </div>
  );
}
