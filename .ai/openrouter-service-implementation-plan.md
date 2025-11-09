## Service Description

`OpenRouterService` centralizes chat-completion flows against the OpenRouter API for the Astro + TypeScript stack. It enforces consistent configuration, message construction, schema-aware response parsing, and telemetry-friendly error handling.

### Key Components

1. Configuration & Environment Management
   - **Functionality**: Load and validate API credentials, default model metadata, and runtime headers (`HTTP-Referer`, `X-Title`) from `import.meta.env` or dependency injection. Merge per-call overrides while preserving immutability.
   - **Challenges**
     1. Missing or malformed environment variables.
     2. Divergent defaults between serverless and long-lived runtimes.
   - **Solutions**
     1. Guard the constructor with schema validation (e.g., Zod) and descriptive errors surfaced through the logger.
     2. Accept an optional config object and fall back to environment-derived defaults, allowing the service to be re-instantiated with context-specific overrides.

2. HttpClientAdapter
   - **Functionality**: Wrap `fetch`/`undici` with shared headers, timeouts, abort handling, and (optional) streaming support for SSE responses.
   - **Challenges**
     1. Ensuring `fetch` uses TLS 1.2+ and respects Astro SSR deployment constraints.
     2. Managing request cancellation for user-aborted generations.
   - **Solutions**
     1. Re-use the global `fetch` provided by Astro/Node 18+ and enforce HTTPS-only requests by validating the base URL.
     2. Accept an `AbortSignal` on public methods and plumb it through to `fetch` while setting defensive default timeouts with `AbortController`.

3. ChatRequestComposer
   - **Functionality**: Assemble system, user, and assistant messages; apply `response_format`, `model`, and tunable parameters (temperature, top_p, max_tokens); and serialize to the OpenRouter chat schema.
   - **Challenges**
     1. Normalizing diverse caller payloads (e.g., string vs. structured messages).
     2. Enforcing JSON-schema-based `response_format` without duplicating schemas.
   - **Solutions**
     1. Define TypeScript DTOs (`ChatMessage`, `ChatCompletionOptions`) and provide helper transformers (e.g., `normalizeMessages`).
     2. Introduce a lightweight schema registry or accept schema payloads via options, validating them with a JSON Schema validator before transmission.

4. ResponseInterpreter
   - **Functionality**: Parse JSON responses, surface structured content, manage streaming tokens, and adapt OpenRouter metadata (usage, model ID) into domain DTOs.
   - **Challenges**
     1. Differentiating between normal JSON payloads and SSE streams.
     2. Safely parsing model responses that should match `response_format`.
   - **Solutions**
     1. Branch on the `stream` flag; for streaming, invoke a callback per chunk; otherwise, await the full JSON body.
     2. When `response_format` is JSON schema, run validation (e.g., Ajv) before returning data to callers, producing actionable errors when validation fails.

5. ErrorTelemetry & Retry Governance
   - **Functionality**: Centralize error mapping, logging, retry/backoff policies, and metric hooks.
   - **Challenges**
     1. Distinguishing retryable transport faults from business errors.
     2. Maintaining observability without leaking sensitive data.
   - **Solutions**
     1. Categorize errors by HTTP status and OpenRouter error codes, enabling exponential backoff for 5xx and rate-limit responses.
     2. Log contextual metadata (request id, model) via `@/lib/logger` while redacting prompts and secrets; expose typed error classes for upstream handling.

## Constructor Description

Instantiate `OpenRouterService` in `src/lib/services/openRouterService.ts` with:

- `config: OpenRouterConfig` (required) containing:
  - `apiKey: string` — retrieved from `import.meta.env.OPENROUTER_API_KEY`.
  - `baseUrl?: string` — defaults to `https://openrouter.ai/api/v1`.
  - `defaultModel: string` — e.g., `"anthropic/claude-3.5-sonnet"`.
  - `defaultParameters?: ModelParameters` — temperature, max tokens, top_p, etc.
  - `referer: string` — site URL for OpenRouter telemetry (must match production domain).
  - `siteTitle: string` — title sent via `X-Title`.
  - `logger?: Logger` — defaults to `@/lib/logger`.
  - `httpClient?: typeof fetch` — defaults to global `fetch`.

The constructor should:

1. Validate `apiKey`, `referer`, and `siteTitle`; throw a configuration error if missing.
2. Freeze the resolved configuration to guard against mutation.
3. Pre-compute default headers (`Authorization`, `HTTP-Referer`, `X-Title`, `Content-Type`) for reuse.

## Public Methods and Fields

- `sendChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult>`
  - Accepts normalized messages, optional overrides (`model`, `responseFormat`, `parameters`, `abortSignal`).
  - Routes to the HTTP client, validates the response against schema (when provided), and returns assistant message data plus usage metadata.
