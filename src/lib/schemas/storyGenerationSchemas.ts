// src/lib/schemas/storyGenerationSchemas.ts

import { z } from "zod";

/**
 * Schema for POST /api/story-generations
 * Validates the story_id in the request body
 */
export const InitGenerationSchema = z.object({
  story_id: z.string().uuid("story_id must be a valid UUID"),
});

/**
 * Schema for GET /api/story-generations query parameters
 * Validates pagination and optional status filter
 */
export const ListGenerationsSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("page must be a positive integer")),
  pageSize: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("pageSize must be a positive integer").max(20, "pageSize cannot exceed 100")),
  status: z.enum(["pending", "in_progress", "completed", "failed"]).optional(),
});

/**
 * Schema for GET /api/story-generations/:id path parameter
 * Validates the generation ID
 */
export const GetByIdSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

/**
 * Schema for DELETE /api/story-generations/:id path parameter
 * Validates the generation ID
 */
export const DeleteGenerationSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

/**
 * Schema for GET /api/story-generations/:id/logs path parameter
 * Validates the generation ID
 */
export const GetLogsSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

/**
 * Schema for GET /api/story-generations/:id/logs query parameters
 * Validates pagination parameters
 */
export const GetLogsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("page must be a positive integer")),
  pageSize: z
    .string()
    .optional()
    .default("50")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("pageSize must be a positive integer").max(100, "pageSize cannot exceed 100")),
});
