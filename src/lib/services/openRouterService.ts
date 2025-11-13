import type {
  ChatCompletionOptions,
  ChatCompletionResult,
  ErrorContext,
  Logger,
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterConfig,
  StreamingChatCompletionOptions,
  UsageMetadata,
} from "./openrouter.types";
import { OpenRouterConfigSchema } from "./openrouter.types";

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Base error class for OpenRouter service errors
 */
export class OpenRouterServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: ErrorContext,
    public readonly isRetryable = false
  ) {
    super(message);
    this.name = "OpenRouterServiceError";
    Object.setPrototypeOf(this, OpenRouterServiceError.prototype);
  }
}

/**
 * Configuration validation error
 */
export class ConfigurationError extends OpenRouterServiceError {
  constructor(message: string, context?: ErrorContext) {
    super(message, "CONFIGURATION_ERROR", context, false);
    this.name = "ConfigurationError";
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Network/transport error
 */
export class TransportError extends OpenRouterServiceError {
  constructor(message: string, context?: ErrorContext, isRetryable = true) {
    super(message, "TRANSPORT_ERROR", context, isRetryable);
    this.name = "TransportError";
    Object.setPrototypeOf(this, TransportError.prototype);
  }
}

/**
 * Client error (4xx responses)
 */
export class ClientError extends OpenRouterServiceError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly openRouterCode?: string,
    context?: ErrorContext
  ) {
    super(message, "CLIENT_ERROR", context, false);
    this.name = "ClientError";
    Object.setPrototypeOf(this, ClientError.prototype);
  }
}

/**
 * Server error (5xx responses)
 */
