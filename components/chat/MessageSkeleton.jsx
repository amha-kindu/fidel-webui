export function MessageSkeleton({ role = "assistant" }) {
    const isAssistant = role === "assistant";
    const isUser = role === "user";

    return (
        <div
        className={`flex gap-2 animate-pulse sm:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
        >
            {/* Assistant Avatar */}
            {isAssistant && (
                <div className="h-8 w-8 flex-shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700 sm:h-10 sm:w-10" />
            )}

            <div className={`w-3/4 max-w-[85%] sm:max-w-3xl`}>
                {/* Bubble */}
                <div
                className={`rounded-2xl px-4 py-3 ${
                    isUser
                    ? "bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50"
                    : "bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50"
                }`}
                >

                    {/* Content skeleton */}
                    <div className="space-y-2">
                        <div className="h-3 w-11/12 rounded bg-gray-300/70 dark:bg-gray-600/60" />
                        <div className="h-3 w-10/12 rounded bg-gray-300/70 dark:bg-gray-600/60" />
                        <div className="h-3 w-7/12 rounded bg-gray-300/70 dark:bg-gray-600/60" />
                    </div>
                </div>
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="h-8 w-8 flex-shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700 sm:h-10 sm:w-10" />
            )}
        </div>
    );
}
