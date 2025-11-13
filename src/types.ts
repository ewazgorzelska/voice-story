// src/types.ts

import type { MouseEvent } from "react";
import type { Database } from "./db/database.types";

//
//#region Voice Sample Management

/** Response DTO for GET /api/voice-sample/phrase */
export interface GetVoiceSamplePhraseResponseDto {
  phrase: string;
}

/** Command Model for POST /api/voice-sample */
export interface CreateVoiceSampleCommand {
  /** Presigned upload URL or raw audio URL */
  audio_url: string;
  /** Verification phrase to confirm ownership */
  verification_phrase: string;
}

/** DB row shortcut */
type VoiceSampleRow = Database["public"]["Tables"]["voice_samples"]["Row"];
/** DB update shortcut */
type VoiceSampleUpdate = Database["public"]["Tables"]["voice_samples"]["Update"];

/** DTO for voice-sample responses (id, user, timestamp, verified) */
export type VoiceSampleDto = Pick<VoiceSampleRow, "id" | "user_id" | "created_at" | "verified">;

/** Command Model for PATCH /api/voice-sample/:id/verify */
export type VerifyVoiceSampleCommand = Pick<VoiceSampleUpdate, "verified">;

/** Response DTO for PATCH /api/voice-sample/:id/verify */
export type VerifyVoiceSampleResponseDto = Pick<VoiceSampleRow, "id" | "verified">;

//#endregion

//
//#region Story Library

/** Shared pagination metadata */
export interface PaginationMetaDto {
  /** Current page number */
  page: number;
  /** Items per page */
  page_size: number;
  /** Total number of items */
  total: number;
}

/** DB row shortcut */
type StoryRow = Database["public"]["Tables"]["stories"]["Row"];

/** Summary DTO for story listings */
export type StorySummaryDto = Pick<StoryRow, "id" | "title" | "slug" | "cover_image_url">;

/** Response DTO for GET /api/stories */
export interface GetStoriesResponseDto {
  data: StorySummaryDto[];
  meta: PaginationMetaDto;
}

/** DTO for GET /api/stories/:slug */
export type StoryDto = Pick<StoryRow, "id" | "title" | "slug" | "content">;

//#endregion

//
//#region Story Generation & User Library

/** DB insert shortcut */
type StoryGenInsert = Database["public"]["Tables"]["story_generations"]["Insert"];
/** DB row shortcut */
type StoryGenRow = Database["public"]["Tables"]["story_generations"]["Row"];

/** User-supplied preferences that influence story generation */
export type StoryGenerationPreferencesDto = Pick<
  StoryGenRow,
  "child_age" | "duration_min_minutes" | "duration_max_minutes"
>;

/** Errors returned by story preferences form validation */
export type StoryPreferencesFormErrors = Partial<
  Record<"child_age" | "duration_min_minutes" | "duration_max_minutes" | "duration_range", string>
>;

/** Command Model for POST /api/story-generations */
export type CreateStoryGenerationCommand = Pick<
  StoryGenInsert,
  "story_id" | "child_age" | "duration_min_minutes" | "duration_max_minutes"
>;

/** Response DTO for POST /api/story-generations */
export type CreateStoryGenerationResponseDto = Pick<StoryGenRow, "id" | "status" | "progress" | "teaser"> & {
  preferences: StoryGenerationPreferencesDto;
};

/** DTO for story generation items (list and single) */
export type StoryGenerationDto = Pick<
  StoryGenRow,
  "id" | "story_id" | "status" | "progress" | "result_url" | "teaser"
> & { preferences: StoryGenerationPreferencesDto };

/** Response DTO for GET /api/story-generations */
export interface GetStoryGenerationsResponseDto {
  data: StoryGenerationDto[];
  meta: PaginationMetaDto;
}

/** Response DTO for GET /api/story-generations/:id */
export type GetStoryGenerationResponseDto = StoryGenerationDto;

/** DELETE has no body or DTO; returns 204 No Content */

//#endregion

//
//#region My Library View Models

/** Enriched generation DTO with story title for display */
export interface EnrichedGenerationDto extends StoryGenerationDto {
  /** Story title from stories table */
  story_title: string;
}

/** Audio player internal state */
export interface AudioPlayerState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Volume level (0.0 to 1.0) */
  volume: number;
  /** Whether audio is loading */
  isLoading: boolean;
  /** Error message if audio failed to load */
  error: string | null;
}

/** Props for MyLibraryView component */
export interface MyLibraryViewProps {
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Number of items per page */
  pageSize?: number;
}

/** Props for LibraryGrid component */
export interface LibraryGridProps {
  /** Array of enriched generation data */
  generations: EnrichedGenerationDto[];
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Number of items per page (for skeleton count) */
  pageSize: number;
  /** ID of currently playing audio (null if none) */
  activeAudioId: string | null;
  /** Handler for play action */
  onPlay: (id: string, url: string) => void;
  /** Handler for pause action */
  onPause: (id: string) => void;
  /** Register audio element for centralized playback control */
  registerAudio?: (id: string, audioElement: HTMLAudioElement) => void;
  /** Unregister audio element when unmounted */
  unregisterAudio?: (id: string) => void;
  /** Handler for delete action */
  onDelete: (id: string) => void;
}