- `streamChatCompletion(options: StreamingChatCompletionOptions): Promise<void>`
  - Sends a streaming request (`stream: true`), invoking a caller-provided `onToken` callback per delta and a final `onComplete`.
  - Handles abort signals and ensures proper stream teardown.
- `withOverrides(overrides: Partial<OpenRouterConfig>): OpenRouterService`
  - Produces a new service instance with merged configuration (useful for per-request scoping).

### Request Assembly Examples

1. **System message**
   ```ts
   const systemMessage: ChatMessage = {
     role: "system",
     content: "You are a concise narrator who writes immersive audio-first stories.",
   };
   ```
2. **User message**
   ```ts
   const userMessage: ChatMessage = {
     role: "user",
     content: "Write the next scene where the hero enters the crystal forest.",
   };
   ```
3. **Structured response via `response_format`**
   ```ts
   const responseFormat: ResponseFormat = {
     type: "json_schema",
     json_schema: {
       name: "StorySegment",
       strict: true,
       schema: {
         type: "object",
         required: ["narration", "choices"],
         properties: {
           narration: { type: "string" },
           choices: {
             type: "array",
             minItems: 2,
             items: { type: "string" },
           },
         },
       },
     },
   };
   ```
4. **Model name override**
   ```ts
   const model = "openai/gpt-4o-mini"; // falls back to config.defaultModel if omitted
   ```
5. **Model parameters override**
   ```ts
   const parameters: ModelParameters = {
     temperature: 0.8,
     top_p: 0.9,
     max_output_tokens: 900,
   };
   ```

## Private Methods and Fields

- `buildHeaders(): Headers` — merges static headers with per-call additions (e.g., `Accept: text/event-stream` for streaming).
- `buildRequestBody(options): OpenRouterChatRequest` — normalizes messages, applies defaults, and injects `response_format` when provided.
- `executeRequest(request: RequestInit & { url: string }): Promise<Response>` — applies abort/timeouts and centralizes retry logic.
- `parseNonStreamingResponse(response: Response): Promise<ChatCompletionResult>` — validates HTTP status, parses JSON, runs schema validation, and maps to domain DTOs.
- `consumeStream(response: Response, callbacks): Promise<void>` — reads SSE chunks, decodes JSON lines, and surfaces deltas via callbacks.
- `mapError(error: unknown, context: ErrorContext): OpenRouterServiceError` — converts low-level errors into typed application errors.

## Error Handling

1. Missing configuration (API key, referer, site title) → throw `ConfigurationError` during construction; instruct operators via log message.
2. Network failures / timeouts → retry with exponential backoff when safe; otherwise throw `TransportError` tagged with retry hints.
3. HTTP 4xx responses (validation, auth) → map to `ClientError` with sanitized details; include OpenRouter `error.code` when available.
4. HTTP 5xx / rate limits → retry using capped exponential backoff; expose `Retry-After` to callers.
5. JSON schema validation failures → throw `SchemaValidationError` describing mismatched fields.
6. Unexpected payload shape / missing choices → treat as `ResponseParsingError` and attach the raw snippet for diagnostics (redact PII).
7. Abort / cancellation signals → throw `AbortError` without retry.

## Security Considerations

- Store `OPENROUTER_API_KEY` in Astro server-side environment variables; never expose via client bundles.
- Redact prompts and API keys in logs; use hashed request ids for correlation.
- Enforce HTTPS-only base URLs to prevent downgrade attacks.
- Sanitize user-provided inputs before logging or persisting to avoid injection.
- Respect OpenRouter usage policies by setting accurate `HTTP-Referer` and `X-Title` headers.

## Step-by-Step Implementation Plan

1. **Define types**: Create `OpenRouterConfig`, `ChatMessage`, `ChatCompletionOptions`, `ResponseFormat`, `ChatCompletionResult`, and error classes in `src/lib/services/openRouterService.ts` (or split DTOs into `src/types.ts` if shared).
2. **Implement configuration validation**: Use Zod (or manual guards) to validate constructor inputs; preload env vars in Astro server entry.
3. **Construct the service class**: Initialize immutable config, headers, and logger; bind the provided `fetch` implementation.
4. **Implement `sendChatCompletion`**:
   - Normalize messages (prepend system message when provided).
   - Build the request body with defaults (`model`, `response_format`, `parameters`).
   - Execute the HTTP call, handle retries, and parse responses.
   - Validate JSON responses against `response_format` when provided.
5. **Implement streaming support** (optional but recommended): Add `streamChatCompletion` that consumes SSE chunks and relays them via callbacks while honoring abort signals.
6. **Add private helpers**: `buildHeaders`, `buildRequestBody`, `executeRequest`, `parseNonStreamingResponse`, `consumeStream`, `mapError`.
7. **Integrate logging**: On each request log model, response time, and status category using `logInfo` / `logError`; avoid logging prompt content.
8. **Harden error handling**: Map all error paths to typed errors and export them for upstream hooks (e.g., UI notifications).
