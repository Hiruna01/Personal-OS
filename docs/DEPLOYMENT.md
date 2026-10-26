# Deploy Personal OS to Supabase and Vercel

This guide is for the first production deployment. The app's code builds locally; no hosted projects have been created or configured yet. The `/preview` workspace uses synthetic fixtures and is always unavailable in production. Your real workspace starts empty.

Readiness checks on 18 October 2026: TypeScript and formatting passed, and the production Webpack build passed using Node 22. The Vercel configuration and lockfile use the same runtime target. Hosted database, Auth, email, and storage checks remain pending project setup.

## 1. Create the Supabase project

Open [Supabase](https://supabase.com/dashboard) and create a dedicated project in your organisation, named **Personal OS**. Choose an available region close to you and create/store its database password yourself. Wait for the project to finish provisioning.

Keep the dashboard URL for this project. In the project's Connect dialog or API settings, find:

- **Project URL**, such as `https://your-project-ref.supabase.co`.
- **Publishable key**, starting with `sb_publishable_` (the legacy `anon` key also works).
- **Secret key**, starting with `sb_secret_` (the legacy `service_role` key also works). This is needed locally once to provision the owner; it is not a Vercel runtime variable.

## 2. Apply the database migration

In this project's **SQL Editor**, create a new query and paste the complete contents of `supabase/migrations/202610180001_private_study_hub.sql`. Run it once on the new, empty project.

It creates the Phase 0–3 tables, owner policies, grants, database functions, and the private `thumbnails` bucket. Do not manually create a public bucket. Do not rerun this initial migration against a project where it has already succeeded, or run `seed.sql` in production.

The SQL Editor approach does not record the migration in Supabase CLI history. If you later adopt CLI migrations, first reconcile the existing migration history; do not blindly push this initial migration a second time. If you already use the Supabase CLI, apply it with `supabase link --project-ref YOUR_PROJECT_REF` followed by `supabase db push` instead of the SQL Editor.

## 3. Configure Auth and provision your owner

In **Authentication**, keep email/password enabled and disable **Allow new users to sign up**. The local `supabase/config.toml` does not automatically change a hosted project's Auth settings.

In your local project folder, copy `.env.example` to `.env.local`. Fill in the project URL, publishable key, administrative secret, owner email, and an owner password of at least 12 characters. Keep `APP_URL=http://localhost:3000` for now. Use Node 22 and run:

```sh
npm ci
npm run provision
```

The script creates one confirmed owner account and a private workspace with timezone `Asia/Colombo`. It can be rerun for the same owner without changing existing passwords or data. It refuses to reassign an existing workspace.

After success, remove `SUPABASE_SECRET_KEY` and `OWNER_PASSWORD` from `.env.local`. Do not upload them to Vercel or commit this file. If you keep a backup for setup, store it in your password manager rather than the repository.

Restart local development and verify you can sign in at `http://localhost:3000/login`. The authenticated area is `/app`; `/preview` remains a separate fixture demonstration.

## 4. Push the repository and import it into Vercel

Push the project into your GitHub repository, including `package-lock.json`, `vercel.json`, `src/`, `public/`, and the Supabase migration. Confirm `.env.local`, `.next/`, `node_modules/`, and `.vercel/` are excluded. The checked-in `.gitignore` covers these paths.

In [Vercel](https://vercel.com/new), import that repository and select:

| Setting          | Value                                                                               |
| ---------------- | ----------------------------------------------------------------------------------- |
| Framework        | Next.js                                                                             |
| Root directory   | The folder containing this app's `package.json` (`./` if it is the repository root) |
| Node.js          | 22.x (also pinned in `package.json`)                                                |
| Install command  | `npm ci`                                                                            |
| Build command    | `npm run build`                                                                     |
| Output directory | Leave the Next.js default; do not select a static export                            |

Add these **Production** environment variables before deploying:

| Name                                   | Value                                                         |
| -------------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | The project URL from step 1                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The publishable/anon key from step 1                          |
| `APP_URL`                              | Your canonical HTTPS website origin, without a trailing slash |
| `ENABLE_DEMO`                          | `false`                                                       |

If you do not know the final Vercel domain yet, leave `APP_URL` unset for the first deploy. After Vercel assigns the project domain, set `APP_URL` to that exact origin and redeploy before using password recovery. Do not use a deployment-specific URL as your permanent origin if a stable project domain is available.

Do not add `SUPABASE_SECRET_KEY`, the database password, or `OWNER_PASSWORD` to Vercel. Runtime requests use the signed-in owner's session and RLS. Do not point automatic preview deployments at your production database; use a separate Supabase development project if you enable preview environment variables.

Deploy the project. Changing environment variables later requires a new deployment.

## 5. Finish the production authentication URLs

Once your stable domain is known, for example `https://your-personal-os.vercel.app`:

1. Set Vercel `APP_URL` to that origin, and redeploy.
2. In Supabase **Authentication → URL Configuration**, set **Site URL** to the same origin.
3. Add these exact **Redirect URLs**, substituting your real domain:

```text
https://your-personal-os.vercel.app/auth/callback
https://your-personal-os.vercel.app/auth/callback?next=/auth/recovery
https://your-personal-os.vercel.app/auth/confirm
https://your-personal-os.vercel.app/auth/recovery
```

If you also use this project locally, add the corresponding `http://localhost:3000` URLs explicitly. Prefer exact production URLs to broad wildcard rules.

In **Authentication → Email Templates → Reset Password**, use this recovery link in the email body:

```html
<h2>Reset your Personal OS password</h2>
<p>
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery"
    >Reset password</a
  >
</p>
```

This matches the implemented token-hash recovery route and supports opening the email in another browser. The standard PKCE `/auth/callback` route is also supported.

Configure **custom SMTP** in Supabase for dependable production recovery delivery. Supabase's built-in email sender is for development, has delivery/rate restrictions, and only sends to pre-authorized organisation team addresses. Creating the confirmed owner through the provisioning script does not require a signup email.

## 6. Verify the live application

- Open `/login`, sign in, and confirm you reach your own empty workspace.
- Create a semester, module, lecture, and note link. Reload and confirm they persist.
- Upload a small thumbnail and verify it loads while signed in.
- Import an example quiz and ordinary Markdown document; check their previews and reading pages.
- Sign out. Check that `/app` requires sign-in and private thumbnail requests are rejected.
- Confirm `/preview/education/campus` is unavailable in production.
- Request a recovery email and complete the password change yourself, then sign in again.

Keep the existing manual verification guide for the complete Phase 0–3 review. No live Supabase checks can be claimed until these steps run against the configured project.

## Troubleshooting

For slow page loads, see [performance improvements and measurement](PERFORMANCE.md). Verify that the Vercel function region is close to the Supabase database region; this is a deployed project setting and is not inferred from repository configuration. Optional `PERFORMANCE_LOGGING=true` enables content-free server timing logs.

- **“Connect your workspace” in production:** set both `NEXT_PUBLIC_SUPABASE_*` variables in Production and redeploy.
- **Owner has no workspace:** apply the migration and run provisioning for the same project/email. Creating an Auth user alone does not create its workspace.
- **Recovery goes to localhost:** correct Vercel `APP_URL`, Supabase Site URL/redirects, and the email template; redeploy and request a fresh email.
- **Recovery email is missing:** inspect Auth logs and SMTP settings; the default sender cannot send to arbitrary addresses.
- **Thumbnail denied:** confirm the migration created the private bucket and owner policies. Keep it private; do not fix this by making it public.
- **Build fails after import:** verify the root directory, Node 22, committed lockfile, and the `npm run build` command. This app uses a server runtime and is not a static export.

## Official references

- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Supabase database migrations](https://supabase.com/docs/guides/deployment/managing-environments)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
