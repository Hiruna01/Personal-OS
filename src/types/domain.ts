export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Workspace = {
  id: string;
  owner_user_id: string;
  name: string;
  timezone: string;
  created_at: string;
};
export type AcademicProfile = {
  workspace_id: string;
  university: string;
  programme: string;
  start_year: number;
  expected_completion: string | null;
  updated_at: string;
};
export type Semester = {
  id: string;
  workspace_id: string;
  name: string;
  academic_year: string;
  starts_on: string;
  ends_on: string;
  status: "planned" | "active" | "completed";
  is_current: boolean;
  created_at: string;
};
export type Module = {
  id: string;
  workspace_id: string;
  semester_id: string;
  title: string;
  code: string;
  credits: number;
  lecturer: string | null;
  contact: string | null;
  position: number;
  created_at: string;
};
export type Lecture = {
  id: string;
  workspace_id: string;
  module_id: string;
  title: string;
  topic: string | null;
  lecture_date: string | null;
  position: number;
  study_status: "not_started" | "studying" | "reviewed";
  created_at: string;
};
export type Asset = {
  id: string;
  workspace_id: string;
  module_id: string;
  object_path: string;
  media_type: string;
  byte_size: number;
  created_at: string;
};
export type Resource = {
  id: string;
  workspace_id: string;
  module_id: string;
  lecture_id: string | null;
  kind: "lecture_note" | "exam_paper" | "exam_solution";
  title: string;
  url: string;
  thumbnail_asset_id: string | null;
  thumbnail_url: string | null;
  paper_year: number | null;
  exam_type: string | null;
  position: number;
  created_at: string;
};
export type Project = {
  id: string;
  workspace_id: string;
  module_id: string;
  title: string;
  created_at: string;
};
export type QuizOption = { label: string; markdown: string };
export type QuizQuestion = {
  number: number;
  type: "mcq" | "written";
  prompt: string;
  options?: QuizOption[];
  answer: string;
  explanation: string;
};
export type Quiz = { title: string; questions: QuizQuestion[] };
export type StudyDocument = {
  id: string;
  workspace_id: string;
  module_id: string;
  lecture_id: string | null;
  project_id: string | null;
  kind: "quiz" | "questions" | "project_brief";
  category: "tutorial" | "practical" | "essay" | "exam" | null;
  title: string;
  source_markdown: string;
  quiz_json: Quiz | null;
  parser_version: string | null;
  revision: number;
  original_filename: string | null;
  created_at: string;
  updated_at: string;
};
export type DocumentSummary = Omit<
  StudyDocument,
  "source_markdown" | "quiz_json"
>;
export type ContextData = {
  workspace: Workspace;
  profile: AcademicProfile | null;
  semesters: Semester[];
  modules: Module[];
  lectures: Lecture[];
  resources: Resource[];
  documents: DocumentSummary[];
  projects: Project[];
  document?: StudyDocument;
  demo: boolean;
};
