# ElevenLabs Service Implementation Plan

## 1. Service Description
- Provide a typed `ElevenLabsService` in `src/lib/services/elevenlabsService.ts` that wraps ElevenLabs Professional Voice Cloning (PVC) workflows for Astro/React consumers.
- Use the official ElevenLabs TypeScript SDK for authenticated REST calls while preserving support for fetch-based fallbacks if the SDK lacks an endpoint.
- Persist PVC metadata (voice IDs, training status, asset URLs) to Supabase via higher-level orchestration hooks; the service remains storage-agnostic and exposes hooks/callbacks for persistence.

1. **ElevenLabsService Orchestrator**
   - **Functionality**: Central entry point providing high-level PVC operations (create, verify, train, list, playback preparation) and coordinating state transitions.
   - **Challenges**
     1. Aligning multiple asynchronous steps (upload → verification → training) without losing state.
     2. Guaranteeing idempotency when clients retry steps.
   - **Solutions**
     1. Track PVC lifecycle through a finite-state model (`"draft" | "pending_verification" | "verified" | "training" | "ready" | "failed"`) returned from every method.
     2. Accept client-supplied `referenceId` and reuse stored ElevenLabs identifiers to short-circuit duplicate requests.

2. **ElevenLabsApiClient**
   - **Functionality**: Thin wrapper around the SDK that injects API key, default headers, retry policy, and logging.
   - **Challenges**
     1. Handling SDK version drift or missing methods.
     2. Managing rate limits and transient network errors.
   - **Solutions**
     1. Encapsulate SDK calls behind adapter methods with narrow interfaces so alternative HTTP implementations can be slotted in.
     2. Configure exponential backoff using `p-retry` or a custom wrapper, surfacing retry metadata through structured logs.

3. **AudioAssetManager**
   - **Functionality**: Validates, uploads, and links source audio to ElevenLabs PVC slots; supports direct file buffers and Supabase storage URLs.
   - **Challenges**
     1. Ensuring uploads comply with ElevenLabs file size/format limits.
     2. Preventing SSRF and unauthorized file access when ingesting remote URLs.
   - **Solutions**
     1. Run MIME sniffing, duration checks (via ffprobe in worker or provided metadata), and hard-size caps before upload.
     2. Require pre-signed HTTPS URLs, sanitize domains, and optionally proxy uploads through a backend fetch to keep secrets server-side.

4. **CaptchaVerificationManager**
   - **Functionality**: Orchestrates PVC captcha verification using ElevenLabs verification endpoints and integrates with the UI captcha widget.
   - **Challenges**
     1. Coordinating external captcha tokens and ensuring they expire gracefully.
     2. Securely storing interim tokens without leaking them to clients.
   - **Solutions**
     1. Accept `captchaToken` from the frontend, validate server-side within 2 minutes, and invalidate once consumed.
     2. Store the verification payload in Supabase with row-level security keyed to the user session.

5. **TrainingJobManager**
   - **Functionality**: Kicks off PVC training, polls status, and emits progress events to subscribers (hooks, websockets, or server-sent events).
   - **Challenges**
     1. Polling frequency vs. API quotas.
     2. Communicating progress back to clients in real time.
   - **Solutions**
     1. Implement adaptive polling (fast immediately after job submission, slow when idle) with `AbortSignal` support.
     2. Expose an RxJS/Observable interface or callback registration so UI layers can subscribe without tight coupling.

6. **VoiceUsageGateway**
   - **Functionality**: Supplies the trained voice ID and signed playback URLs to downstream services (story narration generator, TTS renderer).
   - **Challenges**
     1. Consistent caching of voice metadata between frontend and backend.
     2. Revoking access when a voice is deleted or permissions change.
   - **Solutions**
     1. Cache voice descriptors with `@supabase/auth-helpers-astro` session-aware storage and include ETags; invalidate on training completion events.
     2. Provide a `refreshVoiceMetadata` method that re-fetches state when Supabase signals permission updates.

