"use client";

import {
  useState,
  useTransition,
  type ReactNode,
  type ComponentProps,
} from "react";
import dynamic from "next/dynamic";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { EntityKind } from "@/lib/validation";

const EntityEditor = dynamic(
  () => import("./entity-editor").then((module) => module.EntityEditor),
  {
    loading: () => <p role="status">Loading form…</p>,
  },
);
const names: Record<EntityKind, string> = {
  semester: "semester",
  module: "module",
  lecture: "lecture",
  resource: "note link",
  project: "project",
  profile: "academic profile",
  workspace: "workspace",
};
export type EntityDialogProps = {
  kind: EntityKind;
  initial?: Record<string, unknown>;
  label?: string;
  children?: ReactNode;
  demo?: boolean;
  compact?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
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
}: EntityDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [pending, start] = useTransition();
  const open = controlledOpen ?? localOpen;
  function setOpen(value: boolean) {
    if (onOpenChange) onOpenChange(value);
    else setLocalOpen(value);
  }
  const edit = !!initial.id || kind === "profile" || kind === "workspace";
  const title = label ?? `${edit ? "Edit" : "New"} ${names[kind]}`;
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
        {open && (
          <EntityEditor
            kind={kind}
            initial={initial}
            demo={demo}
            title={title}
            pending={pending}
            start={start}
            setOpen={setOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
