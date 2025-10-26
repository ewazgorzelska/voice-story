# API Endpoint Implementation Plan: GET /api/story-generations/:id/logs

## 1. Endpoint Overview

Retrieve the event logs associated with a specific story generation for debugging and monitoring purposes.

## 2. Request Details

- HTTP Method: GET
- URL Structure: `/api/story-generations/:id/logs`
- Path Parameters:
  - `id` (UUID, required): Identifier of the story generation.
- Headers:
  - `Authorization: Bearer <token>` (required): Valid JWT issued by Supabase Auth.
- Request Body: None

## 3. Used Types

- `GenerationLogDto` (from `src/types.ts`): { event: string; occurred_at: string }
- `GetGenerationLogsResponseDto` (from `src/types.ts`): { logs: GenerationLogDto[] }

## 4. Response Details

- 200 OK:
  ```json
  { "logs": [{ "event": "string", "occurred_at": "timestamp" }] }
  ```
- 400 Bad Request: Invalid UUID format for `id`.
- 401 Unauthorized: Missing or invalid authentication token.
- 404 Not Found: Story generation with provided `id` does not exist or does not belong to the user.
- 500 Internal Server Error: Database or service failure.

## 5. Data Flow

1. **Authentication**: Middleware extracts and verifies JWT from `Authorization` header via `context.locals.supabase.auth.getUser()`.
2. **Input Validation**: Validate `id` path parameter using Zod schema (`z.string().uuid()`).
3. **Authorization**: Query `story_generations` filtered by `id` and `user_id` to ensure the requesting user owns this generation.
4. **Fetch Logs**: Use new `generationLogService.getLogsByGenerationId(id)` to query `generation_logs` table ordered by `occurred_at` ASC.
5. **DTO Mapping**: Map database rows to `GenerationLogDto`.
6. **Response**: Return `{ logs }` with status 200.

## 6. Security Considerations

- **Authentication**: Enforce Supabase Auth middleware on this route.
- **Authorization**: Ensure the `story_generations.user_id` matches authenticated user to prevent access to others’ logs.
- **Input Sanitization**: Strictly validate `id` as UUID to prevent SQL injection.
- **RLS**: Optionally leverage Supabase Row-Level Security policies for `generation_logs` table.

## 7. Error Handling

| Scenario                               | Status Code | Action                                                   |
| -------------------------------------- | ----------- | -------------------------------------------------------- |
| Missing/invalid `Authorization` header | 401         | Return error message: "Unauthorized"                     |
| Invalid UUID format for `id`           | 400         | Return error: "Invalid generation id"                    |
| Generation not found/unauthorized user | 404         | Return error: "Generation not found"                     |
| Database connection/query failure      | 500         | Log error; return generic error: "Internal server error" |

## 8. Performance Considerations

- **Indexing**: Ensure `generation_logs.generation_id` and `occurred_at` are indexed for efficient queries.
- **Pagination**: If log count grows large, consider adding pagination or limits with query parameters.

## 9. Implementation Steps

1. **Routing**: Create `src/pages/api/story-generations/[id]/logs.ts`.
2. **Schema**: Define path-parameter validation schema using Zod in `storyGenerationSchemas.ts`.
3. **Service**: Implement `getLogsByGenerationId(generationId: string)` in `src/lib/services/generationLogService.ts`.
4. **Endpoint Handler**:
   - Import Zod schema and service.
   - Authenticate user via `context.locals.supabase.auth.getUser()`.
   - Validate `id` with schema; handle 400s.
   - Call service; if no rows, return empty array.
   - Return JSON with `GetGenerationLogsResponseDto`.
7. **Error Logging**: Ensure catch blocks log errors via Astro’s logger or a custom logger.
8. **Review & Merge**: Perform code review, lint, and merge following repo guidelines.
