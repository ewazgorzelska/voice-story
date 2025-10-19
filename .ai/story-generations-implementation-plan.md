# API Endpoint Implementation Plan: Story Generations

## 1. Endpoint Overview

The Story Generations endpoints allow authenticated users to:

- Initiate a new generation process for a given story (POST `/api/story-generations`).
- List their past and in-progress generations with pagination and optional status filters (GET `/api/story-generations`).
- Retrieve the status and result URL of a specific generation (GET `/api/story-generations/:id`).
- Delete a specific generation if it is completed or failed (DELETE `/api/story-generations/:id`).

These endpoints drive the asynchronous workflow of generating audio or content assets tied to user-owned stories.

## 2. Request Details

### Common

- All endpoints require `Authorization: Bearer <token>` header.
- Extract `user_id` from the validated JWT.

### POST `/api/story-generations`

- **Method:** POST
- **Body:**
  ```json
  { "story_id": "uuid" }
  ```
- **Required Parameters:**
  - `story_id` (UUID): must reference an existing story.

### GET `/api/story-generations`

- **Method:** GET
- **Query Params:**
  - `page` (integer, default=1)
  - `pageSize` (integer, default=10)
  - `status` (enum, optional: one of `'pending'`, `'in_progress'`, `'succeeded'`, `'failed'`)

### GET `/api/story-generations/:id`

- **Method:** GET
- **Path Param:**
  - `id` (UUID)

### DELETE `/api/story-generations/:id`

- **Method:** DELETE
- **Path Param:**
  - `id` (UUID)

## 3. Used Types

- **Command Models & DTOs** (in `src/types.ts`):
  - `CreateStoryGenerationCommand` (Pick<StoryGenInsert, "story_id">)
  - `CreateStoryGenerationResponseDto` (Pick<StoryGenRow, "id" | "status" | "progress">)
  - `StoryGenerationDto` (Pick<StoryGenRow, "id" | "story_id" | "status" | "progress" | "result_url">)
  - `GetStoryGenerationsResponseDto` (`data: StoryGenerationDto[]; meta: PaginationMetaDto`)
  - `GetStoryGenerationResponseDto` (alias for `StoryGenerationDto`)
  - `PaginationMetaDto` (page, pageSize, total)

## 4. Response Details

- **POST** `/api/story-generations`
  - **202 Accepted**
  ```json
  { "id": "uuid", "status": "pending", "progress": 0 }
  ```
- **GET** `/api/story-generations`
  - **200 OK**
  ```json
  {
    "data": [ /* StoryGenerationDto[] */ ],
    "meta": { "page": number, "pageSize": number, "total": number }
  }
  ```
- **GET** `/api/story-generations/:id`
  - **200 OK**
  ```json
  { "id": "uuid", "story_id": "uuid", "status": "enum", "progress": number, "result_url": "string" }
  ```
- **DELETE** `/api/story-generations/:id`
  - **204 No Content**

## 5. Data Flow

1. **Authentication & Authorization**
   - Middleware parses JWT, attaches `user_id` to `context.locals`.
2. **Validation**
   - Parse and validate input with Zod schemas in each handler.
3. **Service Layer** (`src/lib/services/storyGenerationService.ts`)
   - `initiate(user_id, story_id)` → inserts new row, enqueues background job, returns the new record.
   - `list(user_id, page, pageSize, status?)` → queries with pagination and optional filter.
   - `getById(user_id, generation_id)` → fetches single record.
   - `remove(user_id, generation_id)` → deletes if allowed.
4. **Database Interaction**
   - Use Supabase client from `context.locals.supabase` (per backend rules).
   - Rely on RLS policies to enforce `user_id` ownership.
5. **Background Processing**
   - After insert, background worker picks up new generation tasks and updates `status`, `progress`, `result_url`, and logs events to `generation_logs`.

## 6. Security Considerations

- **Authentication:** Require valid JWT; use Astro middleware.
- **Authorization:** Ensure the `user_id` in token matches row owner; enforce via RLS policies and service-level checks.
- **Validation:** Use Zod to validate UUID formats, pagination params, and status enums.
- **Injection Protection:** All queries via Supabase client; no raw SQL.
- **Rate Limiting:** Consider per-user rate limits on generation initiation to prevent abuse.

## 7. Error Handling

| Scenario                                            | Status Code | Response Body                                         |
| --------------------------------------------------- | ----------- | ----------------------------------------------------- |
| Missing or invalid JWT                              | 401         | `{ "error": "Unauthorized" }`                         |
| Invalid request body or params                      | 400         | `{ "error": "Validation error", "details": [...] }`   |
| Story not found or not owned (POST validation)      | 404         | `{ "error": "Story not found" }`                      |
| No generations found (GET list returns empty array) | 200         | `{ "data": [], "meta": { ... } }`                     |
| Generation not found or not owned (GET /:id)        | 404         | `{ "error": "Generation not found" }`                 |
| Deletion during in-progress generation              | 409         | `{ "error": "Cannot delete in-progress generation" }` |
| Database or service failure                         | 500         | `{ "error": "Internal server error" }`                |

## 8. Performance Considerations

- **Pagination:** Enforce sensible `pageSize` limits (e.g., max 100).
- **Indexes:** Ensure `story_generations(user_id)` and `story_generations(story_id)` are indexed.
- **Background Jobs:** Offload CPU- or I/O-heavy work to workers; API returns immediately.

## 9. Implementation Steps

1. **Define Zod Schemas** in `src/lib/schemas/storyGenerationSchemas.ts`:
   - `InitGenerationSchema`
   - `ListGenerationsSchema`
   - `GetByIdSchema`
   - `DeleteGenerationSchema`
2. **Create Service** in `src/lib/services/storyGenerationService.ts` with methods: `initiate`, `list`, `getById`, `remove`.
3. **Implement API Handlers** in `src/pages/api/story-generations/index.ts` and `src/pages/api/story-generations/[id].ts`:
   - Import and validate request.
   - Call service methods.
   - Map database rows to DTOs.
   - Return proper status codes.
4. **Configure RLS Policies** in Supabase for `story_generations` to restrict access by `user_id`.
5. **Add Middleware** in `src/middleware/index.ts` to authenticate and attach `supabase` and `user_id`.
8. **Update Documentation** (README and `components.json`).