## 2. Constructor Description
- `constructor(options: ElevenLabsServiceOptions)` in `ElevenLabsService` accepts:
  - `apiClient` (defaults to an instance of `ElevenLabsApiClient` configured with `process.env.ELEVENLABS_API_KEY` via `import.meta.env` guards).
  - `logger` implementing `{ info(...args): void; error(...args): void; }`, defaulting to `@/lib/logger`.
  - Optional `persistence` callbacks (`onVoiceCreated`, `onTrainingStatus`, `onVoiceReady`) to integrate with Supabase without hard dependencies.
- Constructor validates the API key immediately, sets default retry/backoff configuration, and initializes any Observables/event emitters for downstream usage.

## 3. Public Methods and Fields
1. `installSdkExample(): Promise<void>` (documentation placeholder, not executed) — documents installing the SDK with `npm install @elevenlabs/elevenlabs`. **Example**: run `npm install @elevenlabs/elevenlabs`.
2. `createPvcVoice(input: CreatePvcVoiceParams): Promise<PvcVoiceDraft>` — calls ElevenLabs `voices.create` with metadata (name, description, language, `referenceId`). Challenges include idempotency and validation; uses AudioAssetManager to validate supplied sample metadata.
   - **Example**:
     ```ts
     const service = await ElevenLabsService.create();
     const draft = await service.createPvcVoice({ name: "Narrator A", referenceId: userId });
     ```
3. `uploadVoiceAsset(voiceId: string, asset: VoiceAssetSource): Promise<VoiceAssetMeta>` — supports Buffer uploads or remote HTTPS URLs by delegating to SDK `voice.addSamples`.
   - **Example**:
     ```ts
     await service.uploadVoiceAsset(draft.voiceId, { file: await fs.readFile(tmpPath), filename: "sample.wav" });
     ```
4. `getSpeakerAudio(voiceId: string, options?: SpeakerSampleFilters): Promise<SpeakerSample[]>` — wraps SDK retrieval of speaker audio assets for preview or validation.
   - **Example**:
     ```ts
     const samples = await service.getSpeakerAudio(voiceId, { limit: 3 });
     ```
5. `submitCaptchaVerification(voiceId: string, payload: CaptchaPayload): Promise<PvcVerificationStatus>` — posts captcha token to ElevenLabs verification endpoint, stores verification timestamp, returns next required action.
   - **Example**:
     ```ts
     await service.submitCaptchaVerification(voiceId, { token: captchaToken, type: "hcaptcha" });
     ```
6. `trainVoice(voiceId: string): Promise<TrainingJob>` — triggers PVC training via `voices.train` endpoint and returns job descriptor.
   - **Example**:
     ```ts
     const job = await service.trainVoice(voiceId);
     ```
7. `pollTrainingStatus(jobId: string, signal?: AbortSignal): Promise<TrainingStatus>` — polls ElevenLabs for job completion; resolves when status is `ready | failed`.
   - **Example**:
     ```ts
     const status = await service.pollTrainingStatus(job.jobId);
     ```
8. `useVoice(voiceId: string, options: UseVoiceOptions): Promise<VoiceUsageContext>` — fetches playback token or integration payload for story rendering (e.g., returns TTS voice ID for OpenRouterService).
   - **Example**:
     ```ts
     const context = await service.useVoice(voiceId, { scenario: "story_generation" });
     ```
9. `listVoices(filter?: VoiceFilter): Promise<VoiceSummary[]>` — optional helper to synchronize available voices for UI selection.

## 4. Private Methods and Fields
1. `_resolveApiClient()` — lazy-instantiates the SDK client with current API key and retry policy.
2. `_validateAudioSource(asset: VoiceAssetSource)` — checks MIME, duration, size, and URL safety.
3. `_mapSdkError(error: unknown, context: string)` — normalizes errors into typed `ElevenLabsServiceError`.
4. `_persistLifecycleEvent(event: PvcLifecycleEvent)` — invokes persistence callbacks when lifecycle updates occur.
5. `_schedulePoll(jobId: string, signal?: AbortSignal)` — manages polling intervals for training updates.
6. Private fields: `_apiClient`, `_logger`, `_persistence`, `_pollIntervals`, `_stateCache`.

