import type { StoryContentDisplayProps } from "@/types";

/**
 * Presentational component displaying story title and content
 * Provides semantic HTML structure with proper typography
 */
const StoryContentDisplay = ({ title, content }: StoryContentDisplayProps) => {
  // Handle empty content
  if (!title || !content) {
    return null;
  }

  return (
    <section className="mb-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
        {title}
      </h1>
      <div className="rounded-lg border border-border/60 bg-card/40 p-4 sm:p-6 shadow-sm">
        <div className="mb-3 flex items-start gap-2">
          <svg
            className="mt-1 size-5 flex-shrink-0 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Original Story</h2>
            <p className="text-xs text-muted-foreground">
              This classic story will be personalized based on your preferences
            </p>
          </div>
        </div>
        <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none max-h-[40vh] overflow-y-auto rounded border border-border/40 bg-background/50 p-4">
          <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{content}</div>
        </article>
      </div>
    </section>
  );
};

export default StoryContentDisplay;
