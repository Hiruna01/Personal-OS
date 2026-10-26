import "server-only";
import { notFound } from "next/navigation";
import { requireOwner } from "./auth";
import { demoEnabled, fixtures } from "./fixtures";
import { measureServer } from "./performance";
import type { ContextData, StudyDocument } from "@/types/domain";

const summary =
  "id,workspace_id,module_id,lecture_id,project_id,kind,category,title,parser_version,revision,original_filename,created_at,updated_at" as const;

export async function loadContext(
  path: string[],
  demo = false,
): Promise<ContextData> {
  if (demo) {
    if (!demoEnabled()) notFound();
    const data = fixtures();
    if (path[0] === "documents") {
      data.document = data.documents.find((d) => d.id === path[1]) as
        StudyDocument | undefined;
      if (!data.document) notFound();
    }
    return data;
  }

  // Only fixed route categories are logged; never titles, IDs, or source content.
  const route = path.join("/");
  const category =
    path[0] === "documents"
      ? "document"
      : path[0] === "education" && path[1] === "campus"
        ? ["semesters", "modules", "lectures", "profile"].includes(path[2])
          ? path[2]
          : "campus"
        : [
              "settings",
              "templates",
              "education",
              "personal",
              "business",
            ].includes(path[0])
          ? path[0]
          : "home";
  return measureServer(`data.${category}`, async () => {
    const { db, workspace } = await requireOwner();
    const data: ContextData = {
      workspace,
      profile: null,
      semesters: [],
      modules: [],
      lectures: [],
      resources: [],
      documents: [],
      projects: [],
      demo: false,
    };

    async function loadProfile() {
      const result = await db
        .from("academic_profiles")
        .select("*")
        .eq("workspace_id", workspace.id)
        .maybeSingle();
      if (result.error)
        throw new Error("Your academic profile could not be loaded.");
      data.profile = result.data;
    }
    async function loadSemester(id: string) {
      const result = await db
        .from("semesters")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("id", id)
        .maybeSingle();
      if (result.error) throw new Error("Your semester could not be loaded.");
      if (!result.data) notFound();
      data.semesters = [result.data];
    }
    async function loadModule(id: string, withSemester = true) {
      const result = await db
        .from("modules")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("id", id)
        .maybeSingle();
      if (result.error) throw new Error("Your module could not be loaded.");
      if (!result.data) notFound();
      data.modules = [result.data];
      if (withSemester) await loadSemester(result.data.semester_id);
    }
    async function loadModules(semesterId?: string) {
      let query = db
        .from("modules")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("position")
        .order("title")
        .limit(500);
      if (semesterId) query = query.eq("semester_id", semesterId);
      const result = await query;
      if (result.error) throw new Error("Your modules could not be loaded.");
      data.modules = result.data;
    }
    async function loadLectures(moduleIds: string[]) {
      if (!moduleIds.length) return;
      const result = await db
        .from("lectures")
        .select("*")
        .eq("workspace_id", workspace.id)
        .in("module_id", moduleIds)
        .order("position")
        .order("created_at")
        .order("id")
        .limit(1000);
      if (result.error) throw new Error("Your lectures could not be loaded.");
      data.lectures = result.data;
    }
    async function loadMaterials(moduleId: string, lectureId?: string) {
      let resources = db
        .from("resources")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("module_id", moduleId)
        .order("position")
        .order("created_at")
        .limit(1000);
      let documents = db
        .from("study_documents")
        .select(summary)
        .eq("workspace_id", workspace.id)
        .eq("module_id", moduleId)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (lectureId) {
        resources = resources.eq("lecture_id", lectureId);
        documents = documents.eq("lecture_id", lectureId);
      }
      const [resourceResult, documentResult, projectResult] = await Promise.all(
        [
          resources,
          documents,
          // Projects are displayed on module pages only.
          lectureId
            ? null
            : db
                .from("projects")
                .select("*")
                .eq("workspace_id", workspace.id)
                .eq("module_id", moduleId)
                .order("created_at")
                .limit(500),
        ],
      );
      if (resourceResult.error || documentResult.error || projectResult?.error)
        throw new Error("Your study materials could not be loaded.");
      data.resources = resourceResult.data;
      data.documents = documentResult.data;
      data.projects = projectResult?.data ?? [];
    }

    if (!route || route === "education/campus") {
      await Promise.all([
        loadProfile(),
        (async () => {
          const current = await db
            .from("semesters")
            .select("*")
            .eq("workspace_id", workspace.id)
            .eq("is_current", true)
            .maybeSingle();
          if (current.error)
            throw new Error("Your current semester could not be loaded.");
          if (!current.data) return;
          data.semesters = [current.data];
          await loadModules(current.data.id);
          await loadLectures(data.modules.map((module) => module.id));
        })(),
      ]);
    } else if (route === "education/campus/profile") {
      await loadProfile();
    } else if (route === "education/campus/semesters") {
      await Promise.all([
        loadModules(),
        (async () => {
          const result = await db
            .from("semesters")
            .select("*")
            .eq("workspace_id", workspace.id)
            .order("starts_on", { ascending: false })
            .limit(500);
          if (result.error)
            throw new Error("Your semesters could not be loaded.");
          data.semesters = result.data;
        })(),
      ]);
    } else if (path.length === 2 && path[0] === "documents") {
      const result = await db
        .from("study_documents")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("id", path[1])
        .maybeSingle();
      if (result.error) throw new Error("Your document could not be loaded.");
      if (!result.data) notFound();
      const document = result.data as unknown as StudyDocument;
      data.document = document;
      await Promise.all([
        loadModule(
          document.module_id,
          document.kind !== "quiz" || !document.quiz_json,
        ),
        (async () => {
          if (!document.lecture_id) return;
          const lecture = await db
            .from("lectures")
            .select("*")
            .eq("workspace_id", workspace.id)
            .eq("module_id", document.module_id)
            .eq("id", document.lecture_id)
            .maybeSingle();
          if (lecture.error)
            throw new Error("Your lecture could not be loaded.");
          if (!lecture.data) notFound();
          data.lectures = [lecture.data];
        })(),
      ]);
    } else if (
      path.length === 4 &&
      path[0] === "education" &&
      path[1] === "campus"
    ) {
      const id = path[3];
      if (path[2] === "semesters") {
        await Promise.all([
          loadSemester(id),
          (async () => {
            await loadModules(id);
            await loadLectures(data.modules.map((module) => module.id));
          })(),
        ]);
      } else if (path[2] === "modules") {
        await Promise.all([
          loadModule(id),
          loadLectures([id]),
          loadMaterials(id),
        ]);
      } else if (path[2] === "lectures") {
        const lecture = await db
          .from("lectures")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("id", id)
          .maybeSingle();
        if (lecture.error) throw new Error("Your lecture could not be loaded.");
        if (!lecture.data) notFound();
        await Promise.all([
          loadModule(lecture.data.module_id),
          // Keep the sibling order so the chapter number stays correct.
          loadLectures([lecture.data.module_id]),
          loadMaterials(lecture.data.module_id, id),
        ]);
      } else notFound();
    } else if (
      ![
        "settings",
        "templates",
        "education",
        "personal",
        "business",
        "education/self-learning",
      ].includes(route)
    ) {
      notFound();
    }
    return data;
  });
}
