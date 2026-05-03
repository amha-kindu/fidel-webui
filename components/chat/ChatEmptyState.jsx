"use client";

import { Sparkles } from "lucide-react";

import { quickPrompts } from "@/app/data/quickPrompts";

export default function ChatEmptyState({ onSelectPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-6xl">
        <div className="mb-6 text-center sm:mb-8">
          <div className="brand-gradient mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl md:text-3xl">
            አዲስ ውይይት ጀምር
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            የፈለጉትን ጥያቄ ይጻፉ ወይም ከታች ካሉት ፈጣን ጥቆማዎች አንዱን ይምረጡ።
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 px-0 sm:mb-6 sm:px-2 md:grid-cols-2 xl:grid-cols-3">
          {quickPrompts.map((prompt, index) => (
            <button
              key={`prompt-${index}`}
              type="button"
              onClick={() => onSelectPrompt(prompt.prompt)}
              className="brand-hover-surface brand-soft-surface group rounded-xl border border-gray-200/50 p-4 text-left transition-all duration-200 dark:border-gray-700/50"
            >
              <div className="mb-2 text-xl">{prompt.icon}</div>
              <h3 className="brand-hover-text mb-1 text-sm font-medium text-gray-900 transition-colors dark:text-gray-100">
                {prompt.text}
              </h3>
              <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                {prompt.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
