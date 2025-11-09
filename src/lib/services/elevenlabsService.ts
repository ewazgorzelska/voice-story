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
