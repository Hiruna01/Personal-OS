// Offline fixture generation only. No credentials or database connections.
// Run with Node >=22.18: node --experimental-strip-types scripts/generate-seed.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { parseQuiz, PARSER_VERSION } from "../src/lib/markdown/parser.ts";
const quote = (value) =>
  value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const mid = "30000000-0000-4000-8000-000000000001";
const sid = "20000000-0000-4000-8000-000000000001";
const lid = "40000000-0000-4000-8000-000000000001";
const pid = "60000000-0000-4000-8000-000000000001";
let sql = `-- SYNTHETIC DEVELOPMENT DATA ONLY. Provision the owner first, then run this file.\n-- This seed never creates Auth users, passwords, or owner bindings. Safe to rerun.\ndo $seed$\ndeclare wid uuid;\nbegin\n  select id into wid from public.workspaces limit 1;\n  if wid is null then raise notice 'No workspace exists. Run npm run provision, then rerun seed.sql.'; return; end if;\n  insert into public.academic_profiles(workspace_id,university,programme,start_year) values(wid,'Example University','BSc in Computer Science',2025) on conflict(workspace_id) do nothing;\n`;
const semesters = [
  [
    sid,
    "Semester 03",
    "2026 / 2027",
    "2026-09-01",
    "2027-01-31",
    "active",
    true,
  ],
  [
    "20000000-0000-4000-8000-000000000002",
    "Semester 02",
    "2025 / 2026",
    "2026-02-01",
    "2026-07-31",
    "completed",
    false,
  ],
  [
    "20000000-0000-4000-8000-000000000003",
    "Semester 04",
    "2026 / 2027",
    "2027-02-01",
    "2027-07-31",
    "planned",
    false,
  ],
];
for (const [id, name, year, start, end, status, current] of semesters)
  sql += `  insert into public.semesters(id,workspace_id,name,academic_year,starts_on,ends_on,status,is_current) values(${quote(id)},wid,${[name, year, start, end, status].map(quote).join(",")},${current ? "not exists(select 1 from public.semesters where workspace_id=wid and is_current)" : "false"}) on conflict(id) do nothing;\n`;
const modules = [
  [mid, "CS203", "Database Systems", 3, "Dr. Morgan"],
  [
    "30000000-0000-4000-8000-000000000002",
    "CS204",
    "Software Engineering",
    3,
    null,
  ],
  [
    "30000000-0000-4000-8000-000000000003",
    "CS205",
    "Computer Networks",
    3,
    null,
  ],
  [
    "30000000-0000-4000-8000-000000000004",
    "MA201",
    "Discrete Mathematics",
    2,
    null,
  ],
];
modules.forEach(
  ([id, code, title, credits, lecturer], position) =>
    (sql += `  insert into public.modules(id,workspace_id,semester_id,code,title,credits,lecturer,position) values(${quote(id)},wid,${quote(sid)},${quote(code)},${quote(title)},${credits},${quote(lecturer)},${position}) on conflict(id) do nothing;\n`),
);
const lectures = [
  [
    lid,
    mid,
    "Introduction to relational databases",
    "Entities, relationships, and keys",
    "studying",
  ],
  [
    "40000000-0000-4000-8000-000000000002",
    mid,
    "The relational model",
    "Tables, constraints, and integrity",
    "reviewed",
  ],
  [
    "40000000-0000-4000-8000-000000000003",
    mid,
    "SQL fundamentals",
    "Queries, joins, and aggregation",
    "not_started",
  ],
  [
    "40000000-0000-4000-8000-000000000004",
    mid,
    "Normalisation",
    "Functional dependencies and normal forms",
    "not_started",
  ],
  [
    "40000000-0000-4000-8000-000000000005",
    modules[1][0],
    "The software development lifecycle",
    "Processes and requirements",
    "studying",
  ],
  [
    "40000000-0000-4000-8000-000000000006",
    modules[2][0],
    "Network architectures",
    "Layers and protocols",
    "not_started",
  ],
];
lectures.forEach(
  ([id, parent, title, topic, status], position) =>
    (sql += `  insert into public.lectures(id,workspace_id,module_id,title,topic,study_status,position) values(${quote(id)},wid,${[parent, title, topic, status].map(quote).join(",")},${position}) on conflict(id) do nothing;\n`),
);
sql += `  insert into public.resources(id,workspace_id,module_id,lecture_id,kind,title,url) values('70000000-0000-4000-8000-000000000001',wid,${quote(mid)},${quote(lid)},'lecture_note','Relational databases — Lecture notes','https://www.postgresql.org/docs/current/tutorial.html') on conflict(id) do nothing;\n  insert into public.projects(id,workspace_id,module_id,title) values(${quote(pid)},wid,${quote(mid)},'A small study library') on conflict(id) do nothing;\n`;
const docs = [
  [
    "50000000-0000-4000-8000-000000000001",
    "quiz",
    null,
    lid,
    null,
    "quiz.md",
    "Database fundamentals",
  ],
  [
    "50000000-0000-4000-8000-000000000002",
    "questions",
    "tutorial",
    lid,
    null,
    "tutorial.md",
    "Relational modelling tutorial",
  ],
  [
    "50000000-0000-4000-8000-000000000003",
    "questions",
    "exam",
    null,
    null,
    "exam-questions.md",
    "Database systems — Exam practice",
  ],
  [
    "50000000-0000-4000-8000-000000000004",
    "project_brief",
    null,
    null,
    pid,
    "project-brief.md",
    "A small study library",
  ],
];
for (const [id, kind, category, lectureId, projectId, file, title] of docs) {
  const source = readFileSync(
    new URL(`../public/examples/${file}`, import.meta.url),
    "utf8",
  );
  const quiz = kind === "quiz" ? parseQuiz(source) : null;
  sql += `  insert into public.study_documents(id,workspace_id,module_id,lecture_id,project_id,kind,category,title,source_markdown,quiz_json,parser_version,original_filename) values(${quote(id)},wid,${[mid, lectureId, projectId, kind, category, title, source, quiz ? JSON.stringify(quiz) : null, quiz ? PARSER_VERSION : null, file].map(quote).join(",")}) on conflict(id) do nothing;\n`;
}
sql += "end $seed$;\n";
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(
  "Generated synthetic seed.sql from the canonical Markdown examples.",
);
