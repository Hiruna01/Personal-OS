"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AcademicFolder } from "@/components/academic-folder";
import { Field, FieldLabel } from "@/components/ui/field";
import { SelectControl } from "@/components/select-control";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemGroup } from "@/components/ui/item";
import { LectureChapter } from "./lecture-chapter";
import { EntityDialog } from "@/components/entity-dialog";
import {
  Status,
  EmptyState,
  dateLabel,
  campusPath,
} from "@/components/page-parts";
import { moveLecture, saveEntity } from "@/lib/actions";
import type {
  Lecture,
  Module,
  Semester,
  Resource,
  DocumentSummary,
} from "@/types/domain";
export function SemesterBrowser({
  semesters,
  modules,
  base,
  demo,
}: {
  semesters: Semester[];
  modules: Module[];
  base: string;
  demo: boolean;
}) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const visible = semesters.filter(
    (s) =>
      (filter === "all" || s.status === filter) &&
      `${s.name} ${s.academic_year}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="collection-toolbar">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All semesters</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="planned">Planned</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="search-control">
          <Search size={16} />
          <Input
            aria-label="Search semesters"
            placeholder="Find a semester…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      {visible.length ? (
        <div className="semester-grid">
          {visible.map((s) => {
            const semesterModules = modules.filter(
              (m) => m.semester_id === s.id,
            );
            const href = `${base}${campusPath}/semesters/${s.id}`;
            return (
              <article
                className={`semester-folder ${s.is_current ? "current-folder" : ""}`}
                key={s.id}
              >
                <div className="semester-folder-visual">
                  <AcademicFolder
                    label={s.name}
                    href={href}
                    items={semesterModules.slice(0, 6).map((module) => (
                      <div key={module.id} className="semester-module-page">
                        <span>{module.code}</span>
                        <strong>{module.title}</strong>
                        <small>{module.credits} credits</small>
                      </div>
                    ))}
                    current={s.is_current}
                  />
                </div>
                <div className="semester-folder-details">
                  <Link href={href} className="semester-title-link">
                    <h2>{s.name}</h2>
                    <ArrowRight size={15} />
                  </Link>
                  <p className="semester-module-count">
                    {s.academic_year}
                    <span>·</span>
                    {semesterModules.length}{" "}
                    {semesterModules.length === 1 ? "module" : "modules"}
                  </p>
                  <span className="semester-dates">
                    {dateLabel(s.starts_on, {
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    —{" "}
                    {dateLabel(s.ends_on, { month: "short", year: "numeric" })}
                  </span>
                  <div className="semester-folder-footer">
                    <Status value={s.status} />
                    {s.is_current && (
                      <span className="current-inline">Current</span>
                    )}
                    <EntityDialog
                      kind="semester"
                      initial={s}
                      demo={demo}
                      compact
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={
            query || filter !== "all"
              ? "No matching semesters"
              : "No semesters yet"
          }
          description={
            query || filter !== "all"
              ? "Try another search or status."
              : "Create your first semester, then add its modules and study materials."
          }
          action={
            !(query || filter !== "all") && (
              <EntityDialog kind="semester" demo={demo} />
            )
          }
        />
      )}
    </>
  );
}
export function LectureList({
  lectures,
  module,
  resources,
  documents,
  base,
  demo,
}: {
  lectures: Lecture[];
  module: Module;
  resources: Resource[];
  documents: DocumentSummary[];
  base: string;
  demo: boolean;
}) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(0),
    [pending, start] = useTransition();
  const filtered = lectures.filter(
    (l) =>
      (filter === "all" || l.study_status === filter) &&
      `${l.title} ${l.topic || ""}`.toLowerCase().includes(query.toLowerCase()),
  );
  const visible = filtered.slice(page * 12, (page + 1) * 12);
  function move(id: string, direction: -1 | 1) {
    if (demo || pending) return;
    start(async () => {
      try {
        const r = await moveLecture(id, direction);
        if (!r.ok) toast.error(r.error);
        else
          toast.success(
            direction === -1 ? "Lecture moved up" : "Lecture moved down",
          );
      } catch {
        toast.error("Could not reorder. Try again.");
      }
    });
  }
  return (
    <>
      <div className="lecture-toolbar">
        <div className="search-control">
          <Search size={16} />
          <Input
            aria-label="Search lectures in this module"
            placeholder="Find a lecture…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <Field className="status-filter-field">
          <FieldLabel htmlFor="lecture-status-filter" className="sr-only">
            Filter lectures by study status
          </FieldLabel>
          <SelectControl
            id="lecture-status-filter"
            className="status-filter"
            aria-label="Filter lectures by study status"
            value={filter}
            onValueChange={(next) => {
              setFilter(next);
              setPage(0);
            }}
            options={[
              { value: "all", label: "All study statuses" },
              { value: "not_started", label: "Not started" },
              { value: "studying", label: "Studying" },
              { value: "reviewed", label: "Reviewed" },
            ]}
          />
        </Field>
        <EntityDialog
          kind="lecture"
          initial={{ module_id: module.id }}
          demo={demo}
        />
      </div>
      {visible.length ? (
        <ItemGroup
          className="chapter-list"
          aria-label="Lectures in this module"
        >
          {visible.map((lecture) => {
            const index = lectures.findIndex((item) => item.id === lecture.id);
            const lectureDocs = documents.filter(
              (document) => document.lecture_id === lecture.id,
            );
            return (
              <LectureChapter
                key={lecture.id}
                lecture={lecture}
                index={index}
                total={lectures.length}
                counts={{
                  notes: resources.filter(
                    (resource) =>
                      resource.lecture_id === lecture.id &&
                      resource.kind === "lecture_note",
                  ).length,
                  quizzes: lectureDocs.filter(
                    (document) => document.kind === "quiz",
                  ).length,
                  tutorials: lectureDocs.filter(
                    (document) =>
                      document.kind === "questions" &&
                      document.category === "tutorial",
                  ).length,
                  practicals: lectureDocs.filter(
                    (document) =>
                      document.kind === "questions" &&
                      document.category === "practical",
                  ).length,
                  essays: lectureDocs.filter(
                    (document) =>
                      document.kind === "questions" &&
                      document.category === "essay",
                  ).length,
                }}
                base={base}
                demo={demo}
                pending={pending}
                onMove={move}
              />
            );
          })}
        </ItemGroup>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={
            query || filter !== "all"
              ? "No matching lectures"
              : "Start with your first lecture"
          }
          description={
            query || filter !== "all"
              ? "Try another search or study status."
              : "Give each topic a home for notes, practice, and questions."
          }
          action={
            !query &&
            filter === "all" && (
              <EntityDialog
                kind="lecture"
                initial={{ module_id: module.id }}
                demo={demo}
              />
            )
          }
        />
      )}
      {filtered.length > 12 && (
        <div className="pagination">
          <span>
            {page * 12 + 1}–{Math.min((page + 1) * 12, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft data-icon="inline-start" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(page + 1) * 12 >= filtered.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      )}
    </>
  );
}
export function StudyStatusControl({
  lecture,
  demo,
}: {
  lecture: Lecture;
  demo: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Field orientation="horizontal" className="study-status-control">
      <FieldLabel htmlFor="study-status">Study status</FieldLabel>
      <SelectControl
        id="study-status"
        value={lecture.study_status}
        disabled={demo || pending}
        options={[
          { value: "not_started", label: "Not started" },
          { value: "studying", label: "Studying" },
          { value: "reviewed", label: "Reviewed" },
        ]}
        onValueChange={(study_status) => {
          start(async () => {
            try {
              const result = await saveEntity("lecture", {
                ...lecture,
                study_status,
              });
              if (result.ok) toast.success("Study status updated");
              else toast.error(result.error);
            } catch {
              toast.error("Unable to update study status.");
            }
          });
        }}
      />
    </Field>
  );
}
