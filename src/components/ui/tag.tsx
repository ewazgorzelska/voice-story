import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TagProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const Tag = ({ children, icon, className }: TagProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-xs",
        className
      )}
    >
      {icon ? <span className="text-muted-foreground [&>svg]:size-3.5 [&>svg]:shrink-0">{icon}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
};

export default Tag;
