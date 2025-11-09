import { LandmarkIcon } from "lucide-react";

import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EmptyLibraryStateProps } from "@/types";

enum EmptyLibraryDefaults {
  Message = "You haven't generated any stories yet. Browse our collection to create your first personalized story.",
  CtaText = "Browse Story Library",
  CtaHref = "/stories",
}

export const EmptyLibraryState = ({
  message = EmptyLibraryDefaults.Message,
  ctaText = EmptyLibraryDefaults.CtaText,
  ctaHref = EmptyLibraryDefaults.CtaHref,
}: EmptyLibraryStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 px-8 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LandmarkIcon aria-hidden="true" className="size-8" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-foreground">No Stories Yet</h2>
        <p className="max-w-prose text-balance text-muted-foreground">{message}</p>
      </div>

      <Button asChild size="lg" className={cn("px-6 py-2.5")}>
        <a href={ctaHref}>{ctaText}</a>
      </Button>
    </div>
  );
};

export default EmptyLibraryState;
