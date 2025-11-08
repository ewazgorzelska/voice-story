import type { StoryContentDisplayProps } from "@/types";

/**
 * Presentational component displaying story title and content
 * Provides semantic HTML structure with proper typography
 */
export function StoryContentDisplay({ title, content }: StoryContentDisplayProps) {
  // Handle empty content
  if (!title || !content) {
    return null;
  }

  return (
    <section className="mb-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">{title}</h1>
      <article className="prose prose-lg dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">{content}</div>
      </article>
    </section>
  );
}
