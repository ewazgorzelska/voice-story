import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface InlineMessageProps {
  type: "error" | "success";
  children: ReactNode;
}

export default function InlineMessage({ type, children }: InlineMessageProps) {
  const isError = type === "error";

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${
        isError
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
      }`}
      role="alert"
      aria-live="polite"
    >
      {isError ? (
        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
