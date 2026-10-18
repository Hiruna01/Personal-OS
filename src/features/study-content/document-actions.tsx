"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { deleteDocument } from "@/lib/actions";
export function DeleteDocument({
  id,
  revision,
  parent,
  demo,
}: {
  id: string;
  revision: number;
  parent: string;
  demo: boolean;
}) {
  const [pending, start] = useTransition(),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!pending) {
          setOpen(v);
          setError("");
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={demo}
          aria-label="Delete document"
        >
          <Trash2 size={16} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this document?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the Markdown source and its saved content.
            Other study materials remain in your workspace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            Keep document
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            aria-busy={pending}
            onClick={() =>
              start(async () => {
                try {
                  const result = await deleteDocument(id, revision);
                  if (!result.ok) {
                    setError(result.error || "Unable to delete.");
                    return;
                  }
                  toast.success("Document deleted");
                  setOpen(false);
                  router.push(parent);
                  router.refresh();
                } catch {
                  setError("Connection interrupted. Try again.");
                }
              })
            }
          >
            {pending && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            {pending ? "Deleting…" : "Delete document"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
