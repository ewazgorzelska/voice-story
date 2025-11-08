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
      className="w-full max-w-2xl mx-auto p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
      role="region"
      aria-label="Generation progress"
    >
      <StatusIndicator status={status} />

      <Progress
        value={clampedProgress}
        className="w-full h-3 mb-2"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Generation progress"
      />

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{clampedProgress}%</span>
        <EstimatedTimeDisplay timeRemaining={estimatedTimeRemaining} />
      </div>
    </div>
  );
};

export default GenerationProgressDisplay;
