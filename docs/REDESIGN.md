# Interface redesign and semester folders

Date: 18 October 2026

## Implemented

- Rebuilt shared design tokens around white, neutral gray, near-black text, black primary buttons, Geist typography, crisp borders, and restrained radii and shadows.
- Updated the OS shell, Home/Campus, Education/future areas, semester and module collections, lecture materials, academic profile, Settings, Templates, authentication/recovery, upload/source previews, quizzes, and Markdown reading surfaces.
- Replaced promotional headings with direct page titles. Tightened spacing, improved contrast, simplified resource presentation, and made material empty states compact.
- Customised the existing shadcn/Radix components consistently. Preserved keyboard navigation, modal focus/return, labels, disabled preview saves, and accessible local quiz interactions.
- Added Motion for React (`motion/react`) with 160–180ms transitions for page entrances, shared tab indicators, sidebar layout/sheets, modal opening, and answer expansion. Global reduced-motion preferences disable transforms/layout motion; bespoke height transitions also use zero duration when reduced motion is requested. CSS animations respect the same preference.
- Import validation errors remain visible with the actions. Successful previews focus their tab. Quiz IDs are unique when an existing quiz and an editor preview appear simultaneously.

## Supplied React Bits Folder

The JavaScript + CSS source supplied in the attachment is retained in `src/components/react-bits/Folder.jsx` and `Folder.css`, with an explicit TypeScript interface in `Folder.d.ts`. No extra dependency was needed for this component.

Application adaptations:

- Matte neutral surfaces, light theme, no tilt, no bounce, no entrance sequence, and a faster settling speed.
- A `href` prop renders the folder surface as a Next.js link. Click, tap, Enter, modifier-click, and normal browser link actions navigate to the semester directly.
- Real module titles/codes/credits form the paper previews, up to the component's six-page limit. Empty semesters remain empty instead of using the component's default sample documents.
- Dragging and zooming are disabled. Module pages inside closed navigation folders are hidden from the accessibility tree.
- Hex colours are parsed identically on the server and client to avoid hydration mismatches.
- The animation engine observes changes to reduced-motion preferences and immediately settles to the target state when enabled.
- The collection uses responsive folder columns directly on the page, without rectangular cards, tinted panels, or separators. Semester information and edit controls sit beneath each folder, aligned to its width. Narrow phones use one folder per row.

## Module folders

Module collections on semester detail, Campus, and Home now use the same supplied React Bits Folder as the semester browser. `AcademicFolder` shares the neutral material, dimensions, navigation, and restrained motion settings across both levels of the hierarchy.

Folders sit directly on the page without rectangular outer cards. The module title, code, credits, and lecture count appear beneath each folder. Reviewed counts are omitted. Up to six actual lecture titles/topics form the paper previews, ordered by lecture position; modules without lectures show empty folders. Both the folder and its title navigate to the existing module route. Data, permissions, forms, and module editing are unchanged.

Desktop and mobile visual review covered the semester and Campus compositions, empty folders, metadata wrapping, and Enter-key navigation to a module. TypeScript and production build checks passed.

## Verification

### Questionnaire quiz reader — 19 October 2026

