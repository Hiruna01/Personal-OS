import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = new URL("../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier.startsWith("@/") ||
      (context.parentURL?.startsWith(root.href) && specifier.startsWith("."))
    ) {
      const base = specifier.startsWith("@/")
        ? new URL(specifier.slice(2), root)
        : new URL(specifier, context.parentURL);
      for (const suffix of ["", ".tsx", ".ts"]) {
        const path = fileURLToPath(base) + suffix;
        if (existsSync(path))
          return { url: pathToFileURL(path).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && /\.tsx?$/.test(url)) {
      const result = ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
        fileName: fileURLToPath(url),
      });
      return {
        format: "module",
        source: result.outputText,
        shortCircuit: true,
      };
    }
    return next(url, context);
  },
});
const { QuizReader } = await import("../src/features/study-content/quiz.tsx");
const quiz = {
  title: "Synthetic long quiz",
  questions: Array.from({ length: 100 }, (_, index) => ({
    number: index + 1,
    type: "multiple_response",
    prompt: `Unique-prompt-${index + 1} **important detail**`,
    options: [
      { label: "A", markdown: "First option" },
      { label: "B", markdown: "Second option" },
      { label: "C", markdown: "Third option" },
    ],
    answer: ["A", "C"],
    explanation: "Synthetic explanation.",
  })),
};
const session = (index, states = {}) => ({
  index,
  states,
  setIndex() {},
  update() {},
});
const render = (index, states) =>
  renderToStaticMarkup(
    React.createElement(QuizReader, { quiz, session: session(index, states) }),
  );

test("a hundred-question paper renders only the active prompt and options", () => {
  const html = render(49);
  assert.equal((html.match(/data-slot="questionnaire-item"/g) ?? []).length, 1);
  assert.equal((html.match(/<input\b[^>]*\btype="checkbox"/g) ?? []).length, 3);
  assert.match(html, /Unique-prompt-50/);
  assert.doesNotMatch(html, /Unique-prompt-49\b|Unique-prompt-51\b/);
  assert.match(html, /Question 50 of 100/);
  assert.match(html, /<strong>important detail<\/strong>/);
});
test("a revisited question retains selection and review feedback from its page session", () => {
  const html = render(0, { 1: { selected: ["A", "B"], review: "checked" } });
  assert.equal((html.match(/ checked=""/g) ?? []).length, 2);
  assert.match(html, /Missed/);
  assert.match(html, /Not correct/);
  assert.match(html, /Synthetic explanation/);
  assert.match(html, />Next</);
  assert.doesNotMatch(html, />Check answers</);
});
test("final-question retry and reveal-without-selection remain available", () => {
  const html = render(99, { 100: { selected: [], review: "revealed" } });
  assert.match(html, /Try again/);
  assert.match(html, /Hide answers/);
  assert.doesNotMatch(html, /Your selection:/);
});
test("reader and import-preview instances have independent input IDs", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(QuizReader, { quiz }),
      React.createElement(QuizReader, { quiz }),
    ),
  );
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});
