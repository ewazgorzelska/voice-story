import { Buffer } from "node:buffer";
import { ElevenLabsClient, ElevenLabs, ElevenLabsError } from "@elevenlabs/elevenlabs-js";
import type { Uploadable } from "@elevenlabs/elevenlabs-js/core/file/types";
import pRetry, { AbortError } from "p-retry";
import { logError, logInfo, logWarn } from "@/lib/logger";
import type { Logger } from "./openrouter.types";
import {
  type CaptchaPayload,
  CaptchaPayloadSchema,
  CreatePvcVoiceSchema,
  type CreatePvcVoiceParams,
  type ElevenLabsApiClient,
  type ElevenLabsApiClientOptions,
  type ElevenLabsHttpResponse,
  type ElevenLabsRetryOptions,
  type PvcLifecycleState,
  type PvcVerificationStatus,
  type PvcVoiceDraft,
  type SpeakerSample,
  type SpeakerSampleFilters,
  type TrainingJob,
  type TrainingState,
  type TrainingStatus,
  type UseVoiceOptions,
  UseVoiceOptionsSchema,
  type VoiceAssetMeta,
  type VoiceAssetSource,
  VoiceAssetSourceSchema,
  type VoiceFilter,
  VoiceFilterSchema,
  type VoiceSummary,
  type VoiceUsageContext,
} from "./elevenlabs.types";

const DEFAULT_RETRY_OPTIONS: ElevenLabsRetryOptions = {
  retries: 3,
  factor: 2,
  minTimeout: 500,
  maxTimeout: 5_000,
};

const DEFAULT_BASE_URL = "https://api.elevenlabs.io";

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

export class SdkElevenLabsApiClient implements ElevenLabsApiClient {
  public static create(options: ElevenLabsApiClientOptions): SdkElevenLabsApiClient {
    return new SdkElevenLabsApiClient(options);
  }

  private readonly client: ElevenLabsClient;
  private readonly logger: Logger;
  private readonly httpClient: typeof fetch;
  private readonly retryOptions: ElevenLabsRetryOptions;
  private readonly baseUrl: string;

  private constructor(private readonly options: ElevenLabsApiClientOptions) {
    const { apiKey, httpClient, baseUrl, retryOptions, logger } = options;

    this.client = new ElevenLabsClient({
      apiKey: () => apiKey,
      baseUrl: baseUrl ?? DEFAULT_BASE_URL,
    });

    this.logger = logger ?? createDefaultLogger();
    this.httpClient = httpClient ?? fetch;
    this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
    this.retryOptions = {
      ...DEFAULT_RETRY_OPTIONS,
      ...retryOptions,
    };
  }

  public async createVoice(params: CreatePvcVoiceParams): Promise<PvcVoiceDraft> {
    const parsed = CreatePvcVoiceSchema.parse(params);

    const payload: ElevenLabs.voices.CreatePvcVoiceRequest = {
      name: parsed.name,
      language: parsed.language ?? "en",
      description: parsed.description,
      labels: {
        ...(parsed.labels ?? {}),
        referenceId: parsed.referenceId,
      },
    };

    const response = await this.withRetry(() => this.client.voices.pvc.create(payload), "voices.pvc.create");

    const voiceId = response.voiceId;
    const voice = await this.getVoiceById(voiceId);

    const draft: PvcVoiceDraft = {
      voiceId,
      name: voice.name ?? parsed.name,
      referenceId: voice.labels?.referenceId ?? parsed.referenceId,
      state: this.deriveLifecycleState(voice),
      language: voice.fineTuning?.language ?? parsed.language ?? voice.voiceVerification?.language,
      createdAt: this.getTimestampFromUnix(voice.createdAtUnix),
      metadata: {
        description: voice.description,
        labels: voice.labels,
        verification: voice.voiceVerification,
        custom: parsed.metadata,
      },
    };

    return draft;
  }

