import type { EstimatedTimeDisplayProps } from "@/types";

/**
 * Formats time in seconds to human-readable string
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `~${seconds} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `~${minutes} min`;
  }

  return `~${minutes} min ${remainingSeconds} sec`;
}

/**
 * Component calculating and displaying estimated time remaining until generation completion
 */
const EstimatedTimeDisplay = ({ timeRemaining }: EstimatedTimeDisplayProps) => {
  // Don't render if no time remaining or invalid value
  if (timeRemaining === undefined || timeRemaining < 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{formatTime(timeRemaining)}</span>
    </div>
  );
};

export default EstimatedTimeDisplay;
