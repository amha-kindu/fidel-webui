import { useRequestState } from "@/components/contexts/RequestStateProvider";

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  onStop,
}) {
  const { isFetching } = useRequestState();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-3 pt-8 sm:px-4 sm:pb-4 sm:pt-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
        <div className="pointer-events-auto flex items-end justify-center gap-3 sm:gap-4">
          <form
            data-testid="chat-input-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (isFetching) return;
              onSubmit();
            }}
            className="flex-1"
          >
            <textarea
              data-testid="chat-textarea"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="መልእክትዎን እዚህ ያስገቡ..."
              className="brand-focus-within min-h-[52px] max-h-32 w-full resize-none rounded-[1.75rem] border-2 border-slate-200/90 bg-white/98 px-4 py-3 leading-relaxed text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl placeholder:text-slate-500 focus:outline-none dark:border-slate-500/70 dark:bg-slate-900/96 dark:text-slate-100 dark:shadow-[0_20px_50px_rgba(2,6,23,0.32)] dark:placeholder:text-slate-400 sm:px-6"
              rows={1}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (isFetching) return;
                  onSubmit();
                }
              }}
            />
          </form>

          {isFetching ? (
            <button
              type="button"
              data-testid="chat-stop-button"
              onClick={onStop}
              className="flex h-[52px] min-w-[56px] flex-none items-center justify-center gap-2 rounded-xl bg-red-500 mb-1.5 px-5 py-3 font-semibold text-white shadow-[0_16px_36px_rgba(239,68,68,0.22)] transition hover:bg-red-600 dark:bg-red-400 dark:text-slate-950 dark:shadow-[0_16px_36px_rgba(248,113,113,0.22)] dark:hover:bg-red-300"
              title="ምላሹን አቁም"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              data-testid="chat-send-button"
              onClick={onSubmit}
              disabled={!value.trim()}
              className={`flex h-[52px] min-w-[56px] flex-none items-center justify-center gap-2 rounded-xl mb-1.5 px-5 py-3 font-semibold text-white transition ${
                !value.trim()
                  ? "cursor-not-allowed border border-slate-300/90 bg-white/96 text-slate-400 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-600/80 dark:bg-slate-700 dark:text-slate-400 dark:shadow-none"
                  : "bg-[rgb(var(--brand-secondary))] shadow-[0_16px_36px_rgba(80,176,96,0.26)] hover:bg-[rgb(var(--brand-primary-deep))] dark:bg-[rgb(var(--brand-primary))] dark:shadow-[0_16px_36px_rgba(0,96,160,0.3)] dark:hover:bg-[rgb(var(--brand-secondary))]"
              }`}
              title="መልእክት ላክ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          )}
        </div>

        <div className="pointer-events-none hidden flex-wrap items-end justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 sm:flex sm:gap-4">
          <span className="pointer-events-auto flex items-center gap-1 bg-white/82 px-3 py-1 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/82">
            <kbd className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700">Enter</kbd>
            ለመላክ
          </span>
          <span className="pointer-events-auto flex items-center gap-1 bg-white/82 px-3 py-1 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/82">
            <kbd className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700">Shift</kbd>
            +
            <kbd className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700">Enter</kbd>
            ለአዲስ መስመር
          </span>
        </div>
      </div>
    </div>
  );
}
