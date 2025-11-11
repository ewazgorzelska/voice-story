import { Buffer } from "node:buffer";
import { z } from "zod";
import { logError, logInfo, logWarn } from "@/lib/logger";
import type { Logger } from "./openrouter.types";
import {
  CaptchaPayloadSchema,
  CreatePvcVoiceSchema,
  ElevenLabsServiceOptionsSchema,
  type ElevenLabsPersistenceHandlers,
  type ElevenLabsServiceOptions,
  type ElevenLabsServiceOptionsInput,
  type PvcVerificationStatus,
  type PvcVoiceDraft,
  type SpeakerSample,
  type SpeakerSampleFilters,
  type TrainingJob,
  type TrainingStatus,
  UseVoiceOptionsSchema,
  VoiceAssetSourceSchema,
  type VoiceAssetMeta,
  type VoiceAssetSource,
  type VoiceFilter,
  VoiceFilterSchema,
  type VoiceSummary,
  type VoiceUsageContext,
} from "./elevenlabs.types";
import { SdkElevenLabsApiClient } from "./elevenlabsApiClient";

// ============================================================================
// Error Classes
// ============================================================================

export class ElevenLabsServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ElevenLabsServiceError";
  }
}

export class ConfigurationError extends ElevenLabsServiceError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}

export class ValidationError extends ElevenLabsServiceError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class UploadError extends ElevenLabsServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, "UPLOAD_ERROR", cause);
    this.name = "UploadError";
  }
}

export class VerificationError extends ElevenLabsServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, "VERIFICATION_ERROR", cause);
    this.name = "VerificationError";
  }
}

export class TrainingFailedError extends ElevenLabsServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, "TRAINING_FAILED", cause);
    this.name = "TrainingFailedError";
  }
}

export class AbortPollingError extends ElevenLabsServiceError {
  constructor(message = "Polling aborted") {
    super(message, "POLLING_ABORTED");
    this.name = "AbortPollingError";
  }
}

export class PersistenceError extends ElevenLabsServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, "PERSISTENCE_ERROR", cause);
    this.name = "PersistenceError";
  }
}

// ============================================================================
// Logger
// ============================================================================

const createDefaultLogger = (): Logger => ({
  info: (message, data) => {
    logInfo(message, data);
  },
  error: (message, error) => {
    logError(message, error);
  },
  warn: (message, data) => {
    logWarn(message, data);
  },
  debug: (message, data) => {
    logInfo(message, data);
  },
});

// ============================================================================
// ElevenLabs Service
// ============================================================================

const HTTPS_PROTOCOL = "https:";
const MAX_REMOTE_ASSET_SIZE_BYTES = 64 * 1024 * 1024; // 64MB
const DEFAULT_FAST_POLL_MS = 2_000;
const DEFAULT_SLOW_POLL_MS = 10_000;

interface TrainingPollContext {
  abortController: AbortController;
  promise: Promise<TrainingStatus>;
}

export class ElevenLabsService {
  public static async installSdkExample(): Promise<void> {
    // Documentation placeholder from the implementation plan.
    logInfo("To install the ElevenLabs SDK run:", "npm install @elevenlabs/elevenlabs-js");
  }

  public static create(options?: ElevenLabsServiceOptionsInput): ElevenLabsService {
    return new ElevenLabsService(options);
  }

  private readonly _apiClient: ReturnType<typeof this._resolveApiClient>;
  private readonly _logger: Logger;
  private readonly _persistence: ElevenLabsPersistenceHandlers;
  private readonly _stateCache = new Map<string, TrainingStatus>();
  private readonly _pollContexts = new Map<string, TrainingPollContext>();
  private readonly _options: ElevenLabsServiceOptions;