  public async uploadVoiceAsset(voiceId: string, asset: VoiceAssetSource): Promise<VoiceAssetMeta> {
    const parsedAsset = VoiceAssetSourceSchema.parse(asset);
    const uploadable = await this.resolveUploadable(parsedAsset);

    const result = await this.withRetry(
      () =>
        this.client.voices.pvc.samples.create(voiceId, {
          files: [uploadable],
        }),
      "voices.pvc.samples.create"
    );

    const sample = result[0];

    if (!sample?.sampleId) {
      throw new Error("ElevenLabs SDK did not return a voice sample identifier");
    }

    const voice = await this.getVoiceById(voiceId);
    const summary = this.toVoiceSummary(voice);
    const fallbackFilename =
      parsedAsset.kind === "url"
        ? this.extractFilenameFromUrl(parsedAsset.url)
        : (parsedAsset.filename ?? summary.name);

    return {
      assetId: sample.sampleId,
      voiceId,
      filename: sample.fileName ?? fallbackFilename,
      mimeType:
        parsedAsset.kind === "buffer"
          ? (parsedAsset.mimeType ?? "audio/mpeg")
          : (parsedAsset.mimeTypeHint ?? "audio/mpeg"),
      durationSeconds: sample.durationSecs ?? parsedAsset.metrics?.durationSeconds,
      sizeBytes: sample.sizeBytes ?? parsedAsset.metrics?.sizeBytes,
      createdAt: new Date().toISOString(),
    };
  }

  public async getSpeakerAudio(voiceId: string, filters?: SpeakerSampleFilters): Promise<SpeakerSample[]> {
    const voice = await this.getVoiceById(voiceId);
    const samples = voice.samples ?? [];
    const limit = filters?.limit ?? samples.length;

    const selectedSamples = samples.slice(0, limit).filter((sample) => sample.sampleId);

    const results: SpeakerSample[] = [];

    for (const sample of selectedSamples) {
      if (filters?.minDurationSeconds && (sample.durationSecs ?? 0) < filters.minDurationSeconds) {
        continue;
      }

      if (filters?.maxDurationSeconds && (sample.durationSecs ?? 0) > filters.maxDurationSeconds) {
        continue;
      }

      const preview = await this.withRetry(
        () =>
          this.client.voices.pvc.samples.audio.get(voiceId, sample.sampleId ?? "", {
            removeBackgroundNoise: true,
          }),
        "voices.pvc.samples.audio.get"
      );

      results.push({
        sampleId: sample.sampleId ?? "",
        url: `data:${preview.mediaType};base64,${preview.audioBase64}`,
        durationSeconds: preview.durationSecs ?? sample.durationSecs ?? 0,
        format: preview.mediaType,
        transcription: undefined,
        createdAt: new Date().toISOString(),
      });
    }

    return results;
  }

