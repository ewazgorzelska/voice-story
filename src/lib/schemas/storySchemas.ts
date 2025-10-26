// src/lib/schemas/storySchemas.ts

import { z } from "zod";

/**
 * Schema for GET /api/stories query parameters
 * Validates pagination and sorting options
 */
export const GetStoriesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, {
      message: "page must be >= 1",
    }),
  pageSize: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, {
      message: "pageSize must be between 1 and 100",
    }),
  sort: z.enum(["asc", "desc"]).optional().default("asc"),
});

/**
 * Schema for GET /api/stories/:slug path parameters
 * Validates slug format
 */
export const GetStoryBySlugParamsSchema = z.object({
  slug: z
    .string()
    .min(1, "slug cannot be empty")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "slug must be lowercase alphanumeric with hyphens",
    }),
});
