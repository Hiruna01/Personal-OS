import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import { safeUrl } from "@/lib/markdown/urls.mjs";
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code || []),
      ["className", /^language-./, "math-inline", "math-display"],
    ],
  },
};
export function Markdown({
  source,
  className = "",
}: {
  source: string;
  className?: string;
}) {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeSanitize, schema],
          [
            rehypeKatex,
            {
              trust: false,
              strict: "warn",
              throwOnError: false,
              maxExpand: 1000,
              maxSize: 20,
            },
          ],
        ]}
        skipHtml
        urlTransform={(url, key) => safeUrl(url, key === "src") ?? ""}
        components={{
          a: ({ href, children }) =>
            href ? (
              <a
                href={href}
                target={href.startsWith("#") ? undefined : "_blank"}
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          img: ({ src, alt }) =>
            typeof src === "string" && safeUrl(src, true) ? (
              <img
                src={src}
                alt={alt || ""}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="muted">
                [Image unavailable — use an absolute HTTPS source]
              </span>
            ),
          table: ({ children }) => (
            <div
              className="table-scroll"
              role="region"
              aria-label="Scrollable table"
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          ),
          pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
