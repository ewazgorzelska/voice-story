import { useCallback, useMemo, useState } from "react";
import type { StoryGenerationViewProps, StoryGenerationPreferencesDto, StoryPreferencesFormErrors } from "@/types";
import { useStoryGeneration } from "@/lib/hooks/useStoryGeneration";
import {
  createDefaultStoryPreferences,
  hasStoryPreferenceErrors,
  loadStoredStoryPreferences,
  sanitizeStoryPreferences,
  storeStoryPreferences,
  validateStoryPreferences,
} from "@/lib/utils/storyPreferences";
import StoryContentDisplay from "./StoryContentDisplay";
import GenerationSection from "./GenerationSection";
import GenerationProgressDisplay from "./GenerationProgressDisplay";
import ErrorMessage from "./ErrorMessage";

/**
 * Main view container for story generation
 * Orchestrates story display and manages the generation process
 * Responsible for fetching data, managing generation state, API polling, and handling user interactions
 */
const StoryGenerationView = ({ story, userHasVoiceSample }: StoryGenerationViewProps) => {
  const initialPreferences = useMemo<StoryGenerationPreferencesDto>(() => {
    const stored = loadStoredStoryPreferences();
    return stored ?? createDefaultStoryPreferences();
  }, []);

  const [preferences, setPreferences] = useState<StoryGenerationPreferencesDto>(initialPreferences);
  const [formErrors, setFormErrors] = useState<StoryPreferencesFormErrors>(() =>
    validateStoryPreferences(initialPreferences)
  );

  const hasValidationErrors = useMemo(() => hasStoryPreferenceErrors(formErrors), [formErrors]);

  /**
   * Redirect to My Library after successful generation
   */
  const handleComplete = useCallback(() => {
    // Prefer using navigation instead of direct window.location mutation
    if (typeof window !== "undefined") {
      window.location.assign("/my-library");
    }
  }, []);

  /**
   * Use custom hook for generation logic
   */
  const { state, startGeneration, estimatedTimeRemaining, resetError } = useStoryGeneration({
    storyId: story.id,
    preferences,
    onComplete: handleComplete,
  });

  /**
   * Handle preference updates from the form
   */
  const handlePreferencesChange = useCallback((nextValues: StoryGenerationPreferencesDto) => {
    const sanitized = sanitizeStoryPreferences(nextValues);

    setPreferences(sanitized);
    const nextErrors = validateStoryPreferences(sanitized);
    setFormErrors(nextErrors);

    if (!hasStoryPreferenceErrors(nextErrors)) {
      storeStoryPreferences(sanitized);
    }
  }, []);

  /**
   * Handle generate button click
   */
  const handleStartGeneration = useCallback(async () => {
    if (!userHasVoiceSample) {
      return;
    }

    const currentErrors = validateStoryPreferences(preferences);
    setFormErrors(currentErrors);

    if (hasStoryPreferenceErrors(currentErrors)) {
      return;
    }

    storeStoryPreferences(preferences);

    await startGeneration();
  }, [preferences, startGeneration, userHasVoiceSample]);

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
            disabled={!userHasVoiceSample || state.isGenerating || hasValidationErrors}
            isLoading={state.isGenerating}
            userHasVoiceSample={userHasVoiceSample}
            preferences={preferences}
            errors={formErrors}
            onPreferencesChange={handlePreferencesChange}
          />
        )}
      </div>
    </div>
  );
};

export default StoryGenerationView;
