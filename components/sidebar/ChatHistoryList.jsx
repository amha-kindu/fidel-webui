"use client";

import { MessageSquare, Trash2 } from "lucide-react";

export default function ChatHistoryList({
  chatHistory,
  chatListError,
  currentChatId,
  isChatListLoading,
  loadMoreRef,
  onRequestDelete,
  onRetry,
  onSelectChat,
  setChatListNode,
  sidebarOpen,
}) {
  if (!sidebarOpen) return null;

  return (
    <div
      ref={setChatListNode}
      data-testid="chat-history-list"
      className="flex-1 overflow-y-auto p-3 sm:p-4"
    >
      <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        <MessageSquare className="h-3 w-3" />
        የቅርብ ጊዜ ውይይቶች
      </h3>

      {chatListError && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="truncate">{chatListError}</span>
          <button
            type="button"
            onClick={onRetry}
            className="ml-2 shrink-0 rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] text-red-700 hover:bg-red-100"
          >
            እንደገና ሞክር
          </button>
        </div>
      )}

      {isChatListLoading && chatHistory.length === 0 && (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`chat-skeleton-${index}`}
              className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700/40"
            />
          ))}
        </div>
      )}

      {!isChatListLoading && chatHistory.length === 0 && !chatListError && (
        <div className="flex h-80 items-center justify-center text-xs text-gray-500 dark:text-gray-400">
          እስካሁን ውይይቶች የሉም።
        </div>
      )}

      <div className="space-y-2">
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            className={`group relative rounded-xl border transition-all duration-200 ${
              currentChatId === chat.id
                ? "brand-active-surface"
                : "border-transparent brand-hover-surface hover:bg-gray-50 dark:hover:border-gray-600/50 dark:hover:bg-gray-700/50"
            }`}
          >
            <button
              type="button"
              data-testid="chat-list-item"
              onClick={() => onSelectChat(chat.id)}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {chat.title}
                </p>
                <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                  {chat.lastMessage || "እስካሁን መልእክት የለም"}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {new Intl.DateTimeFormat("am-ET", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(chat.updatedAt))}
                </p>
              </div>
            </button>

            <div className="absolute right-2 top-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                data-testid="delete-chat-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRequestDelete(chat.id, chat.title);
                }}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                title="ውይይቱን ሰርዝ"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        <div ref={loadMoreRef} />
      </div>

      {isChatListLoading && chatHistory.length > 0 && (
        <div className="py-2 text-center text-xs text-gray-500 dark:text-gray-400">
          ተጨማሪ ውይይቶች በመጫን ላይ...
        </div>
      )}
    </div>
  );
}
