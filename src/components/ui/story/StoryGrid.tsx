import StoryCard from "@/components/ui/story/StoryCard";
import { SkeletonCard } from "@/components/ui/story/SkeletonCard";
import type { StorySummaryDto } from "@/types";

interface StoryGridProps {
  stories: StorySummaryDto[];
  isLoading: boolean;
  pageSize: number;
}

const StoryGrid = ({ stories, isLoading, pageSize }: StoryGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        {Array.from({ length: pageSize }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  );
};

export default StoryGrid;