/** Props for GeneratedStoryCard component */
export interface GeneratedStoryCardProps {
  /** Generation data with enriched story title */
  generation: EnrichedGenerationDto;
  /** Whether this card's audio is currently active */
  isAudioActive: boolean;
  /** Register audio element for centralized playback control */
  registerAudio?: (id: string, audioElement: HTMLAudioElement) => void;
  /** Unregister audio element when unmounted */
  unregisterAudio?: (id: string) => void;
  /** Handler for play action */
  onPlay: (id: string, url: string) => void;
  /** Handler for pause action */
  onPause: (id: string) => void;
  /** Handler for delete action */
  onDelete: (id: string) => void;
}

/** Props for AudioPlayer component */
export interface AudioPlayerProps {
  /** URL of the audio file to play */
  audioUrl: string;
  /** Whether this audio player is currently active */
  isActive: boolean;
  /** Handler called when play is triggered */
  onPlay: () => void;
  /** Handler called when pause is triggered */
  onPause: () => void;
}

/** Props for StatusBadge component */
export interface StatusBadgeProps {
  /** Current generation status */
  status: GenerationStatus;
  /** Additional CSS classes */
  className?: string;
}

/** Props for ProgressDisplay component */
export interface ProgressDisplayProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Current generation status */
  status: GenerationStatus;
}

/** Props for DeleteConfirmationDialog component */
export interface DeleteConfirmationDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Generation to be deleted (null if none) */
  generation: EnrichedGenerationDto | null;
  /** Whether deletion is in progress */
  isDeleting: boolean;
  /** Error message if deletion failed */
  error: string | null;
  /** Handler for confirm action */
  onConfirm: () => Promise<void>;
  /** Handler for cancel action */
  onCancel: () => void;
}

/** Props for EmptyLibraryState component */
export interface EmptyLibraryStateProps {
  /** Custom message to display */
  message?: string;
  /** CTA button text */
  ctaText?: string;
  /** CTA button href */
  ctaHref?: string;
}

//#endregion

//
//#region Generation Logs (Internal)

/** DB row shortcut */
type GenLogRow = Database["public"]["Tables"]["generation_logs"]["Row"];

/** DTO for individual generation log entries */
export type GenerationLogDto = Pick<GenLogRow, "event" | "occurred_at">;

/** Response DTO for GET /api/story-generations/:id/logs */
export interface GetGenerationLogsResponseDto {
  logs: GenerationLogDto[];
  meta?: PaginationMetaDto;
}

//#endregion

//
//#region Story Generation View Models

/** Generation status type */
export type GenerationStatus = "pending" | "in_progress" | "completed" | "failed";

/** Internal generation state in component */
export interface GenerationState {
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** ID of current generation (from API) */
  generationId: string | null;
  /** Current generation status */
  status: "idle" | GenerationStatus;
  /** Generation progress (0-100) */
  progress: number;
  /** Error message if occurred */
  error: string | null;
  /** Timestamp of start (for time calculation) */
  startTime: number | null;
  /** Timestamp of last progress update */
  lastProgressUpdate: number | null;
  /** Last known progress (for calculating rate) */
  lastProgress: number;
}

/** Props for main view component */
export interface StoryGenerationViewProps {
  /** Story data from Astro */
  story: StoryDto;
  /** Whether user has voice sample */
  userHasVoiceSample: boolean;
}

/** Props for progress display component */
export interface GenerationProgressDisplayProps {
  /** Current generation status */
  status: GenerationStatus;
  /** Generation progress (0-100) */
  progress: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}

/** Props for generation button section */
export interface GenerationSectionProps {
  /** Generate button click handler */
  onGenerate: () => void;
  /** Whether button is disabled */
  disabled: boolean;
  /** Whether generation is loading */
  isLoading: boolean;
  /** Whether user has voice sample */
  userHasVoiceSample: boolean;
  /** Current preference values */
  preferences: StoryGenerationPreferencesDto;
  /** Validation errors for preference controls */
  errors: StoryPreferencesFormErrors;
  /** Callback when preference values change */
  onPreferencesChange: (values: StoryGenerationPreferencesDto) => void;
}

/** Props for generate button */
export interface GenerateButtonProps {
  /** Button click handler */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Whether button is disabled */
  disabled: boolean;
  /** Whether button is in loading state */
  isLoading: boolean;
  /** Button type attribute */
  type?: "button" | "submit" | "reset";
}

/** Props for story content display */
export interface StoryContentDisplayProps {
  /** Story title */
  title: string;
  /** Story content */
  content: string;
}

/** Props for status indicator */
export interface StatusIndicatorProps {
  /** Current generation status */
  status: GenerationStatus;
}

/** Props for estimated time display */
export interface EstimatedTimeDisplayProps {
  /** Time remaining in seconds */
  timeRemaining?: number;
}

/** Props for error message */
export interface ErrorMessageProps {
  /** Error message text */
  message: string;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Whether error is dismissible */
  dismissible?: boolean;
}

/** Props for story preferences form */
export interface StoryPreferencesFormProps {
  /** Current form values */
  values: StoryGenerationPreferencesDto;
  /** Validation errors */
  errors: StoryPreferencesFormErrors;
  /** Callback when values change */
  onChange: (values: StoryGenerationPreferencesDto) => void;
}

/** Standardized API error */
export interface ApiError {
  /** HTTP status code */
  code: number;
  /** Error message */
  message: string;
}

/** Polling configuration */
export interface PollingConfig {
  /** Polling frequency in ms */
  intervalMs: number;
  /** Max retry attempts on error */
  maxRetries: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
}

//#endregion
