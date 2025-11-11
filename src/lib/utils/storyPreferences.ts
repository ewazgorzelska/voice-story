import type { StoryGenerationPreferencesDto, StoryPreferencesFormErrors } from "@/types";

export const STORY_PREFERENCES_STORAGE_KEY = "voice-story:preferences";
export const STORY_PREFERENCES_MOTIF_MAX_LENGTH = 200;

const toIntegerOrNaN = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value) : Number.NaN;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return Number.NaN;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }

  return Number.NaN;
};

export const createDefaultStoryPreferences = (): StoryGenerationPreferencesDto => ({
  child_age: 5,
  duration_min_minutes: 5,
  duration_max_minutes: 10,
  motif_prompt: null,
});

export const sanitizeStoryPreferences = (values: StoryGenerationPreferencesDto): StoryGenerationPreferencesDto => {
  const motif = values.motif_prompt?.slice(0, STORY_PREFERENCES_MOTIF_MAX_LENGTH).trim() ?? null;

  return {
    ...values,
    motif_prompt: motif && motif.length > 0 ? motif : null,
  };
};

export const validateStoryPreferences = (values: StoryGenerationPreferencesDto): StoryPreferencesFormErrors => {
  const errors: StoryPreferencesFormErrors = {};

  if (!Number.isInteger(values.child_age) || values.child_age < 0 || values.child_age > 18) {
    errors.child_age = "Please enter an age between 0 and 18.";
  }

  if (
    !Number.isInteger(values.duration_min_minutes) ||
    values.duration_min_minutes < 1 ||
    values.duration_min_minutes > 60
  ) {
    errors.duration_min_minutes = "Minimum duration must be between 1 and 60 minutes.";
  }

  if (
    !Number.isInteger(values.duration_max_minutes) ||
    values.duration_max_minutes < 1 ||
    values.duration_max_minutes > 60
  ) {
    errors.duration_max_minutes = "Maximum duration must be between 1 and 60 minutes.";
  }

  if (
    Number.isInteger(values.duration_min_minutes) &&
    Number.isInteger(values.duration_max_minutes) &&
    values.duration_max_minutes <= values.duration_min_minutes
  ) {
    errors.duration_range = "Maximum duration must be greater than minimum duration.";
  }

  if (values.motif_prompt && values.motif_prompt.trim().length > STORY_PREFERENCES_MOTIF_MAX_LENGTH) {
    errors.motif_prompt = `Motif description cannot exceed ${STORY_PREFERENCES_MOTIF_MAX_LENGTH} characters.`;
  }

  return errors;
};

export const hasStoryPreferenceErrors = (errors: StoryPreferencesFormErrors): boolean =>
  Object.values(errors).some(Boolean);

export const loadStoredStoryPreferences = (): StoryGenerationPreferencesDto | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORY_PREFERENCES_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoryGenerationPreferencesDto>;
    const candidate: StoryGenerationPreferencesDto = {
      child_age: toIntegerOrNaN(parsed?.child_age),
      duration_min_minutes: toIntegerOrNaN(parsed?.duration_min_minutes),
      duration_max_minutes: toIntegerOrNaN(parsed?.duration_max_minutes),
      motif_prompt: typeof parsed?.motif_prompt === "string" ? parsed?.motif_prompt : null,
    };

    const sanitized = sanitizeStoryPreferences(candidate);
    const validation = validateStoryPreferences(sanitized);

    if (hasStoryPreferenceErrors(validation)) {
      return null;
    }

    return sanitized;
  } catch {
    return null;
  }
};

export const storeStoryPreferences = (values: StoryGenerationPreferencesDto): void => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoryGenerationPreferencesDto = {
    child_age: values.child_age,
    duration_min_minutes: values.duration_min_minutes,
    duration_max_minutes: values.duration_max_minutes,
    motif_prompt: values.motif_prompt,
  };

  try {
    window.localStorage.setItem(STORY_PREFERENCES_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Swallow storage errors (e.g., quota exceeded or disabled storage)
  }
};
