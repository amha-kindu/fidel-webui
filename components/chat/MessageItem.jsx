"use client";

import { memo } from "react";
import { Bot, Copy, RotateCcw, User } from "lucide-react";

import MarkdownMessage from "@/components/chat/MarkdownMessage";

function MessageItemComponent({ index, isDark, message, onCopy, onRegenerate }) {
  const isAssistant = message.role === "assistant";
  const timestamp = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("am-ET", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      data-testid="message-row"
      className={`flex gap-2 sm:gap-4 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {isAssistant && (
        <div className="brand-gradient flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl shadow-lg sm:h-10 sm:w-10">
          <Bot className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </div>
      )}

      <div
        className={`min-w-0 ${message.role === "user" ? "order-first max-w-[85%] sm:max-w-3xl" : "w-full"}`}
      >
        <div
          className={`overflow-hidden rounded-2xl px-4 py-3 ${
            message.role === "user"
              ? "brand-gradient ml-auto text-white shadow-xl"
              : "border border-gray-200/50 bg-white/80 text-gray-900 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80 dark:text-gray-100"
          }`}
        >
          {message.content && (
            <div
              data-testid="message-content"
              className="prose prose-sm max-w-none break-words dark:prose-invert"
            >
              {isAssistant ? (
                <MarkdownMessage content={message.content} isDark={isDark} />
              ) : (
                <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {message.content}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 sm:mt-3 sm:gap-2">
          <span className="shrink-0">{timestamp}</span>

          {isAssistant && (
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => onCopy(message.content)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title="መልእክቱን ቅዳ"
              >
                <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>

              <button
                type="button"
                onClick={() => onRegenerate(index)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title="ምላሹን እንደገና ፍጠር"
              >
                <RotateCcw className="brand-icon-hover h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {message.role === "user" && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg dark:from-gray-500 dark:to-gray-700 sm:h-10 sm:w-10">
          <User className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </div>
      )}
    </div>
  );
}

const MessageItem = memo(MessageItemComponent);

export default MessageItem;
