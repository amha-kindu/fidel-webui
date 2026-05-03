"use client";

import { Bot } from "lucide-react";

import MessageItem from "@/components/chat/MessageItem";
import { MessageSkeleton } from "@/components/chat/MessageSkeleton";
import { useMessageHistory } from "@/components/chat/useMessageHistory";
import { useTheme } from "@/components/contexts/ThemeProvider";

export default function MessageList({
  apiUrl,
  chatId,
  onCopy,
  onRegenerate,
  scrollRef,
  scrollRoot,
}) {
  const { resolvedTheme } = useTheme();
  const {
    bottomRef,
    currentMessages,
    isMessagesLoading,
    loadMoreRef,
    messagesError,
    retryMessages,
    shouldShowTypingIndicator,
  } = useMessageHistory({
    apiUrl,
    chatId,
    scrollRef,
    scrollRoot,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {messagesError && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="truncate">{messagesError}</span>
          <button
            type="button"
            onClick={retryMessages}
            className="ml-2 shrink-0 rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] text-red-700 hover:bg-red-100"
          >
            እንደገና ሞክር
          </button>
        </div>
      )}

      {isMessagesLoading && currentMessages.length === 0 && (
        <div className="space-y-6 sm:space-y-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <MessageSkeleton
              key={`message-skeleton-${index}`}
              role={index % 2 === 0 ? "user" : "assistant"}
            />
          ))}
        </div>
      )}

      {!isMessagesLoading && chatId && currentMessages.length === 0 && !messagesError && (
        <div className="rounded-xl border border-gray-200/60 bg-white/70 px-4 py-3 text-xs text-gray-500 dark:border-gray-700/60 dark:bg-gray-800/70 dark:text-gray-400">
          እስካሁን መልእክቶች የሉም።
        </div>
      )}

      <div ref={loadMoreRef} />
      {isMessagesLoading && currentMessages.length > 0 && (
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          የቀድሞ መልእክቶች በመጫን ላይ...
        </div>
      )}

      {currentMessages.map((message, index) => (
        <MessageItem
          key={message.id}
          index={index}
          isDark={resolvedTheme === "dark"}
          message={message}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
        />
      ))}

      {shouldShowTypingIndicator && (
        <div data-testid="typing-indicator" className="flex items-start gap-2 sm:gap-4">
          <div className="brand-gradient flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl shadow-lg">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="rounded-2xl border border-gray-200/50 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80 sm:px-6 sm:py-4">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
