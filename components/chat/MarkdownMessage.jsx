import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github.css";
import "highlight.js/styles/github-dark.css";

export default function MarkdownMessage({ content, isDark }) {
  void isDark;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        h1: ({ children, ...props }) => (
          <h1 className="mb-3 mt-4 text-lg font-bold sm:text-xl" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="mb-2 mt-3 text-base font-semibold sm:text-lg" {...props}>
            {children}
          </h2>
        ),
        p: ({ children, ...props }) => (
          <p className="mb-2 break-words leading-relaxed" {...props}>
            {children}
          </p>
        ),
        ul: ({ children, ...props }) => (
          <ul className="list-inside list-disc space-y-1 break-words" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-inside list-decimal space-y-1 break-words" {...props}>
            {children}
          </ol>
        ),
        a: ({ children, ...props }) => (
          <a className="brand-link break-all underline" {...props}>
            {children}
          </a>
        ),
        code: ({ inline, children, ...props }) =>
          inline ? (
            <code
              className="break-all rounded bg-gray-200 px-1 py-0.5 text-sm dark:bg-gray-700"
              {...props}
            >
              {children}
            </code>
          ) : (
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-50 sm:text-sm">
              <code {...props}>{children}</code>
            </pre>
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
