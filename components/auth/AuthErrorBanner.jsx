"use client";

import { useAuth } from "@/components/contexts/AuthProvider";

export default function AuthErrorBanner() {
  const { error, setError } = useAuth();

  if (!error) return null;

  return (
    <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2">
      <div
        data-testid="auth-error-alert"
        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm"
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
  );
}
