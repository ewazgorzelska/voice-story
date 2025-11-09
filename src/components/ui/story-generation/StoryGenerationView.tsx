import { useCallback, useMemo, useState } from "react";
import type { StoryGenerationViewProps, StoryGenerationPreferencesDto, StoryPreferencesFormErrors } from "@/types";
import { useStoryGeneration } from "@/lib/hooks/useStoryGeneration";
import StoryContentDisplay from "./StoryContentDisplay";
import GenerationSection from "./GenerationSection";
import GenerationProgressDisplay from "./GenerationProgressDisplay";
import ErrorMessage from "./ErrorMessage";

const MOTIF_MAX_LENGTH = 200;

const computePreferenceErrors = (values: StoryGenerationPreferencesDto): StoryPreferencesFormErrors => {
  const nextErrors: StoryPreferencesFormErrors = {};

  if (!Number.isInteger(values.child_age) || values.child_age < 0 || values.child_age > 18) {
    nextErrors.child_age = "Please enter an age between 0 and 18.";
  }

  if (
    !Number.isInteger(values.duration_min_minutes) ||
    values.duration_min_minutes < 1 ||
    values.duration_min_minutes > 60
  ) {
    nextErrors.duration_min_minutes = "Minimum duration must be between 1 and 60 minutes.";
  }

  if (
    !Number.isInteger(values.duration_max_minutes) ||
    values.duration_max_minutes < 1 ||
    values.duration_max_minutes > 60
  ) {
    nextErrors.duration_max_minutes = "Maximum duration must be between 1 and 60 minutes.";
  }

  if (
    Number.isInteger(values.duration_min_minutes) &&
    Number.isInteger(values.duration_max_minutes) &&
    values.duration_max_minutes <= values.duration_min_minutes
  ) {
    nextErrors.duration_range = "Maximum duration must be greater than minimum duration.";
  }

  if (values.motif_prompt && values.motif_prompt.trim().length > MOTIF_MAX_LENGTH) {
    nextErrors.motif_prompt = `Motif description cannot exceed ${MOTIF_MAX_LENGTH} characters.`;
  }

  return nextErrors;
};

/**
 * Main view container for story generation
 * Orchestrates story display and manages the generation process
 * Responsible for fetching data, managing generation state, API polling, and handling user interactions
 */
const StoryGenerationView = ({ story, userHasVoiceSample }: StoryGenerationViewProps) => {
  const initialPreferences = useMemo<StoryGenerationPreferencesDto>(
    () => ({
      child_age: 5,
      duration_min_minutes: 5,
      duration_max_minutes: 10,
      motif_prompt: null,
    }),
    []
  );

  const [preferences, setPreferences] = useState<StoryGenerationPreferencesDto>(initialPreferences);
  const [formErrors, setFormErrors] = useState<StoryPreferencesFormErrors>(() =>
    computePreferenceErrors(initialPreferences)
  );

  const hasValidationErrors = useMemo(() => Object.values(formErrors).some(Boolean), [formErrors]);

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
    preferences,
    onComplete: handleComplete,
  });

  /**
   * Validate preference controls
   */
  const validatePreferences = useCallback(
    (values: StoryGenerationPreferencesDto): StoryPreferencesFormErrors => computePreferenceErrors(values),
    []
  );

  /**
   * Handle preference updates from the form
   */
  const handlePreferencesChange = useCallback(
    (nextValues: StoryGenerationPreferencesDto) => {
      const sanitized: StoryGenerationPreferencesDto = {
        ...nextValues,
        motif_prompt: nextValues.motif_prompt ? nextValues.motif_prompt.trim() || null : null,
      };

      setPreferences(sanitized);
      setFormErrors(validatePreferences(sanitized));
    },
    [validatePreferences]
  );

  /**
   * Handle generate button click
   */
  const handleStartGeneration = useCallback(async () => {
    if (!userHasVoiceSample) {
      return;
    }

    const currentErrors = validatePreferences(preferences);
    setFormErrors(currentErrors);

    if (Object.values(currentErrors).some(Boolean)) {
      return;
    }

    await startGeneration();
  }, [preferences, startGeneration, userHasVoiceSample, validatePreferences]);

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
