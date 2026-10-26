# Personal OS — Private Study Hub

![Personal OS — Private study workspace: Semesters, Modules, Lectures, and Quizzes](docs/assets/personal-os-cover.png)

A complete Phase 0–3 implementation using Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase. Original lecture documents stay externally hosted; Markdown content is stored in Postgres and optional thumbnails in private Storage.

## Start locally

Use Node 22 LTS (see `.nvmrc`).

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Without Supabase configuration, owner routes lead to the sign-in/setup screen. [Sample preview](http://localhost:3000/preview/education/campus) is a separate, read-only collection of synthetic data. It is available only in development and is always disabled in production. Set `ENABLE_DEMO=false` to disable it in development too.

## Connect Supabase

Choose a dedicated development Supabase project or a local Supabase instance. The application never substitutes fixtures for authenticated data.

### Hosted project

1. Create a Supabase project.
2. Run `supabase/migrations/202610180001_private_study_hub.sql` in its SQL editor, or link the CLI and use `supabase db push`.
3. In Authentication settings, **disable public sign-ups**, enable email/password, and set Site URL to `http://localhost:3000`.
4. Allow redirects to `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/recovery`. The application requests the callback with `?next=/auth/recovery`; allow the callback URL including query parameters if required by your project’s exact-match configuration.
5. For reliable recovery across browsers, set the recovery email link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery` and also allow `/auth/confirm`. The standard PKCE recovery flow through `/auth/callback` is supported.
6. Copy `.env.example` to `.env.local`. Set the project URL, publishable key (legacy anon key also works), canonical `APP_URL`, administrative secret (legacy service-role key also works), owner email, and a unique owner password of at least 12 characters. Do not commit `.env.local`.
7. Run `npm run provision`. The script explicitly creates/locates the owner and creates one workspace. Rerunning preserves an existing owner’s password and records and refuses ownership changes. The default timezone is `Asia/Colombo`.
8. Restart the application and sign in as that owner.

The administrative secret and initial password are only needed by the provisioning script. Remove them from the running app/Vercel configuration after provisioning. Runtime owner requests use only the publishable key and authenticated session, with RLS.

### Local Supabase

Requires the Supabase CLI and Docker, installed separately.

```sh
supabase start
supabase db reset
```

`supabase/config.toml` disables registration and defines private storage limits. `supabase/seed.sql` intentionally does nothing until a workspace exists. Copy the local URL, publishable/anon key, and admin key from `supabase status` into `.env.local`; run `npm run provision`. To populate synthetic examples after provisioning:

```sh
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' -f supabase/seed.sql
```

The seed is optional and intended only for development. Do not run `db reset` against data you need to keep. Local email delivery can be inspected through the Supabase development mail interface shown by `supabase status`.

## What is implemented

- OS shell: Home, Personal/Business future areas, Education, Campus, Self Learning future area, and Settings.
- Owner sign-in/out and password recovery; protected server pages/actions; one provisioned owner/workspace; editable timezone.
- Academic profile; semester creation/editing/status/current selection; module creation/editing/credits/lecturer details.
- Lecture creation/editing/ordering/manual study status; multiple note links; uploaded or HTTPS thumbnail images with fallbacks.
- Strict `campus-quiz-v1` syntax-tree parsing; file validation/preview/import; optional MCQ selection; per-question reveals; written model answers; canonical source editing/replacement/deletion and revision conflict protection.
- Multiple-answer papers with separate answer keys and explanations, checkbox selections, Check → Next, and a separate reveal action. See [format details and template](docs/MULTIPLE-ANSWER-QUIZZES.md).
- Ordinary Markdown tutorial, practical, essay, exam-question, and project-brief reading with GFM tables, code, and KaTeX mathematics.
- Module exam preparation with paper/solution links, quizzes, and exam questions. Minimal project titles serve as parents for briefs.
- Downloadable example files in `public/examples` and a Templates screen.

This milestone does not include sharing, marks/GPA, schedules, full projects, references, global search, archive, or export. Grading policy configuration remains future work.

## Engineering and verification

```sh
npm run typecheck
npm run test:quiz
npm run test:performance
npm run build
npm start
```

The lockfile pins the installed dependency tree. The official shadcn components live in `src/components/ui`; product tokens/layouts are in `src/app/globals.css`. Owner actions use Zod and authenticated typed Supabase queries. The database enforces ownership, parent relationships, enum-like states, module codes, current-semester uniqueness, and document shape/revision rules. Quiz replacements and current-semester changes are transactional.

The interface now uses a neutral Vercel-inspired visual system, restrained Motion for React transitions, and the supplied React Bits folder collection. See [redesign and verification notes](docs/REDESIGN.md) for screenshots and the component adaptations.

Functional testing is manual at the owner’s request. See [manual verification](docs/MANUAL-VERIFICATION.md), [implementation decisions](docs/IMPLEMENTATION.md), and [completion report](docs/COMPLETION.md). No hosted credentials, Supabase CLI, or Docker were supplied during implementation; live Auth, RLS, migrations, storage, and database persistence still need to be exercised in your configured environment.

Pages load only the data they display, quizzes render the active question, and editing tools load when opened. See [performance improvements](docs/PERFORMANCE.md) for verification, optional server timings, and hosting-region checks.

## Vercel

Follow the [Supabase and Vercel deployment guide](docs/DEPLOYMENT.md) for the exact first-deployment sequence, owner provisioning, environment variables, recovery email template, and live checks. `vercel.json` sets the Next.js framework and the existing build command; Node 22 is pinned in `package.json`. Apply migrations and provision the owner in the intended Supabase environment first. Preview deployments should use a separate development Supabase project.

Private owner pages, actions, and thumbnail handlers check ownership independently. Responses use private/no-store cache headers. Production never exposes the fixture preview. Keep Postgres backups and thumbnail object backups separately; database backups alone do not contain the image objects.

## Useful references

Implementation follows the current [shadcn/ui Radix documentation](https://ui.shadcn.com/docs/components/radix/sidebar), [Next.js App Router documentation](https://nextjs.org/docs/app), [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client), and [rehype sanitisation guidance](https://github.com/rehypejs/rehype-sanitize). These links describe the libraries; the project’s scope is defined by the supplied project document and this Phase 3 milestone.