## 5. Error Handling
1. **Missing configuration** — no API key in `import.meta.env`; throw `ConfigurationError` with remediation hint.
2. **Invalid audio input** — non-HTTPS URLs, unsupported MIME, duration outside ElevenLabs limits; return `ValidationError`.
3. **Upload failures** — network issues, 413 responses; retry with backoff, surface `UploadError`.
4. **Captcha verification failure** — expired token, incorrect captcha type; respond with `VerificationError` and require new token.
5. **Training failure** — ElevenLabs reports `failed` status; emit `TrainingFailedError` including `supportTicketUrl` if provided.
6. **Rate limiting** — handle HTTP 429 by retrying with server-provided `Retry-After` header.
7. **Unauthorized access** — API key revoked; log critical error and disable service until reconfigured.
8. **Data persistence errors** — Supabase write failures; wrap in `PersistenceError` and mark lifecycle event as pending retry.

## 6. Security Considerations
- Store the ElevenLabs API key only in server-side Astro runtime (`import.meta.env`); never expose it to clients.
- Validate and sanitize all external URLs before server-side fetches to avoid SSRF.
- Enforce RLS in Supabase for PVC metadata tables; use `context.locals.supabase` to read/write within API routes.
- Require authenticated user context for every mutating call; integrate with Astro middleware to inject session info.
- Use HTTPS-only communication with ElevenLabs and ensure TLS certificate pinning if platform permits.
- Rotate cached voice metadata and purge stale audio samples to reduce risk of unauthorized reuse.
- Log only non-sensitive identifiers; redact tokens, captcha payloads, and raw audio references.

## 7. Step-by-Step Implementation Plan
1. **Install SDK and dependencies**
   - Run `npm install @elevenlabs/elevenlabs`.
   - Add `p-retry`, `zod`, and `abort-controller` polyfills if not already present.
2. **Define types and schemas**
   - Create `PvcVoiceDraft`, `VoiceAssetSource`, `TrainingJob`, `TrainingStatus`, and `ElevenLabsServiceError` in `src/lib/services/elevenlabs.types.ts` or existing `openrouter.types.ts` equivalent.
   - Use Zod to validate incoming payloads in Astro API routes before calling the service.
3. **Implement ElevenLabsApiClient**
   - Wrap the SDK, configure base URL, attach interceptors for logging and retry.
   - Provide a factory method `ElevenLabsApiClient.create({ apiKey, fetch })`.
4. **Build ElevenLabsService**
   - Implement constructor validation and initialize private fields.
   - Expose public methods listed above, delegating SDK interactions to the API client.
   - Ensure every method emits lifecycle events through `_persistLifecycleEvent`.
5. **Handle audio ingestion**
   - Implement `_validateAudioSource` and integrate `AudioAssetManager` helpers.
   - Support both direct file buffers (from Supabase storage downloads) and HTTPS URLs.
6. **Captcha verification flow**
   - Create `submitCaptchaVerification` that calls ElevenLabs verification endpoint and stores verification state.
   - Integrate with frontend captcha widget by issuing short-lived verification sessions via Supabase.
7. **Training orchestration**
   - Implement `trainVoice` and `pollTrainingStatus` with adaptive polling and abort support.
   - Emit progress updates to persistence layer or event bus for UI updates.
8. **Voice usage integration**
   - Implement `useVoice` to prepare data for `OpenRouterService` or other TTS consumers (voice ID, preview URL, metadata).
   - Cache responses with Supabase keyed by user and voice ID.
9. **Testing and validation**
   - Write unit tests mocking the SDK to verify error handling and lifecycle transitions.
   - Add integration tests in Astro API routes that cover full PVC lifecycle using ElevenLabs sandbox credentials.
10. **Documentation and observability**
    - Update README and `.ai/tech-stack.md` with SDK usage notes if needed.
    - Configure structured logging (success/failure) and metrics for call counts, latency, and error rates.


