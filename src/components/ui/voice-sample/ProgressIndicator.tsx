import { Loader2 } from "lucide-react";

export default function ProgressIndicator() {
  return (
    <div
      className="flex items-center justify-center gap-2 text-muted-foreground bg-muted/30 dark:bg-muted/20 p-4 rounded-lg border"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span>Uploading your voice sample...</span>
    </div>
  );
}
