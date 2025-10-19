# REST API Plan

## 1. Resources

- **Users** (`auth.users` & `profiles`)
- **VoiceSamples** (`voice_samples`)
- **Stories** (`stories`)
- **StoryGenerations** (`story_generations`)
- **GenerationLogs** (`generation_logs`)

## 2. Endpoints

### 2.2 Voice Sample Management

#### GET /api/voice-sample/phrase

- Description: Fetch a random verification phrase.
- Response 200:
  ```json
  { "phrase": "string" }
  ```

#### POST /api/voice-sample

- Description: Upload a voice sample and verification phrase.
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  {
    "audio_url": "string", // presigned upload URL or raw binary URL
    "verification_phrase": "string"
  }
  ```
- Response 201:
  ```json
  { "id": "uuid", "user_id": "uuid", "created_at": "timestamp", "verified": false }
  ```
- Errors:
  - 409: "Voice sample already exists"
  - 422: Validation errors

#### PATCH /api/voice-sample/:id/verify

- Description: Mark a sample as verified after phrase match.
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  { "verified": true }
  ```
- Response 200:
  ```json
  { "id": "uuid", "verified": true }
  ```

### 2.3 Story Library

#### GET /api/stories

- Description: List all available stories
- Query Params: `page`, `pageSize`, `sort` (by title)
- Response 200:
  ```json
  {
    "data": [ { "id": "uuid", "title": "string", "slug": "string" } ],
    "meta": { "page": number, "pageSize": number, "total": number }
  }
  ```

#### GET /api/stories/:slug

- Description: Fetch story content by slug
- Response 200:
  ```json
  { "id": "uuid", "title": "string", "slug": "string", "content": "string" }
  ```
- Errors: 404 if not found

### 2.4 Story Generation & User Library

#### POST /api/story-generations

- Description: Initiate a new story generation
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  { "story_id": "uuid" }
  ```
- Response 202:
  ```json
  { "id": "uuid", "status": "pending", "progress": 0 }
  ```

#### GET /api/story-generations

- Description: List user's generated stories
- Headers: `Authorization: Bearer <token>`
- Query Params: `page`, `pageSize`, `status`
- Response 200:
  ```json
  {
    "data": [
      { "id": "uuid", "story_id": "uuid", "status": "enum", "progress": number, "result_url": "string" }
    ],
    "meta": { "page": number, "pageSize": number, "total": number }
  }
  ```

#### GET /api/story-generations/:id

- Description: Get specific generation status & result
- Headers: `Authorization: Bearer <token>`
- Response 200:
  ```json
  { "id": "uuid", "status": "enum", "progress": number, "result_url": "string" }
  ```
- Errors: 404 if not found or not owned

#### DELETE /api/story-generations/:id

- Description: Delete a generated story owned by the authenticated user
- Headers: `Authorization: Bearer <token>`
- Response 204: No Content
- Errors:
  - 404: If not found or not owned
  - 409: If story generation is in progress and cannot be deleted

### 2.5 Generation Logs (Internal)

#### GET /api/story-generations/:id/logs

- Description: Retrieve logs for debugging
- Headers: `Authorization: Bearer <token>`
- Response 200:
  ```json
  { "logs": [{ "event": "string", "occurred_at": "timestamp" }] }
  ```

## 3. Authentication & Authorization

- Use Supabase Auth JWTs. Verify token on each protected endpoint.
- RLS policies ensure users can access only their own `profiles`, `voice_samples`, and `story_generations`.
- Admin role can bypass RLS for diagnostics.

## 4. Validation & Business Logic

- **VoiceSample**: Enforce one sample per user (UNIQUE constraint). Validate phrase and file format.
- **StoryGenerations**: Enforce `story_id` exists. Initialize `status='pending'`, `progress=0`.
- **Progress**: Must be integer 0–100.
- **Enum**: `status` must be one of `(pending, in_progress, completed, failed)`.

### Pagination & Filtering

- Apply limits and offsets using `page` & `pageSize` with defaults (e.g., 10 per page).
- Filter story-generations by `status`.

### Error Handling

- Standardize on JSON error responses:
  ```json
  { "error": { "code": number, "message": "string" } }
  ```
- Use 4xx codes for client errors and 5xx for server errors.

### Rate Limiting & Security

- Rate limit story-generation requests (e.g., 5 per minute) to prevent abuse.
- Sanitize inputs and guard against injection.
- Serve audio files via presigned URLs from Supabase Storage with E2EE in transit.
