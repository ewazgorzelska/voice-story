import { useMemo } from "react";

import Progress from "@/components/ui/progress";
import type { GenerationStatus, ProgressDisplayProps } from "@/types";

const STATUS_MESSAGES: Record<GenerationStatus, string> = {
  pending: "Waiting for generation to start…",
  in_progress: "Generating your story…",
  completed: "Generation complete",
  failed: "Generation failed",
};

const ProgressDisplay = ({ progress, status }: ProgressDisplayProps) => {
  const safeProgress = useMemo(() => {
    if (Number.isNaN(progress)) {
      return 0;
    }
    if (progress < 0) {
      return 0;
    }
    if (progress > 100) {
      return 100;
    }
    return Math.round(progress);
  }, [progress]);

  const statusMessage =
    status === "pending" || status === "in_progress" ? STATUS_MESSAGES[status] : STATUS_MESSAGES.in_progress;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="flex flex-col gap-3 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-4"
    >
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>{statusMessage}</span>
        <span aria-label="Progress percentage">{safeProgress}%</span>
      </div>
      <Progress
        aria-label="Generation progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeProgress}
        className="h-2"
        value={safeProgress}
      />
    </div>
  );
};

export default ProgressDisplay;
