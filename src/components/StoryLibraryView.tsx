import { useCallback, useMemo, useState } from "react";
import Button from "@/components/ui/button";
import StoryPreferencesForm from "@/components/ui/story-generation/StoryPreferencesForm";
import StoryGrid from "@/components/ui/story/StoryGrid";
import StoryPagination from "@/components/ui/story/StoryPagination";
import { useStoryLibrary } from "@/lib/hooks/useStoryLibrary";
import {
  createDefaultStoryPreferences,
  hasStoryPreferenceErrors,
  loadStoredStoryPreferences,
  sanitizeStoryPreferences,
  storeStoryPreferences,
  validateStoryPreferences,
} from "@/lib/utils/storyPreferences";
import type { StoryGenerationPreferencesDto, StoryPreferencesFormErrors } from "@/types";

const arePreferencesEqual = (left: StoryGenerationPreferencesDto, right: StoryGenerationPreferencesDto): boolean =>
  left.child_age === right.child_age &&
  left.duration_min_minutes === right.duration_min_minutes &&
  left.duration_max_minutes === right.duration_max_minutes &&
  (left.motif_prompt ?? null) === (right.motif_prompt ?? null);

export default function StoryLibraryView() {
  const defaultPreferences = useMemo(() => createDefaultStoryPreferences(), []);
  const initialPreferences = useMemo<StoryGenerationPreferencesDto>(() => {
    const stored = loadStoredStoryPreferences();
    return stored ?? defaultPreferences;
  }, [defaultPreferences]);

  const [preferences, setPreferences] = useState<StoryGenerationPreferencesDto>(initialPreferences);
  const [preferenceErrors, setPreferenceErrors] = useState<StoryPreferencesFormErrors>(() =>
    validateStoryPreferences(initialPreferences)
  );

  const hasErrors = useMemo(() => hasStoryPreferenceErrors(preferenceErrors), [preferenceErrors]);
  const isDefaultPreferences = useMemo(
    () => arePreferencesEqual(preferences, defaultPreferences),
    [preferences, defaultPreferences]
  );

  const handlePreferencesChange = useCallback((nextValues: StoryGenerationPreferencesDto) => {
    const sanitized = sanitizeStoryPreferences(nextValues);
    setPreferences(sanitized);

    const nextErrors = validateStoryPreferences(sanitized);
    setPreferenceErrors(nextErrors);

    if (!hasStoryPreferenceErrors(nextErrors)) {
      storeStoryPreferences(sanitized);
    }
  }, []);

  const handleResetPreferences = useCallback(() => {
    const defaults = createDefaultStoryPreferences();
    setPreferences(defaults);

    const defaultErrors = validateStoryPreferences(defaults);
    setPreferenceErrors(defaultErrors);

    storeStoryPreferences(defaults);
  }, []);

  const { stories, pagination, isLoading, error, setCurrentPage } = useStoryLibrary({
    initialPage: 1,
    pageSize: 12,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold">Story Library</h1>
            <p className="text-base text-muted-foreground">
              Set your storytelling preferences, then choose a story to personalize the narration.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-border/60 bg-card/60 shadow-sm">
          <form className="space-y-6 px-4 py-5 sm:px-6 sm:py-6" noValidate>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Personalize your stories</h2>
              <p className="text-sm text-muted-foreground">
                These preferences help us tailor pacing and vocabulary. We reuse them across story generations.
              </p>
            </div>

            <StoryPreferencesForm values={preferences} errors={preferenceErrors} onChange={handlePreferencesChange} />

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                {hasErrors
                  ? "Fix the highlighted fields to save your preferences."
                  : "Preferences save automatically when valid."}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetPreferences}
                disabled={isDefaultPreferences}
              >
                Reset to defaults
              </Button>
            </div>
          </form>
        </section>

        {error && (
          <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/15 p-4 text-destructive">
            <p className="font-semibold">An error occurred.</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        <section id="story-library-grid" className="space-y-6">
          <StoryGrid stories={stories} isLoading={isLoading} pageSize={12} />

          {pagination && !isLoading && !error && (
            <div className="flex justify-center">
              <StoryPagination pagination={pagination} onPageChange={setCurrentPage} />
            </div>
          )}

          {!isLoading && !error && stories.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/70 py-12 text-center">
              <p className="text-lg text-muted-foreground">No stories are available yet. Check back soon!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