The quiz reader now uses the official [shadcn Base Questionnaire](https://ui.shadcn.com/docs/components/base/questionnaire) composition and `@shadcn/react` 0.3.1. Shared wrappers are customised to the existing neutral design system.

- One question at a time, a position indicator, native radio choices, and Previous/Next controls. Navigation never requires a selection or written response. There is no submission, score, timer, or attempt record.
- Show answer immediately reveals the correct choice or model answer and its explanation beneath the current question. Selections and reveals survive navigation between questions and reset on reload. Reader and import-preview instances remain independent.
- Rich Markdown, mathematics, links, tables, and code remain supported in prompts, options, answers, and explanations. Long code and tables scroll within their own containers, including narrow upload previews.
- Keyboard radio selection, navigation focus, accessible question/answer labels, selected/focus/hover states, and reduced-motion answer expansion are retained. Single-question imports omit unnecessary navigation.
- Browser review covered desktop and 360px mobile layouts, unanswered navigation, MCQ and written reveals, keyboard selection, navigation state retention, reload reset, source-preview isolation, and rich Markdown overflow. Synthetic preview content only; no records were saved.
- TypeScript, formatting, and the Node 22 production build passed. Concurrent development/build output briefly produced a stale development chunk; restarting the development server and reloading restored the reader, with no new browser errors during the final review.

Authentication, parser behavior, canonical Markdown/derived JSON, persistence, revisions, and permissions are unchanged.

### Lecture chapter cards

Module lectures now use outlined [shadcn Base Items](https://ui.shadcn.com/docs/components/base/item), composed with ItemMedia, ItemContent, ItemTitle, ItemDescription, and ItemActions. Individual cards replace the table container and column headings.

- Stable chapter numbers, lecture titles/topics, optional dates, and real counts of notes, quizzes, tutorials, practicals, and essays. Reviewed lectures retain their number. Empty lectures say “No materials yet.”
- One toolbar for scoped search, study-status filtering, and lecture creation. Reduced spacing around the module tabs.
- Full-card navigation uses a native title link with an expanded click target; menu buttons remain separate controls. Three-dot menus contain editing and Move up/down. Boundary/pending/preview restrictions are retained, with an additional preview guard in the reorder handler.
- Existing lecture forms support controlled opening from the menu. Escape/cancel return focus to that card's menu button. Mobile cards wrap status/actions beneath the content; search occupies its own toolbar row.
- Browser review checked desktop/mobile composition, material counts against lecture details, stable numbering under filtering, search/empty results, disabled preview reordering/saving, menu-to-dialog focus, and Enter-key navigation. Opening a lecture preserved its Studying status. TypeScript, formatting, and production build checks passed; live authenticated reordering/saving still requires Supabase setup.

No database, permission, authentication, or study-status behavior changed.

### Base Button redesign

The shared Button now uses the official [shadcn Base Button](https://ui.shadcn.com/docs/components/base/button) API and the already-installed Base UI primitive. Its documented variants and eight sizes share local neutral tokens, crisp borders, restrained hover transitions, and a visible keyboard focus ring. No additional dependency was needed.

- Primary creation, save, sign-in, and review actions use `default`; edit, cancel, upload, download, and date-trigger controls use `outline` where appropriate.
- Quiz reveals use `secondary`. Close, visibility, reorder, account, and other utility controls use `ghost` with icon sizes. Recovery text actions use `link`; final deletion uses `destructive`.
- Actual navigation/download links use `buttonVariants` on Link or anchor elements, preserving link semantics, following the documentation. No Button renders an anchor with a button role.
- Added documented icon-position attributes, consistent sizes, explicit non-submit defaults, busy states on asynchronous actions, and shared disabled/invalid styling. Radix dialogs, sheets, and alert actions compose the Base Button without nested buttons.
- TypeScript, formatting, and production build checks passed. Browser checks covered desktop/mobile presentation, Enter-key dialog opening, cancel/close controls, date-popover actions, real link navigation, quiz reveals, password visibility/recovery navigation, disabled preview saves, and mobile navigation. A stale development chunk during the build was resolved with a refresh.

Authentication, server actions, permissions, stored data, and preview restrictions are unchanged. No credentials were submitted or records mutated.

### Shared form redesign

- Added the shadcn Base Field, Select, Popover, Calendar, and Empty compositions, customised through the existing neutral design tokens. Date handling uses `date-fns` and `react-day-picker`, pinned in the lockfile.
- Converted semester, module, lecture, resource, project, academic profile, workspace, sign-in, recovery, and document-import forms to shared Field labels, groups, descriptions, and errors. Lecture topics use Textarea. Related short fields share a row on desktop and stack on phones.
- Semester dates use a range calendar with Clear/Done controls. Lecture and completion dates use single-date calendars with optional clearing. Submitted dates retain the original `yyyy-MM-dd` names and values without UTC conversion. Calendars show two months on desktop and one on mobile.
- Replaced native application dropdowns with accessible Base Select controls, including import categories, lecture filters, and study status. Popovers and dropdowns portal inside their parent dialog so nested focus management works correctly.
- Added inline client validation before the existing authenticated server validation. Shared empty states now use the Empty component composition, retaining their original content and actions.
- Verified populated semester and lecture editors, profile fields, resource uploads, category selection, ordinary Markdown previews, empty-source disabling, quiz import errors, lecture filtering, and recovery navigation. Checked keyboard dismissal/focus return, single-date selection/clearing, and range selection. No real records were changed.
- TypeScript, formatting, and production build checks passed. Browser review covered desktop and narrow mobile layouts; live saves, thumbnail storage, and recovery delivery remain dependent on Supabase setup.

- `npm run typecheck` passed.
- `npm run build` passed with the existing Webpack configuration.
- Browser review at 1280 × 900 and 360 × 800 covered the main workspace compositions, semester folders, module/lecture materials, quiz reading/reveals, ordinary Markdown reading, source/import previews, profile, Settings, Templates, Education/future areas, and authentication/recovery states.
- Checked semester filters/search and empty results; folder keyboard navigation; mobile sheet navigation; populated semester edit forms; invalid quiz feedback; successful quiz and ordinary-document previews; disabled fixture saving; local option selection and individual answer reveals; and reset on reload.
- Checked 360px page widths for the semester, quiz, and Markdown reader. No page-level horizontal overflow was observed; tables and code retain their own overflow areas.
- The final browser session reported no warnings or errors. An earlier stale development bundle was resolved by reloading after dependency installation.
- Reduced-motion branches were reviewed in code; an operating-system preference toggle was not exercised during browser review.

This work changes presentation and local interactions. Database schema, owner provisioning, authenticated server actions, RLS, storage permissions, parser semantics, and the production preview guard are preserved. No real records were mutated. Live Supabase Auth/recovery/storage/persistence still require the environment setup described in README.md; credentials were unavailable here.

## Screenshots

All content shown is synthetic.

- [Questionnaire quiz reader — desktop](screenshots/questionnaire-desktop.png)
- [Questionnaire quiz reader — mobile](screenshots/questionnaire-mobile.png)

- [Lecture chapter cards — desktop](screenshots/lecture-chapters-desktop.png)
- [Lecture chapter cards — mobile](screenshots/lecture-chapters-mobile.png)

- [Updated buttons — desktop dialog](screenshots/buttons-desktop-dialog.png)
- [Updated buttons — mobile dialog](screenshots/buttons-mobile-dialog.png)
- [Updated buttons — mobile quiz](screenshots/buttons-mobile-quiz.png)

- [Updated semester form](screenshots/forms-desktop-semester.png)
- [Updated lecture form](screenshots/forms-desktop-lecture.png)
- [Mobile range calendar](screenshots/forms-mobile-calendar.png)
- [Mobile import form](screenshots/forms-mobile-import.png)
- [Mobile import validation](screenshots/forms-mobile-error.png)

- [Desktop semester folders](screenshots/redesign-desktop-semesters.png)
- [Mobile semester folders](screenshots/redesign-mobile-semesters.png)
- [Desktop Campus](screenshots/redesign-desktop-campus.png)
- [Module folders — desktop](screenshots/module-folders-desktop.png)
- [Module folders — mobile](screenshots/module-folders-mobile.png)
- [Desktop module](screenshots/redesign-desktop-module.png)
- [Desktop lecture notes](screenshots/redesign-desktop-lecture.png)
- [Desktop upload preview](screenshots/redesign-desktop-upload.png)
- [Desktop quiz](screenshots/redesign-desktop-quiz.png)
- [Mobile quiz](screenshots/redesign-mobile-quiz.png)
- [Mobile Markdown reader](screenshots/redesign-mobile-document.png)
- [Mobile upload preview](screenshots/redesign-mobile-upload.png)
- [Mobile navigation](screenshots/redesign-mobile-navigation.png)
- [Desktop sign-in](screenshots/redesign-desktop-sign-in.png)
- [Mobile sign-in](screenshots/redesign-mobile-sign-in.png)