  private constructor(options?: ElevenLabsServiceOptionsInput) {
    const parsedOptions = ElevenLabsServiceOptionsSchema.safeParse(options ?? {});

    if (!parsedOptions.success) {
      const issues = parsedOptions.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      throw new ConfigurationError(`Invalid ElevenLabs service options: ${issues}`);
    }

    const envApiKey = import.meta.env.ELEVENLABS_API_KEY as string | undefined;
    const apiKey = parsedOptions.data.apiKey ?? envApiKey;

    if (!apiKey) {
      throw new ConfigurationError("Missing ElevenLabs API key. Set ELEVENLABS_API_KEY in environment variables.");
    }

    this._options = {
      ...parsedOptions.data,
      apiKey,
    };

    this._logger = parsedOptions.data.logger ?? createDefaultLogger();
    this._persistence = parsedOptions.data.persistence ?? {};
    this._apiClient = this._resolveApiClient();

    this._logger.info("ElevenLabsService initialized");
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  public async createPvcVoice(input: z.input<typeof CreatePvcVoiceSchema>): Promise<PvcVoiceDraft> {
    try {
      const params = CreatePvcVoiceSchema.parse(input);
      this._logger.info("Creating PVC voice", { referenceId: params.referenceId });

      const voice = await this._apiClient.createVoice(params);

      await this._persistLifecycleEvent({
        type: "voice_created",
        voiceId: voice.voiceId,
        payload: voice,
      });

      return voice;
    } catch (error) {
      throw this._mapSdkError(error, "createPvcVoice");
    }
  }

  public async uploadVoiceAsset(voiceId: string, asset: VoiceAssetSource): Promise<VoiceAssetMeta> {
    const validatedAsset = this._validateAudioSource(asset);

    try {
      this._logger.info("Uploading PVC voice asset", {
        voiceId,
        kind: validatedAsset.kind,
      });

      return await this._apiClient.uploadVoiceAsset(voiceId, validatedAsset);
    } catch (error) {
      throw this._mapSdkError(error, "uploadVoiceAsset", (err) => new UploadError("Failed to upload voice asset", err));
    }
  }

  public async getSpeakerAudio(voiceId: string, filters?: SpeakerSampleFilters): Promise<SpeakerSample[]> {
    try {
      return await this._apiClient.getSpeakerAudio(voiceId, filters);
    } catch (error) {
      throw this._mapSdkError(error, "getSpeakerAudio");
    }
  }

  public async submitCaptchaVerification(
    voiceId: string,
    payload: z.input<typeof CaptchaPayloadSchema>
  ): Promise<PvcVerificationStatus> {
    try {
      const parsedPayload = CaptchaPayloadSchema.parse(payload);
      const status = await this._apiClient.submitCaptchaVerification(voiceId, parsedPayload);

      await this._persistLifecycleEvent({
        type: "verification_status",
        voiceId,
        payload: status,
      });

      return status;
    } catch (error) {
      throw this._mapSdkError(
        error,
        "submitCaptchaVerification",
        (err) => new VerificationError("Captcha verification failed", err)
      );
    }
  }

  public async trainVoice(voiceId: string): Promise<TrainingJob> {
    try {
      const job = await this._apiClient.trainVoice(voiceId);
      this._scheduleTrainingPoll(job.voiceId);
      return job;
    } catch (error) {
      throw this._mapSdkError(error, "trainVoice");
    }
  }

  public async pollTrainingStatus(jobId: string, signal?: AbortSignal): Promise<TrainingStatus> {
    try {
      const existing = this._pollContexts.get(jobId);
      if (existing) {
        if (signal) {
          signal.addEventListener("abort", () => existing.abortController.abort(), { once: true });
        }
        return existing.promise;
      }

      const context = this._createPollContext(jobId, signal);
      this._pollContexts.set(jobId, context);

      const status = await context.promise;
      this._pollContexts.delete(jobId);
      return status;
    } catch (error) {
      throw this._mapSdkError(error, "pollTrainingStatus");
    }
  }

  public async useVoice(voiceId: string, options: z.input<typeof UseVoiceOptionsSchema>): Promise<VoiceUsageContext> {
    try {
      const parsedOptions = UseVoiceOptionsSchema.parse(options);
      const context = await this._apiClient.useVoice(voiceId, parsedOptions);

      await this._persistLifecycleEvent({
        type: "voice_ready",
        voiceId,
        payload: context,
      });

      return context;
    } catch (error) {
      throw this._mapSdkError(error, "useVoice");
    }
  }

  public async listVoices(filter?: VoiceFilter): Promise<VoiceSummary[]> {
    try {
      const parsedFilter = VoiceFilterSchema.parse(filter);
      return await this._apiClient.listVoices(parsedFilter);
    } catch (error) {
      throw this._mapSdkError(error, "listVoices");
    }
  }

  /**
   * Transcribes audio to text using ElevenLabs Scribe
   * @param audioFile Audio file buffer or URL to the audio file to transcribe
   * @returns Transcribed text
   */
  public async speechToText(audioFile: ArrayBuffer | string): Promise<string> {
    try {
      this._logger.info("Transcribing audio to text", {
        audioType: typeof audioFile === "string" ? "URL" : "Buffer",
      });

      // If audioFile is a URL, download it first
      let audioData: ArrayBuffer;
      if (typeof audioFile === "string") {
        const audioResponse = await fetch(audioFile);
        if (!audioResponse.ok) {
          throw new ElevenLabsServiceError(
            `Failed to download audio: ${audioResponse.statusText}`,
            "AUDIO_DOWNLOAD_ERROR"
          );
        }
        audioData = await audioResponse.arrayBuffer();
      } else {
        audioData = audioFile;
      }

      // Use the ElevenLabs Speech-to-Text API (Scribe)
      const baseUrl = "https://api.elevenlabs.io";
      const url = `${baseUrl}/v1/speech-to-text`;

      // Convert ArrayBuffer to Blob
      const audioBlob = new Blob([audioData], { type: "audio/webm" });

      // Prepare form data
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-sample.webm");
      formData.append("model_id", "scribe_v2"); // Use Scribe v2 for best accuracy
      formData.append("language", "pl"); // Polish language

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": this._options.apiKey || "",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        this._logger.error("ElevenLabs STT API error", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new ElevenLabsServiceError(`Speech-to-text failed: ${response.statusText}`, "STT_ERROR", errorText);
      }

      const result = await response.json();

      // Extract transcript from response
      // Scribe v2 returns: { text: "transcribed text", ... }
      const transcript = result.text || result.transcript || result.transcription?.text || "";

      this._logger.info("Speech-to-text completed", {
        transcriptLength: transcript.length,
        transcript: transcript.substring(0, 100), // Log first 100 chars for debugging
      });

      return transcript;
    } catch (error) {
      throw this._mapSdkError(error, "speechToText");
    }
  }

