import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  BookOpen,
  FolderOpen,
  FileText,
  Download,
  LockKeyhole,
  ExternalLink,
  CalendarDays,
  ChevronRight,
  Library,
  FileQuestion,
  CheckCircle2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { EntityDialog } from "@/components/entity-dialog";
import {
  PageHeader,
  SectionHeader,
  EmptyState,
  Crumbs,
  Status,
  ModuleCollection,
  DocumentList,
  FutureArea,
  basePath,
  campusPath,
  dateLabel,
} from "@/components/page-parts";
import { ResourceList } from "@/components/resource-list";
import {
  SemesterBrowser,
  LectureList,
  StudyStatusControl,
} from "./collections";
import { ImportDialog } from "@/features/study-content/import-dialog";
import { QuizReader } from "@/features/study-content/quiz";
import { Markdown } from "@/features/study-content/markdown";
import { DeleteDocument } from "@/features/study-content/document-actions";
import type {
  ContextData,
  Module,
  Lecture,
  StudyDocument,
} from "@/types/domain";
function campusCrumbs(data: ContextData) {
  const base = basePath(data);
  return [
    { label: "Education", href: `${base}/education` },
    { label: "Campus", href: `${base}${campusPath}` },
  ];
}
function moduleCrumbs(data: ContextData, module: Module) {
  const base = basePath(data);
  const semester = data.semesters.find((s) => s.id === module.semester_id);
  return [
    ...campusCrumbs(data),
    {
      label: semester?.name || "Semester",
      href: `${base}${campusPath}/semesters/${module.semester_id}`,
    },
    { label: module.code, href: `${base}${campusPath}/modules/${module.id}` },
  ];
}
function CampusHome({
  data,
  osHome = false,
}: {
  data: ContextData;
  osHome?: boolean;
}) {
  const base = basePath(data),
    current = data.semesters.find((s) => s.is_current),
    modules = data.modules.filter((m) => m.semester_id === current?.id),
    studying = data.lectures.filter(
      (l) =>
        l.study_status === "studying" &&
        modules.some((m) => m.id === l.module_id),
    );
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: data.workspace.timezone,
  }).format(new Date());
  return (
    <>
      <PageHeader
        eyebrow={osHome ? "YOUR PERSONAL WORKSPACE" : "EDUCATION / CAMPUS"}
        title={osHome ? "Home" : "Campus"}
        description={
          osHome
            ? "Your current semester and study materials."
            : "Manage your semesters, modules, and study materials."
        }
        actions={
          <span className="today-label">
            <CalendarDays size={15} />
            {date}
          </span>
        }
      />
      {current ? (
        <section className="current-semester-panel">
          <div className="current-semester-icon">
            <GraduationCap size={30} strokeWidth={1.3} />
          </div>
          <div className="current-semester-copy">
            <div className="eyebrow">
              <span className="accent-dot" />
              CURRENT SEMESTER
            </div>
            <h2>{current.name}</h2>
            <p>
              {current.academic_year} <span>·</span>{" "}
              {dateLabel(current.starts_on, {
                month: "short",
                year: "numeric",
              })}{" "}
              —{" "}
              {dateLabel(current.ends_on, { month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="current-semester-meta">
            <span>
              <strong>{modules.length}</strong> modules
            </span>
            <span>
              <strong>
                {modules.reduce((n, m) => n + Number(m.credits), 0)}
              </strong>{" "}
              credits
            </span>
          </div>
          <Link
            href={`${base}${campusPath}/semesters/${current.id}`}
            data-slot="button"
            className={buttonVariants({ variant: "outline" })}
          >
            Open semester
            <ArrowRight data-icon="inline-end" />
          </Link>
        </section>
      ) : (
        <div className="current-empty">
          <GraduationCap size={28} />
          <div>
            <h2>No current semester</h2>
            <p>
              Create a semester and set it as current to bring your study space
              together.
            </p>
          </div>
          <EntityDialog kind="semester" demo={data.demo} />
        </div>
      )}
      <div className="campus-home-grid">
        <section>
          <SectionHeader
            title={osHome ? "Your Campus" : "Current modules"}
            count={modules.length}
            action={
              <Link
                className="text-link"
                href={`${base}${campusPath}/semesters`}
              >
                All semesters
                <ArrowUpRight size={14} />
              </Link>
            }
          />
          {modules.length ? (
            <ModuleCollection modules={modules} data={data} />
          ) : (
            <EmptyState
              title="No modules yet"
              description="Your modules and their study progress will appear here."
              action={
                current ? (
                  <EntityDialog
                    kind="module"
                    initial={{ semester_id: current.id }}
                    demo={data.demo}
                  />
                ) : (
                  <Link
                    href={`${base}${campusPath}/semesters`}
                    data-slot="button"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Browse semesters
                  </Link>
                )
              }
            />
          )}
        </section>
        <aside className="continuation-panel">
          <SectionHeader title="Continue studying" />
          {studying.length ? (
            <div className="continuation-list">
              {studying.slice(0, 4).map((l) => (
                <Link key={l.id} href={`${base}${campusPath}/lectures/${l.id}`}>
                  <span className="continuation-icon">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <span className="eyebrow">
                      {modules.find((m) => m.id === l.module_id)?.code}
                    </span>
                    <strong>{l.title}</strong>
                    <span className="continuation-status">
                      <span />
                      Studying
                    </span>
                  </div>
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="continuation-empty">
              <BookOpen size={21} />
              <h3>Nothing in progress</h3>
              <p>Set a lecture to Studying to keep it close at hand.</p>
            </div>
          )}
          <div className="study-tip">
            <FileText size={19} />
            <h3>Study templates</h3>
            <p>
              Link your original notes, then add quizzes and question documents
              alongside them.
            </p>
            <Link href={`${base}/templates`} className="text-link">
              Browse templates
              <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
      <section className="home-bottom">
        <div>
          <span className="eyebrow">ACADEMIC PROFILE</span>
          <h3>{data.profile?.programme || "Academic profile"}</h3>
          <p>
            {data.profile?.university ||
              "Add your university and programme to your academic profile."}
          </p>
        </div>
        <Link
          href={`${base}${campusPath}/profile`}
          data-slot="button"
          className={buttonVariants({ variant: "outline" })}
        >
          Academic profile
          <ArrowUpRight data-icon="inline-end" />
        </Link>
      </section>
      {osHome && (
        <section className="future-strip">
          <h2>Future areas</h2>
          <Link href={`${base}/personal`}>
            Personal <span>Future area</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link href={`${base}/business`}>
            Business <span>Future area</span>
            <ArrowUpRight size={14} />
          </Link>
        </section>
      )}
    </>
  );
}
function Semesters({ data }: { data: ContextData }) {
  const base = basePath(data);
  return (
    <>
      <Crumbs items={[...campusCrumbs(data), { label: "Semesters" }]} />
      <PageHeader
        title="Semesters"
        description="Organise modules and materials by academic semester."
        actions={<EntityDialog kind="semester" demo={data.demo} />}
      />
      <SemesterBrowser
        semesters={data.semesters}
        modules={data.modules}
        base={base}
        demo={data.demo}
      />
      <p className="collection-footnote">
        <LockKeyhole size={12} />
        Your study materials are private to your workspace.
      </p>
    </>
  );
}
function SemesterDetail({ data, id }: { data: ContextData; id: string }) {
  const semester = data.semesters.find((s) => s.id === id);
  if (!semester) notFound();
  const base = basePath(data),
    modules = data.modules.filter((m) => m.semester_id === id);
  return (
    <>
      <Crumbs
        items={[
          ...campusCrumbs(data),
          { label: "Semesters", href: `${base}${campusPath}/semesters` },
          { label: semester.name },
        ]}
      />
      <PageHeader
        eyebrow={semester.academic_year}
        title={semester.name}
        description={`${dateLabel(semester.starts_on)} — ${dateLabel(semester.ends_on)}`}
        actions={
          <>
            <EntityDialog kind="semester" initial={semester} demo={data.demo} />
            <EntityDialog
              kind="module"
              initial={{ semester_id: id }}
              demo={data.demo}
            />
          </>
        }
      />
      <div className="semester-info-line">
        <Status value={semester.status} />
        {semester.is_current && (
          <span className="current-inline">
            <span className="accent-dot" />
            Current semester
          </span>
        )}
        <span>{modules.length} modules</span>
        <span>
          {modules.reduce((sum, m) => sum + Number(m.credits), 0)} credits
        </span>
      </div>
      <SectionHeader title="Modules" count={modules.length} />
      {modules.length ? (
        <ModuleCollection modules={modules} data={data} />
      ) : (
        <EmptyState
          title="No modules yet"
          description="Add a module to start building your study collection."
          action={
            <EntityDialog
              kind="module"
              initial={{ semester_id: id }}
              demo={data.demo}
            />
          }
        />
      )}
    </>
  );
}
function ModuleDetail({ data, id }: { data: ContextData; id: string }) {
  const module = data.modules.find((m) => m.id === id);
  if (!module) notFound();
  const base = basePath(data),
    lectures = data.lectures
      .filter((l) => l.module_id === id)
      .sort((a, b) => a.position - b.position),
    examDocs = data.documents.filter(
      (d) => d.module_id === id && !d.lecture_id && !d.project_id,
    ),
    papers = data.resources.filter(
      (r) => r.module_id === id && r.kind !== "lecture_note",
    ),
    projects = data.projects.filter((p) => p.module_id === id),
    reviewed = lectures.filter((l) => l.study_status === "reviewed").length;
  return (
    <>
      <Crumbs
        items={moduleCrumbs(data, module).map((c, i, a) =>
          i === a.length - 1 ? { label: c.label } : c,
        )}
      />
      <PageHeader
        eyebrow={`${module.code} · ${module.credits} CREDITS`}
        title={module.title}
        description={
          module.lecturer
            ? `Lecturer · ${module.lecturer}${module.contact ? ` · ${module.contact}` : ""}`
            : "Your lectures and study materials, all in one place."
        }
        actions={
          <EntityDialog kind="module" initial={module} demo={data.demo} />
        }
      />
      <div className="module-progress-line">
        <BookOpen size={16} />
        <span>
          <strong>{reviewed}</strong> of {lectures.length} lectures reviewed
        </span>
        <div className="progress-track">
          <span
            style={{
              width: `${lectures.length ? (reviewed / lectures.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <Tabs defaultValue="lectures" className="workspace-tabs module-workspace">
        <TabsList className="section-tabs" variant="line">
          <TabsTrigger value="lectures">
            Lectures <span>{lectures.length}</span>
          </TabsTrigger>
          <TabsTrigger value="exam">Exam preparation</TabsTrigger>
          <TabsTrigger value="briefs">Project briefs</TabsTrigger>
        </TabsList>
        <TabsContent value="lectures">
          <LectureList
            lectures={lectures}
            module={module}
            resources={data.resources.filter(
              (resource) => resource.module_id === id,
            )}
            documents={data.documents.filter(
              (document) => document.module_id === id,
            )}
            base={base}
            demo={data.demo}
          />
        </TabsContent>
        <TabsContent value="exam">
          <SectionHeader
            title="Papers & solutions"
            action={
              <EntityDialog
                kind="resource"
                label="Add paper link"
                initial={{
                  module_id: id,
                  lecture_id: null,
                  kind: "exam_paper",
                }}
                demo={data.demo}
              />
            }
          />
          {papers.length ? (
            <ResourceList resources={papers} demo={data.demo} />
          ) : (
            <EmptyState
              title="No papers or solutions yet"
              description="Add external links to papers and solutions for this module."
              icon={FileText}
            />
          )}
          <section className="material-section">
            <SectionHeader
              title="Practice quizzes"
              action={
                <ImportDialog kind="quiz" moduleId={id} demo={data.demo} />
              }
            />
            {examDocs.some((d) => d.kind === "quiz") ? (
              <DocumentList
                documents={examDocs.filter((d) => d.kind === "quiz")}
                base={base}
              />
            ) : (
              <EmptyState
                title="No quizzes yet"
                description="Upload a quiz with answers and explanations for self-checking."
                icon={FileQuestion}
              />
            )}
          </section>
          <section className="material-section">
            <SectionHeader
              title="Exam questions"
              action={
                <ImportDialog kind="questions" moduleId={id} demo={data.demo} />
              }
            />
            {examDocs.some((d) => d.kind === "questions") ? (
              <DocumentList
                documents={examDocs.filter((d) => d.kind === "questions")}
                base={base}
              />
            ) : (
              <EmptyState
                title="No exam questions yet"
                description="Upload an ordinary Markdown exam question document."
                icon={FileText}
              />
            )}
          </section>
        </TabsContent>
        <TabsContent value="briefs">
          <SectionHeader
            title="Project briefs"
            action={
              <EntityDialog
                kind="project"
                label="New project"
                initial={{ module_id: id }}
                demo={data.demo}
              />
            }
          />
          <p className="section-description">
            A simple home for project instructions and reference briefs.
          </p>
          {projects.length ? (
            <div className="project-brief-list">
              {projects.map((project) => (
                <section key={project.id}>
                  <div className="project-brief-heading">
                    <span className="resource-icon">
                      <FolderOpen size={20} />
                    </span>
                    <h3>{project.title}</h3>
                    <EntityDialog
                      kind="project"
                      initial={project}
                      demo={data.demo}
                      compact
                    />
                    <ImportDialog
                      kind="project_brief"
                      moduleId={id}
                      projectId={project.id}
                      demo={data.demo}
                    />
                  </div>
                  {data.documents.some((d) => d.project_id === project.id) ? (
                    <DocumentList
                      documents={data.documents.filter(
                        (d) => d.project_id === project.id,
                      )}
                      base={base}
                    />
                  ) : (
                    <p className="project-brief-empty">
                      Upload a Markdown brief to start reading.
                    </p>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No project briefs yet"
              description="Create a project title, then upload its Markdown brief."
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
function LectureDetail({ data, id }: { data: ContextData; id: string }) {
  const lecture = data.lectures.find((l) => l.id === id);
  if (!lecture) notFound();
  const module = data.modules.find((m) => m.id === lecture.module_id);
  if (!module) notFound();
  const base = basePath(data),
    notes = data.resources.filter((r) => r.lecture_id === id),
    documents = data.documents.filter((d) => d.lecture_id === id);
  return (
    <>
      <Crumbs
        items={[...moduleCrumbs(data, module), { label: lecture.title }]}
      />
      <PageHeader
        eyebrow={`${module.code} · LECTURE ${String(data.lectures.filter((l) => l.module_id === module.id).findIndex((l) => l.id === id) + 1).padStart(2, "0")}`}
        title={lecture.title}
        description={
          lecture.topic ||
          "Your notes, practice, and questions for this lecture."
        }
        actions={
          <EntityDialog kind="lecture" initial={lecture} demo={data.demo} />
        }
      />
      <div className="lecture-detail-meta">
        <StudyStatusControl lecture={lecture} demo={data.demo} />
        {lecture.lecture_date && (
          <span>
            <CalendarDays size={14} />
            {dateLabel(lecture.lecture_date)}
          </span>
        )}
        <p>Study status is always your choice.</p>
      </div>
      <Tabs defaultValue="notes" className="workspace-tabs">
        <TabsList className="section-tabs" variant="line">
          <TabsTrigger value="notes">
            Notes <span>{notes.length}</span>
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            Quizzes{" "}
            <span>{documents.filter((d) => d.kind === "quiz").length}</span>
          </TabsTrigger>
          <TabsTrigger value="questions">
            Questions{" "}
            <span>
              {documents.filter((d) => d.kind === "questions").length}
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notes">
          <SectionHeader
            title="Lecture notes"
            action={
              <EntityDialog
                kind="resource"
                label="Add note link"
                initial={{
                  module_id: module.id,
                  lecture_id: id,
                  kind: "lecture_note",
                }}
                demo={data.demo}
              />
            }
          />
          <p className="section-description">
            Original documents stay with their host. Keep the links you need
            here.
          </p>
          {notes.length ? (
            <ResourceList resources={notes} demo={data.demo} notes />
          ) : (
            <EmptyState
              title="No note links yet"
              description="Add a link to your lecture slides, reading, or notes, with an optional thumbnail."
              icon={ExternalLink}
            />
          )}
        </TabsContent>
        <TabsContent value="quizzes">
          <SectionHeader
            title="Practice quizzes"
            action={
              <ImportDialog
                kind="quiz"
                moduleId={module.id}
                lectureId={id}
                demo={data.demo}
              />
            }
          />
          <p className="section-description">
            Select an option if you like, then reveal the answer when you’re
            ready.
          </p>
          {documents.some((d) => d.kind === "quiz") ? (
            <DocumentList
              documents={documents.filter((d) => d.kind === "quiz")}
              base={base}
            />
          ) : (
            <EmptyState
              title="No quizzes yet"
              description="Upload a single-answer, written, or multiple-answer Markdown quiz to begin."
              icon={FileQuestion}
            />
          )}
        </TabsContent>
        <TabsContent value="questions">
          <SectionHeader
            title="Question documents"
            action={
              <ImportDialog
                kind="questions"
                moduleId={module.id}
                lectureId={id}
                demo={data.demo}
              />
            }
          />
          <p className="section-description">
            Tutorials, practicals, and essays — read in the order they were
            written.
          </p>
          {documents.some((d) => d.kind === "questions") ? (
            <div className="question-categories">
              {(["tutorial", "practical", "essay"] as const).map((category) => {
                const docs = documents.filter((d) => d.category === category);
                return docs.length ? (
                  <section key={category}>
                    <h3>{category[0].toUpperCase() + category.slice(1)}</h3>
                    <DocumentList documents={docs} base={base} />
                  </section>
                ) : null;
              })}
            </div>
          ) : (
            <EmptyState
              title="No question documents yet"
              description="Upload an ordinary Markdown question document and choose its category."
              icon={FileText}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
function DocumentPage({ data }: { data: ContextData }) {
  const document = data.document;
  if (!document) notFound();
  const module = data.modules.find((m) => m.id === document.module_id);
  if (!module) notFound();
  const base = basePath(data),
    lecture = data.lectures.find((l) => l.id === document.lecture_id),
    parent = lecture
      ? `${base}${campusPath}/lectures/${lecture.id}`
      : `${base}${campusPath}/modules/${module.id}`;
  const crumbs = [
    ...moduleCrumbs(data, module),
    ...(lecture ? [{ label: lecture.title, href: parent }] : []),
    {
      label:
        document.kind === "quiz"
          ? "Quiz"
          : document.kind === "project_brief"
            ? "Project brief"
            : document.category || "Questions",
    },
  ];
  return (
    <>
      <Crumbs items={crumbs} />
      <div className="document-toolbar">
        <Link href={parent} className="text-link">
          <BookOpen size={15} />
          {lecture ? "Back to lecture" : "Back to module"}
        </Link>
        <div>
          <span className="document-revision">
            Revision {document.revision}
          </span>
          <ImportDialog
            kind={document.kind}
            moduleId={module.id}
            lectureId={document.lecture_id ?? undefined}
            projectId={document.project_id ?? undefined}
            document={document}
            demo={data.demo}
          />
          <DeleteDocument
            id={document.id}
            revision={document.revision}
            parent={parent}
            demo={data.demo}
          />
        </div>
      </div>
      <article
        className={`reading-surface ${document.kind === "quiz" ? "quiz-reading-surface" : ""}`}
      >
        <header className="reading-header">
          <div className="eyebrow">
            {document.kind === "quiz"
              ? "SELF-STUDY QUIZ"
              : document.kind === "project_brief"
                ? "PROJECT BRIEF"
                : `${document.category?.toUpperCase()} QUESTIONS`}
          </div>
          {(document.kind === "quiz" ||
            !document.source_markdown.trimStart().startsWith("# ")) && (
            <h1>{document.title}</h1>
          )}
          {document.kind === "quiz" && (
            <p>
              {document.quiz_json?.questions.length} questions <span>·</span>{" "}
              {document.quiz_json?.questions.some(
                (question) => question.type === "multiple_response",
              )
                ? "Select, check, and explore the explanations."
                : "Take your time. Reveal answers as you go."}
            </p>
          )}
        </header>
        {document.kind === "quiz" && document.quiz_json ? (
          <QuizReader
            key={`${document.id}-${document.revision}`}
            quiz={document.quiz_json}
          />
        ) : (
          <div className="document-body">
            <Markdown source={document.source_markdown} />
          </div>
        )}
        <footer className="reading-footer">
          <CheckCircle2 size={14} />
          {document.kind === "quiz"
            ? "Selections and reveals stay on this page. Reload to start fresh."
            : "Rendered from your original Markdown."}
        </footer>
      </article>
    </>
  );
}
function Profile({ data }: { data: ContextData }) {
  const p = data.profile;
  return (
    <>
      <Crumbs items={[...campusCrumbs(data), { label: "Academic profile" }]} />
      <PageHeader
        title="Academic profile"
        description="Your university, programme, and study dates."
        actions={
          <EntityDialog
            kind="profile"
            initial={p ?? {}}
            label={p ? "Edit profile" : "Set up profile"}
            demo={data.demo}
          />
        }
      />
      {p ? (
        <section className="profile-panel">
          <div className="profile-heading">
            <span className="profile-icon">
              <GraduationCap size={32} strokeWidth={1.3} />
            </span>
            <div>
              <span className="eyebrow">ACADEMIC PROFILE</span>
              <h2>{p.university}</h2>
              <p>{p.programme}</p>
            </div>
          </div>
          <Separator />
          <dl className="details-list">
            <div>
              <dt>Programme</dt>
              <dd>{p.programme}</dd>
            </div>
            <div>
              <dt>Start year</dt>
              <dd>{p.start_year}</dd>
            </div>
            <div>
              <dt>Expected completion</dt>
              <dd>
                {p.expected_completion
                  ? dateLabel(p.expected_completion)
                  : "Not set"}
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <EmptyState
          title="Set up your academic profile"
          description="Add your university, programme, and start year to personalise your Campus."
          icon={GraduationCap}
          action={
            <EntityDialog
              kind="profile"
              label="Set up profile"
              demo={data.demo}
            />
          }
        />
      )}
    </>
  );
}
function Settings({ data }: { data: ContextData }) {
  return (
    <>
      <PageHeader
        eyebrow="YOUR WORKSPACE"
        title="Settings"
        description="Manage your workspace and account."
      />
      <section className="settings-section">
        <div className="settings-section-heading">
          <div>
            <h2>Workspace</h2>
            <p>Your name and local timezone.</p>
          </div>
          <EntityDialog
            kind="workspace"
            initial={data.workspace}
            label="Edit workspace"
            demo={data.demo}
          />
        </div>
        <dl className="details-list">
          <div>
            <dt>Name</dt>
            <dd>{data.workspace.name}</dd>
          </div>
          <div>
            <dt>Timezone</dt>
            <dd>{data.workspace.timezone}</dd>
          </div>
        </dl>
      </section>
      <section className="settings-section">
        <div className="settings-section-heading">
          <div>
            <h2>Privacy and access</h2>
            <p>One owner. One workspace.</p>
          </div>
          <LockKeyhole size={20} />
        </div>
        <p className="settings-note">
          Your study materials and uploaded thumbnails are available only to
          your authenticated owner account.
        </p>
        <Link
          href="/login"
          data-slot="button"
          className={buttonVariants({ variant: "outline" })}
        >
          Manage sign-in
          <ArrowUpRight data-icon="inline-end" />
        </Link>
      </section>
      <section className="settings-section">
        <h2>Private Study Hub</h2>
        <p className="settings-note">Personal OS · Phase 3 · version 0.3.0</p>
        <p className="settings-note">
          Campus is ready for semesters, modules, lectures, and Markdown study
          content. Personal, Business, and Self Learning are future areas.
        </p>
      </section>
    </>
  );
}
function Templates() {
  const templates = [
    {
      file: "quiz",
      title: "Self-study quiz",
      kind: "campus-quiz-v1",
      description:
        "Multiple choice and written questions, with an answer and explanation for each.",
      icon: FileQuestion,
    },
    {
      file: "quiz-multiple-response",
      title: "Multiple-answer quiz",
      kind: "Separate questions and explanations",
      description:
        "Select all correct options, check your choices, then read the explanation. Matches the exam-paper layout with a separate answer key.",
      icon: FileQuestion,
    },
    {
      file: "tutorial",
      title: "Tutorial questions",
      kind: "Ordinary Markdown",
      description:
        "Numbered questions, tables, code examples, and mathematical notation.",
      icon: FileText,
    },
    {
      file: "practical",
      title: "Practical exercises",
      kind: "Ordinary Markdown",
      description: "Objectives, instructions, and code for hands-on work.",
      icon: FileText,
    },
    {
      file: "essay",
      title: "Essay questions",
      kind: "Ordinary Markdown",
      description: "A prompt, suggested structure, and room for reflection.",
      icon: FileText,
    },
    {
      file: "exam-questions",
      title: "Exam questions",
      kind: "Ordinary Markdown",
      description:
        "Module-level revision material, with answers wherever you place them.",
      icon: FileText,
    },
    {
      file: "project-brief",
      title: "Project brief",
      kind: "Ordinary Markdown",
      description: "A clear project overview, outcomes, and deliverables.",
      icon: FolderOpen,
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="STUDY MATERIALS"
        title="Templates"
        description="Download an example, make it yours, then upload it from a lecture or module."
      />
      <div className="template-intro">
        <FileText size={21} />
        <p>
          Every import starts with a <strong>.md file</strong>. Quizzes use a
          structured template; other documents are ordinary Markdown. Preview
          every file before saving.
        </p>
      </div>
      <div className="templates-list">
        {templates.map((t) => (
          <article key={t.file}>
            <span className="resource-icon">
              <t.icon size={23} strokeWidth={1.5} />
            </span>
            <div>
              <h2>{t.title}</h2>
              <p>{t.description}</p>
              <span className="template-format">{t.kind}</span>
            </div>
            <a
              href={`/examples/${t.file}.md`}
              download
              data-slot="button"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Download data-icon="inline-start" />
              Download<span className="sr-only"> {t.title} example</span>
            </a>
          </article>
        ))}
      </div>
      <p className="collection-footnote">
        UTF-8 Markdown · up to 1 MiB per file · quizzes up to 100 questions
      </p>
    </>
  );
}
export function WorkspaceContent({
  data,
  path,
}: {
  data: ContextData;
  path: string[];
}) {
  const base = basePath(data);
  const route = path.join("/");
  if (!route) return <CampusHome data={data} osHome />;
  if (route === "education/campus") return <CampusHome data={data} />;
  if (route === "education/campus/semesters") return <Semesters data={data} />;
  if (route === "education/campus/profile") return <Profile data={data} />;
  if (route === "settings") return <Settings data={data} />;
  if (route === "templates") return <Templates />;
  if (
    route === "personal" ||
    route === "business" ||
    route === "education/self-learning"
  )
    return (
      <FutureArea
        title={
          route === "personal"
            ? "Personal"
            : route === "business"
              ? "Business"
              : "Self Learning"
        }
        base={base}
        description={
          route === "personal"
            ? "A future home for your personal projects and everyday life. For now, your study materials have a home in Campus."
            : route === "business"
              ? "A future home for the work you build. Your academic workspace is ready in Campus."
              : "A future home for courses, learning paths, and the subjects you explore on your own."
        }
      />
    );
  if (route === "education")
    return (
      <>
        <PageHeader
          eyebrow="YOUR WORKSPACE"
          title="Education"
          description="Your academic workspace and future learning areas."
        />
        <div className="education-areas">
          <Link href={`${base}${campusPath}`}>
            <GraduationCap size={32} strokeWidth={1.4} />
            <div>
              <span className="eyebrow">YOUR ACADEMIC WORKSPACE</span>
              <h2>Campus</h2>
              <p>
                Semesters, lectures, and the materials that bring it all
                together.
              </p>
            </div>
            <ArrowUpRight size={20} />
          </Link>
          <Link href={`${base}/education/self-learning`}>
            <Library size={30} strokeWidth={1.4} />
            <div>
              <span className="eyebrow">A FUTURE AREA</span>
              <h2>Self Learning</h2>
              <p>Independent courses and learning paths. Coming later.</p>
            </div>
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </>
    );
  if (path.length === 4 && path[0] === "education" && path[1] === "campus") {
    if (path[2] === "semesters")
      return <SemesterDetail data={data} id={path[3]} />;
    if (path[2] === "modules") return <ModuleDetail data={data} id={path[3]} />;
    if (path[2] === "lectures")
      return <LectureDetail data={data} id={path[3]} />;
  }
  if (path.length === 2 && path[0] === "documents")
    return <DocumentPage data={data} />;
  notFound();
}
