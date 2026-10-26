import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import type { Root, RootContent, List, ListItem, Text, Paragraph } from "mdast";
import type { Quiz, QuizOption } from "@/types/domain";
import { safeUrl } from "./urls.mjs";
export { safeUrl } from "./urls.mjs";
export const PARSER_VERSION = "campus-quiz-v1.1.1";
export const MAX_MARKDOWN_BYTES = 1048576;
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkStringify, { bullet: "-", fences: true });
const paperQuestionsHeading = /^Questions(?:\s+\d+\s*[-–—]\s*\d+)?$/i;
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

function parseOptions(list: List, number: number): QuizOption[] {
  if (list.ordered || list.children.length < 2 || list.children.length > 26)
    throw new ImportError(
      "Provide an unordered list of 2–26 options labelled A., B., and so on.",
      list.position?.start.line,
      number,
    );
  return list.children.map((item: ListItem, index: number) => {
    const copy = structuredClone(item);
    const paragraph = copy.children[0] as Paragraph;
    const first = paragraph?.children?.[0];
    const label = String.fromCharCode(65 + index);
    if (paragraph?.type !== "paragraph")
      throw new ImportError(
        `Expected option label ${label}. followed by a space.`,
        item.position?.start.line,
        number,
      );
    if (first?.type === "text" && first.value.startsWith(`${label}. `)) {
      first.value = first.value.slice(3);
    } else if (
      first?.type === "strong" &&
      inline(first) === `${label}.` &&
      paragraph.children[1]?.type === "text" &&
      /^\s/.test(paragraph.children[1].value)
    ) {
      paragraph.children.shift();
      (paragraph.children[0] as Text).value = (
        paragraph.children[0] as Text
      ).value.trimStart();
    } else {
      throw new ImportError(
        `Expected option label ${label}. followed by a space (plain or bold).`,
        item.position?.start.line,
        number,
      );
    }
    const content = markdown(copy.children as RootContent[]);
    if (!content)
      throw new ImportError(
        `Option ${label} is empty.`,
        item.position?.start.line,
        number,
      );
    return { label, markdown: content };
  });
}

function parseAnswerLabels(
  value: string,
  options: QuizOption[],
  number: number,
  line?: number,
): string[] {
  if (!/^[A-Z](?:\s*,\s*[A-Z])+$/.test(value.trim()))
    throw new ImportError(
      "Multiple-response answers need at least two comma-separated labels, such as A, C, E.",
      line,
      number,
    );
  const labels = value.split(",").map((label) => label.trim());
  if (new Set(labels).size !== labels.length)
    throw new ImportError(
      "Correct answer labels must not repeat.",
      line,
      number,
    );
  if (labels.some((label) => !options.some((option) => option.label === label)))
    throw new ImportError(
      "Every correct answer label must match an option.",
      line,
      number,
    );
  return options
    .filter((option) => labels.includes(option.label))
    .map((option) => option.label);
}

