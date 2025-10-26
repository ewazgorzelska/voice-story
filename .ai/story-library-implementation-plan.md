# API Endpoint Implementation Plan: Story Library

## 1. Endpoint Overview
The Story Library provides public read-only access to stored stories.  
- `GET /api/stories`: Returns a paginated list of story summaries.  
- `GET /api/stories/:slug`: Returns full details of a story by slug.

## 2. Request Details

### GET /api/stories
- HTTP Method: GET  
- URL: `/api/stories`  
- Query Parameters:
  - Required: none  
  - Optional:
    - `page` (integer ≥1, default 1)
    - `pageSize` (integer ≥1, default 10)
    - `sort` (“asc” or “desc”, default “asc”)

### GET /api/stories/:slug
- HTTP Method: GET  
- URL: `/api/stories/:slug`  
- Path Parameters:
  - `slug` (string, non-empty)

## 3. Used Types
- `StorySummaryDto` (Pick<StoryRow, "id" | "title" | "slug">)  
- `PaginationMetaDto`  
- `GetStoriesResponseDto`  
- `StoryDto` (Pick<StoryRow, "id" | "title" | "slug" | "content">)

## 4. Response Details

### GET /api/stories
- 200 OK  
  ```json
  {
    "data": [ { "id": "uuid", "title": "string", "slug": "string" } ],
    "meta": { "page": number, "pageSize": number, "total": number }
  }
  ```

### GET /api/stories/:slug
- 200 OK  
  ```json
  { "id": "uuid", "title": "string", "slug": "string", "content": "string" }
  ```
- 404 Not Found  
  ```json
  { "error": "Story not found" }
  ```

## 5. Data Flow
1. HTTP request arrives at Astro API route (`src/pages/api/stories/index.ts` or `[slug].ts`).  
2. Request handler:
   - Parse and validate incoming params via Zod.  
   - Call `storyService.getStories(...)` or `storyService.getStoryBySlug(slug)`.  
   - Format result into the appropriate DTO.  
3. Service layer interacts with Supabase client (from `context.locals.supabase`) to query the `stories` table:
   - For list: `.select("id, title, slug")`, apply `.range()` for pagination, `.order("title", { ascending })`.  
   - For slug: `.select("id, title, slug, content").eq("slug", slug).single()`.  
4. Return JSON response with correct status code.

## 6. Security Considerations
- Public read-only access; no authentication required.  
- Input validation prevents invalid or malicious parameters.  
- Supabase client uses parameterized queries to avoid SQL injection.  
- Consider caching popular story lists (e.g. CDN or in-memory) to reduce DB load.  
- Optionally implement rate limiting at edge or middleware.

## 7. Error Handling
- 400 Bad Request: Zod validation failure (invalid `page`, `pageSize`, `sort`, or missing slug).  
- 404 Not Found: No story with given slug.  
- 500 Internal Server Error: Database failure or unhandled exceptions.  
- All errors logged via a structured logger (e.g. `console.error` with context).

## 8. Performance Considerations
- Use Supabase pagination with `range()` to fetch only needed rows.  
- Index `slug` column (already unique) for fast lookups.  
- Add an index on `title` if sorting on large datasets.  
- Cache count of total stories to avoid expensive `count()` on every request.  
- Consider HTTP caching headers or a CDN for static list responses.

## 9. Implementation Steps
1. Define Zod schemas in `src/lib/schemas/storySchemas.ts`:
   - `GetStoriesQuerySchema` for `page`, `pageSize`, `sort`.  
   - `GetStoryBySlugParamsSchema` for `slug`.
2. Create `storyService.ts` in `src/lib/services/`:
   - `getStories(page, pageSize, sort)` implementation using Supabase.  
   - `getStoryBySlug(slug)` implementation.
3. Create API route files:
   - `src/pages/api/stories/index.ts` for listing stories.  
   - `src/pages/api/stories/[slug].ts` for fetching by slug.
4. In each route:
   - Import Zod schemas and `storyService`.  
   - Parse/validate input.  
   - Invoke service.  
   - Handle `null` or errors and return appropriate HTTP status.
5. Add necessary types to `src/types.ts` if missing.
6. Add unit and integration tests for:
   - Valid and invalid query params.  
   - Pagination boundaries.  
   - Slug lookup success and failure.
7. Update OpenAPI documentation or API plan files to reflect the implementation.
8. Peer review and merge.  
