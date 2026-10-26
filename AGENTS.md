<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Personal OS — repository guide

## Product and scope

Personal OS is a private academic workspace for one provisioned owner and one workspace. The implemented milestone covers Phases 0–3, plus the explicitly requested multiple-answer quiz extension.

- Preserve the hierarchy: Education → Campus → Semester → Module → Lecture.
- Personal, Business, and Self Learning are clearly labelled future areas.
- Projects currently provide only a module parent, title, and Markdown briefs.
- Lecture documents remain externally hosted. Store links, metadata, and optional thumbnails rather than original lecture files.
- Do not expand into sharing/viewer accounts, GPA/marks, timetables, full project management, global search, or portable export unless the user requests that scope.
- Show real records and counts. Do not invent activity, deadlines, grades, or study progress. Opening a note must not mark its lecture reviewed.

Read the relevant project documents before changing behavior:

- [README.md](README.md): setup, commands, and deployment entry points.
- [Implementation decisions](docs/IMPLEMENTATION.md): architecture and scope.
- [Multiple-answer quizzes](docs/MULTIPLE-ANSWER-QUIZZES.md): current import and interaction contracts.
- [Redesign notes](docs/REDESIGN.md): established interface patterns.
- [Project document](docs/Personal-OS-Project-Document.md): the wider roadmap; later phases are not current requirements.
- [Deployment guide](docs/DEPLOYMENT.md) and [manual verification](docs/MANUAL-VERIFICATION.md): environment setup and live checks.

Some implementation reports describe the environment at the time they were written. Do not assume credentials are currently available or unavailable from those historical notes. Current user instructions take precedence over older milestone assumptions.

## Runtime and repository map

Use Node **22.x**, as declared in `.nvmrc` and `package.json`, and npm with the committed lockfile. Preserve the existing Webpack development/build configuration and pinned dependencies unless a task requires changing them.

