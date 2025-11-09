import { cn } from "@/lib/utils";
import type { GenerationStatus, StatusBadgeProps } from "@/types";

const STATUS_STYLES: Record<GenerationStatus, string> = {
  pending:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-400/30",
  in_progress:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-400/30",
  completed:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-400/30",
  failed: "bg-red-50 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/30",
};

const STATUS_TEXT: Record<GenerationStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  failed: "Failed",
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        STATUS_STYLES[status],
        className
      )}
      data-status={status}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      <span>{STATUS_TEXT[status]}</span>
    </span>
  );
};

export default StatusBadge;
