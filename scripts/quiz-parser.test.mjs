import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseQuiz, PARSER_VERSION } from "../src/lib/markdown/parser.ts";

const original = readFileSync(
  new URL("../public/examples/quiz.md", import.meta.url),
  "utf8",
);
const paper = readFileSync(
  new URL("../public/examples/quiz-multiple-response.md", import.meta.url),
  "utf8",
);
const structured = `# Structured multiple-response quiz

Format: campus-quiz-v1

## Question 1

Type: multiple_response

Which operations preserve this constraint? Consider $x > 0$.

### Options

- A. Add a **positive** number.

  \`\`\`js
  // ## Question 99 is code, not a question
  const x = 1;
  \`\`\`
- B. Replace it with zero.
- C. Multiply by two.

### Answer

C, A

### Explanation

Both positive addition and multiplication preserve $x > 0$.

| Option | Reason |
|---|---|
| A | Positive sum |
| C | Positive product |
`;

test("existing single-answer/written quizzes retain their shape and rich Markdown", () => {
  const quiz = parseQuiz(original);
  assert.deepEqual(
    quiz.questions.map((q) => q.type),
    ["mcq", "written", "mcq"],
  );
  assert.equal(quiz.questions[0].answer, "B");
  assert.match(quiz.questions[1].prompt, /```sql/);
  assert.match(quiz.questions[2].prompt, /\$n\$/);
  assert.equal(PARSER_VERSION, "campus-quiz-v1.1.0");
});

test("separate questions, bold option labels, answer keys, explanations and math", () => {
  const quiz = parseQuiz(paper);
  assert.equal(quiz.questions.length, 2);
  assert.deepEqual(
    quiz.questions.map((q) => q.type),
    ["multiple_response", "multiple_response"],
  );
  assert.deepEqual(quiz.questions[0].answer, ["A", "B", "D"]);
  assert.equal(quiz.questions[0].options.length, 5);
  assert.doesNotMatch(quiz.questions[0].options[0].markdown, /^\*\*A\./);
  assert.match(quiz.questions[1].explanation, /\$100 \/ 50 = 2\$/);
  assert.match(quiz.questions[0].explanation, /Incorrect/);
});

test("structured multiple_response preserves code, tables and math, with canonical label order", () => {
  const question = parseQuiz(structured).questions[0];
  assert.deepEqual(question.answer, ["A", "C"]);
  assert.match(question.options[0].markdown, /## Question 99/);
  assert.match(question.options[0].markdown, /\*\*positive\*\*/);
  assert.match(question.explanation, /\| Option/);
});

test("quick key is optional; when present all entries must agree", () => {
  const withoutKey = paper.replace(
    /## Quick answer key[\s\S]*?(?=## Detailed explanations)/,
    "",
  );
  assert.deepEqual(parseQuiz(withoutKey), parseQuiz(paper));
  assert.throws(
    () => parseQuiz(paper.replace("| 1 | A, B, D |", "| 1 | A, C, D |")),
    /Question 1:.*disagree/,
  );
  assert.throws(
    () => parseQuiz(paper.replace("| 2 | A, C, E |", "")),
    /every question exactly once/,
  );
});

test("multi-column quick key pairs are matched by question number", () => {
  const paired = paper.replace(
    /\| Question \| Correct options \|[\s\S]*?(?=## Detailed explanations)/,
    `| Question | Correct options | Question | Correct options |
|---|---|---|---|
| 2 | A, C, E | 1 | A, B, D |

`,
  );
  assert.deepEqual(parseQuiz(paired), parseQuiz(paper));
});

test("missing/duplicate explanations, question numbers and options fail with useful errors", () => {
  assert.throws(
    () =>
      parseQuiz(paper.replace(/### Question 2 - Correct answers:[\s\S]*/, "")),
    /Question 2: Missing detailed explanation/,
  );
  assert.throws(
    () =>
      parseQuiz(
        paper.replace(
          "### Question 2 - Correct answers: A, C, E",
          "### Question 1 - Correct answers: A, C, E",
        ),
      ),
    /repeated question number/,
  );
  assert.throws(
    () => parseQuiz(paper.replace("### Question 2\n", "### Question 3\n")),
    /Expected ### Question 2/,
  );
  assert.throws(
    () => parseQuiz(paper.replace("- **B.** Assigning", "- **A.** Assigning")),
    /Question 1: Expected option label B/,
  );
  assert.throws(
    () => parseQuiz(paper.replace("## Questions 1-2", "## Questions 1-3")),
    /heading range/,
  );
});

test("unknown/duplicate/single answer labels and empty explanations are rejected", () => {
  assert.throws(
    () => parseQuiz(structured.replace("C, A", "A, Z")),
    /match an option/,
  );
  assert.throws(
    () => parseQuiz(structured.replace("C, A", "A, A")),
    /must not repeat/,
  );
  assert.throws(
    () => parseQuiz(structured.replace("C, A", "A")),
    /at least two comma-separated/,
  );
  assert.throws(
    () =>
      parseQuiz(
        structured.replace(/### Explanation[\s\S]*/, "### Explanation\n"),
      ),
    /must all contain text/,
  );
  assert.throws(
    () => parseQuiz(paper.replace("### Question 2\n", "## Question 2\n")),
    /outside its expected section/,
  );
});

test("malformed format and existing mcq/written validation remain strict", () => {
  assert.throws(
    () => parseQuiz(original.replace("Type: mcq", "Type: unknown")),
    /Use Type:/,
  );
  assert.throws(
    () =>
      parseQuiz(original.replace("Format: campus-quiz-v1", "Format: unknown")),
    /Place Format:/,
  );
  assert.throws(
    () => parseQuiz(original.replace("### Answer\n\nB", "### Answer\n\nA, B")),
    /exactly one matching/,
  );
  assert.throws(() => parseQuiz(""), /empty/);
});