  public async submitCaptchaVerification(voiceId: string, payload: CaptchaPayload): Promise<PvcVerificationStatus> {
    const data = CaptchaPayloadSchema.parse(payload);

    const endpoint = `${this.baseUrl}/v1/voices/pvc/${voiceId}/verification/captcha`;
    const response = await this.executeHttpRequest(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": this.options.apiKey,
      },
      body: JSON.stringify({
        captcha_token: data.token,
        captcha_type: data.type,
      }),
    });

    if (response.status >= 400) {
      throw new Error(`Captcha verification failed with status ${response.status}`);
    }

    const voice = await this.getVoiceById(voiceId);
    const state = this.deriveLifecycleState(voice);

    return {
      voiceId,
      state,
      verifiedAt: voice.voiceVerification?.isVerified ? new Date().toISOString() : undefined,
      nextAction: this.resolveNextAction(state),
      reason: voice.voiceVerification?.verificationFailures?.[0],
    };
  }

  public async trainVoice(voiceId: string): Promise<TrainingJob> {
    await this.withRetry(() => this.client.voices.pvc.train(voiceId), "voices.pvc.train");

    return {
      jobId: voiceId,
      voiceId,
      state: "queued",
      submittedAt: new Date().toISOString(),
    };
  }

  public async getTrainingStatus(jobId: string): Promise<TrainingStatus> {
    const voice = await this.getVoiceById(jobId);
    const state = this.deriveTrainingState(voice);
    const progress = this.deriveTrainingProgress(voice);
    const message = this.deriveTrainingMessage(voice);

    const completed = state === "ready" || state === "failed";

    return {
      jobId,
      voiceId: jobId,
      state,
      progress,
      estimatedTimeSeconds: undefined,
      completedAt: completed ? new Date().toISOString() : undefined,
      failureReason: state === "failed" ? message : undefined,
    };
  }

  public async useVoice(voiceId: string, options: UseVoiceOptions): Promise<VoiceUsageContext> {
    const parsedOptions = UseVoiceOptionsSchema.parse(options);
    const voice = await this.getVoiceById(voiceId);

    const expiresAt =
      parsedOptions.expiresInSeconds !== undefined
        ? new Date(Date.now() + parsedOptions.expiresInSeconds * 1000).toISOString()
        : undefined;

    return {
      voiceId,
      playbackUrl: voice.previewUrl,
      expiresAt,
      metadata: {
        scenario: parsedOptions.scenario,
        labels: voice.labels,
      },
    };
  }

  public async listVoices(filter?: VoiceFilter): Promise<VoiceSummary[]> {
    const parsedFilter = VoiceFilterSchema.parse(filter);
    const response = await this.withRetry(() => this.client.voices.getAll(), "voices.getAll");

    const voices = response.voices ?? [];

    const filteredVoices = voices.filter((voice) => {
      if (parsedFilter?.referenceId && voice.labels?.referenceId !== parsedFilter.referenceId) {
        return false;
      }

      if (parsedFilter?.search) {
        const haystack = `${voice.name ?? ""} ${voice.description ?? ""}`.toLowerCase();
        if (!haystack.includes(parsedFilter.search.toLowerCase())) {
          return false;
        }
      }

      if (parsedFilter?.states?.length) {
        const state = this.deriveLifecycleState(voice);
        if (!parsedFilter.states.includes(state)) {
          return false;
        }
      }

      return true;
    });

    return filteredVoices
      .slice(0, parsedFilter?.limit ?? filteredVoices.length)
      .map((voice) => this.toVoiceSummary(voice));
  }

  // ==========================================================================
  // Internal Helpers
  // ==========================================================================

  private async getVoiceById(voiceId: string): Promise<ElevenLabs.Voice> {
    return this.withRetry(() => this.client.voices.get(voiceId), "voices.get");
  }

  private async withRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
    return pRetry(
      async () => {
        try {
          return await operation();
        } catch (error) {
          const statusCode = this.extractStatusCode(error);

          if (statusCode && statusCode < 500 && statusCode !== 429) {
            throw new AbortError(error instanceof Error ? error : new Error(String(error)));
          }

          throw error;
        }
      },
      {
        retries: this.retryOptions.retries,
        factor: this.retryOptions.factor,
        minTimeout: this.retryOptions.minTimeout,
        maxTimeout: this.retryOptions.maxTimeout,
        onFailedAttempt: (error) => {
          this.logger.warn(`Retryable ElevenLabs operation failed: ${label}`, {
            attemptNumber: error.attemptNumber,
            retriesLeft: error.retriesLeft,
            error: error instanceof Error ? error.message : String(error),
          });
        },
      }
    );
  }

  private deriveLifecycleState(voice: ElevenLabs.Voice): PvcLifecycleState {
    const verification = voice.voiceVerification;
    const fineTuningState = this.extractFineTuningState(voice)?.toLowerCase();

    if (fineTuningState === "fine_tuned") {
      return "ready";
    }

    if (fineTuningState === "fine_tuning" || fineTuningState === "queued") {
      return "training";
    }

    if (fineTuningState === "failed") {
      return "failed";
    }

    if (verification?.isVerified) {
      return "verified";
    }

    if (verification?.requiresVerification) {
      return "pending_verification";
    }

    return "draft";
  }

  private extractStatusCode(error: unknown): number | undefined {
    if (error instanceof ElevenLabsError) {
      return error.statusCode;
    }

    if (error instanceof Response) {
      return error.status;
    }

    if (typeof error === "object" && error !== null && "statusCode" in error) {
      const statusCode = (error as { statusCode?: unknown }).statusCode;
      if (typeof statusCode === "number") {
        return statusCode;
      }
    }

    if (typeof error === "object" && error !== null && "cause" in error) {
      const cause = (error as { cause?: unknown }).cause;
      if (cause) {
        return this.extractStatusCode(cause);
      }
    }

    return undefined;
  }

  private deriveTrainingState(voice: ElevenLabs.Voice): TrainingState {
    const fineTuningState = this.extractFineTuningState(voice)?.toLowerCase();

    switch (fineTuningState) {
      case "queued":
        return "queued";
      case "fine_tuning":
      case "delayed":
        return "processing";
      case "fine_tuned":
        return "ready";
      case "failed":
        return "failed";
      default:
        return "queued";
    }
  }

  private deriveTrainingProgress(voice: ElevenLabs.Voice): number | undefined {
    const progresses = voice.fineTuning?.progress;
    if (!progresses) {
      return undefined;
    }

    const values = Object.values(progresses).filter((value): value is number => typeof value === "number");
    if (!values.length) {
      return undefined;
    }

    const total = values.reduce((acc, current) => acc + current, 0);
    return Math.min(1, total / values.length);
  }

  private deriveTrainingMessage(voice: ElevenLabs.Voice): string | undefined {
    const messages = voice.fineTuning?.message;
    if (!messages) {
      return undefined;
    }

    const values = Object.values(messages).filter(
      (value): value is string => typeof value === "string" && value.length > 0
    );
    return values[0];
  }

  private extractFineTuningState(voice: ElevenLabs.Voice): ElevenLabs.FineTuningResponseModelStateValue | undefined {
    const state = voice.fineTuning?.state;
    if (!state) {
      return undefined;
    }

    const values = Object.values(state);
    return values.find((value): value is ElevenLabs.FineTuningResponseModelStateValue => typeof value === "string");
  }

  private resolveNextAction(state: PvcLifecycleState): PvcVerificationStatus["nextAction"] {
    switch (state) {
      case "pending_verification":
        return "retry_verification";
      case "verified":
        return "upload_samples";
      case "training":
        return "await_training";
      case "ready":
        return undefined;
      default:
        return undefined;
    }
  }

  private async resolveUploadable(asset: VoiceAssetSource): Promise<Uploadable.FileLike> {
    if (asset.kind === "buffer") {
      if (Buffer.isBuffer(asset.buffer)) {
        return asset.buffer;
      }

      if (asset.buffer instanceof Uint8Array) {
        return Buffer.from(asset.buffer);
      }

      if (asset.buffer instanceof ArrayBuffer) {
        return Buffer.from(asset.buffer);
      }

      throw new Error("Unsupported buffer asset type");
    }

    const response = await this.httpClient(asset.url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to download asset from ${asset.url}: ${response.status} ${response.statusText}`);
    }

    const data = new Uint8Array(await response.arrayBuffer());
    return Buffer.from(data);
  }

  private extractFilenameFromUrl(url: string): string {
    try {
      const { pathname } = new URL(url);
      const segments = pathname.split("/").filter(Boolean);
      return segments.at(-1) ?? "voice-sample.wav";
    } catch {
      return "voice-sample.wav";
    }
  }

  private toVoiceSummary(voice: ElevenLabs.Voice): VoiceSummary {
    return {
      voiceId: voice.voiceId,
      name: voice.name ?? "Untitled Voice",
      state: this.deriveLifecycleState(voice),
      language: voice.fineTuning?.language ?? voice.voiceVerification?.language,
      createdAt: this.getTimestampFromUnix(voice.createdAtUnix),
      updatedAt: undefined,
      metadata: {
        description: voice.description,
        labels: voice.labels,
        verification: voice.voiceVerification,
      },
    };
  }

  private getTimestampFromUnix(unix?: number): string {
    if (!unix) {
      return new Date().toISOString();
    }

    return new Date(unix * 1000).toISOString();
  }

  private async executeHttpRequest(
    url: string,
    init: RequestInit & { method: string; headers?: Record<string, string> }
  ): Promise<ElevenLabsHttpResponse<unknown>> {
    const response = await this.httpClient(url, init);

    return {
      status: response.status,
      headers: response.headers,
      data: await this.safeParseJson(response),
      raw: response,
    };
  }

  private async safeParseJson(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return undefined;
    }

    try {
      return await response.json();
    } catch (error) {
      this.logger.warn("Failed to parse ElevenLabs JSON response", { error });
      return undefined;
    }
  }
}
