# Implementation decisions — Private Study Hub

## Boundary

This implementation stops at Phase 3. The original project specification remains the long-term roadmap. There are no sharing/viewer routes, grading policies, marks, GPA, timetable, deadline aggregation, references, full project management, global search, archive, or portable export features.

A project has only a title, module parent, and Markdown briefs. Lecture documents remain externally hosted. Exam preparation contains paper/solution links and study documents, without exam scheduling.

## Design

All 13 reference images were visually inspected before implementation. The application translates their whitespace, folder navigation, quiet selected states, compact lists, segmented controls, and upload composition into an original academic workspace. Geist, Lucide, and official shadcn/ui Radix components form the foundation. Shared CSS variables define colors, typography, spacing, radii, shadows, and motion. The redesigned interface uses white backgrounds, neutral gray surfaces, near-black text, and black primary controls. Motion for React supplies restrained page, tab, sidebar, dialog, and quiz-answer transitions with reduced-motion support. The Semesters page uses the user-supplied React Bits Folder component in its matte material; real modules appear as paper previews and folders navigate directly to their semester. See [redesign verification](REDESIGN.md).

Home derives its current modules and continuation links from the selected current semester and manually set Studying lectures. It does not fabricate recent activity, marks, deadlines, or progress. Counts represent saved records. Opening an external note does not update study status.

## Implementation assumptions

- One explicitly provisioned owner and one workspace per database. Owner binding cannot be changed through authenticated application grants. Registration is disabled in local configuration and must be disabled in hosted Auth settings.
- Multiple semesters may be Active. At most one is Current, and Current must be Active. Choosing it switches the prior selection in a transaction.
- Names are editable; module codes are normalised to uppercase and unique per semester. Repeated modules use separate records.
- Thumbnail sources are either a private uploaded JPEG/PNG/WebP or an absolute HTTPS URL. The server never fetches arbitrary external images or lecture documents. Browser-hosted external images may depend on their source permissions. Uploaded images are decoded, dimension checked, bounded, oriented, and re-encoded as WebP. Download errors fall back to a document tile.
- The development-only `/preview` tree uses synthetic fixtures and disables mutations. It never authorises owner requests and is unconditionally unavailable under `NODE_ENV=production`. It is separate from `/app`, which always requires verified Supabase Auth and workspace ownership.
- No persistent client state is used for quizzes. Optional option selection and individual answer reveals reset on reload.
- Uploaded Markdown is canonical. `campus-quiz-v1.0.0` identifies the syntax-tree parser. Source, derived JSON, parser version, and revision share a single database row and atomic write. Failed validation or stale replacements leave the saved row intact.
- Question and brief files are rendered directly with GFM, code, and mathematics. No quiz extraction is applied to them. Raw HTML/MDX is disabled. Sanitisation runs before KaTeX with narrowly allowed math classes, `trust: false`, expansion and size limits. Outbound links allow HTTP(S), mailto, and page fragments; images allow absolute HTTPS only. Credentials in URLs and executable protocols are rejected. Relative image references produce import warnings.
- Owner data is loaded in Server Components using the authenticated session and typed Supabase client. Actions independently validate input, verify owner access, and rely on RLS and composite parent constraints. The administrative key is used only by the explicit provisioning script.
- Lists are scoped to workspace and academic parent. The lecture list paginates 12 rows in the interface. Queries are bounded at 500 structure records / 1,000 study records per loaded context; these are initial safeguards, not unlimited pagination. Before growing beyond those limits, add cursor-based server pagination and exact count queries. Typical single-owner study workloads fit comfortably below these limits.

## Environment and verification

The provided environment has Node and npm, but no Supabase credentials, Supabase CLI, or Docker runtime. A real hosted/local database was therefore not provisioned or exercised during implementation. Migrations, local configuration, owner provisioning, and synthetic seed data are supplied.

The user will perform manual functional testing. No automated functional test suite was added or run. Compilation/build checks and visual review are documented separately in the completion report. Hosted Auth/RLS/storage and end-to-end persistence require the Supabase setup in README.md and the manual checks in docs/MANUAL-VERIFICATION.md.
