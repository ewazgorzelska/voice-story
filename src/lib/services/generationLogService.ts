// src/lib/services/generationLogService.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { GetGenerationLogsResponseDto } from "../../types";

/**
 * Generation Log Service
 * Handles business logic for generation log operations
 */

/**
 * Retrieves logs for a specific story generation with pagination support
 *
 * @param supabase - Authenticated Supabase client
 * @param generationId - ID of the generation to fetch logs for
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated list of generation log entries ordered by occurrence time
 * @throws Error if database query fails
 */
export async function getLogsByGenerationId(
  supabase: SupabaseClient,
  generationId: string,
  page: number,
  pageSize: number
): Promise<GetGenerationLogsResponseDto> {
  // Calculate offset for pagination
  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from("generation_logs")
    .select("event, occurred_at", { count: "exact" })
    .eq("generation_id", generationId)
    .order("occurred_at", { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Failed to fetch generation logs:", error);
    throw new Error("Failed to fetch generation logs");
  }

  // Return empty array if no logs found (not an error condition)
  return {
    logs: (data || []).map((log) => ({
      event: log.event,
      occurred_at: log.occurred_at,
    })),
    meta: {
      page,
      page_size: pageSize,
      total: count || 0,
    },
  };
}
