import { useCallback, useEffect, useRef, useState } from "react";

import { logError } from "@/lib/logger";
import type {
  GenerationState,
  CreateStoryGenerationCommand,
  CreateStoryGenerationResponseDto,
  StoryGenerationDto,
} from "@/types";

type StoryGenerationPreferencesInput = Omit<CreateStoryGenerationCommand, "story_id">;

const DEFAULT_GENERATION_PREFERENCES: StoryGenerationPreferencesInput = {
  child_age: 5,
  duration_min_minutes: 5,
  duration_max_minutes: 10,
  motif_prompt: null,
};

interface UseStoryGenerationParams {
  storyId: string;
  preferences?: StoryGenerationPreferencesInput;
  onComplete?: () => void;
  pollingIntervalMs?: number;
  maxRetries?: number;
}

interface UseStoryGenerationReturn {
  state: GenerationState;
  startGeneration: () => Promise<void>;
  estimatedTimeRemaining: number | undefined;
  resetError: () => void;
}

const INITIAL_STATE: GenerationState = {
  isGenerating: false,
  generationId: null,
  status: "idle",
  progress: 0,
  error: null,
  startTime: null,
  lastProgressUpdate: null,
  lastProgress: 0,
};

/**
 * Custom hook for managing story generation lifecycle
 * Handles API calls, polling, progress tracking, and error handling
 */
