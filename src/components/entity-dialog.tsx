"use client";
import { useId, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { SelectControl } from "@/components/select-control";
import { DatePicker, DateRangePicker } from "@/components/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { saveEntity } from "@/lib/actions";
import { schemas, type EntityKind } from "@/lib/validation";
type FieldDefinition = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: [string, string][];
  help?: string;
};
const fields: Record<EntityKind, FieldDefinition[]> = {
  semester: [
    {
      name: "name",
      label: "Semester name",
      required: true,
      placeholder: "Semester 03",
    },
    {
      name: "academic_year",
      label: "Academic year",
      required: true,
      placeholder: "2026 / 2027",
    },
    { name: "starts_on", label: "Start date", type: "date", required: true },
    { name: "ends_on", label: "End date", type: "date", required: true },
    {
      name: "status",
      label: "Status",
      required: true,
      options: [
        ["planned", "Planned"],
        ["active", "Active"],
        ["completed", "Completed"],
      ],
    },
    {
      name: "is_current",
      label: "Use as my current semester",
      type: "checkbox",
      help: "Choose Active status. This replaces the previous current semester.",
    },
  ],
  module: [
    {
      name: "code",
      label: "Module code",
      required: true,
      placeholder: "CS203",
    },
    {
      name: "title",
      label: "Module title",
      required: true,
      placeholder: "Database Systems",
    },
    { name: "credits", label: "Credits", type: "number", required: true },
    { name: "lecturer", label: "Lecturer", placeholder: "Optional" },
    {
      name: "contact",
      label: "Lecturer contact",
      placeholder: "Email or other contact · optional",
    },
  ],
  lecture: [
    {
      name: "title",
      label: "Lecture title",
      required: true,
      placeholder: "Introduction to relational databases",
    },
    {
      name: "topic",
      label: "Topic",
      type: "textarea",
      placeholder: "Optional short description",
    },
    { name: "lecture_date", label: "Lecture date", type: "date" },
    {
      name: "study_status",
      label: "Study status",
      required: true,
      options: [
        ["not_started", "Not started"],
        ["studying", "Studying"],
        ["reviewed", "Reviewed"],
      ],
    },
  ],
  resource: [
    {
      name: "title",
      label: "Resource title",
      required: true,
      placeholder: "Lecture notes",
    },
    {
      name: "url",
      label: "Original document URL",
      type: "url",
      required: true,
      placeholder: "https://…",
      help: "The original document stays with its host. Only this link is stored.",
    },
    {
      name: "thumbnail_url",
      label: "Thumbnail image URL",
      type: "url",
      placeholder: "https://… · optional",
      help: "Use HTTPS, or upload an image below.",
    },
    {
      name: "thumbnail",
      label: "Upload a thumbnail",
      type: "file",
      help: "JPEG, PNG, or WebP · up to 2 MiB · at least 32 × 32 pixels.",
    },
  ],
  project: [
    {
      name: "title",
      label: "Project title",
      required: true,
      placeholder: "A small study library",
    },
  ],
  profile: [
    {
      name: "university",
      label: "University",
      required: true,
      placeholder: "Your university",
    },
    {
      name: "programme",
      label: "Programme",
      required: true,
      placeholder: "BSc in Computer Science",
    },
    { name: "start_year", label: "Start year", type: "number", required: true },
    { name: "expected_completion", label: "Expected completion", type: "date" },
  ],
  workspace: [
    { name: "name", label: "Workspace name", required: true },
    {
      name: "timezone",
      label: "Timezone",
      required: true,
      placeholder: "Asia/Colombo",
      help: "Use an IANA timezone, for example Asia/Colombo or Europe/London.",
    },
  ],
};
const names: Record<EntityKind, string> = {
  semester: "semester",
  module: "module",
  lecture: "lecture",
  resource: "note link",
  project: "project",
  profile: "academic profile",
  workspace: "workspace",
};
export function EntityDialog({
  kind,
  initial = {},
  label,
  children,
  demo = false,
  compact = false,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  onCloseAutoFocus,
}: {
  kind: EntityKind;
  initial?: Record<string, unknown>;
  label?: string;
  children?: ReactNode;
  demo?: boolean;
  compact?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onCloseAutoFocus?: React.ComponentProps<
    typeof DialogContent
  >["onCloseAutoFocus"];
}) {
  const [localOpen, setLocalOpen] = useState(false),
    [pending, start] = useTransition(),
    [error, setError] = useState("");
  const open = controlledOpen ?? localOpen;
  const router = useRouter();
  const formId = useId();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  function setOpen(next: boolean) {
    if (onOpenChange) onOpenChange(next);
    else setLocalOpen(next);
    setError("");
    setFieldErrors({});
  }
  const edit = !!initial.id || kind === "profile" || kind === "workspace";
  const title = label ?? `${edit ? "Edit" : "New"} ${names[kind]}`;
  const isExam = kind === "resource" && initial.kind !== "lecture_note";
  const orderedFields =
    kind === "module"
      ? [fields.module[1], fields.module[0], ...fields.module.slice(2)]
      : fields[kind];
  const visible = orderedFields.concat(
    isExam
      ? ([
          {
            name: "kind",
            label: "Link type",
            required: true,
            options: [
              ["exam_paper", "Past paper"],
              ["exam_solution", "Solution"],
            ],
          },
          { name: "paper_year", label: "Paper year", type: "number" },
          {
            name: "exam_type",
            label: "Exam type",
            placeholder: "Final, midterm, or resit · optional",
          },
        ] as FieldDefinition[])
      : [],
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!pending) {
          setOpen(v);
        }
      }}
    >
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            variant={compact ? "ghost" : edit ? "outline" : "default"}
            size={compact ? "icon-sm" : "default"}
            title={demo ? "Sample preview is read-only" : title}
            aria-label={title}
          >
            {children ??
              (compact ? (
                <Pencil size={15} />
              ) : (
                <>
                  {edit ? (
                    <Pencil data-icon="inline-start" />
                  ) : (
                    <Plus data-icon="inline-start" />
                  )}
                  {title}
                </>
              ))}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="entity-dialog"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {kind === "project"
              ? "Create a place for a Markdown project brief."
              : kind === "resource"
                ? "Keep your materials connected to their original source."
                : "Update the details below, then save your changes."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (demo) return;
            const form = new FormData(event.currentTarget);
            const payload: Record<string, unknown> = { ...initial };
            for (const field of visible) {
              if (field.type === "file") continue;
              const value = form.get(field.name);
              payload[field.name] =
                field.type === "checkbox"
                  ? value === "on"
                  : ["credits", "start_year", "paper_year"].includes(field.name)
                    ? value
                      ? Number(value)
                      : null
                    : typeof value === "string"
                      ? value
                      : null;
            }
            if (kind === "resource") {
              payload.kind ??= "lecture_note";
              payload.lecture_id ??= null;
              payload.thumbnail_asset_id ??= null;
              payload.paper_year ??= null;
              payload.exam_type ??= null;
            }
            const validation = schemas[kind].safeParse(payload);
            if (!validation.success) {
              const errors: Record<string, string> = {};
              for (const issue of validation.error.issues) {
                const key = String(issue.path[0] || "form");
                errors[key] =
                  ["starts_on", "ends_on"].includes(key) && !payload[key]
                    ? "Choose a start and end date."
                    : issue.message;
              }
              setFieldErrors(errors);
              setError("Check the highlighted fields.");
              return;
            }
            setFieldErrors({});
            setError("");
            start(async () => {
              try {
                const result = await saveEntity(kind, payload, form);
                if (!result.ok) {
                  setError(result.error || "Unable to save.");
                  return;
                }
                toast.success("Saved to your workspace");
                setOpen(false);
                router.refresh();
              } catch {
                setError("The connection was interrupted. Try again.");
              }
            });
          }}
        >
          <FieldSet disabled={pending}>
            <FieldLegend className="sr-only">{title} details</FieldLegend>
            <FieldGroup className="entity-field-grid">
              {visible.map((field) => {
                if (kind === "semester" && field.name === "ends_on")
                  return null;
                const range = kind === "semester" && field.name === "starts_on";
                const id = `${formId}-${field.name}`;
                const descriptionId = `${id}-description`;
                const errorId = `${id}-error`;
                const fieldError =
                  fieldErrors[field.name] ||
                  (range ? fieldErrors.ends_on : undefined);
                const help = range
                  ? "Select the first and last day of this semester."
                  : field.help;
                const describedBy =
                  [help ? descriptionId : "", fieldError ? errorId : ""]
                    .filter(Boolean)
                    .join(" ") || undefined;
                const paired =
                  kind === "semester"
                    ? ["name", "academic_year"]
                    : kind === "module"
                      ? ["code", "credits"]
                      : kind === "lecture"
                        ? ["lecture_date", "study_status"]
                        : kind === "profile"
                          ? ["start_year", "expected_completion"]
                          : kind === "resource"
                            ? ["paper_year", "exam_type"]
                            : [];
                const full = range || !paired.includes(field.name);
                if (field.type === "checkbox")
                  return (
                    <Field
                      key={field.name}
                      orientation="horizontal"
                      className="entity-field-full"
                      data-invalid={!!fieldError}
                    >
                      <Checkbox
                        id={id}
                        name={field.name}
                        defaultChecked={Boolean(initial[field.name])}
                        aria-describedby={describedBy}
                        aria-invalid={!!fieldError}
                      />
                      <FieldContent>
                        <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                        {help && (
                          <FieldDescription id={descriptionId}>
                            {help}
                          </FieldDescription>
                        )}
                        {fieldError && (
                          <FieldError id={errorId}>{fieldError}</FieldError>
                        )}
                      </FieldContent>
                    </Field>
                  );
                return (
                  <Field
                    key={field.name}
                    className={full ? "entity-field-full" : undefined}
                    data-invalid={!!fieldError}
                  >
                    <FieldLabel htmlFor={id}>
                      {range ? "Semester dates" : field.label}
                      {!field.required && (
                        <span className="optional">Optional</span>
                      )}
                    </FieldLabel>
                    {range ? (
                      <DateRangePicker
                        id={id}
                        startName="starts_on"
                        endName="ends_on"
                        defaultStart={String(initial.starts_on || "")}
                        defaultEnd={String(initial.ends_on || "")}
                        required
                        disabled={pending}
                        aria-describedby={describedBy}
                        aria-invalid={!!fieldError}
                      />
                    ) : field.type === "date" ? (
                      <DatePicker
                        id={id}
                        name={field.name}
                        defaultValue={String(initial[field.name] || "")}
                        required={field.required}
                        disabled={pending}
                        aria-describedby={describedBy}
                        aria-invalid={!!fieldError}
                      />
                    ) : field.options ? (
                      <SelectControl
                        id={id}
                        name={field.name}
                        defaultValue={String(
                          initial[field.name] ?? field.options[0][0],
                        )}
                        options={field.options.map(([value, label]) => ({
                          value,
                          label,
                        }))}
                        disabled={pending}
                        required={field.required}
                        aria-describedby={describedBy}
                        aria-invalid={!!fieldError}
                      />
                    ) : field.type === "textarea" ? (
                      <Textarea
                        id={id}
                        name={field.name}
                        rows={3}
                        maxLength={500}
                        defaultValue={String(initial[field.name] ?? "")}
                        placeholder={field.placeholder}
                        aria-describedby={describedBy}
                        aria-invalid={!!fieldError}
                      />
                    ) : (
                      <Input
                        id={id}
                        name={field.name}
                        type={field.type || "text"}
                        required={field.required}
                        placeholder={field.placeholder}
                        defaultValue={
                          field.type === "file"
                            ? undefined
                            : String(initial[field.name] ?? "")
                        }
                        min={
                          field.type === "number"
                            ? field.name === "credits"
                              ? "0.01"
                              : "1900"
                            : undefined
                        }
                        max={
                          field.type === "number"
                            ? field.name === "credits"
                              ? "100"
                              : "2200"
                            : undefined
                        }
                        step={field.name === "credits" ? "0.01" : undefined}
                        accept={
                          field.type === "file"
                            ? "image/jpeg,image/png,image/webp"
                            : undefined
                        }
                        maxLength={
                          field.type === "url"
                            ? 2000
                            : field.name === "name"
                              ? 160
                              : 500
                        }
                        aria-describedby={describedBy}
                        aria-invalid={!!fieldError}
                      />
                    )}
                    {help && (
                      <FieldDescription id={descriptionId}>
                        {help}
                      </FieldDescription>
                    )}
                    {fieldError && (
                      <FieldError id={errorId}>{fieldError}</FieldError>
                    )}
                  </Field>
                );
              })}
            </FieldGroup>
          </FieldSet>
          {demo && (
            <FieldDescription className="form-preview-note">
              Sample preview · saving changes is disabled.
            </FieldDescription>
          )}
          {error && <FieldError className="form-error">{error}</FieldError>}
          <DialogFooter className="form-footer">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={pending || demo}
              aria-busy={pending}
              type="submit"
            >
              {pending && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
