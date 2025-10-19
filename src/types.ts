// src/types.ts

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
  pageSize: number;
  /** Total number of items */
  total: number;
}

/** DB row shortcut */
type StoryRow = Database["public"]["Tables"]["stories"]["Row"];

/** Summary DTO for story listings */
export type StorySummaryDto = Pick<StoryRow, "id" | "title" | "slug">;

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

/** Command Model for POST /api/story-generations */
export type CreateStoryGenerationCommand = Pick<StoryGenInsert, "story_id">;

/** Response DTO for POST /api/story-generations */
export type CreateStoryGenerationResponseDto = Pick<StoryGenRow, "id" | "status" | "progress">;

/** DTO for story generation items (list and single) */
export type StoryGenerationDto = Pick<StoryGenRow, "id" | "story_id" | "status" | "progress" | "result_url">;

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
//#region Generation Logs (Internal)

/** DB row shortcut */
type GenLogRow = Database["public"]["Tables"]["generation_logs"]["Row"];

/** DTO for individual generation log entries */
export type GenerationLogDto = Pick<GenLogRow, "event" | "occurred_at">;

/** Response DTO for GET /api/story-generations/:id/logs */
export interface GetGenerationLogsResponseDto {
  logs: GenerationLogDto[];
}

//#endregion
