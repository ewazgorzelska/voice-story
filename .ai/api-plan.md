# REST API Plan

## 1. Resources

- **Users** (`auth.users` & `profiles`)
- **VoiceSamples** (`voice_samples`)
- **Stories** (`stories`)
- **StoryGenerations** (`story_generations`)
- **GenerationLogs** (`generation_logs`)

## 2. Endpoints

### 2.1 User Account Management

#### POST /api/profile/consent

- Description: Records the user's explicit consent for voice cloning.
- Headers: `Authorization: Bearer <token>`
- Response 200: OK

#### DELETE /api/account

- Description: Schedules the user's account for permanent deletion.
- Headers: `Authorization: Bearer <token>`
- Response 202: Accepted
- Errors:
  - 409: Account already scheduled for deletion

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

#### DELETE /api/voice-sample

- Description: Delete the authenticated user's voice sample and the associated voice clone.
- Headers: `Authorization: Bearer <token>`
- Response 204: No Content
- Errors:
  - 404: If voice sample is not found

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
  {
    "story_id": "uuid",
    "child_age": 5,
    "duration_min_minutes": 4,
    "duration_max_minutes": 8,
    "motif_prompt": "string" // optional, max 200 characters
  }
  ```
- Response 202:
  ```json
  {
    "id": "uuid",
    "status": "pending",
    "progress": 0,
    "teaser": "string"
  }
  ```

#### GET /api/story-generations

- Description: List user's generated stories
- Headers: `Authorization: Bearer <token>`
- Query Params: `page`, `pageSize`, `status`
- Response 200:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "story_id": "uuid",
        "status": "enum",
        "progress": number,
        "result_url": "string",
        "teaser": "string",
        "preferences": {
          "child_age": number,
          "duration_min_minutes": number,
          "duration_max_minutes": number,
          "motif_prompt": "string|null"
        }
      }
    ],
    "meta": { "page": number, "pageSize": number, "total": number }
  }
  ```

#### GET /api/story-generations/:id

- Description: Get specific generation status & result
- Headers: `Authorization: Bearer <token>`
- Response 200:
  ```json
  {
    "id": "uuid",
    "status": "enum",
    "progress": number,
    "result_url": "string",
    "teaser": "string",
    "preferences": {
      "child_age": number,
      "duration_min_minutes": number,
      "duration_max_minutes": number,
      "motif_prompt": "string|null"
    }
  }
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

- **VoiceSample**: Enforce one sample per user (UNIQUE constraint). Validate phrase and file format. Before creating a voice sample, the service must verify that the user has provided explicit consent for voice cloning.
- **StoryGenerations**: Enforce `story_id`