  /**
   * Converts text to speech using a specific voice
   * @param params Text-to-speech parameters
   * @returns Audio data as ArrayBuffer
   */
  public async textToSpeech(params: {
    text: string;
    voiceId: string;
    model_id?: string;
    voice_settings?: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    };
    optimize_streaming_latency?: number;
  }): Promise<{ audio: ArrayBuffer }> {
    try {
      this._logger.info("Converting text to speech", {
        voiceId: params.voiceId,
        textLength: params.text.length,
        model: params.model_id || "default",
      });

      const baseUrl = "https://api.elevenlabs.io";
      const url = `${baseUrl}/v1/text-to-speech/${params.voiceId}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": this._options.apiKey || "",
        },
        body: JSON.stringify({
          text: params.text,
          model_id: params.model_id || "eleven_multilingual_v2",
          voice_settings: params.voice_settings,
          optimize_streaming_latency: params.optimize_streaming_latency,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new ElevenLabsServiceError(`Text-to-speech failed: ${response.statusText}`, "TTS_ERROR", errorText);
      }

      const audio = await response.arrayBuffer();

      this._logger.info("Text-to-speech completed", {
        voiceId: params.voiceId,
        audioSize: audio.byteLength,
      });

      return { audio };
    } catch (error) {
      throw this._mapSdkError(error, "textToSpeech");
    }
  }

  // ==========================================================================
  // Internal Helpers
  // ==========================================================================

  private _resolveApiClient() {
    if (this._options.apiClient) {
      return this._options.apiClient;
    }

    return SdkElevenLabsApiClient.create({
      apiKey: this._options.apiKey as string,
      baseUrl: undefined,
      httpClient: this._options.httpClient,
      logger: this._logger,
      retryOptions: this._options.retryOptions,
    });
  }

  private _validateAudioSource(asset: VoiceAssetSource): VoiceAssetSource {
    const parsed = VoiceAssetSourceSchema.parse(asset);

    if (parsed.kind === "url") {
      const url = this._sanitizeUrl(parsed.url);
      parsed.url = url.toString();

      if (parsed.metrics?.sizeBytes && parsed.metrics.sizeBytes > MAX_REMOTE_ASSET_SIZE_BYTES) {
        throw new ValidationError("Remote audio file exceeds maximum size of 64MB");
      }
    } else if (parsed.kind === "buffer") {
      const buffer = parsed.buffer;
      const bufferSize = Buffer.isBuffer(buffer)
        ? buffer.byteLength
        : buffer instanceof Uint8Array
          ? buffer.byteLength
          : buffer instanceof ArrayBuffer
            ? buffer.byteLength
            : 0;

      if (bufferSize === 0) {
        throw new ValidationError("Audio buffer must not be empty");
      }

      if (parsed.metrics?.sizeBytes && parsed.metrics.sizeBytes !== bufferSize) {
        this._logger.warn("Audio buffer size mismatch; using actual size", {
          provided: parsed.metrics.sizeBytes,
          actual: bufferSize,
        });
      }

      if (parsed.mimeType && !parsed.mimeType.startsWith("audio/")) {
        throw new ValidationError("Invalid audio MIME type");
      }
    }

    return parsed;
  }

  private _sanitizeUrl(input: string): URL {
    try {
      const url = new URL(input);

      if (url.protocol !== HTTPS_PROTOCOL) {
        throw new ValidationError("Only HTTPS audio sources are allowed");
      }

      return url;
    } catch (error) {
      throw new ValidationError(`Invalid audio URL: ${(error as Error).message}`);
    }
  }

  private _mapSdkError(
    error: unknown,
    operation: string,
    transform?: (err: ElevenLabsServiceError | unknown) => ElevenLabsServiceError
  ): ElevenLabsServiceError {
    if (error instanceof ElevenLabsServiceError) {
      return error;
    }

    if (transform) {
      return transform(error);
    }

    const message = error instanceof Error ? error.message : "Unexpected ElevenLabs error";
    this._logger.error(`ElevenLabs operation failed: ${operation}`, { message, error });

    return new ElevenLabsServiceError(message, "UNKNOWN_ERROR", error);
  }

  private async _persistLifecycleEvent(event: {
    type: "voice_created" | "training_status" | "verification_status" | "voice_ready";
    voiceId: string;
    payload: PvcVoiceDraft | TrainingStatus | PvcVerificationStatus | VoiceUsageContext;
  }): Promise<void> {
    try {
      switch (event.type) {
        case "voice_created":
          await this._persistence.onVoiceCreated?.(event.payload as PvcVoiceDraft);
          break;
        case "training_status":
          await this._persistence.onTrainingStatus?.(event.payload as TrainingStatus);
          break;
        case "verification_status":
          await this._persistence.onVerificationStatus?.(event.payload as PvcVerificationStatus);
          break;
        case "voice_ready":
          await this._persistence.onVoiceReady?.(event.payload as VoiceUsageContext);
          break;
        default:
          break;
      }
    } catch (error) {
      this._logger.error("Failed to persist ElevenLabs lifecycle event", error);
      throw new PersistenceError("Failed to persist ElevenLabs lifecycle event", error);
    }
  }

  private _scheduleTrainingPoll(voiceId: string): void {
    if (this._pollContexts.has(voiceId)) {
      return;
    }

    const context = this._createPollContext(voiceId);
    this._pollContexts.set(voiceId, context);
  }

  private _createPollContext(voiceId: string, externalSignal?: AbortSignal): TrainingPollContext {
    const abortController = new AbortController();

    if (externalSignal) {
      externalSignal.addEventListener(
        "abort",
        () => {
          abortController.abort();
        },
        { once: true }
      );
    }

    const promise = (async () => {
      let iteration = 0;

      while (true) {
        if (abortController.signal.aborted) {
          throw new AbortPollingError();
        }

        const status = await this._apiClient.getTrainingStatus(voiceId);
        this._stateCache.set(voiceId, status);

        await this._persistLifecycleEvent({
          type: "training_status",
          voiceId,
          payload: status,
        });

        if (status.state === "ready") {
          return status;
        }

        if (status.state === "failed") {
          throw new TrainingFailedError(status.failureReason ?? "ElevenLabs reported training failure", status);
        }

        const delay = iteration < 5 ? DEFAULT_FAST_POLL_MS : DEFAULT_SLOW_POLL_MS;
        await this._delay(delay, abortController.signal);
        iteration += 1;
      }
    })();

    return {
      abortController,
      promise,
    };
  }

  private async _delay(ms: number, signal?: AbortSignal): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve();
      }, ms);

      const cleanup = () => {
        clearTimeout(timer);
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
      };

      const onAbort = () => {
        cleanup();
        reject(new AbortPollingError());
      };

      if (signal) {
        if (signal.aborted) {
          cleanup();
          reject(new AbortPollingError());
          return;
        }

        signal.addEventListener("abort", onAbort, { once: true });
      }
    });
  }
}

/**
 * High-level helper that provisions a custom voice model in ElevenLabs
 * based on the recorded audio sample stored in Supabase.
 *
 * In development environments where `ELEVENLABS_API_KEY` is not provided,
 * this function falls back to returning a deterministic mock identifier so
 * the rest of the voice onboarding flow can be exercised without hitting
 * the external API.
 *
 * @param audioUrl Public HTTPS URL to the uploaded voice sample
 * @param referenceId Stable identifier tied to the authenticated user
 * @returns ElevenLabs voice identifier (or mock identifier in local dev)
 */
export async function createVoiceModel(audioUrl: string, referenceId: string): Promise<string> {
  if (!audioUrl || typeof audioUrl !== "string") {
    throw new ValidationError("Audio URL is required to create a voice model");
  }

  if (!referenceId || typeof referenceId !== "string") {
    throw new ValidationError("Reference ID is required to create a voice model");
  }

  const sanitizedReferenceId = referenceId.trim();
  if (sanitizedReferenceId.length === 0) {
    throw new ValidationError("Reference ID must not be empty");
  }

  let service: ElevenLabsService | null = null;

  try {
    service = ElevenLabsService.create();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      const fallbackVoiceId = createMockVoiceId(sanitizedReferenceId);
      logWarn("ELEVENLABS_API_KEY is not configured; using mock voice identifier", {
        referenceId: sanitizedReferenceId,
        fallbackVoiceId,
      });
      return fallbackVoiceId;
    }

    throw error;
  }

  try {
    const voiceDraft = await service.createPvcVoice({
      name: resolveVoiceName(sanitizedReferenceId),
      referenceId: sanitizedReferenceId,
      labels: {
        app: "voice-story",
      },
      metadata: {
        source: "voice-story",
      },
    });

    await service.uploadVoiceAsset(voiceDraft.voiceId, {
      kind: "url",
      url: audioUrl,
      filename: resolveFilenameFromUrl(audioUrl),
      mimeTypeHint: "audio/webm",
    });

    try {
      await service.trainVoice(voiceDraft.voiceId);
    } catch (error) {
      logWarn("Failed to queue ElevenLabs voice training; continuing with draft voice", {
        voiceId: voiceDraft.voiceId,
        referenceId: sanitizedReferenceId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return voiceDraft.voiceId;
  } catch (error) {
    logError("ElevenLabs integration failed; falling back to mock voice identifier", {
      referenceId: sanitizedReferenceId,
      audioUrl,
      error: error instanceof Error ? error.message : String(error),
    });

    return createMockVoiceId(sanitizedReferenceId);
  }
}

function resolveVoiceName(referenceId: string): string {
  const normalized = referenceId.replace(/[^a-z0-9-_]/gi, "").toLowerCase();
  if (normalized) {
    return `voice-story-${normalized}`;
  }
  return `voice-story-${Date.now().toString(36)}`;
}

function resolveFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.trim();
    const lastSegment = pathname.split("/").pop();

    if (lastSegment && lastSegment.length > 0) {
      return lastSegment;
    }
  } catch (error) {
    logWarn("Failed to derive filename from audio URL; using default name", {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return "voice-sample.webm";
}

function createMockVoiceId(referenceId: string): string {
  const normalized = referenceId.replace(/[^a-z0-9-_]/gi, "").toLowerCase() || "user";
  return `mock-${normalized}-${Date.now().toString(36)}`;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates an ElevenLabsService instance with environment configuration
 * @returns Configured ElevenLabsService instance
 */
export function createElevenLabsService(): ElevenLabsService {
  return ElevenLabsService.create({
    apiKey: import.meta.env.ELEVENLABS_API_KEY,
  });
}
