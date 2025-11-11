import type { StatusIndicatorProps, GenerationStatus } from "@/types";

/**
 * Maps generation status to color classes
 */
const statusColors: Record<GenerationStatus, string> = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

/**
 * Maps generation status to display text
 */
const statusText: Record<GenerationStatus, string> = {
  pending: "Preparing your story...",
  in_progress: "Crafting your personalized narration...",
  completed: "Your story is ready!",
  failed: "Generation failed",
};

/**
 * Small component displaying colored status indicator with textual description
 */
const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className={`w-3 h-3 rounded-full ${statusColors[status]}`} aria-hidden="true" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{statusText[status]}</span>
    </div>
  );
};

export default StatusIndicator;
