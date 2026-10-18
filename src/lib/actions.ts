"use server";
import { revalidatePath } from "next/cache";
import { requireOwner } from "./auth";
import { schemas, documentSchema, type EntityKind } from "./validation";
import {
  normalizeSource,
  parseQuiz,
  PARSER_VERSION,
  inspectMarkdown,
} from "./markdown/parser";
import type { Json } from "@/types/domain";
import sharp from "sharp";
import { z } from "zod";
function message(error: unknown) {
  const e = error as { code?: string; message?: string };
  if (e.code === "23505") return "That code already exists in this semester.";
  if (e.code === "23503")
    return "The selected parent is unavailable. Reload the page and try again.";
  return e.message?.includes("This document changed")
    ? e.message
    : "Unable to save. Check your input and connection, then try again.";
}
export async function saveEntity(
  kind: EntityKind,
  input: unknown,
  attachment?: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const { db, workspace } = await requireOwner();
  if (!Object.prototype.hasOwnProperty.call(schemas, kind))
    return { ok: false, error: "Unsupported operation." };
  const schema = schemas[kind];
  if (!schema) return { ok: false, error: "Unsupported operation." };
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(" ").replaceAll("_", " ")}: ${i.message}`)
        .join("\n"),
    };
  const data = parsed.data;
  try {
    let error;
    if (kind === "semester") {
      ({ error } = await db.rpc("save_semester", {
        payload: { ...data, workspace_id: workspace.id } as Json,
      }));
    } else if (kind === "profile") {
      ({ error } = await db.from("academic_profiles").upsert({
        ...schemas.profile.parse(data),
        workspace_id: workspace.id,
        updated_at: new Date().toISOString(),
      }));
    } else if (kind === "workspace") {
      ({ error } = await db
        .from("workspaces")
        .update(schemas.workspace.parse(data))
        .eq("id", workspace.id));
    } else if (kind === "module") {
      const v = schemas.module.parse(data);
      const parent = await db
        .from("semesters")
        .select("id")
        .eq("id", v.semester_id)
        .eq("workspace_id", workspace.id)
        .single();
      if (parent.error) throw parent.error;
      const result = v.id
        ? await db
            .from("modules")
            .update(v)
            .eq("id", v.id)
            .eq("workspace_id", workspace.id)
            .select("id")
            .single()
        : await db
            .from("modules")
            .insert({ ...v, workspace_id: workspace.id })
            .select("id")
            .single();
      error = result.error;
    } else if (kind === "lecture") {
      const v = schemas.lecture.parse(data);
      const parent = await db
        .from("modules")
        .select("id")
        .eq("id", v.module_id)
        .eq("workspace_id", workspace.id)
        .single();
      if (parent.error) throw parent.error;
      const result = v.id
        ? await db
            .from("lectures")
            .update(v)
            .eq("id", v.id)
            .eq("module_id", v.module_id)
            .eq("workspace_id", workspace.id)
            .select("id")
            .single()
        : await db
            .from("lectures")
            .insert({ ...v, workspace_id: workspace.id })
            .select("id")
            .single();
      error = result.error;
    } else if (kind === "project") {
      const v = schemas.project.parse(data);
      const parent = await db
        .from("modules")
        .select("id")
        .eq("id", v.module_id)
        .eq("workspace_id", workspace.id)
        .single();
      if (parent.error) throw parent.error;
      const result = v.id
        ? await db
            .from("projects")
            .update(v)
            .eq("id", v.id)
            .eq("workspace_id", workspace.id)
            .select("id")
            .single()
        : await db
            .from("projects")
            .insert({ ...v, workspace_id: workspace.id })
            .select("id")
            .single();
      error = result.error;
    } else if (kind === "resource") {
      const v = schemas.resource.parse(data);
      const parent = await db
        .from("modules")
        .select("id")
        .eq("id", v.module_id)
        .eq("workspace_id", workspace.id)
        .single();
      if (parent.error) throw parent.error;
      let uploaded: { id: string; path: string } | null = null;
      const file = attachment?.get("thumbnail");
      if (file instanceof File && file.size) {
        if (
          file.size > 2097152 ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        )
          return {
            ok: false,
            error: "Choose a JPEG, PNG, or WebP image up to 2 MiB.",
          };
        let bytes: Buffer;
        try {
          const source = Buffer.from(await file.arrayBuffer());
          const metadata = await sharp(source, {
            limitInputPixels: 20000000,
          }).metadata();
          if (
            !["jpeg", "png", "webp"].includes(metadata.format || "") ||
            !metadata.width ||
            !metadata.height ||
            metadata.width < 32 ||
            metadata.height < 32
          )
            throw new Error();
          bytes = await sharp(source, { limitInputPixels: 20000000 })
            .rotate()
            .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
        } catch {
          return {
            ok: false,
            error:
              "The image could not be read. Choose a valid JPEG, PNG, or WebP image at least 32 × 32 pixels.",
          };
        }
        const assetId = crypto.randomUUID();
        const path = `${workspace.id}/${v.module_id}/${assetId}.webp`;
        const upload = await db.storage
          .from("thumbnails")
          .upload(path, bytes, { contentType: "image/webp", upsert: false });
        if (upload.error) throw upload.error;
        const asset = await db.from("assets").insert({
          id: assetId,
          workspace_id: workspace.id,
          module_id: v.module_id,
          object_path: path,
          media_type: "image/webp",
          byte_size: bytes.length,
        });
        if (asset.error) {
          await db.storage.from("thumbnails").remove([path]);
          throw asset.error;
        }
        uploaded = { id: assetId, path };
        v.thumbnail_asset_id = assetId;
        v.thumbnail_url = null;
      }
      if (v.thumbnail_url) v.thumbnail_asset_id = null;
      const result = v.id
        ? await db
            .from("resources")
            .update(v)
            .eq("id", v.id)
            .eq("workspace_id", workspace.id)
            .select("id")
            .single()
        : await db
            .from("resources")
            .insert({ ...v, workspace_id: workspace.id })
            .select("id")
            .single();
      error = result.error;
      if (error && uploaded) {
        await db.from("assets").delete().eq("id", uploaded.id);
        await db.storage.from("thumbnails").remove([uploaded.path]);
      }
    }
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}
export async function moveLecture(id: string, direction: number) {
  const { db } = await requireOwner();
  if (
    !z
      .object({
        id: z.uuid(),
        direction: z.union([z.literal(-1), z.literal(1)]),
      })
      .safeParse({ id, direction }).success
  )
    return { ok: false, error: "Invalid lecture." };
  const { error } = await db.rpc("reorder_lecture", {
    target_id: id,
    direction,
  });
  if (error) return { ok: false, error: message(error) };
  revalidatePath("/app", "layout");
  return { ok: true };
}
export async function saveDocument(
  input: unknown,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { db, workspace } = await requireOwner();
  const result = documentSchema.safeParse(input);
  if (!result.success)
    return {
      ok: false,
      error: result.error.issues.map((i) => i.message).join(" "),
    };
  try {
    const v = result.data;
    const parent = await db
      .from("modules")
      .select("id")
      .eq("id", v.module_id)
      .eq("workspace_id", workspace.id)
      .single();
    if (parent.error) throw parent.error;
    const source = normalizeSource(v.source_markdown);
    inspectMarkdown(source);
    const quiz = v.kind === "quiz" ? parseQuiz(source) : null;
    const { revision, ...fields } = v;
    const { data, error } = await db.rpc("save_study_document", {
      payload: {
        ...fields,
        title: quiz?.title ?? v.title,
        source_markdown: source,
        quiz_json: quiz as unknown as Json,
        parser_version: quiz ? PARSER_VERSION : null,
        workspace_id: workspace.id,
      } as Json,
      expected_revision: revision ?? null,
    });
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true, id: data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.name === "ImportError"
          ? error.message
          : message(error),
    };
  }
}
export async function deleteDocument(id: string, revision: number) {
  const { db, workspace } = await requireOwner();
  if (
    !z
      .object({ id: z.uuid(), revision: z.number().int().positive() })
      .safeParse({ id, revision }).success
  )
    return { ok: false, error: "Invalid document or revision." };
  const { data, error } = await db
    .from("study_documents")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .eq("revision", revision)
    .select("id")
    .single();
  if (error || !data)
    return {
      ok: false,
      error:
        "This document changed or could not be deleted. Reload and try again.",
    };
  revalidatePath("/app", "layout");
  return { ok: true };
}
