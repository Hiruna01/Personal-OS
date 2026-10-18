import "server-only";
import { notFound } from "next/navigation";
import { requireOwner } from "./auth";
import { demoEnabled, fixtures } from "./fixtures";
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
  const { db, workspace } = await requireOwner();
  const [profile, semesters] = await Promise.all([
    db
      .from("academic_profiles")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    db
      .from("semesters")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("starts_on", { ascending: false })
      .limit(500),
  ]);
  if (profile.error || semesters.error)
    throw new Error(
      "Your study structure could not be loaded. Please try again.",
    );
  const data: ContextData = {
    workspace,
    profile: profile.data,
    semesters: semesters.data ?? [],
    modules: [],
    lectures: [],
    resources: [],
    documents: [],
    projects: [],
    demo: false,
  };
  const segment = path.at(-2);
  const target = path.at(-1);
  let moduleId: string | undefined;
  let semesterId: string | undefined;
  if (path[0] === "documents") {
    const doc = await db
      .from("study_documents")
      .select("*")
      .eq("id", target!)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (doc.error || !doc.data) notFound();
    data.document = doc.data as unknown as StudyDocument;
    moduleId = doc.data.module_id;
  } else if (segment === "lectures") {
    const lecture = await db
      .from("lectures")
      .select("*")
      .eq("id", target!)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (lecture.error || !lecture.data) notFound();
    moduleId = lecture.data.module_id;
  } else if (segment === "modules") moduleId = target;
  else if (segment === "semesters") semesterId = target;
  if (moduleId) {
    const mod = await db
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (mod.error || !mod.data) notFound();
    data.modules = [mod.data];
  } else {
    let query = db
      .from("modules")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("position")
      .order("title")
      .limit(500);
    if (semesterId) query = query.eq("semester_id", semesterId);
    const modules = await query;
    if (modules.error) throw new Error("Your modules could not be loaded.");
    data.modules = modules.data;
  }
  const moduleIds = data.modules.map((m) => m.id);
  if (moduleIds.length) {
    const lectureResult = await db
      .from("lectures")
      .select("*")
      .eq("workspace_id", workspace.id)
      .in("module_id", moduleIds)
      .order("position")
      .order("created_at")
      .order("id")
      .limit(1000);
    if (lectureResult.error)
      throw new Error("Your lectures could not be loaded.");
    data.lectures = lectureResult.data;
  }
  if (moduleId) {
    const [resources, documents, projects] = await Promise.all([
      db
        .from("resources")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("module_id", moduleId)
        .order("position")
        .order("created_at")
        .limit(1000),
      db
        .from("study_documents")
        .select(summary)
        .eq("workspace_id", workspace.id)
        .eq("module_id", moduleId)
        .order("created_at", { ascending: false })
        .limit(1000),
      db
        .from("projects")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("module_id", moduleId)
        .order("created_at")
        .limit(500),
    ]);
    if (resources.error || documents.error || projects.error)
      throw new Error("Your study materials could not be loaded.");
    data.resources = resources.data;
    data.documents = documents.data;
    data.projects = projects.data;
  }
  return data;
}