export function useStoryGeneration({
  storyId,
  preferences,
  onComplete,
  pollingIntervalMs = 2000,
  maxRetries = 3,
}: UseStoryGenerationParams): UseStoryGenerationReturn {
  const [state, setState] = useState<GenerationState>(INITIAL_STATE);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const preferencesRef = useRef<StoryGenerationPreferencesInput>(preferences ?? DEFAULT_GENERATION_PREFERENCES);

  useEffect(() => {
    if (preferences) {
      preferencesRef.current = {
        child_age: preferences.child_age,
        duration_min_minutes: preferences.duration_min_minutes,
        duration_max_minutes: preferences.duration_max_minutes,
        motif_prompt: preferences.motif_prompt ?? null,
      };
    }
  }, [preferences]);

  /**
   * Validates UUID format
   */
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  /**
   * Validates generation data from API
   */
  const validateGenerationData = (data: unknown): data is StoryGenerationDto => {
    if (typeof data !== "object" || data === null) {
      return false;
    }

    const candidate = data as Partial<StoryGenerationDto>;
    const validStatuses = ["pending", "in_progress", "completed", "failed"];
    const hasValidPreferences =
      typeof candidate.preferences === "object" &&
      candidate.preferences !== null &&
      typeof candidate.preferences.child_age === "number" &&
      typeof candidate.preferences.duration_min_minutes === "number" &&
      typeof candidate.preferences.duration_max_minutes === "number" &&
      (candidate.preferences.motif_prompt === null || typeof candidate.preferences.motif_prompt === "string");
    return (
      typeof candidate.id === "string" &&
      typeof candidate.story_id === "string" &&
      typeof candidate.status === "string" &&
      validStatuses.includes(candidate.status) &&
      typeof candidate.progress === "number" &&
      candidate.progress >= 0 &&
      candidate.progress <= 100 &&
      typeof candidate.result_url === "string" &&
      typeof candidate.teaser === "string" &&
      hasValidPreferences
    );
  };

  /**
   * Stops the polling interval
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Polls the API for generation progress
   */
  const pollProgress = useCallback(
    async (generationId: string) => {
      try {
        const response = await fetch(`/api/story-generations/${generationId}`);

        // Handle authentication errors
        if (response.status === 401) {
          stopPolling();
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            error: "Session expired. Please log in again.",
          }));
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }

        // Handle not found errors
        if (response.status === 404) {
          stopPolling();
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            status: "failed",
            error: "Generation not found",
          }));
          return;
        }

        // Handle other errors
        if (!response.ok) {
          throw new Error("Failed to fetch generation progress");
        }

        const data = await response.json();

        // Validate response data
        if (!validateGenerationData(data)) {
          logError("Invalid data structure:", data);
          throw new Error("Invalid data from API");
        }

        // Reset retry counter on success
        retryCountRef.current = 0;

        // Update state with new progress
        setState((prev) => ({
          ...prev,
          status: data.status,
          progress: data.progress,
          lastProgressUpdate: Date.now(),
          lastProgress: prev.progress,
        }));

        // Handle completion
        if (data.status === "completed") {
          stopPolling();
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            progress: 100,
          }));
          // Call completion callback after a short delay for UI feedback
          setTimeout(() => {
            onComplete?.();
          }, 2000);
        }

        // Handle failure
        if (data.status === "failed") {
          stopPolling();
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            status: "failed",
            error: "Failed to generate story. Please try again later.",
          }));
        }
      } catch (error) {
        logError("Polling error:", error);
        retryCountRef.current += 1;

        // Stop polling after max retries
        if (retryCountRef.current >= maxRetries) {
          stopPolling();
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            status: "failed",
            error: "Lost connection to server. Please refresh the page.",
          }));
        }
        // Otherwise continue polling with existing interval
      }
    },
    [stopPolling, onComplete, maxRetries]
  );

  /**
   * Starts polling for generation progress
   */
  const startPolling = useCallback(
    (generationId: string) => {
      // Clear any existing interval
      stopPolling();

      // Start new polling interval
      pollingIntervalRef.current = setInterval(() => {
        pollProgress(generationId);
      }, pollingIntervalMs);

      // Poll immediately
      pollProgress(generationId);
    },
    [stopPolling, pollProgress, pollingIntervalMs]
  );

  /**
   * Initiates story generation
   */
  const startGeneration = useCallback(async () => {
    // Prevent multiple simultaneous generations
    if (state.isGenerating) {
      return;
    }

    // Validate story ID
    if (!storyId || !isValidUUID(storyId)) {
      setState((prev) => ({
        ...prev,
        error: "Invalid story identifier",
      }));
      return;
    }

    // Reset state and start generation
    setState({
      ...INITIAL_STATE,
      isGenerating: true,
      status: "pending",
      startTime: Date.now(),
    });
    retryCountRef.current = 0;

    try {
      const { child_age, duration_min_minutes, duration_max_minutes, motif_prompt } =
        preferencesRef.current ?? DEFAULT_GENERATION_PREFERENCES;

      const command: CreateStoryGenerationCommand = {
        story_id: storyId,
        child_age,
        duration_min_minutes,
        duration_max_minutes,
        motif_prompt: motif_prompt ?? null,
      };

      const response = await fetch("/api/story-generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      // Handle authentication errors
      if (response.status === 401) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: "Session expired. Please log in again.",
        }));
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      // Handle not found errors
      if (response.status === 404) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: "Story not found",
        }));
        setTimeout(() => {
          window.location.href = "/stories";
        }, 2000);
        return;
      }

      // Handle conflict errors (no voice sample or generation in progress)
      if (response.status === 409) {
        const error = await response.json();
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: error.message || "Cannot start generation. Please check your voice sample.",
        }));
        return;
      }

      // Handle validation errors
      if (response.status === 400 || response.status === 422) {
        const error = await response.json();
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: error.message || "Invalid request. Please review your story preferences.",
        }));
        return;
      }

      // Handle rate limit errors
      if (response.status === 429) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: "Request limit exceeded. Please try again in a moment.",
        }));
        return;
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      const data: CreateStoryGenerationResponseDto = await response.json();

      // Update state with generation ID and start polling
      setState((prev) => ({
        ...prev,
        generationId: data.id,
        status: data.status,
        progress: data.progress,
        lastProgressUpdate: Date.now(),
      }));

      // Start polling for progress
      startPolling(data.id);
    } catch (error) {
      logError("Error starting generation:", error);
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: "Failed to start generation. Please try again.",
      }));
    }
  }, [state.isGenerating, storyId, startPolling]);

  /**
   * Calculates estimated time remaining based on progress rate
   */
  const calculateEstimatedTime = useCallback((): number | undefined => {
    if (!state.isGenerating || !state.startTime || state.progress <= 0) {
      return undefined;
    }

    const elapsedTime = Date.now() - state.startTime;
    const progressRate = state.progress / elapsedTime; // progress per millisecond
    const remainingProgress = 100 - state.progress;

    if (progressRate <= 0) {
      return undefined;
    }

    const estimatedRemainingMs = remainingProgress / progressRate;
    const estimatedRemainingSec = Math.ceil(estimatedRemainingMs / 1000);

    return estimatedRemainingSec;
  }, [state.isGenerating, state.startTime, state.progress]);

  /**
   * Resets error state
   */
  const resetError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    state,
    startGeneration,
    estimatedTimeRemaining: calculateEstimatedTime(),
    resetError,
  };
}
