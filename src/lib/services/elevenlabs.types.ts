import { Buffer } from "node:buffer";
import { z } from "zod";
import type { Logger } from "./openrouter.types";

// ============================================================================
// Constants & Enums
// ============================================================================

export const PVC_LIFECYCLE_STATES = [
  "draft",
  "pending_verification",
  "verified",
  "training",
  "ready",
  "failed",
] as const;

export type PvcLifecycleState = (typeof PVC_LIFECYCLE_STATES)[number];

export const TRAINING_STATUSES = ["queued", "processing", "ready", "failed"] as const;

export type TrainingState = (typeof TRAINING_STATUSES)[number];

export const CAPTCHA_TYPES = ["hcaptcha", "recaptcha_v2", "recaptcha_enterprise"] as const;

export type CaptchaType = (typeof CAPTCHA_TYPES)[number];

// ============================================================================
// Shared Types & Interfaces
// ============================================================================

export interface LifecycleMetadata {
  state: PvcLifecycleState;
  updatedAt: string;
  reason?: string;
}

export interface ElevenLabsHttpRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: BodyInit | null;
  signal?: AbortSignal;
}

export interface ElevenLabsHttpResponse<T> {
  status: number;
  headers: Headers;
  data: T;
  raw: Response;
}

export interface ElevenLabsPersistenceHandlers {
  onVoiceCreated?: (voice: PvcVoiceDraft) => Promise<void> | void;
  onTrainingStatus?: (status: TrainingStatus) => Promise<void> | void;
  onVerificationStatus?: (status: PvcVerificationStatus) => Promise<void> | void;
  onVoiceReady?: (voice: VoiceUsageContext) => Promise<void> | void;
}

export interface ElevenLabsRetryOptions {
  retries: number;
  factor: number;
  minTimeout: number;
  maxTimeout: number;
}

export interface ElevenLabsServiceOptions {
  apiKey?: string;
  apiClient?: ElevenLabsApiClient;
  logger?: Logger;
  httpClient?: typeof fetch;
  retryOptions?: Partial<ElevenLabsRetryOptions>;
  persistence?: ElevenLabsPersistenceHandlers;
}

export interface ElevenLabsApiClientOptions {
  apiKey: string;
  baseUrl?: string;
  httpClient?: typeof fetch;
  logger?: Logger;
  retryOptions?: Partial<ElevenLabsRetryOptions>;
}

// ============================================================================
// Voice Creation & Assets
// ============================================================================

