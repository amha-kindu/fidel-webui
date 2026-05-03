"use client";

import Image from "next/image";

export default function BrandedLoadingScreen({
  message = "መለያዎን በማረጋገጥ ላይ...",
  className = "",
}) {
  return (
    <div
      className={`brand-shell relative flex h-full w-full items-center justify-center overflow-hidden px-6 py-10 ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top, rgb(var(--brand-primary) / 0.14), transparent 42%), radial-gradient(circle at bottom, rgb(var(--brand-secondary) / 0.12), transparent 38%)",
        }}
      />

      <div className="relative mx-auto flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="brand-glow absolute inset-0 scale-110 rounded-[2.5rem] blur-2xl" />
          <div className="loading-logo-frame">
            <div aria-hidden="true" className="loading-logo-beacon loading-logo-beacon-1" />
            <div aria-hidden="true" className="loading-logo-beacon loading-logo-beacon-2" />
            <div aria-hidden="true" className="loading-logo-beacon loading-logo-beacon-3" />
            <div className="">
              <Image
                src="/fidel-logo.png"
                alt="Fidel logo"
                width={442}
                height={387}
                priority
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="brand-text text-xl font-semibold tracking-tight">
            ፊደል ቻት
          </p>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-400">
          <span className="brand-fill h-2 w-2 animate-pulse rounded-full" />
          እባክዎ ጥቂት ይጠብቁ
        </div>
      </div>
    </div>
  );
}
