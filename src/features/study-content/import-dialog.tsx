"use client";

import { useState, useTransition, type ComponentProps } from "react";
import dynamic from "next/dynamic";
import { Upload, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { StudyDocument } from "@/types/domain";

const ImportEditor = dynamic(
  () => import("./import-editor").then((module) => module.ImportEditor),
  {
    loading: () => (
      <div className="import-body" role="status">
        Loading editor…
      </div>
    ),
  },
);

export type ImportDialogProps = {
  moduleId: string;
  lectureId?: string;
  projectId?: string;
  kind: StudyDocument["kind"];
  document?: StudyDocument;
  demo?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
};
export function ImportDialog({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  onCloseAutoFocus,
  ...props
}: ImportDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [pending, start] = useTransition();
  const open = controlledOpen ?? localOpen;
  function setOpen(value: boolean) {
    setLocalOpen(value);
    onOpenChange?.(value);
  }
  const noun =
    props.kind === "quiz"
      ? "quiz"
      : props.kind === "questions"
        ? "questions"
        : "project brief";
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value);
      }}
    >
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            title={props.demo ? "Sample preview is read-only" : undefined}
          >
            {props.document ? (
              <FileCode2 data-icon="inline-start" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            {props.document ? "Edit source" : `Upload ${noun}`}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="import-dialog"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>
            {props.document ? `Edit ${noun}` : `Upload ${noun}`}
          </DialogTitle>
          <DialogDescription>
            {props.kind === "quiz"
              ? "Upload a campus-quiz-v1 quiz or a multiple-answer paper with separate questions and detailed explanations."
              : "An ordinary Markdown document, rendered just as you wrote it."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ImportEditor
            {...props}
            open={open}
            setOpen={setOpen}
            pending={pending}
            start={start}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
