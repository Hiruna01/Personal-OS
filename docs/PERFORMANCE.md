# Performance improvements

Implemented 26 October 2026.

## Data loading

Owner authentication and workspace verification are unchanged. Page loaders now request only the records their views display. Independent requests run concurrently; only parent-dependent requests wait for earlier results.

| View                                            | Requested page data                                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Home / Campus                                   | Profile, current semester, its modules and lectures                                                  |
| Semester browser                                | Semester and module metadata; no lecture/material bodies                                             |
| Semester                                        | Selected semester, its modules and their lectures                                                    |
| Module                                          | Module/semester, lectures, resource links, document summaries and projects                           |
| Lecture                                         | Parent module/semester, ordered sibling lectures for chapter numbering, and this lecture's materials |
| Quiz                                            | Document, module, and optional parent lecture                                                        |
| Ordinary document                               | Document, module/semester, and optional parent lecture                                               |
| Academic profile                                | Profile only                                                                                         |
| Settings, Templates, Education and future areas | Workspace identity only                                                                              |

The shell no longer queries semesters it does not display. A lecture-level quiz previously requested eight page-data queries plus one unused shell query; it now requests three page-data queries and no shell query. These counts exclude the unchanged Auth and workspace checks. Module-level quizzes need two page-data queries.

Database grants, RLS, server validation, private responses, query bounds, canonical documents and atomic writes are preserved. No shared cross-user data cache or service-role access is introduced.

## Browser work

The shared initial workspace client chunks in the local production build decreased from 1,390,006 to 678,282 uncompressed bytes. Individually gzip-compressed estimates decreased from 434,527 to 219,058 bytes (49.6%). This compares the chunks referenced by the workspace's client entry before and after the change. Quiz and editor chunks load separately when needed; this is not a measurement of total quiz-route downloads or live loading time.

- The quiz mounts only the active question and its options. The page session retains selections, reviews and position for Previous/Next and Focus mode. Inactive questions are not rendered as hidden Markdown.
- Unchanged quiz prompts, options and explanations are memoized so selection changes do not repeatedly parse the same Markdown.
- Import/source editor and entity form bodies load on opening their dialogs. Form validation, calendar controls and import parsing stay behind these boundaries. The small dialog shell opens immediately with a loading message and retains existing focus management and pending restrictions.
- The quiz reader is a separate client chunk, so unrelated workspace pages do not need to load its Markdown/math implementation up front.
- The shared URL policy lives independently of import parsing. Its protocol restrictions and sanitization behavior are unchanged.

## Measure the deployed application

Set `PERFORMANCE_LOGGING=true` in the intended environment and redeploy when ready. Logs contain operation names and elapsed milliseconds only:

- `auth.user`: verified Auth request.
- `auth.workspace`: owner/workspace lookup.
- `data.document`, `data.modules`, etc.: total page-data load, including owner verification when needed.

Timings can overlap because the layout and page share request-memoized owner access; do not add them together. No titles, document IDs, source, user identities or credentials are logged. Leave the variable unset or false to disable logging.

Compare the same deployed pages with the same data before/after, including first and repeated visits. Inspect the document/RSC request duration separately from JavaScript downloads and browser rendering. Build size and synthetic tests demonstrate reduced work, not a measured live latency improvement.

## Hosting regions

The repository does not pin a Vercel region, and deployed dashboard settings have not been inspected or changed. Check the Supabase project's database region, then choose the matching or nearest supported Vercel function region. Apply it to the intended project and redeploy when authorized. Keep preview and production databases separate. There is no reason to move or recreate the database merely for this code update.

See [Vercel function-region guidance](https://vercel.com/docs/functions/configuring-functions/region). The [Next.js lazy-loading guide](https://nextjs.org/docs/app/guides/lazy-loading) describes the client loading boundaries used here.

## Verification

Using Node 22:

```sh
npm run typecheck
npm run test:quiz
npm run test:performance
npm run build
```

`test:performance` uses a synthetic database adapter and server-rendered synthetic quizzes. It checks route scoping, missing/foreign documents, query concurrency, preserved counts and lecture order, current-question-only output, saved local review state passed into the reader, final retry, and unique IDs between instances. It does not exercise hosted Auth, RLS, storage, real persistence or browser interaction. The owner performs manual browser/mobile verification.
