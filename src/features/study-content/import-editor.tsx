"use client";
import {
  useEffect,
  useRef,
  useState,
  type TransitionStartFunction,
} from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  CheckCircle2,
  Loader2,
  Download,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DialogFooter } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { SelectControl } from "@/components/select-control";
import { Textarea } from "@/components/ui/textarea";
import {
  normalizeSource,
  parseQuiz,
  inspectMarkdown,
  MAX_MARKDOWN_BYTES,
} from "@/lib/markdown/parser";
import { saveDocument } from "@/lib/actions";
import type { Quiz, StudyDocument } from "@/types/domain";
import { Markdown } from "./markdown";
import { QuizReader } from "./quiz";
import type { ImportDialogProps } from "./import-dialog";

type Props = Pick<
  ImportDialogProps,
  "moduleId" | "lectureId" | "projectId" | "kind" | "document" | "demo"
> & {
  open: boolean;
  setOpen: (open: boolean) => void;
  pending: boolean;
  start: TransitionStartFunction;
};
export function ImportEditor({
  moduleId,
  lectureId,
  projectId,
  kind,
  document,
  demo,
  open,
  setOpen,
  pending,
  start,
}: Props) {
  const [source, setSource] = useState(document?.source_markdown || ""),
    [title, setTitle] = useState(document?.title || ""),
    [category, setCategory] = useState(
      document?.category ?? (lectureId ? "tutorial" : "exam"),
    ),
    [filename, setFilename] = useState(document?.original_filename || ""),
    [error, setError] = useState(""),
    [warnings, setWarnings] = useState<string[]>([]),
    [preview, setPreview] = useState<{
      quiz: Quiz | null;
      source: string;
    } | null>(null),
    [tab, setTab] = useState("source"),
    [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const previewTab = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (preview) previewTab.current?.focus();
  }, [preview]);
  const router = useRouter();
  const noun =
    kind === "quiz"
      ? "quiz"
      : kind === "questions"
        ? "questions"
        : "project brief";
  const template =
    kind === "quiz"
      ? "quiz"
      : kind === "project_brief"
        ? "project-brief"
        : lectureId
          ? category
          : "exam-questions";
  async function readFile(file?: File) {
    setError("");
    setPreview(null);
    setTab("source");
    if (!file) return;
    if (!/\.md$/i.test(file.name)) {
      setError("Choose a .md Markdown file.");
      return;
    }
    if (file.size > MAX_MARKDOWN_BYTES) {
      setError("The file is too large. Markdown files can be up to 1 MiB.");
      return;
    }
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(
        await file.arrayBuffer(),
      );
      setSource(normalizeSource(text));
      setFilename(file.name);
      if (!document)
        setTitle(file.name.replace(/\.md$/i, "").replaceAll(/[-_]/g, " "));
    } catch (e) {
      setError(
        e instanceof Error && e.name === "ImportError"
          ? e.message
          : "This is not a valid UTF-8 text file. Save it as UTF-8 and try again.",
      );
    }
  }
  function review() {
    setError("");
    try {
      const normalized = normalizeSource(source);
      const quiz = kind === "quiz" ? parseQuiz(normalized) : null;
      if (!quiz && !title.trim())
        throw new Error("Enter a document title before previewing.");
      if (quiz) setTitle(quiz.title);
      setWarnings(inspectMarkdown(normalized));
      setPreview({ quiz, source: normalized });
      setTab("preview");
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Unable to preview this file.");
    }
  }
  useEffect(() => {
    if (!open) return;
    setSource(document?.source_markdown || "");
    setTitle(document?.title || "");
    setFilename(document?.original_filename || "");
    setCategory(document?.category ?? (lectureId ? "tutorial" : "exam"));
    setError("");
    setWarnings([]);
    setPreview(null);
    setTab("source");
  }, [open, document, lectureId]);
  return (
    <>
      <div className="import-body">
        <div className="import-context">
          <span>
            <FileText size={16} />
            {lectureId
              ? "Lecture material"
              : projectId
                ? "Project brief"
                : "Exam preparation"}
          </span>
          <a
            href={`/examples/${template}.md`}
            download
            className={buttonVariants({ variant: "ghost", size: "xs" })}
          >
            <Download data-icon="inline-start" />
            {kind === "quiz" ? "Single-answer template" : "Download template"}
          </a>
        </div>
        {kind === "quiz" && (
          <div className="import-quiz-template">
            <span>Select several answers, check, then continue.</span>
            <a
              href="/examples/quiz-multiple-response.md"
              download
              className={buttonVariants({ variant: "outline", size: "xs" })}
            >
              <Download data-icon="inline-start" />
              Multiple-answer template
            </a>
          </div>
        )}
        <div
          className={`upload-zone ${drag ? "is-dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void readFile(e.dataTransfer.files[0]);
          }}
        >
          <Upload size={22} />
          <p>{filename || "Drop your Markdown file here"}</p>
          <FieldDescription>.md files · UTF-8 · up to 1 MiB</FieldDescription>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => input.current?.click()}
            disabled={pending}
          >
            {filename ? "Replace file" : "Choose file"}
          </Button>
          <input
            ref={input}
            type="file"
            accept=".md,text/markdown"
            className="sr-only"
            aria-label={`Choose ${noun} Markdown file`}
            onChange={(e) => {
              void readFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <FieldSet disabled={pending}>
          <FieldLegend className="sr-only">Document details</FieldLegend>
          <FieldGroup className="import-metadata">
            <Field>
              <FieldLabel htmlFor="document-title">Document title</FieldLabel>
              <Input
                id="document-title"
                maxLength={200}
                value={title}
                disabled={pending || kind === "quiz"}
                placeholder={
                  kind === "quiz"
                    ? "Read from the quiz heading"
                    : "A clear, descriptive title"
                }
                onChange={(e) => {
                  setTitle(e.target.value);
                  setPreview(null);
                }}
              />
            </Field>
            {kind === "questions" && lectureId && (
              <Field>
                <FieldLabel htmlFor="document-category">Category</FieldLabel>
                <SelectControl
                  id="document-category"
                  value={category}
                  options={[
                    { value: "tutorial", label: "Tutorial" },
                    { value: "practical", label: "Practical" },
                    { value: "essay", label: "Essay" },
                  ]}
                  disabled={pending}
                  onValueChange={(next) => {
                    setCategory(next as typeof category);
                    setPreview(null);
                  }}
                />
              </Field>
            )}
          </FieldGroup>
        </FieldSet>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="source">Markdown source</TabsTrigger>
            <TabsTrigger ref={previewTab} value="preview" disabled={!preview}>
              Preview {preview && <CheckCircle2 size={14} />}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="source">
            <Field>
              <FieldLabel htmlFor="markdown-source" className="sr-only">
                Markdown source
              </FieldLabel>
              <Textarea
                id="markdown-source"
                className="source-editor"
                aria-describedby="markdown-source-description"
                spellCheck={false}
                value={source}
                disabled={pending}
                placeholder="Upload a file or paste your Markdown here…"
                onChange={(e) => {
                  setSource(e.target.value);
                  setPreview(null);
                  setError("");
                }}
              />
              <FieldDescription id="markdown-source-description">
                Paste your Markdown here or choose a file above, then review the
                preview.
              </FieldDescription>
            </Field>
          </TabsContent>
          <TabsContent value="preview">
            <div className="import-preview">
              {preview?.quiz ? (
                <>
                  <p className="validation-success">
                    <CheckCircle2 size={16} />
                    {preview.quiz.questions.length}{" "}
                    {preview.quiz.questions.length === 1
                      ? "question"
                      : "questions"}{" "}
                    validated · original order preserved
                  </p>
                  <QuizReader key={preview.source} quiz={preview.quiz} />
                </>
              ) : (
                preview && <Markdown source={preview.source} />
              )}
            </div>
          </TabsContent>
        </Tabs>
        {warnings.length > 0 && (
          <div className="import-warnings">
            {warnings.map((w) => (
              <p key={w}>
                <AlertCircle size={15} />
                {w}
              </p>
            ))}
          </div>
        )}
      </div>
      <DialogFooter className="import-footer">
        {error && <FieldError className="form-error">{error}</FieldError>}

        <p>
          {demo
            ? "Sample preview · saving is disabled."
            : preview
              ? "Validated and ready to save."
              : "Preview your document before saving."}
        </p>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        {preview ? (
          <Button
            disabled={pending || demo}
            aria-busy={pending}
            onClick={() =>
              start(async () => {
                try {
                  const result = await saveDocument({
                    id: document?.id,
                    module_id: moduleId,
                    lecture_id: lectureId ?? null,
                    project_id: projectId ?? null,
                    kind,
                    category: kind === "questions" ? category : null,
                    title,
                    source_markdown: preview.source,
                    original_filename: filename || null,
                    revision: document?.revision,
                  });
                  if (!result.ok) {
                    setError(result.error || "Unable to save.");
                    return;
                  }
                  setOpen(false);
                  toast.success(
                    document ? "Document updated" : "Study material added",
                  );
                  router.push(`/app/documents/${result.id}`);
                  router.refresh();
                } catch {
                  setError(
                    "The connection was interrupted. Your existing document is unchanged. Try again.",
                  );
                }
              })
            }
          >
            {pending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <CheckCircle2 data-icon="inline-start" />
            )}
            {pending ? "Saving…" : "Save document"}
          </Button>
        ) : (
          <Button disabled={!source.trim() || pending} onClick={review}>
            Review import
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
