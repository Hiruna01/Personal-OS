import { z } from "zod";
const title = z.string().trim().min(1, "A title is required.").max(200);
const id = z.uuid();
const optionalText = z.string().trim().max(500).nullable().optional();
const date = z.iso.date();
const optionalDate = z
  .union([date, z.literal(""), z.null()])
  .optional()
  .transform((x) => x || null);
const url = z
  .url()
  .max(2000)
  .refine((v) => {
    try {
      const u = new URL(v);
      return (
        ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
      );
    } catch {
      return false;
    }
  }, "Use an HTTP or HTTPS URL without embedded credentials.");
export const schemas = {
  semester: z
    .object({
      id: id.optional(),
      name: title.max(160),
      academic_year: z.string().trim().min(1).max(50),
      starts_on: date,
      ends_on: date,
      status: z.enum(["planned", "active", "completed"]),
      is_current: z.boolean(),
    })
    .refine((v) => v.ends_on >= v.starts_on, {
      message: "End date must be on or after the start date.",
      path: ["ends_on"],
    })
    .refine((v) => !v.is_current || v.status === "active", {
      message: "The current semester must have Active status.",
      path: ["is_current"],
    }),
  module: z.object({
    id: id.optional(),
    semester_id: id,
    title,
    code: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .transform((v) => v.toUpperCase()),
    credits: z.coerce.number().positive().max(100),
    lecturer: optionalText,
    contact: optionalText,
  }),
  lecture: z.object({
    id: id.optional(),
    module_id: id,
    title,
    topic: optionalText,
    lecture_date: optionalDate,
    study_status: z.enum(["not_started", "studying", "reviewed"]),
  }),
  resource: z.object({
    id: id.optional(),
    module_id: id,
    lecture_id: id.nullable(),
    kind: z.enum(["lecture_note", "exam_paper", "exam_solution"]),
    title,
    url,
    thumbnail_asset_id: id.nullable().optional(),
    thumbnail_url: z
      .union([
        z.literal(""),
        url.refine((v) => v.startsWith("https:"), "Images require HTTPS."),
        z.null(),
      ])
      .optional()
      .transform((v) => v || null),
    paper_year: z
      .union([z.coerce.number().int().min(1900).max(2200), z.null()])
      .optional(),
    exam_type: optionalText,
  }),
  project: z.object({ id: id.optional(), module_id: id, title }),
  profile: z.object({
    university: title,
    programme: title,
    start_year: z.coerce.number().int().min(1900).max(2200),
    expected_completion: optionalDate,
  }),
  workspace: z.object({
    name: title.max(100),
    timezone: z.string().refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid IANA timezone, such as Asia/Colombo."),
  }),
};
export type EntityKind = keyof typeof schemas;
export const documentSchema = z
  .object({
    id: id.optional(),
    module_id: id,
    lecture_id: id.nullable(),
    project_id: id.nullable(),
    kind: z.enum(["quiz", "questions", "project_brief"]),
    category: z.enum(["tutorial", "practical", "essay", "exam"]).nullable(),
    title,
    source_markdown: z.string().min(1),
    original_filename: z.string().max(255).nullable(),
    revision: z.number().int().positive().optional(),
  })
  .refine(
    (v) =>
      v.kind === "project_brief"
        ? !!v.project_id && !v.lecture_id
        : !v.project_id,
    { message: "Select a valid document parent." },
  )
  .refine(
    (v) =>
      v.kind === "questions"
        ? v.lecture_id
          ? ["tutorial", "practical", "essay"].includes(v.category || "")
          : v.category === "exam"
        : v.category === null,
    { message: "Choose the appropriate question category." },
  );