// This format separates the question collection from its answer key and explanations.
// Boundaries come from the Markdown tree, so fenced code and nested content stay intact.
function parseMultipleResponsePaper(tree: Root): Quiz {
  const nodes = tree.children;
  function sections(pattern: RegExp) {
    const starts = nodes.flatMap((node, index) =>
      node.type === "heading" &&
      node.depth === 2 &&
      pattern.test(inline(node).trim())
        ? [index]
        : [],
    );
    return starts.map((start) => {
      let end = start + 1;
      while (
        end < nodes.length &&
        !(
          nodes[end].type === "heading" &&
          (nodes[end] as { depth: number }).depth <= 2
        )
      )
        end++;
      return { heading: nodes[start], nodes: nodes.slice(start + 1, end) };
    });
  }
  function section(pattern: RegExp, label: string, required = true) {
    const matches = sections(pattern);
    if (!required && !matches.length) return null;
    if (matches.length !== 1)
      throw new ImportError(`Use exactly one ## ${label} section.`);
    return matches[0];
  }
  const questionGroups = sections(paperQuestionsHeading);
  if (!questionGroups.length)
    throw new ImportError(
      "Add a ## Questions section, optionally split into numbered ranges such as Questions 1-2 and Questions 3-4.",
    );
  if (
    questionGroups.length > 1 &&
    questionGroups.some((group) =>
      /^Questions$/i.test(inline(group.heading).trim()),
    )
  )
    throw new ImportError(
      "When splitting questions into sections, give each section a numbered range such as ## Questions 1-2.",
    );
  const questions = { nodes: questionGroups.flatMap((group) => group.nodes) };
  const explanations = section(
    /^Detailed explanations$/i,
    "Detailed explanations",
  )!;
  const key = section(/^Quick answer key$/i, "Quick answer key", false);
  for (const node of nodes) {
    if (
      node.type === "heading" &&
      /^Question\s+\d+\b/i.test(inline(node)) &&
      !questions.nodes.includes(node) &&
      !explanations.nodes.includes(node)
    )
      throw new ImportError(
        "A question or explanation is outside its expected section. Keep questions under Questions and answers under Detailed explanations.",
        node.position?.start.line,
      );
  }
  if (
    nodes.filter((node) => node.type === "heading" && node.depth === 1)
      .length !== 1
  )
    throw new ImportError("Only one level-one quiz title is allowed.");
  const quiz: Quiz = { title: inline(nodes[0]).trim(), questions: [] };
  let index = 0;
  while (index < questions.nodes.length) {
    const heading = questions.nodes[index];
    const number = quiz.questions.length + 1;
    if (
      heading.type !== "heading" ||
      heading.depth !== 3 ||
      inline(heading).trim() !== `Question ${number}`
    )
      throw new ImportError(
        `Expected ### Question ${number}. Numbers must be unique and sequential.`,
        heading.position?.start.line,
      );
    if (number > 100)
      throw new ImportError(
        "A quiz can contain at most 100 questions.",
        heading.position?.start.line,
      );
    index++;
    const body: RootContent[] = [];
    while (index < questions.nodes.length) {
      const node = questions.nodes[index];
      if (node.type === "heading" && node.depth === 3) break;
      body.push(node);
      index++;
    }
    const optionIndex = body.findIndex(
      (node) =>
        node.type === "list" &&
        !node.ordered &&
        /^A\.\s/.test(inline(node.children[0]?.children[0])),
    );
    if (optionIndex < 0)
      throw new ImportError(
        "Add an unordered option list starting with A. or **A.**.",
        heading.position?.start.line,
        number,
      );
    const prompt = markdown(body.slice(0, optionIndex));
    const options = parseOptions(body[optionIndex] as List, number);
    const trailing = body.slice(optionIndex + 1);
    if (
      trailing.some(
        (node) =>
          node.type !== "thematicBreak" &&
          !(
            index === questions.nodes.length &&
            node.type === "paragraph" &&
            /^End of questions\b/i.test(inline(node).trim())
          ),
      )
    )
      throw new ImportError(
        "Keep the question before its option list. Put answers in Detailed explanations.",
        trailing[0]?.position?.start.line,
        number,
      );
    if (!prompt)
      throw new ImportError(
        "The question prompt is empty.",
        heading.position?.start.line,
        number,
      );
    quiz.questions.push({
      number,
      type: "multiple_response",
      prompt,
      options,
      answer: [],
      explanation: "",
    });
  }
  if (!quiz.questions.length)
    throw new ImportError("Add at least one ### Question 1 section.");
  for (const group of questionGroups) {
    const range = /^Questions\s+(\d+)\s*[-–—]\s*(\d+)$/i.exec(
      inline(group.heading).trim(),
    );
    if (!range) continue;
    const numbers = group.nodes.flatMap((node) => {
      const match =
        node.type === "heading" && node.depth === 3
          ? /^Question (\d+)$/.exec(inline(node).trim())
          : null;
      return match ? [Number(match[1])] : [];
    });
    const from = Number(range[1]),
      to = Number(range[2]);
    if (
      numbers[0] !== from ||
      numbers.at(-1) !== to ||
      numbers.length !== to - from + 1
    )
      throw new ImportError(
        "The Questions heading range does not match the questions in that section.",
        group.heading.position?.start.line,
      );
  }
  const explained = new Set<number>();
  index = 0;
  while (index < explanations.nodes.length) {
    const heading = explanations.nodes[index];
    if (
      heading.type === "thematicBreak" &&
      index === explanations.nodes.length - 1
    )
      break;
    const match =
      heading.type === "heading" && heading.depth === 3
        ? /^Question (\d+)\s*[-–—]\s*Correct answers:\s*(.+)$/i.exec(
            inline(heading).trim(),
          )
        : null;
    if (!match)
      throw new ImportError(
        "Use ### Question 1 - Correct answers: A, C under Detailed explanations.",
        heading.position?.start.line,
      );
    const number = Number(match[1]);
    const question = quiz.questions[number - 1];
    if (
      !question ||
      explained.has(number) ||
      question.type !== "multiple_response"
    )
      throw new ImportError(
        "This explanation has an unknown or repeated question number.",
        heading.position?.start.line,
        number,
      );
    question.answer = parseAnswerLabels(
      match[2],
      question.options,
      number,
      heading.position?.start.line,
    );
    explained.add(number);
    index++;
    const body: RootContent[] = [];
    while (index < explanations.nodes.length) {
      const node = explanations.nodes[index];
      if (node.type === "heading" && node.depth === 3) break;
      body.push(node);
      index++;
    }
    while (body.at(-1)?.type === "thematicBreak") body.pop();
    question.explanation = markdown(body);
    if (!question.explanation)
      throw new ImportError(
        "The explanation is empty.",
        heading.position?.start.line,
        number,
      );
  }
  for (const question of quiz.questions) {
    if (!explained.has(question.number))
      throw new ImportError(
        "Missing detailed explanation and correct answers.",
        undefined,
        question.number,
      );
  }
  if (key) {
    const tables = key.nodes.filter((node) => node.type !== "thematicBreak");
    if (tables.length !== 1 || tables[0].type !== "table")
      throw new ImportError(
        "Quick answer key must contain one table of Question / Correct options column pairs.",
        key.heading.position?.start.line,
      );
    const table = tables[0];
    const headers = table.children[0].children.map((cell) =>
      inline(cell).trim().toLowerCase(),
    );
    if (
      headers.length % 2 ||
      headers.some(
        (header, column) =>
          header !== (column % 2 ? "correct options" : "question"),
      )
    )
      throw new ImportError(
        "Use Question and Correct options column pairs in the answer key.",
        table.position?.start.line,
      );
    const keyed = new Set<number>();
    for (const row of table.children.slice(1)) {
      if (row.children.length !== headers.length)
        throw new ImportError(
          "Answer-key rows must match the table's columns.",
          row.position?.start.line,
        );
      for (let column = 0; column < headers.length; column += 2) {
        const numberText = inline(row.children[column]).trim();
        const number = Number(numberText);
        const question = quiz.questions[number - 1];
        if (
          !/^\d+$/.test(numberText) ||
          !question ||
          keyed.has(number) ||
          question.type !== "multiple_response"
        )
          throw new ImportError(
            "The answer key has an unknown, missing, or repeated question number.",
            row.position?.start.line,
          );
        const answer = parseAnswerLabels(
          inline(row.children[column + 1]).trim(),
          question.options,
          number,
          row.position?.start.line,
        );
        if (answer.join(",") !== question.answer.join(","))
          throw new ImportError(
            "Quick answer key and detailed explanation disagree. Correct them before importing.",
            row.position?.start.line,
            number,
          );
        keyed.add(number);
      }
    }
    if (keyed.size !== quiz.questions.length)
      throw new ImportError(
        "The quick answer key must include every question exactly once.",
        table.position?.start.line,
      );
  }
  return quiz;
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
    !inline(nodes[1]).trim().startsWith("Format:")
  ) {
    if (
      nodes.some(
        (node) =>
          node.type === "heading" &&
          node.depth === 2 &&
          paperQuestionsHeading.test(inline(node).trim()),
      )
    )
      return parseMultipleResponsePaper(tree);
  }
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
      !/^Type: (mcq|written|multiple_response)$/.test(inline(typeNode))
    )
      throw new ImportError(
        "Use Type: mcq, Type: multiple_response, or Type: written immediately after the question heading.",
        typeNode?.position?.start.line,
        number,
      );
    const type = inline(typeNode).slice(6) as
      "mcq" | "written" | "multiple_response";
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
      type !== "written" ? "Options,Answer,Explanation" : "Answer,Explanation";
    if (seen.join(",") !== expected)
      throw new ImportError(
        `Required section order: ${expected.replaceAll(",", ", ")}.`,
        heading.position?.start.line,
        number,
      );
    const content = {
      number,
      prompt: markdown(parts.Prompt),
      explanation: markdown(parts.Explanation),
    };
    const answerMarkdown = markdown(parts.Answer);
    if (!content.prompt || !answerMarkdown || !content.explanation)
      throw new ImportError(
        "Question, Answer, and Explanation must all contain text.",
        heading.position?.start.line,
        number,
      );
    if (type !== "written") {
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
      const options = parseOptions(parts.Options[0], number);
      const answer = inline({ children: parts.Answer }).trim();
      if (parts.Answer.length !== 1 || parts.Answer[0].type !== "paragraph")
        throw new ImportError(
          "Answer must be one paragraph containing option labels.",
          heading.position?.start.line,
          number,
        );
      if (type === "multiple_response") {
        quiz.questions.push({
          ...content,
          type,
          options,
          answer: parseAnswerLabels(
            answer,
            options,
            number,
            heading.position?.start.line,
          ),
        });
      } else {
        if (!options.some((option) => option.label === answer))
          throw new ImportError(
            "Answer must contain exactly one matching option label, such as B.",
            heading.position?.start.line,
            number,
          );
        quiz.questions.push({ ...content, type, options, answer });
      }
    } else quiz.questions.push({ ...content, type, answer: answerMarkdown });
  }
  if (!quiz.questions.length)
    throw new ImportError("Add at least one ## Question 1 section.");
  return quiz;
}