export interface CreatePvcVoiceParams {
  name: string;
  description?: string;
  language?: string;
  referenceId: string;
  labels?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface PvcVoiceDraft {
  voiceId: string;
  name: string;
  referenceId: string;
  state: PvcLifecycleState;
  language?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface VoiceAssetUploadMetrics {
  durationSeconds?: number;
  sizeBytes?: number;
  checksum?: string;
}

export interface BufferVoiceAsset {
  kind: "buffer";
  buffer: ArrayBuffer | Uint8Array | Buffer;
  filename: string;
  mimeType?: string;
  metrics?: VoiceAssetUploadMetrics;
}

export interface UrlVoiceAsset {
  kind: "url";
  url: string;
  filename?: string;
  mimeTypeHint?: string;
  metrics?: VoiceAssetUploadMetrics;
}

export type VoiceAssetSource = BufferVoiceAsset | UrlVoiceAsset;

export interface VoiceAssetMeta {
  assetId: string;
  voiceId: string;
  filename: string;
  mimeType: string;
  durationSeconds?: number;
  sizeBytes?: number;
  createdAt: string;
}

export interface SpeakerSample {
  sampleId: string;
  url: string;
  durationSeconds: number;
  format: string;
  transcription?: string;
  createdAt: string;
}

export interface SpeakerSampleFilters {
  limit?: number;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
}

// ============================================================================
// Verification & Training
// ============================================================================

export interface CaptchaPayload {
  token: string;
  type: CaptchaType;
  expiresAt?: string;
}

export interface PvcVerificationStatus {
  voiceId: string;
  state: PvcLifecycleState;
  verifiedAt?: string;
  nextAction?: "upload_samples" | "await_training" | "retry_verification";
  reason?: string;
}

export interface TrainingJob {
  jobId: string;
  voiceId: string;
  state: TrainingState;
  submittedAt: string;
}

export interface TrainingStatus {
  jobId: string;
  voiceId: string;
  state: TrainingState;
  progress?: number;
  estimatedTimeSeconds?: number;
  completedAt?: string;
  failureReason?: string;
}

// ============================================================================
// Voice Usage & Listing
// ============================================================================

export interface UseVoiceOptions {
  scenario: "story_generation" | "preview" | "export" | string;
  expiresInSeconds?: number;
  forceRefresh?: boolean;
}

export interface VoiceUsageContext {
  voiceId: string;
  playbackUrl?: string;
  signedToken?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface VoiceFilter {
  referenceId?: string;
  states?: PvcLifecycleState[];
  search?: string;
  limit?: number;
}

export interface VoiceSummary {
  voiceId: string;
  name: string;
  state: PvcLifecycleState;
  language?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface PvcLifecycleEvent {
  type: "voice_created" | "training_status" | "verification_status" | "voice_ready";
  voiceId: string;
  payload: PvcVoiceDraft | TrainingStatus | PvcVerificationStatus | VoiceUsageContext;
}

// ============================================================================
// API Client Contract
// ============================================================================

export interface ElevenLabsApiClient {
  createVoice(params: CreatePvcVoiceParams): Promise<PvcVoiceDraft>;
  uploadVoiceAsset(voiceId: string, asset: VoiceAssetSource): Promise<VoiceAssetMeta>;
  getSpeakerAudio(voiceId: string, filters?: SpeakerSampleFilters): Promise<SpeakerSample[]>;
  submitCaptchaVerification(voiceId: string, payload: CaptchaPayload): Promise<PvcVerificationStatus>;
  trainVoice(voiceId: string): Promise<TrainingJob>;
  getTrainingStatus(jobId: string): Promise<TrainingStatus>;
  useVoice(voiceId: string, options: UseVoiceOptions): Promise<VoiceUsageContext>;
  listVoices(filter?: VoiceFilter): Promise<VoiceSummary[]>;
}

// ============================================================================
// Schemas
// ============================================================================

export const VoiceAssetUploadMetricsSchema = z
  .object({
    durationSeconds: z.number().positive().max(600).optional(),
    sizeBytes: z
      .number()
      .positive()
      .max(64 * 1024 * 1024)
      .optional(),
    checksum: z
      .string()
      .regex(/^[a-f0-9]{64}$/i, "Checksum must be a SHA-256 hex string")
      .optional(),
  })
  .optional();

export const BufferVoiceAssetSchema = z.object({
  kind: z.literal("buffer"),
  buffer: z.custom<ArrayBuffer | Uint8Array | Buffer>((value) => {
    return value instanceof ArrayBuffer || value instanceof Uint8Array || value instanceof Buffer;
  }, "Buffer asset must be an ArrayBuffer, Uint8Array, or Buffer"),
  filename: z.string().min(1, "Filename is required"),
  mimeType: z
    .string()
    .regex(/^audio\//)
    .optional(),
  metrics: VoiceAssetUploadMetricsSchema,
});

export const UrlVoiceAssetSchema = z.object({
  kind: z.literal("url"),
  url: z.string().url(),
  filename: z.string().min(1).optional(),
  mimeTypeHint: z
    .string()
    .regex(/^audio\//)
    .optional(),
  metrics: VoiceAssetUploadMetricsSchema,
});

export const VoiceAssetSourceSchema = z.discriminatedUnion("kind", [BufferVoiceAssetSchema, UrlVoiceAssetSchema]);

export const CreatePvcVoiceSchema = z.object({
  name: z.string().min(1, "Voice name is required"),
  description: z.string().max(512).optional(),
  language: z.string().min(2).max(10).optional(),
  referenceId: z.string().min(1, "Reference ID is required"),
  labels: z.record(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CaptchaPayloadSchema = z.object({
  token: z.string().min(1, "Captcha token is required"),
  type: z.enum(CAPTCHA_TYPES),
  expiresAt: z.string().datetime().optional(),
});

export const UseVoiceOptionsSchema = z.object({
  scenario: z.string().min(1),
  expiresInSeconds: z.number().int().positive().max(3600).optional(),
  forceRefresh: z.boolean().optional(),
});

export const VoiceFilterSchema = z
  .object({
    referenceId: z.string().optional(),
    states: z.array(z.enum(PVC_LIFECYCLE_STATES)).min(1).optional(),
    search: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
  })
  .optional();

export const ElevenLabsServiceOptionsSchema = z.object({
  apiKey: z.string().optional(),
  apiClient: z.custom<ElevenLabsApiClient>().optional(),
  logger: z.custom<Logger>().optional(),
  httpClient: z.custom<typeof fetch>().optional(),
  retryOptions: z
    .object({
      retries: z.number().int().min(0).optional(),
      factor: z.number().positive().optional(),
      minTimeout: z.number().positive().optional(),
      maxTimeout: z.number().positive().optional(),
    })
    .optional(),
  persistence: z
    .object({
      onVoiceCreated: z.custom<ElevenLabsPersistenceHandlers["onVoiceCreated"]>().optional(),
      onTrainingStatus: z.custom<ElevenLabsPersistenceHandlers["onTrainingStatus"]>().optional(),
      onVerificationStatus: z.custom<ElevenLabsPersistenceHandlers["onVerificationStatus"]>().optional(),
      onVoiceReady: z.custom<ElevenLabsPersistenceHandlers["onVoiceReady"]>().optional(),
    })
    .optional(),
});

export type ElevenLabsServiceOptionsInput = z.input<typeof ElevenLabsServiceOptionsSchema>;
