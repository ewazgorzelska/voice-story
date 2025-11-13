import { Buffer } from "node:buffer";
import { ElevenLabsClient, ElevenLabs, ElevenLabsError } from "@elevenlabs/elevenlabs-js";
import type { Uploadable } from "@elevenlabs/elevenlabs-js/core/file/types";
import pRetry, { AbortError } from "p-retry";
import { logError, logInfo, logWarn } from "@/lib/logger";
import type { Logger } from "./openrouter.types";
import {
  CreateIvcVoiceSchema,
  type CreateIvcVoiceParams,
  type ElevenLabsApiClient,
  type ElevenLabsApiClientOptions,
  type ElevenLabsRetryOptions,
  type IvcLifecycleState,
  type IvcVoiceDraft,
  type SpeakerSample,
  type SpeakerSampleFilters,
  type UseVoiceOptions,
  UseVoiceOptionsSchema,
  type VoiceAssetSource,
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

  public async createVoice(params: CreateIvcVoiceParams): Promise<IvcVoiceDraft> {
    const parsed = CreateIvcVoiceSchema.parse(params);

    // Resolve all audio files to uploadable format
    const uploadableFiles: Uploadable.FileLike[] = [];
    for (const asset of parsed.files) {
      const uploadable = await this.resolveUploadable(asset);
      uploadableFiles.push(uploadable);
    }

    // Create voice with IVC (Instant Voice Cloning)
    const labelsWithRef: Record<string, string> = {
      ...(parsed.labels ?? {}),
      referenceId: parsed.referenceId,
    };

    const response = await this.withRetry(
      () =>
        this.client.voices.ivc.create({
          name: parsed.name,
          description: parsed.description,
          files: uploadableFiles,
          labels: JSON.stringify(labelsWithRef), // IVC API expects serialized JSON string
        }),
      "voices.ivc.create"
    );

    const voiceId = response.voiceId;
    const voice = await this.getVoiceById(voiceId);

    const draft: IvcVoiceDraft = {
      voiceId,
      name: voice.name ?? parsed.name,
      referenceId: voice.labels?.referenceId ?? parsed.referenceId,
      state: this.deriveLifecycleState(voice),
      createdAt: this.getTimestampFromUnix(voice.createdAtUnix),
      metadata: {
        description: voice.description,
        labels: voice.labels,
        custom: parsed.metadata,
      },
    };

    return draft;
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

      // For IVC voices, samples are already available
      // Note: The SDK doesn't provide direct audio URLs for samples
      // We'll need to construct a placeholder or fetch them separately if needed
      results.push({
        sampleId: sample.sampleId ?? "",
        url: "", // IVC samples don't have direct URLs in the API response
        durationSeconds: sample.durationSecs ?? 0,
        format: sample.mimeType ?? "audio/mpeg",
        transcription: undefined,
        createdAt: new Date().toISOString(),
      });
    }

    return results;
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

  private deriveLifecycleState(voice: ElevenLabs.Voice): IvcLifecycleState {
    // IVC voices are instantly ready after creation
    // Check if voice has samples - if yes, it's ready
    if (voice.samples && voice.samples.length > 0) {
      return "ready";
    }

    // Check for any failure indicators
    if (voice.fineTuning?.state && Object.values(voice.fineTuning.state).includes("failed")) {
      return "failed";
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
      createdAt: this.getTimestampFromUnix(voice.createdAtUnix),
      updatedAt: undefined,
      metadata: {
        description: voice.description,
        labels: voice.labels,
      },
    };
  }

  private getTimestampFromUnix(unix?: number): string {
    if (!unix) {
      return new Date().toISOString();
    }

    return new Date(unix * 1000).toISOString();
  }
}
