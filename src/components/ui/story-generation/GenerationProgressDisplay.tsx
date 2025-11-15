import { Progress } from "@/components/ui/progress";
import type { GenerationProgressDisplayProps } from "@/types";
import StatusIndicator from "./StatusIndicator";
import EstimatedTimeDisplay from "./EstimatedTimeDisplay";

/**
 * Clamps progress value to valid range (0-100)
 */
function clampProgress(progress: number): number {
  return Math.max(0, Math.min(100, progress));
}

/**
 * Component displaying current story generation progress
 * Shows text status, visual progress bar, and estimated time remaining
 */
const GenerationProgressDisplay = ({ status, progress, estimatedTimeRemaining }: GenerationProgressDisplayProps) => {
  const clampedProgress = clampProgress(progress);

  return (
    <div
      className="w-full mx-auto rounded-xl border border-border/60 bg-card shadow-md transition-all animate-in fade-in duration-500"
      role="region"
      aria-label="Generation progress"
      aria-live="polite"
    >
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <svg
              className="size-6 text-primary animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22l-.394-1.433a2.25 2.25 0 00-1.423-1.423L13.25 18.5l1.433-.394a2.25 2.25 0 001.423-1.423l.394-1.433.394 1.433a2.25 2.25 0 001.423 1.423l1.433.394-1.433.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <StatusIndicator status={status} />
            <p className="text-xs text-muted-foreground mt-1">
              Creating your personalized story with AI-powered narration
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress
            value={clampedProgress}
            className="w-full h-2"
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Story generation progress: ${clampedProgress} percent complete`}
          />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-foreground">{clampedProgress}%</span>
            <EstimatedTimeDisplay timeRemaining={estimatedTimeRemaining} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationProgressDisplay;
