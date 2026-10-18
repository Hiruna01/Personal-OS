-- SYNTHETIC DEVELOPMENT DATA ONLY. Provision the owner first, then run this file.
-- This seed never creates Auth users, passwords, or owner bindings. Safe to rerun.
do $seed$
declare wid uuid;
begin
  select id into wid from public.workspaces limit 1;
  if wid is null then raise notice 'No workspace exists. Run npm run provision, then rerun seed.sql.'; return; end if;
  insert into public.academic_profiles(workspace_id,university,programme,start_year) values(wid,'Example University','BSc in Computer Science',2025) on conflict(workspace_id) do nothing;
  insert into public.semesters(id,workspace_id,name,academic_year,starts_on,ends_on,status,is_current) values('20000000-0000-4000-8000-000000000001',wid,'Semester 03','2026 / 2027','2026-09-01','2027-01-31','active',not exists(select 1 from public.semesters where workspace_id=wid and is_current)) on conflict(id) do nothing;
  insert into public.semesters(id,workspace_id,name,academic_year,starts_on,ends_on,status,is_current) values('20000000-0000-4000-8000-000000000002',wid,'Semester 02','2025 / 2026','2026-02-01','2026-07-31','completed',false) on conflict(id) do nothing;
  insert into public.semesters(id,workspace_id,name,academic_year,starts_on,ends_on,status,is_current) values('20000000-0000-4000-8000-000000000003',wid,'Semester 04','2026 / 2027','2027-02-01','2027-07-31','planned',false) on conflict(id) do nothing;
  insert into public.modules(id,workspace_id,semester_id,code,title,credits,lecturer,position) values('30000000-0000-4000-8000-000000000001',wid,'20000000-0000-4000-8000-000000000001','CS203','Database Systems',3,'Dr. Morgan',0) on conflict(id) do nothing;
  insert into public.modules(id,workspace_id,semester_id,code,title,credits,lecturer,position) values('30000000-0000-4000-8000-000000000002',wid,'20000000-0000-4000-8000-000000000001','CS204','Software Engineering',3,null,1) on conflict(id) do nothing;
  insert into public.modules(id,workspace_id,semester_id,code,title,credits,lecturer,position) values('30000000-0000-4000-8000-000000000003',wid,'20000000-0000-4000-8000-000000000001','CS205','Computer Networks',3,null,2) on conflict(id) do nothing;
  insert into public.modules(id,workspace_id,semester_id,code,title,credits,lecturer,position) values('30000000-0000-4000-8000-000000000004',wid,'20000000-0000-4000-8000-000000000001','MA201','Discrete Mathematics',2,null,3) on conflict(id) do nothing;
  insert into public.lectures(id,workspace_id,module_id,title,topic,study_status,position) values('40000000-0000-4000-8000-000000000001',wid,'30000000-0000-4000-8000-000000000001','Introduction to relational databases','Entities, relationships, and keys','studying',0) on conflict(id) do nothing;
  insert into public.lectures(id,workspace_id,module_id,title,topic,study_status,position) values('40000000-0000-4000-8000-000000000002',wid,'30000000-0000-4000-8000-000000000001','The relational model','Tables, constraints, and integrity','reviewed',1) on conflict(id) do nothing;
  insert into public.lectures(id,workspace_id,module_id,title,topic,study_status,position) values('40000000-0000-4000-8000-000000000003',wid,'30000000-0000-4000-8000-000000000001','SQL fundamentals','Queries, joins, and aggregation','not_started',2) on conflict(id) do nothing;
  insert into public.lectures(id,workspace_id,module_id,title,topic,study_status,position) values('40000000-0000-4000-8000-000000000004',wid,'30000000-0000-4000-8000-000000000001','Normalisation','Functional dependencies and normal forms','not_started',3) on conflict(id) do nothing;
  insert into public.lectures(id,workspace_id,module_id,title,topic,study_status,position) values('40000000-0000-4000-8000-000000000005',wid,'30000000-0000-4000-8000-000000000002','The software development lifecycle','Processes and requirements','studying',4) on conflict(id) do nothing;
  insert into public.lectures(id,workspace_id,module_id,title,topic,study_status,position) values('40000000-0000-4000-8000-000000000006',wid,'30000000-0000-4000-8000-000000000003','Network architectures','Layers and protocols','not_started',5) on conflict(id) do nothing;
  insert into public.resources(id,workspace_id,module_id,lecture_id,kind,title,url) values('70000000-0000-4000-8000-000000000001',wid,'30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','lecture_note','Relational databases — Lecture notes','https://www.postgresql.org/docs/current/tutorial.html') on conflict(id) do nothing;
  insert into public.projects(id,workspace_id,module_id,title) values('60000000-0000-4000-8000-000000000001',wid,'30000000-0000-4000-8000-000000000001','A small study library') on conflict(id) do nothing;
  insert into public.study_documents(id,workspace_id,module_id,lecture_id,project_id,kind,category,title,source_markdown,quiz_json,parser_version,original_filename) values('50000000-0000-4000-8000-000000000001',wid,'30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',null,'quiz',null,'Database fundamentals','# Database fundamentals

Format: campus-quiz-v1

## Question 1

Type: mcq

Which key uniquely identifies a row in a relational table?

### Options

- A. Foreign key
- B. Primary key
- C. Search term

### Answer

B

### Explanation

A **primary key** uniquely identifies each row. A foreign key connects it to a row in another table.

## Question 2

Type: written

Explain why the following query uses a foreign key, and describe what happens if the referenced semester does not exist.

```sql
INSERT INTO modules (title, semester_id)
VALUES (''Database Systems'', ''semester-01'');
```

### Answer

The `semester_id` points to a semester record. A foreign-key constraint rejects the insert if that semester does not exist, preserving referential integrity.

### Explanation

The relationship ensures every module has a valid parent. This is a database-level guarantee, independent of form validation.

## Question 3

Type: mcq

For a relation with $n$ rows, which statement about a primary key is correct?

### Options

- A. Its values may repeat $n$ times.
- B. It must contain exactly $n$ distinct, non-null values.
- C. It is always a text column.

### Answer

B

### Explanation

Uniqueness and non-nullability identify every row. A key may be a number, text, or a combination of columns.
','{"title":"Database fundamentals","questions":[{"number":1,"type":"mcq","prompt":"Which key uniquely identifies a row in a relational table?","answer":"B","explanation":"A **primary key** uniquely identifies each row. A foreign key connects it to a row in another table.","options":[{"label":"A","markdown":"Foreign key"},{"label":"B","markdown":"Primary key"},{"label":"C","markdown":"Search term"}]},{"number":2,"type":"written","prompt":"Explain why the following query uses a foreign key, and describe what happens if the referenced semester does not exist.\n\n```sql\nINSERT INTO modules (title, semester_id)\nVALUES (''Database Systems'', ''semester-01'');\n```","answer":"The `semester_id` points to a semester record. A foreign-key constraint rejects the insert if that semester does not exist, preserving referential integrity.","explanation":"The relationship ensures every module has a valid parent. This is a database-level guarantee, independent of form validation."},{"number":3,"type":"mcq","prompt":"For a relation with $n$ rows, which statement about a primary key is correct?","answer":"B","explanation":"Uniqueness and non-nullability identify every row. A key may be a number, text, or a combination of columns.","options":[{"label":"A","markdown":"Its values may repeat $n$ times."},{"label":"B","markdown":"It must contain exactly $n$ distinct, non-null values."},{"label":"C","markdown":"It is always a text column."}]}]}','campus-quiz-v1.0.0','quiz.md') on conflict(id) do nothing;
  insert into public.study_documents(id,workspace_id,module_id,lecture_id,project_id,kind,category,title,source_markdown,quiz_json,parser_version,original_filename) values('50000000-0000-4000-8000-000000000002',wid,'30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',null,'questions','tutorial','Relational modelling tutorial','# Relational modelling tutorial

Work through these questions at your own pace. Sketch your answers before reading the notes.

## 1. Identify the entities

A university organises **semesters**, **modules**, and **lectures**.

1. List the attributes of each entity.
2. Choose a primary key for each table.
3. Draw the relationships between them.

| Entity | Example attributes | Parent |
| --- | --- | --- |
| Semester | Name, academic year, dates | Workspace |
| Module | Code, title, credits | Semester |
| Lecture | Title, topic, study status | Module |

## 2. Write the query

Write a query to return the lectures in one module in their study order.

```sql
SELECT title, topic, study_status
FROM lectures
WHERE module_id = ''your-module-id''
ORDER BY position;
```

## 3. Think about integrity

Why should a lecture not reference a module from another workspace?

### Discussion

A foreign key ensures the parent exists. A **composite foreign key** can also ensure the lecture and its parent belong to the same workspace.

## 4. A mathematical perspective

For a set of keys $K$ and rows $R$, the primary key defines a one-to-one mapping:

$$
f: K \rightarrow R
$$

Read more in the [PostgreSQL constraints documentation](https://www.postgresql.org/docs/current/ddl-constraints.html).
',null,null,'tutorial.md') on conflict(id) do nothing;
  insert into public.study_documents(id,workspace_id,module_id,lecture_id,project_id,kind,category,title,source_markdown,quiz_json,parser_version,original_filename) values('50000000-0000-4000-8000-000000000003',wid,'30000000-0000-4000-8000-000000000001',null,null,'questions','exam','Database systems — Exam practice','# Database systems — Exam practice

## Section A: Short answers

1. Define a candidate key.
2. Explain the difference between `INNER JOIN` and `LEFT JOIN`.
3. Describe a transaction and its atomicity guarantee.

## Section B: Applied reasoning

A module has $n$ lectures and each lecture has $m$ resources.

1. Express the total number of resources as a function of $n$ and $m$.
2. Propose an index for finding resources belonging to one lecture.

### Model discussion

There are $n \times m$ resources under the stated assumptions. An index beginning with `lecture_id` supports the lookup.
',null,null,'exam-questions.md') on conflict(id) do nothing;
  insert into public.study_documents(id,workspace_id,module_id,lecture_id,project_id,kind,category,title,source_markdown,quiz_json,parser_version,original_filename) values('50000000-0000-4000-8000-000000000004',wid,'30000000-0000-4000-8000-000000000001',null,'60000000-0000-4000-8000-000000000001','project_brief',null,'A small study library','# Project brief — A small study library

## Overview

Design and implement a private library for organising university study materials.

## Outcomes

- A clear semester → module → lecture structure.
- External links for original documents.
- Readable Markdown study pages.

## Deliverables

| Deliverable | Evidence |
| --- | --- |
| Data model | Schema diagram and constraints |
| Interface | Responsive study pages |
| Reflection | Short explanation of key decisions |

## Technical notes

Use transactions for related updates. A failed replacement must preserve the existing document.

```text
Validate → Preview → Save atomically
```

Dates, responsibilities, and milestones in this brief are ordinary document text. They are not automatically added to a calendar or project-management system.
',null,null,'project-brief.md') on conflict(id) do nothing;
end $seed$;
