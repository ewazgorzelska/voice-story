import { useStoryLibrary } from "@/lib/hooks/useStoryLibrary";
import StoryGrid from "@/components/ui/story/StoryGrid";
import StoryPagination from "@/components/ui/story/StoryPagination";

export default function StoryLibraryView() {
  const { stories, pagination, isLoading, error, setCurrentPage } = useStoryLibrary({
    initialPage: 1,
    pageSize: 12,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Story Library</h1>

      {error && (
        <div
          role="alert"
          className="bg-destructive/15 text-destructive border border-destructive/50 rounded-lg p-4 mb-6"
        >
          <p className="font-semibold">An error occurred.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <StoryGrid stories={stories} isLoading={isLoading} pageSize={12} />

      {pagination && !isLoading && !error && (
        <div className="mt-8">
          <StoryPagination pagination={pagination} onPageChange={setCurrentPage} />
        </div>
      )}

      {!isLoading && !error && stories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No stories have been found.</p>
        </div>
      )}
    </div>
  );
}
