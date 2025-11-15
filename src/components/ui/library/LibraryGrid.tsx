import { useMemo } from "react";

import { SkeletonCard } from "@/components/ui/story/SkeletonCard";
import EmptyLibraryState from "@/components/ui/library/EmptyLibraryState";
import GeneratedStoryCard from "@/components/ui/library/GeneratedStoryCard";
import type { LibraryGridProps } from "@/types";

const createSkeletonIds = (count: number) => Array.from({ length: count }, (_, index) => index);

const LibraryGrid = ({
  generations,
  isLoading,
  pageSize,
  activeAudioId,
  registerAudio,
  unregisterAudio,
  onPlay,
  onPause,
  onDelete,
}: LibraryGridProps) => {
  const skeletonIds = useMemo(() => createSkeletonIds(pageSize), [pageSize]);
  const showEmptyState = !isLoading && generations.length === 0;

  if (showEmptyState) {
    return (
      <div className="py-16">
        <EmptyLibraryState />
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {isLoading
        ? skeletonIds.map((key) => <SkeletonCard key={key} />)
        : generations.map((generation) => (
            <GeneratedStoryCard
              key={generation.id}
              generation={generation}
              isAudioActive={generation.id === activeAudioId}
              registerAudio={registerAudio}
              unregisterAudio={unregisterAudio}
              onPlay={onPlay}
              onPause={onPause}
              onDelete={onDelete}
            />
          ))}
    </div>
  );
};

export default LibraryGrid;
