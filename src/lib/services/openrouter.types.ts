import { z } from "zod";

// ============================================================================
// Configuration Schema & Types
// ============================================================================

/**
 * Model tuning parameters for chat completions
 */
export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
}

/**
 * Configuration schema for OpenRouter service
 */
export const OpenRouterConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url().default("https://openrouter.ai/api/v1"),
  defaultModel: z.string().min(1, "Default model is required"),
  defaultParameters: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      top_p: z.number().min(0).max(1).optional(),
      max_output_tokens: z.number().positive().optional(),
      presence_penalty: z.number().min(-2).max(2).optional(),
      frequency_penalty: z.number().min(-2).max(2).optional(),
    })
    .optional(),
  referer: z.string().url("Referer must be a valid URL"),
  siteTitle: z.string().min(1, "Site title is required"),
  logger: z.custom<Logger>().optional(),
  httpClient: z.custom<typeof fetch>().optional(),
});

export type OpenRouterConfig = z.infer<typeof OpenRouterConfigSchema>;

// ============================================================================
// Chat Message Types
// ============================================================================

/**
 * Chat message role types
 */
export type ChatRole = "system" | "user" | "assistant";

/**
 * Individual chat message
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// ============================================================================
// Response Format & Schema Types
// ============================================================================

/**
 * JSON Schema definition for structured responses
 */
export interface JSONSchema {
  type: string;
  required?: string[];
  properties?: Record<string, unknown>;
  items?: unknown;
  minItems?: number;
  maxItems?: number;
  [key: string]: unknown;
}

/**
 * Response format specification
 */
export interface ResponseFormat {
  type: "json_schema" | "json_object";
  json_schema?: {
    name: string;
    strict?: boolean;
    schema: JSONSchema;
  };
}

// ============================================================================
// Request & Response Types
// ============================================================================

/**
 * Options for sending a chat completion
 */
export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  responseFormat?: ResponseFormat;
  parameters?: ModelParameters;
  abortSignal?: AbortSignal;
}

/**
 * Options for streaming chat completion
 */
export interface StreamingChatCompletionOptions extends ChatCompletionOptions {
  onToken: (delta: string) => void;
  onComplete: (result: ChatCompletionResult) => void;
}

/**
 * Usage statistics from OpenRouter API
 */
export interface UsageMetadata {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Result from a chat completion request
 */
export interface ChatCompletionResult {
  content: string;
  role: ChatRole;
  model: string;
  usage: UsageMetadata;
  finishReason?: string;
}

/**
 * OpenRouter API request body structure
 */
export interface OpenRouterChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  response_format?: ResponseFormat;
  stream?: boolean;
}

/**
 * OpenRouter API response structure
 */
export interface OpenRouterChatResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: ChatRole;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: UsageMetadata;
}

/**
 * Error context for telemetry
 */
export interface ErrorContext {
  model?: string;
  requestId?: string;
  method?: string;
}

// ============================================================================
// Logger Interface
// ============================================================================

export interface Logger {
  info: (message: string, data?: unknown) => void;
  error: (message: string, error?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  debug: (message: string, data?: unknown) => void;
}
