import type {
  Workspace,
  AcademicProfile,
  Semester,
  Module,
  Lecture,
  Asset,
  Resource,
  Project,
  StudyDocument,
  Json,
} from "./domain";
type Table<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      workspaces: Table<Workspace>;
      academic_profiles: Table<AcademicProfile>;
      semesters: Table<Semester>;
      modules: Table<Module>;
      lectures: Table<Lecture>;
      assets: Table<Asset>;
      resources: Table<Resource>;
      projects: Table<Project>;
      study_documents: Table<
        Omit<StudyDocument, "quiz_json"> & { quiz_json: Json | null }
      >;
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      save_semester: { Args: { payload: Json }; Returns: string };
      reorder_lecture: {
        Args: { target_id: string; direction: number };
        Returns: undefined;
      };
      save_study_document: {
        Args: { payload: Json; expected_revision: number | null };
        Returns: string;
      };
    };
  };
};