export class ServerError extends OpenRouterServiceError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly retryAfter?: number,
    context?: ErrorContext
  ) {
    super(message, "SERVER_ERROR", context, true);
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Schema validation error
 */
export class SchemaValidationError extends OpenRouterServiceError {
  constructor(
    message: string,
    public readonly validationErrors: string[],
    context?: ErrorContext
  ) {
    super(message, "SCHEMA_VALIDATION_ERROR", context, false);
    this.name = "SchemaValidationError";
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
  }
}

/**
 * Response parsing error
 */
export class ResponseParsingError extends OpenRouterServiceError {
  constructor(
    message: string,
    public readonly rawSnippet?: string,
    context?: ErrorContext
  ) {
    super(message, "RESPONSE_PARSING_ERROR", context, false);
    this.name = "ResponseParsingError";
    Object.setPrototypeOf(this, ResponseParsingError.prototype);
  }
}

/**
 * Request abort error
 */
export class AbortError extends OpenRouterServiceError {
  constructor(message = "Request was aborted", context?: ErrorContext) {
    super(message, "ABORT_ERROR", context, false);
    this.name = "AbortError";
    Object.setPrototypeOf(this, AbortError.prototype);
  }
}

// ============================================================================
// Default Logger Implementation
// ============================================================================

/**
 * Default logger implementation using console
 * Note: Console statements are allowed only in the default logger implementation
 */
const defaultLogger: Logger = {
  info: (message, data) => {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${message}`, data || "");
  },
  error: (message, error) => {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, error || "");
  },
  warn: (message, data) => {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, data || "");
  },
  debug: (message, data) => {
    // eslint-disable-next-line no-console
    console.debug(`[DEBUG] ${message}`, data || "");
  },
};

// ============================================================================
// OpenRouterService Class
// ============================================================================

/**
 * Service for interacting with OpenRouter API
 * Centralizes chat-completion flows with consistent configuration,
 * message construction, schema-aware response parsing, and error handling.
 */
export class OpenRouterService {
  private readonly config: Readonly<OpenRouterConfig>;
  private readonly logger: Logger;
  private readonly httpClient: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  private readonly defaultHeaders: Headers;

  /**
   * Creates a new OpenRouterService instance
   * @param config Configuration object containing API credentials and defaults
   * @throws {ConfigurationError} If required configuration is missing or invalid
   */
  constructor(config: Partial<OpenRouterConfig>) {
    // Validate configuration using Zod schema
    const validationResult = OpenRouterConfigSchema.safeParse(config);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      throw new ConfigurationError(`Invalid OpenRouter configuration: ${errorMessages}`, { method: "constructor" });
    }

    // Freeze configuration to prevent mutations
    this.config = Object.freeze(validationResult.data);
    this.logger = this.config.logger || defaultLogger;
    this.httpClient = this.config.httpClient || fetch;

    // Pre-compute default headers for reuse
    this.defaultHeaders = new Headers({
      Authorization: `Bearer ${this.config.apiKey}`,
      "HTTP-Referer": this.config.referer,
      "X-Title": this.config.siteTitle,
      "Content-Type": "application/json",
    });

    this.logger.info("OpenRouterService initialized", {
      baseUrl: this.config.baseUrl,
      defaultModel: this.config.defaultModel,
    });
  }

  /**
   * Sends a non-streaming chat completion request
   * @param options Chat completion options including messages and overrides
   * @returns Promise resolving to the chat completion result
   */
  public async sendChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const startTime = Date.now();
    const model = options.model || this.config.defaultModel;
    const requestId = this.generateRequestId();

    try {
      this.logger.info("Sending chat completion request", { model, requestId });

      // Validate messages
      if (!options.messages || options.messages.length === 0) {
        throw new ClientError("Messages array cannot be empty", 400, undefined, { model, requestId });
      }

      // Build request body
      const requestBody = this.buildRequestBody(options);

      // Execute request
      const response = await this.executeRequest({
        url: `${this.config.baseUrl}/chat/completions`,
        method: "POST",
        headers: this.buildHeaders(false),
        body: JSON.stringify(requestBody),
        signal: options.abortSignal,
      });

      // Parse response
      const result = await this.parseNonStreamingResponse(response, {
        model,
        requestId,
      });

      const duration = Date.now() - startTime;
      this.logger.info("Chat completion successful", {
        model,
        requestId,
        duration,
        usage: result.usage,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const mappedError = this.mapError(error, { model, requestId });

      this.logger.error("Chat completion failed", {
        model,
        requestId,
        duration,
        error: mappedError.message,
        code: mappedError.code,
      });

      throw mappedError;
    }
  }

  /**
   * Sends a streaming chat completion request
   * @param options Streaming chat completion options with callbacks
   * @returns Promise that resolves when streaming completes
   */
  public async streamChatCompletion(options: StreamingChatCompletionOptions): Promise<void> {
    const startTime = Date.now();
    const model = options.model || this.config.defaultModel;
    const requestId = this.generateRequestId();

    try {
      this.logger.info("Sending streaming chat completion request", { model, requestId });

      // Validate messages
      if (!options.messages || options.messages.length === 0) {
        throw new ClientError("Messages array cannot be empty", 400, undefined, { model, requestId });
      }

      // Build request body with streaming enabled
      const requestBody = this.buildRequestBody(options, true);

      // Execute request
      const response = await this.executeRequest({
        url: `${this.config.baseUrl}/chat/completions`,
        method: "POST",
        headers: this.buildHeaders(true),
        body: JSON.stringify(requestBody),
        signal: options.abortSignal,
      });

      // Consume stream
      await this.consumeStream(response, options, { model, requestId });

      const duration = Date.now() - startTime;
      this.logger.info("Streaming chat completion successful", {
        model,
        requestId,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const mappedError = this.mapError(error, { model, requestId });

      this.logger.error("Streaming chat completion failed", {
        model,
        requestId,
        duration,
        error: mappedError.message,
        code: mappedError.code,
      });

      throw mappedError;
    }
  }

  /**
   * Creates a new service instance with merged configuration
   * Useful for per-request scoping with different parameters
   * @param overrides Partial configuration to merge with existing config
   * @returns New OpenRouterService instance
   */
  public withOverrides(overrides: Partial<OpenRouterConfig>): OpenRouterService {
    const mergedConfig = {
      ...this.config,
      ...overrides,
      defaultParameters: {
        ...this.config.defaultParameters,
        ...overrides.defaultParameters,
      },
    };
    return new OpenRouterService(mergedConfig);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Builds headers for API requests
   * @param streaming Whether this is a streaming request
   * @returns Headers object
   */
  private buildHeaders(streaming = false): Headers {
    const headers = new Headers(this.defaultHeaders);
    if (streaming) {
      headers.set("Accept", "text/event-stream");
    }
    return headers;
  }

  /**
   * Builds the request body for OpenRouter API
   * @param options Chat completion options
   * @param streaming Whether streaming is enabled
   * @returns OpenRouter API request body
   */
  private buildRequestBody(options: ChatCompletionOptions, streaming = false): OpenRouterChatRequest {
    const model = options.model || this.config.defaultModel;
    const parameters = {
      ...this.config.defaultParameters,
      ...options.parameters,
    };

    const requestBody: OpenRouterChatRequest = {
      model,
      messages: options.messages,
      stream: streaming,
    };

    // Add optional parameters
    if (parameters.temperature !== undefined) {
      requestBody.temperature = parameters.temperature;
    }
    if (parameters.top_p !== undefined) {
      requestBody.top_p = parameters.top_p;
    }
    if (parameters.max_output_tokens !== undefined) {
      requestBody.max_tokens = parameters.max_output_tokens;
    }
    if (parameters.presence_penalty !== undefined) {
      requestBody.presence_penalty = parameters.presence_penalty;
    }
    if (parameters.frequency_penalty !== undefined) {
      requestBody.frequency_penalty = parameters.frequency_penalty;
    }

    // Add response format if specified
    if (options.responseFormat) {
      requestBody.response_format = options.responseFormat;
    }

    return requestBody;
  }

  /**
   * Executes HTTP request with timeout and retry logic
   * @param request Request configuration
   * @returns Response object
   */
  private async executeRequest(request: RequestInit & { url: string }): Promise<Response> {
    const { url, ...init } = request;

    // Validate HTTPS
    if (!url.startsWith("https://")) {
      throw new ConfigurationError("Base URL must use HTTPS protocol", { method: "executeRequest" });
    }

    // Create abort controller with timeout if no signal provided
    let timeoutId: NodeJS.Timeout | undefined;
    let abortController: AbortController | undefined;

    if (!init.signal) {
      abortController = new AbortController();
      timeoutId = setTimeout(() => {
        if (abortController) {
          abortController.abort();
        }
      }, 60000); // 60s default timeout
      init.signal = abortController.signal;
    }

    try {
      const response = await this.httpClient(url, init);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      return response;
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Check if aborted
      if (error instanceof Error && error.name === "AbortError") {
        throw new AbortError("Request was aborted or timed out");
      }

      throw error;
    }
  }

  /**
   * Parses non-streaming response from OpenRouter API
   * @param response HTTP response
   * @param context Error context
   * @returns Parsed chat completion result
   */
  private async parseNonStreamingResponse(response: Response, context: ErrorContext): Promise<ChatCompletionResult> {
    // Handle error responses
    if (!response.ok) {
      await this.handleErrorResponse(response, context);
    }

    let responseData: OpenRouterChatResponse;
    try {
      responseData = await response.json();
    } catch {
      throw new ResponseParsingError(
        "Failed to parse JSON response",
        await response.text().catch(() => undefined),
        context
      );
    }

    // Validate response structure
    if (!responseData.choices || responseData.choices.length === 0) {
      throw new ResponseParsingError(
        "Response contains no choices",
        JSON.stringify(responseData).substring(0, 200),
        context
      );
    }

    const choice = responseData.choices[0];
    if (!choice.message || !choice.message.content) {
      throw new ResponseParsingError(
        "Response choice missing message content",
        JSON.stringify(choice).substring(0, 200),
        context
      );
    }

    return {
      content: choice.message.content,
      role: choice.message.role,
      model: responseData.model,
      usage: responseData.usage,
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Handles error responses from OpenRouter API
   * @param response HTTP response
   * @param context Error context
   */
  private async handleErrorResponse(response: Response, context: ErrorContext): Promise<never> {
    const statusCode = response.status;
    let errorMessage = `HTTP ${statusCode}: ${response.statusText}`;
    let openRouterCode: string | undefined;

    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error.message || errorMessage;
        openRouterCode = errorData.error.code;
      }
    } catch {
      // Failed to parse error response, use default message
    }

    // Handle different status code ranges
    if (statusCode >= 400 && statusCode < 500) {
      throw new ClientError(errorMessage, statusCode, openRouterCode, context);
    }

    if (statusCode >= 500) {
      const retryAfter = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
      throw new ServerError(errorMessage, statusCode, retryAfterSeconds, context);
    }

    throw new TransportError(errorMessage, context);
  }

  /**
   * Consumes streaming response
   * @param response HTTP response
   * @param options Streaming options with callbacks
   * @param context Error context
   */
  private async consumeStream(
    response: Response,
    options: StreamingChatCompletionOptions,
    context: ErrorContext
  ): Promise<void> {
    if (!response.ok) {
      await this.handleErrorResponse(response, context);
    }

    if (!response.body) {
      throw new ResponseParsingError("Response has no body for streaming", undefined, context);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let lastModel = "";
    let usage: UsageMetadata | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            try {
              const parsed = JSON.parse(data);

              if (parsed.choices && parsed.choices[0]) {
                const delta = parsed.choices[0].delta;
                if (delta?.content) {
                  fullContent += delta.content;
                  options.onToken(delta.content);
                }
              }

              if (parsed.model) {
                lastModel = parsed.model;
              }

              if (parsed.usage) {
                usage = parsed.usage;
              }
            } catch {
              this.logger.warn("Failed to parse SSE chunk", { data });
            }
          }
        }
      }

      // Call completion callback
      const result: ChatCompletionResult = {
        content: fullContent,
        role: "assistant",
        model: lastModel || context.model || "",
        usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      };

      options.onComplete(result);
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Maps errors to typed service errors
   * @param error Original error
   * @param context Error context
   * @returns Mapped OpenRouterServiceError
   */
  private mapError(error: unknown, context: ErrorContext): OpenRouterServiceError {
    // Already a service error
    if (error instanceof OpenRouterServiceError) {
      return error;
    }

    // Network/fetch errors
    if (error instanceof TypeError) {
      return new TransportError(`Network error: ${error.message}`, context, true);
    }

    // Generic errors
    if (error instanceof Error) {
      return new TransportError(error.message, context, false);
    }

    // Unknown error type
    return new TransportError("An unknown error occurred", context, false);
  }

  /**
   * Generates a unique request ID for tracing
   * @returns Random request ID
   */
  private generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates an OpenRouterService instance from environment variables
 * @returns Configured OpenRouterService instance
 */
export function createOpenRouterService(): OpenRouterService {
  const config: Partial<OpenRouterConfig> = {
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    baseUrl: import.meta.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-4.5-sonnet",
    referer: import.meta.env.OPENROUTER_REFERER || import.meta.env.PUBLIC_SITE_URL,
    siteTitle: import.meta.env.OPENROUTER_SITE_TITLE || import.meta.env.PUBLIC_SITE_TITLE,
  };

  return new OpenRouterService(config);
}
