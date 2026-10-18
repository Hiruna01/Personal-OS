import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import type { Root, RootContent, ListItem, Text, Paragraph } from "mdast";
import type { Quiz, QuizQuestion } from "@/types/domain";
export const PARSER_VERSION = "campus-quiz-v1.0.0";
export const MAX_MARKDOWN_BYTES = 1048576;
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkStringify, { bullet: "-", fences: true });
function inline(node: unknown): string {
  const n = node as { value?: string; children?: unknown[] };
  return n.value ?? n.children?.map(inline).join("") ?? "";
}
function markdown(nodes: RootContent[]) {
  return processor.stringify({ type: "root", children: nodes }).trim();
}
export class ImportError extends Error {
  constructor(message: string, line?: number, question?: number) {
    super(
      `${question ? `Question ${question}: ` : ""}${message}${line ? ` (line ${line})` : ""}`,
    );
    this.name = "ImportError";
  }
}
export function normalizeSource(source: string) {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (new TextEncoder().encode(normalized).length > MAX_MARKDOWN_BYTES)
    throw new ImportError("Markdown must be 1 MiB or smaller.");
  if (!normalized.trim()) throw new ImportError("The Markdown file is empty.");
  if (normalized.includes("\0"))
    throw new ImportError(
      "This file contains binary content. Choose a UTF-8 Markdown file.",
    );
  return normalized;
}
export function safeUrl(value: string, image = false): string | undefined {
  if (!image && value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return (image
      ? url.protocol === "https:"
      : ["https:", "http:", "mailto:"].includes(url.protocol)) &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function inspectMarkdown(source: string) {
  const tree = processor.parse(normalizeSource(source));
  const warnings = new Set<string>();
  visit(tree, (node) => {
    if (node.type === "html")
      warnings.add("Raw HTML is disabled and will not be displayed.");
    if (node.type === "image" && !safeUrl(node.url, true))
      warnings.add(
        "Only absolute HTTPS images are displayed. Relative images are not uploaded with this file.",
      );
    if (
      (node.type === "link" || node.type === "definition") &&
      !safeUrl(node.url)
    )
      warnings.add(
        "An unsupported or relative URL will be disabled. Use an absolute HTTP(S) URL.",
      );
    if (node.type === "imageReference")
      warnings.add(
        "Referenced images must resolve to an absolute HTTPS URL; local image files are not uploaded.",
      );
  });
  return [...warnings];
}
export function parseQuiz(source: string): Quiz {
  const tree = processor.parse(normalizeSource(source));
  const nodes = tree.children;
  if (
    nodes[0]?.type !== "heading" ||
    nodes[0].depth !== 1 ||
    !inline(nodes[0]).trim()
  )
    throw new ImportError(
      "Start with one # Quiz title.",
      nodes[0]?.position?.start.line,
    );
  if (
    nodes[1]?.type !== "paragraph" ||
    inline(nodes[1]).trim() !== "Format: campus-quiz-v1"
  )
    throw new ImportError(
      "Place Format: campus-quiz-v1 immediately after the title.",
      nodes[1]?.position?.start.line,
    );
  const quiz: Quiz = { title: inline(nodes[0]).trim(), questions: [] };
  let index = 2;
  while (index < nodes.length) {
    const heading = nodes[index];
    const number = quiz.questions.length + 1;
    if (
      heading.type !== "heading" ||
      heading.depth !== 2 ||
      inline(heading) !== `Question ${number}`
    )
      throw new ImportError(
        `Expected ## Question ${number}. Question numbers must be unique and sequential.`,
        heading.position?.start.line,
      );
    if (number > 100)
      throw new ImportError(
        "A quiz can contain at most 100 questions.",
        heading.position?.start.line,
      );
    index++;
    const typeNode = nodes[index];
    if (
      typeNode?.type !== "paragraph" ||
      !/^Type: (mcq|written)$/.test(inline(typeNode))
    )
      throw new ImportError(
        "Use Type: mcq or Type: written immediately after the question heading.",
        typeNode?.position?.start.line,
        number,
      );
    const type = inline(typeNode).slice(6) as "mcq" | "written";
    index++;
    const parts: Record<string, RootContent[]> = {
      Prompt: [],
      Options: [],
      Answer: [],
      Explanation: [],
    };
    let section = "Prompt";
    const seen: string[] = [];
    while (index < nodes.length) {
      const node = nodes[index];
      if (node.type === "heading" && node.depth === 2) break;
      if (node.type === "heading" && node.depth === 1)
        throw new ImportError(
          "Only one level-one title is allowed.",
          node.position?.start.line,
          number,
        );
      if (node.type === "heading" && node.depth === 3) {
        const name = inline(node);
        if (
          !["Options", "Answer", "Explanation"].includes(name) ||
          seen.includes(name)
        )
          throw new ImportError(
            "Use each reserved heading exactly once: Options, Answer, Explanation. Use #### for other headings.",
            node.position?.start.line,
            number,
          );
        seen.push(name);
        section = name;
      } else parts[section].push(node);
      index++;
    }
    const expected =
      type === "mcq" ? "Options,Answer,Explanation" : "Answer,Explanation";
    if (seen.join(",") !== expected)
      throw new ImportError(
        `Required section order: ${expected.replaceAll(",", ", ")}.`,
        heading.position?.start.line,
        number,
      );
    const q: QuizQuestion = {
      number,
      type,
      prompt: markdown(parts.Prompt),
      answer: markdown(parts.Answer),
      explanation: markdown(parts.Explanation),
    };
    if (!q.prompt || !q.answer || !q.explanation)
      throw new ImportError(
        "Question, Answer, and Explanation must all contain text.",
        heading.position?.start.line,
        number,
      );
    if (type === "mcq") {
      if (
        parts.Options.length !== 1 ||
        parts.Options[0].type !== "list" ||
        parts.Options[0].ordered
      )
        throw new ImportError(
          "Options must be one unordered list with items labelled A., B., and so on.",
          heading.position?.start.line,
          number,
        );
      const items = parts.Options[0].children;
      if (items.length < 2 || items.length > 26)
        throw new ImportError(
          "Provide between 2 and 26 options.",
          heading.position?.start.line,
          number,
        );
      q.options = items.map((item: ListItem, i: number) => {
        const copy = structuredClone(item);
        const p = copy.children[0] as Paragraph;
        const t = p?.children?.[0] as Text;
        const label = String.fromCharCode(65 + i);
        if (
          p?.type !== "paragraph" ||
          t?.type !== "text" ||
          !t.value.startsWith(`${label}. `)
        )
          throw new ImportError(
            `Expected option label ${label}. followed by a space.`,
            item.position?.start.line,
            number,
          );
        t.value = t.value.slice(3);
        const content = markdown(copy.children as RootContent[]);
        if (!content)
          throw new ImportError(
            `Option ${label} is empty.`,
            item.position?.start.line,
            number,
          );
        return { label, markdown: content };
      });
      const answer = inline({ children: parts.Answer }).trim();
      if (
        parts.Answer.length !== 1 ||
        parts.Answer[0].type !== "paragraph" ||
        !q.options.some((o) => o.label === answer)
      )
        throw new ImportError(
          "Answer must contain exactly one matching option label, such as B.",
          heading.position?.start.line,
          number,
        );
      q.answer = answer;
    }
    quiz.questions.push(q);
  }
  if (!quiz.questions.length)
    throw new ImportError("Add at least one ## Question 1 section.");
  return quiz;
}
