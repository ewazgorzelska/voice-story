import { useCallback } from "react";
import type { StoryGenerationViewProps } from "@/types";
import { useStoryGeneration } from "@/lib/hooks/useStoryGeneration";
import { StoryContentDisplay } from "./StoryContentDisplay";
import { GenerationSection } from "./GenerationSection";
import GenerationProgressDisplay from "./GenerationProgressDisplay";
import ErrorMessage from "./ErrorMessage";

/**
 * Main view container for story generation
 * Orchestrates story display and manages the generation process
 * Responsible for fetching data, managing generation state, API polling, and handling user interactions
 */
const StoryGenerationView = ({ story, userHasVoiceSample }: StoryGenerationViewProps) => {
  /**
   * Redirect to My Library after successful generation
   */
  const handleComplete = useCallback(() => {
    // Prefer using navigation instead of direct window.location mutation
    if (typeof window !== "undefined") {
      window.location.assign("/stories");
    }
  }, []);

  /**
   * Use custom hook for generation logic
   */
  const { state, startGeneration, estimatedTimeRemaining, resetError } = useStoryGeneration({
    storyId: story.id,
    onComplete: handleComplete,
  });

  /**
   * Handle generate button click
   */
  const handleStartGeneration = useCallback(async () => {
    if (!userHasVoiceSample) {
      return;
    }
    await startGeneration();
  }, [startGeneration, userHasVoiceSample]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-4xl">
      {/* Error Message */}
      {state.error && <ErrorMessage message={state.error} onDismiss={resetError} dismissible={true} />}

      {/* Story Content */}
      <StoryContentDisplay title={story.title} content={story.content} />

      {/* Generation Controls or Progress */}
      <div className="mt-6 sm:mt-8">
        {state.isGenerating ? (
          <GenerationProgressDisplay
            status={state.status === "idle" ? "pending" : state.status}
            progress={state.progress}
            estimatedTimeRemaining={estimatedTimeRemaining}
          />
        ) : (
          <GenerationSection
            onGenerate={handleStartGeneration}
            disabled={!userHasVoiceSample || state.isGenerating}
            isLoading={state.isGenerating}
            userHasVoiceSample={userHasVoiceSample}
          />
        )}
      </div>
    </div>
  );
};

export default StoryGenerationView;
