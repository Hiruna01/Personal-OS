# Multiple-answer quizzes

The quiz importer accepts the supplied IT3120 paper layout directly, alongside existing `campus-quiz-v1` single-answer and written quizzes. Nothing needs to be added to the supplied file before uploading it as a **quiz**.

Download **Multiple-answer quiz** from Templates or **Multiple-answer template** from a quiz upload/source editor. The example is also in `public/examples/quiz-multiple-response.md`.

## Study flow

1. Select all options you think are correct. Choices use checkboxes; no correct-answer count is disclosed.
2. Select **Check answers**. Correct choices, missed choices, and incorrect selections are identified. The answer labels and full Markdown explanation appear below.
3. The same button becomes **Next**, so you decide when to continue after reading.
4. **Reveal answers** works without making any selections. This reveals the key and explanation without evaluating your choices, then enables Next.
5. Change any selection to return to Check answers. Previous retains local selections and review state. The last question offers Try again for that question. Reloading resets everything.

These are page-local self-study interactions. There are no timers, aggregate scores, saved attempts, or changes to academic marks.

## Paper layout

- One `# Title`.
- `## Questions` or `## Questions 1-N`.
- Sequential `### Question 1`, `### Question 2`, etc.; up to 100 questions.
- Prompt Markdown followed by one unordered option list. Labels run from A. onward, with 2–26 options. Plain `A.` and bold `**A.**` labels are accepted. Code, nested lists, tables, links, and mathematics are preserved within option items.
- Optional `## Quick answer key`: a table with `Question` / `Correct options` column pairs. Several pairs per row are supported, as in the supplied paper. Every question must appear exactly once, and the key must agree with the detailed answers.
- Required `## Detailed explanations`. Each question starts with `### Question 1 - Correct answers: A, C, E`, followed by non-empty Markdown. Supply at least two different matching option labels. Explanations can appear in a different order; they are joined to their questions by number.
- Introductory text, coverage checklists, and source sections remain in the canonical source. The interactive reader extracts questions and their detailed explanations. A trailing “End of questions” notice and thematic separators are supported.

Missing/duplicate question numbers or explanations, malformed options, unknown answer labels, inconsistent answer keys, and incorrect declared question ranges block preview/save with an actionable error. Failed replacements leave the existing document intact.

## Structured format extension

Existing `campus-quiz-v1` documents may also include this new type, alongside `mcq` and `written`:

```markdown
## Question 1

Type: multiple_response

Which options are correct?

### Options

- A. First correct option.
- B. An incorrect option.
- C. Another correct option.

### Answer

A, C

### Explanation

Explain each correct and incorrect choice here.
```

The title and `Format: campus-quiz-v1` marker remain required for structured files. Multiple-response derived JSON uses `type: "multiple_response"` and an ordered array of correct labels in `answer`. Existing single-answer and written JSON retains its original shape. Parser version: `campus-quiz-v1.1.0`.

Source Markdown, derived JSON, parser version, and revision continue to save atomically through the existing owner-authenticated operation. No database migration or data conversion is needed; existing records remain readable. HTML execution and URL sanitisation rules are unchanged.

## Verification

`npm run test:quiz` exercises compatibility, separated and structured formats, bold options, code/math/tables, optional and multi-column keys, mismatches, missing/duplicate content, unknown labels, and invalid ranges. The supplied 30-question file was also parsed directly without modification. Browser checks and screenshots are recorded in the completion report for this change.
