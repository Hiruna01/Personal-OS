import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ContextData, StudyDocument } from "@/types/domain";
import { parseQuiz, PARSER_VERSION } from "./markdown/parser";
const timestamp = "2026-10-18T03:30:00.000Z";
const wid = "10000000-0000-4000-8000-000000000001";
export const sampleIds = {
  semester: "20000000-0000-4000-8000-000000000001",
  module: "30000000-0000-4000-8000-000000000001",
  lecture: "40000000-0000-4000-8000-000000000001",
  quiz: "50000000-0000-4000-8000-000000000001",
  tutorial: "50000000-0000-4000-8000-000000000002",
};
export function demoEnabled() {
  return (
    process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO !== "false"
  );
}
export function fixtures(): ContextData {
  const source = (name: string) =>
    readFileSync(join(process.cwd(), "public/examples", name), "utf8");
  const quiz = source("quiz.md");
  const documents: StudyDocument[] = [
    {
      id: sampleIds.quiz,
      kind: "quiz",
      category: null,
      title: "Database fundamentals",
      source_markdown: quiz,
      quiz_json: parseQuiz(quiz),
      parser_version: PARSER_VERSION,
      lecture_id: sampleIds.lecture,
      project_id: null,
    },
    {
      id: sampleIds.tutorial,
      kind: "questions",
      category: "tutorial",
      title: "Relational modelling tutorial",
      source_markdown: source("tutorial.md"),
      quiz_json: null,
      parser_version: null,
      lecture_id: sampleIds.lecture,
      project_id: null,
    },
    {
      id: "50000000-0000-4000-8000-000000000003",
      kind: "questions",
      category: "exam",
      title: "Database systems — Exam practice",
      source_markdown: source("exam-questions.md"),
      quiz_json: null,
      parser_version: null,
      lecture_id: null,
      project_id: null,
    },
    {
      id: "50000000-0000-4000-8000-000000000004",
      kind: "project_brief",
      category: null,
      title: "A small study library",
      source_markdown: source("project-brief.md"),
      quiz_json: null,
      parser_version: null,
      lecture_id: null,
      project_id: "60000000-0000-4000-8000-000000000001",
    },
  ].map((d) => ({
    ...d,
    workspace_id: wid,
    module_id: sampleIds.module,
    revision: 1,
    original_filename: `${d.kind}.md`,
    created_at: timestamp,
    updated_at: timestamp,
  })) as StudyDocument[];
  return {
    demo: true,
    workspace: {
      id: wid,
      owner_user_id: "sample-owner",
      name: "My workspace",
      timezone: "Asia/Colombo",
      created_at: timestamp,
    },
    profile: {
      workspace_id: wid,
      university: "Example University",
      programme: "BSc in Computer Science",
      start_year: 2025,
      expected_completion: null,
      updated_at: timestamp,
    },
    semesters: [
      {
        id: sampleIds.semester,
        name: "Semester 03",
        academic_year: "2026 / 2027",
        starts_on: "2026-09-01",
        ends_on: "2027-01-31",
        status: "active",
        is_current: true,
      },
      {
        id: "20000000-0000-4000-8000-000000000002",
        name: "Semester 02",
        academic_year: "2025 / 2026",
        starts_on: "2026-02-01",
        ends_on: "2026-07-31",
        status: "completed",
        is_current: false,
      },
      {
        id: "20000000-0000-4000-8000-000000000003",
        name: "Semester 04",
        academic_year: "2026 / 2027",
        starts_on: "2027-02-01",
        ends_on: "2027-07-31",
        status: "planned",
        is_current: false,
      },
    ].map((s) => ({
      ...s,
      workspace_id: wid,
      created_at: timestamp,
    })) as ContextData["semesters"],
    modules: [
      {
        id: sampleIds.module,
        title: "Database Systems",
        code: "CS203",
        credits: 3,
        lecturer: "Dr. Morgan",
        contact: null,
      },
      {
        id: "30000000-0000-4000-8000-000000000002",
        title: "Software Engineering",
        code: "CS204",
        credits: 3,
        lecturer: null,
        contact: null,
      },
      {
        id: "30000000-0000-4000-8000-000000000003",
        title: "Computer Networks",
        code: "CS205",
        credits: 3,
        lecturer: null,
        contact: null,
      },
      {
        id: "30000000-0000-4000-8000-000000000004",
        title: "Discrete Mathematics",
        code: "MA201",
        credits: 2,
        lecturer: null,
        contact: null,
      },
    ].map((m, i) => ({
      ...m,
      workspace_id: wid,
      semester_id: sampleIds.semester,
      position: i,
      created_at: timestamp,
    })),
    lectures: [
      {
        id: sampleIds.lecture,
        title: "Introduction to relational databases",
        topic: "Entities, relationships, and keys",
        study_status: "studying",
        module_id: sampleIds.module,
      },
      {
        id: "40000000-0000-4000-8000-000000000002",
        title: "The relational model",
        topic: "Tables, constraints, and integrity",
        study_status: "reviewed",
        module_id: sampleIds.module,
      },
      {
        id: "40000000-0000-4000-8000-000000000003",
        title: "SQL fundamentals",
        topic: "Queries, joins, and aggregation",
        study_status: "not_started",
        module_id: sampleIds.module,
      },
      {
        id: "40000000-0000-4000-8000-000000000004",
        title: "Normalisation",
        topic: "Functional dependencies and normal forms",
        study_status: "not_started",
        module_id: sampleIds.module,
      },
      {
        id: "40000000-0000-4000-8000-000000000005",
        title: "The software development lifecycle",
        topic: "Processes and requirements",
        study_status: "studying",
        module_id: "30000000-0000-4000-8000-000000000002",
      },
      {
        id: "40000000-0000-4000-8000-000000000006",
        title: "Network architectures",
        topic: "Layers and protocols",
        study_status: "not_started",
        module_id: "30000000-0000-4000-8000-000000000003",
      },
    ].map((l, i) => ({
      ...l,
      workspace_id: wid,
      lecture_date: null,
      position: i,
      created_at: timestamp,
    })) as ContextData["lectures"],
    resources: [
      {
        id: "70000000-0000-4000-8000-000000000001",
        workspace_id: wid,
        module_id: sampleIds.module,
        lecture_id: sampleIds.lecture,
        kind: "lecture_note",
        title: "Relational databases — Lecture notes",
        url: "https://www.postgresql.org/docs/current/tutorial.html",
        thumbnail_asset_id: null,
        thumbnail_url: null,
        paper_year: null,
        exam_type: null,
        position: 0,
        created_at: timestamp,
      },
    ],
    documents,
    projects: [
      {
        id: "60000000-0000-4000-8000-000000000001",
        workspace_id: wid,
        module_id: sampleIds.module,
        title: "A small study library",
        created_at: timestamp,
      },
    ],
  };
}
