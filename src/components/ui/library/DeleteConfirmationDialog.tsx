import { useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangleIcon, Loader2Icon, Trash2Icon, XIcon } from "lucide-react";

import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DeleteConfirmationDialogProps } from "@/types";

const DeleteConfirmationDialog = ({
  isOpen,
  generation,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) => {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onCancel();
      }
    },
    [onCancel]
  );

  const handleConfirm = useCallback(() => {
    void onConfirm();
  }, [onConfirm]);

  const title = generation?.story_title ?? "Delete Story?";
  const status = generation?.status ?? "pending";
  const showInProgressWarning = status === "in_progress";

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out"
          aria-hidden="true"
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-popover p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:animate-out data-[state=closed]:fade-out-90 data-[state=closed]:slide-out-to-bottom-8"
          aria-describedby="delete-confirmation-description"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2Icon aria-hidden="true" className="size-5" />
              </span>
              <DialogPrimitive.Title className="text-xl font-semibold text-foreground">
                Delete “{title}”?
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-full border border-transparent text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close dialog"
              >
                <XIcon aria-hidden="true" className="size-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Description
            id="delete-confirmation-description"
            className="mt-4 text-sm leading-6 text-muted-foreground"
          >
            This action cannot be undone. The story audio and its generation history will be deleted permanently.
          </DialogPrimitive.Description>

          {showInProgressWarning ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/10 dark:text-amber-100">
              <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div className="text-sm leading-6">
                <p className="font-semibold">Story generation is still in progress.</p>
                <p>Please wait for the generation to complete or fail before deleting.</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-4 rounded-xl border border-destructive bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting || showInProgressWarning}
              className={cn("w-full gap-2 sm:w-auto")}
            >
              {isDeleting ? (
                <>
                  <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2Icon aria-hidden="true" className="size-4" />
                  Delete Story
                </>
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default DeleteConfirmationDialog;
