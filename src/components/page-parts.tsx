import Link from "next/link";
import { Fragment } from "react";
import {
  FolderOpen,
  ArrowUpRight,
  FileQuestion,
  FileText,
  ChevronRight,
  Library,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { buttonVariants } from "@/components/ui/button";
import { AcademicFolder } from "@/components/academic-folder";
import type { ContextData, Module, DocumentSummary } from "@/types/domain";
export const campusPath = "/education/campus";
export function basePath(data: Pick<ContextData, "demo">) {
  return data.demo ? "/preview" : "/app";
}
export function Crumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <Breadcrumb className="page-breadcrumb">
      <BreadcrumbList>
        {items.map((item, i) => (
          <Fragment key={i}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow page-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>
        {title}
        {count !== undefined && <span>{count}</span>}
      </h2>
      {action}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = FolderOpen,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <Empty className="empty-state">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="empty-icon">
          <Icon size={25} strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>
          <h3>{title}</h3>
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value}`}>
      <span />
      {value === "not_started"
        ? "Not started"
        : value[0].toUpperCase() + value.slice(1)}
    </span>
  );
}
export function dateLabel(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    ...(options || { day: "numeric", month: "short", year: "numeric" }),
  }).format(new Date(date + "T12:00:00Z"));
}
export function ModuleCollection({
  modules,
  data,
}: {
  modules: Module[];
  data: ContextData;
}) {
  const base = basePath(data);
  return (
    <div className="academic-folder-grid" role="list" aria-label="Modules">
      {modules.map((module) => {
        const lectures = data.lectures
          .filter((lecture) => lecture.module_id === module.id)
          .sort((a, b) => a.position - b.position);
        const href = `${base}${campusPath}/modules/${module.id}`;
        return (
          <article
            className="academic-folder module-folder"
            role="listitem"
            key={module.id}
          >
            <div className="academic-folder-visual">
              <AcademicFolder
                label={module.code}
                href={href}
                items={lectures.slice(0, 6).map((lecture, index) => (
                  <div key={lecture.id} className="academic-folder-page">
                    <span>Lecture {String(index + 1).padStart(2, "0")}</span>
                    <strong>{lecture.title}</strong>
                    {lecture.topic && <small>{lecture.topic}</small>}
                  </div>
                ))}
              />
            </div>
            <div className="academic-folder-details">
              <Link href={href} className="academic-folder-title">
                <h3>{module.title}</h3>
                <ChevronRight size={15} aria-hidden="true" />
              </Link>
              <p className="academic-folder-meta">
                <span className="module-code">{module.code}</span>
                <span aria-hidden="true">·</span>
                <span>{module.credits} credits</span>
              </p>
              <p className="academic-folder-caption">
                {lectures.length}{" "}
                {lectures.length === 1 ? "lecture" : "lectures"}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
export function DocumentList({
  documents,
  base,
}: {
  documents: DocumentSummary[];
  base: string;
}) {
  return (
    <div className="document-list">
      {documents.map((d) => (
        <Link
          className="document-row"
          key={d.id}
          href={`${base}/documents/${d.id}`}
        >
          <span
            className={`resource-icon ${d.kind === "quiz" ? "quiz-icon" : ""}`}
          >
            {d.kind === "quiz" ? (
              <FileQuestion size={20} />
            ) : (
              <FileText size={20} />
            )}
          </span>
          <div>
            <strong>{d.title}</strong>
            <span>
              {d.kind === "quiz"
                ? "Quiz · reveal answers as you go"
                : d.kind === "project_brief"
                  ? "Project brief"
                  : `${d.category?.[0].toUpperCase()}${d.category?.slice(1)} · Markdown document`}
            </span>
          </div>
          <ChevronRight size={16} />
        </Link>
      ))}
    </div>
  );
}
export function FutureArea({
  title,
  base,
  description,
}: {
  title: string;
  base: string;
  description: string;
}) {
  return (
    <>
      <PageHeader eyebrow="YOUR WORKSPACE" title={title} />
      <div className="future-area">
        <span className="empty-icon">
          <Library size={30} strokeWidth={1.4} />
        </span>
        <span className="future-label">A future area</span>
        <h2>Coming in a future release</h2>
        <p>{description}</p>
        <Link
          href={`${base}${campusPath}`}
          data-slot="button"
          className={buttonVariants({ variant: "outline" })}
        >
          <GraduationCap data-icon="inline-start" />
          Open Campus
          <ArrowUpRight data-icon="inline-end" />
        </Link>
      </div>
    </>
  );
}
