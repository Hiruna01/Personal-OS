"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  FileCode2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StudyDocument } from "@/types/domain";
import { DeleteDocument } from "./document-actions";
import { ImportDialog } from "./import-dialog";
import { useQuizSession } from "./quiz-session";

const QuizReader = dynamic(
  () => import("./quiz").then((module) => module.QuizReader),
  {
    loading: () => <p role="status">Loading question…</p>,
  },
);

function QuizDocumentActions({
  document,
  parent,
  demo,
}: {
  document: StudyDocument;
  parent: string;
  demo: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState<"edit" | "delete" | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function returnFocus(event: Event) {
    event.preventDefault();
    trigger.current?.focus();
  }
  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={trigger}
            variant="ghost"
            size="icon-sm"
            aria-label="Quiz options"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(event) => {
            if (action) event.preventDefault();
          }}
        >
          <DropdownMenuLabel>Revision {document.revision}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setMenuOpen(false);
              setAction("edit");
            }}
          >
            <FileCode2 /> Edit source
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={demo}
            onSelect={() => {
              setMenuOpen(false);
              setAction("delete");
            }}
          >
            <Trash2 /> Delete quiz
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ImportDialog
        kind="quiz"
        moduleId={document.module_id}
        lectureId={document.lecture_id ?? undefined}
        document={document}
        demo={demo}
        open={action === "edit"}
        onOpenChange={(open) => setAction(open ? "edit" : null)}
        hideTrigger
        onCloseAutoFocus={returnFocus}
      />
      <DeleteDocument
        id={document.id}
        revision={document.revision}
        parent={parent}
        demo={demo}
        open={action === "delete"}
        onOpenChange={(open) => setAction(open ? "delete" : null)}
        hideTrigger
        onCloseAutoFocus={returnFocus}
      />
    </>
  );
}

export function QuizPage({
  document,
  parent,
  demo,
}: {
  document: StudyDocument;
  parent: string;
  demo: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const session = useQuizSession();
  const focusTrigger = useRef<HTMLButtonElement>(null);
  const focusTitle = useRef<HTMLHeadingElement>(null);
  const reader = useRef<HTMLDivElement>(null);
  const readerHeight = useRef(0);
  const scrollPosition = useRef(0);
  const quiz = document.quiz_json;
  if (!quiz) return null;

  return (
    <Dialog
      open={focused}
      onOpenChange={(open) => {
        if (open) {
          readerHeight.current =
            reader.current?.getBoundingClientRect().height ?? 0;
          scrollPosition.current = window.scrollY;
        }
        setFocused(open);
      }}
    >
      <article className="quiz-page" aria-label={document.title}>
        <header className="quiz-page-header">
          <Link href={parent} className="text-link quiz-back">
            <ArrowLeft size={16} />
            {document.lecture_id ? "Back to lecture" : "Back to module"}
          </Link>
          <div className="quiz-page-tools">
            <DialogTrigger asChild>
              <Button ref={focusTrigger} variant="outline" size="sm">
                <Maximize2 data-icon="inline-start" /> Focus mode
              </Button>
            </DialogTrigger>
            <QuizDocumentActions
              document={document}
              parent={parent}
              demo={demo}
            />
          </div>
          <h1>{document.title}</h1>
        </header>
        <div
          ref={reader}
          style={focused ? { minHeight: readerHeight.current } : undefined}
        >
          {!focused && <QuizReader quiz={quiz} session={session} />}
        </div>
      </article>
      <DialogContent
        className="quiz-focus-dialog"
        showCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          focusTitle.current?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          window.scrollTo({ top: scrollPosition.current, behavior: "instant" });
          focusTrigger.current?.focus({ preventScroll: true });
        }}
      >
        <header className="quiz-focus-header">
          <DialogTitle ref={focusTitle} tabIndex={-1}>
            {document.title}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              <Minimize2 data-icon="inline-start" /> Exit focus
            </Button>
          </DialogClose>
        </header>
        <div className="quiz-focus-scroll">
          {focused && <QuizReader quiz={quiz} session={session} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