| Location                                      | Responsibility                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/app`                                     | App Router routes, layouts, authentication endpoints, private asset handlers, and shared CSS |
| `src/components/ui`                           | Local shadcn component wrappers and variants                                                 |
| `src/components`                              | Shared shell and application components                                                      |
| `src/features/campus`                         | Academic pages, collections, and lecture chapter cards                                       |
| `src/features/study-content`                  | Imports, document actions, Markdown rendering, and quiz interaction                          |
| `src/lib/markdown/parser.ts`                  | Shared source validation, quiz parsing, URL policies, and parser version                     |
| `src/lib/actions.ts`, `src/lib/validation.ts` | Owner mutations and Zod validation                                                           |
| `src/lib/auth.ts`, `src/lib/supabase`         | Verified owner access and authenticated Supabase clients                                     |
| `src/types`                                   | Domain and database types                                                                    |
| `supabase/migrations`                         | Database schema, relationships, grants, RLS, and atomic operations                           |
| `public/examples`                             | Downloadable, synthetic Markdown templates                                                   |
| `scripts/quiz-parser.test.mjs`                | Quiz import regression tests                                                                 |
| `docs/assets`                                 | Versioned README artwork and related assets                                                  |

Inspect the existing implementation before editing it. Prefer Server Components for data loading and Client Components for interaction. Keep domain types, client previews, and server validation consistent.

## Authentication, persistence, and data safety

- `/app` requires verified Supabase Auth and workspace ownership. Every owner mutation and private asset request must independently enforce access; hiding a control is not authorization.
- Validate server inputs with Zod. Preserve workspace scoping, RLS, grants, foreign keys, and parent relationships.
- Owner requests use the authenticated session. Keep administrative credentials confined to explicit provisioning tooling; never introduce a service-role shortcut for ordinary requests.
- Never print or commit secrets or `.env.local`. Use `.env.example` for documented variable names and placeholders.
- `/preview` is a separate development-only fixture surface with mutations disabled. Preserve its unconditional production guard; never use it as an authentication bypass.
- Use synthetic preview data for UI review. Do not mutate, seed, or reset a live workspace merely to test presentation.
- Preserve atomic document replacement and current-semester selection. Failed validation, stale revisions, or failed imports must leave existing content intact.
- Preserve private thumbnail storage and authenticated asset delivery. Do not fetch arbitrary external documents on the server.
- Missing hosted setup must not block independent implementation. Provide migrations/setup instructions and report which live checks remain unverified.

## Interface conventions

- Maintain the current light, neutral visual system: white backgrounds, quiet gray surfaces, crisp borders, near-black text, black primary buttons, Geist typography, and Lucide icons.
- Reuse shared tokens in `src/app/globals.css` and component variants. Avoid one-off styling, purple/lavender tints, decorative gradients, charts, and fabricated dashboard content.
- Use the existing shadcn wrappers. The repository contains both Base UI and Radix compositions; inspect each wrapper's actual API before using `render`, `asChild`, controlled state, or event handlers.
- Semester and module collections use the shared React Bits folder presentation with metadata below, without rectangular outer cards. Lectures use Item-based chapter cards and contextual menus.
- Use Field compositions for forms and the established upload/source/preview flow. Keep labels, validation feedback, pending/disabled states, modal focus management, and keyboard support intact.
- Use Motion for React for fast, restrained transitions. Respect reduced-motion preferences and do not move focus into exiting or hidden content.
- Support narrow screens down to 360px. Keep primary actions reachable and contain code/table overflow within reading surfaces.
- Treat navigation/downloads as links and actions as buttons. Every visible control must perform a meaningful action.

## Markdown and quiz contracts

- Canonical source Markdown, derived quiz JSON, parser version, and revision save together. Revalidate on the server even after a successful client preview.
- Use syntax-tree parsing for document structure. Header-looking text inside fenced code or nested content must not become a question boundary.
- Keep existing `campus-quiz-v1` single-answer MCQs and written questions compatible, including their stored JSON shape.
- Support `Type: multiple_response` and paper-style quizzes with separate questions, optional quick keys, and detailed explanations. Paper question sections may be one collection or consecutive numbered groups such as `Questions 1-2`, `Questions 3-4`, etc.
- Preserve question/option order and rich Markdown. Validate sequential question numbers, each declared range, matching answer labels, non-empty explanations, duplicate content, and agreement between quick keys and detailed answers. Never silently drop questions from later groups.
- Keep `PARSER_VERSION` and format documentation current when parser behavior changes. Add focused regression coverage for accepted variants and invalid inputs.
- Multiple-answer flow: select checkboxes → Check answers → show correct/missed/incorrect feedback and explanation → the same primary button becomes Next. Reveal answers works without a selection. Preserve Previous state, final-question retry, and keyboard focus.
- Selections and answer reveals are local to the page and reset on reload. Main readers and import previews must have independent state and unique IDs. Do not add timers, aggregate scoring, persistent attempts, automatic written grading, or marks integration.
- Tutorial, practical, essay, exam-question, reference-sheet, and project-brief content is ordinary Markdown. Do not require quiz extraction for these documents.
- Preserve HTML/MDX disabling, sanitization, restricted URL protocols, and KaTeX safety settings. Keep code and tables scrollable.
- Update downloadable templates and upload guidance when changing supported formats. Use synthetic examples; do not copy personal course files into the repository as fixtures without a reason within the user's request.

## Verification and delivery

Run checks proportionate to the change using Node 22:

```sh
npm run typecheck
npm run test:quiz
npm run build
```

- Run `test:quiz` for parser/domain/import changes; it is a focused regression suite, not a full application test suite.
- The owner performs full manual functional testing. Do not claim live Auth, recovery, RLS, storage, or persistence checks from compilation or fixture previews.
- Format/check changed files with the installed Prettier and run `git diff --check`. Avoid running the broad formatting script over unrelated files. Documentation-only changes do not need an application build.
- For UI changes, inspect the running application and review relevant desktop/mobile, empty, validation, focus, and error states when browser tools are available. State any verification limits accurately.
- Avoid simultaneous development and production builds in the same checkout; they have previously caused stale development chunks. If starting/stopping a preview for verification, leave the requested preview usable afterward.
- `screenshots/` directories are ignored by Git. Do not rely on ignored local screenshots as the only deliverable or as required README assets; use `docs/assets` for artwork that belongs in the repository.
- Preserve unrelated working-tree changes. Do not commit, push, deploy, or apply hosted migrations unless the user requests those actions.
- Report the implemented outcome, relevant checks, and remaining environment setup concisely. Never present preview validation as a successful database save.
