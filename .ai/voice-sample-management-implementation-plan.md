# API Endpoint Implementation Plan: Voice Sample Management

## 1. Endpoint Overview

This suite of endpoints enables users to manage voice samples for voice cloning and verification. It includes fetching a random verification phrase, uploading a voice sample to ElevenLabs for model creation, and marking a sample as verified.

## 2. Request Details

### 2.1 GET /api/voice-sample/phrase

- HTTP Method: GET
- URL Structure: `/api/voice-sample/phrase`
- Parameters: None
- Request Body: None

### 2.2 POST /api/voice-sample

- HTTP Method: POST
- URL Structure: `/api/voice-sample`
- Headers:
  - `Authorization: Bearer <token>`
- Request Body (JSON):
  ```json
  {
    "audio_url": "string", // presigned upload URL or raw audio URL
    "verification_phrase": "string" // phrase to match for verification
  }
  ```

### 2.3 PATCH /api/voice-sample/:id/verify

- HTTP Method: PATCH
- URL Structure: `/api/voice-sample/:id/verify`
- Headers:
  - `Authorization: Bearer <token>`
- Path Parameters:
  - `id` (UUID) – ID of the voice sample
- Request Body (JSON):
  ```json
  { "verified": true }
  ```

## 3. Used Types

- GetVoiceSamplePhraseResponseDto: `{ phrase: string }`
- CreateVoiceSampleCommand: `{ audio_url: string; verification_phrase: string; }`
- VoiceSampleDto: `{ id: string; user_id: string; created_at: string; verified: boolean }`
- VerifyVoiceSampleCommand: `{ verified: boolean }`
- VerifyVoiceSampleResponseDto: `{ id: string; verified: boolean }`

## 4. Response Details

| Endpoint                       | Success Status | Response Body                  |
| ------------------------------ | -------------- | ------------------------------ |
| GET /phrase                    | 200            | `{ "phrase": "string" }`       |
| POST /voice-sample             | 201            | `VoiceSampleDto`               |
| PATCH /voice-sample/:id/verify | 200            | `VerifyVoiceSampleResponseDto` |

Error status codes:

- 400: Bad request (invalid input)
- 401: Unauthorized (missing/invalid token)
- 404: Not Found (sample ID not found or not owned)
- 409: Conflict (voice sample already exists for user)
- 422: Unprocessable Entity (validation errors)
- 500: Internal Server Error (external services or DB failures)

## 5. Data Flow

1. **GET phrase:**
   - Retrieve a random phrase from an in-memory or config-defined list in `voiceSampleService.getRandomPhrase()`.
2. **POST voice-sample:**
   - Authenticate user via `context.locals.supabase.auth.getUser()`.
   - Validate request body with Zod schema.
   - Check for existing sample in `voice_samples` by `user_id` → if exists, return 409.
   - Call ElevenLabs voice cloning API with `audio_url` to create a model; receive `elevenlabs_voice_id`.
   - Insert new row into `voice_samples` with `user_id`, `elevenlabs_voice_id`, `verification_phrase`.
   - Return inserted record mapped to `VoiceSampleDto`.
3. **PATCH verify:**
   - Authenticate user.
   - Validate `id` (UUID) and request body with Zod.
   - Fetch sample by `id`; if not found or `user_id` mismatch, return 404.
   - Update `verified` column to `true`.
   - Return `VerifyVoiceSampleResponseDto`.

All database interactions use the Supabase client from `src/db/supabase.client.ts` with RLS policies for additional security.

## 6. Security Considerations

- **Authentication**: All non-GET endpoints require a valid Supabase JWT; use `context.locals.supabase.auth.getUser()`.
- **Authorization**: Ensure users can only operate on their own samples.
- **Input Validation**: Use Zod schemas to guard against invalid or malicious data.
- **SSRF Protection**: Validate or whitelist domains for `audio_url` before calling ElevenLabs.
- **Sensitive Data**: Do not expose `elevenlabs_voice_id` or raw URLs in responses.
- **Rate Limiting**: Consider applying rate limits on POST and PATCH to prevent abuse.

## 7. Error Handling

| Scenario                                 | Status | Details                                                      |
| ---------------------------------------- | ------ | ------------------------------------------------------------ |
| Missing/invalid auth token               | 401    | Return standardized error JSON                               |
| Validation failure                       | 422    | Return Zod error messages                                    |
| Sample already exists (POST)             | 409    | `{ message: "Voice sample already exists" }`                 |
| Sample not found or unauthorized (PATCH) | 404    | Hide existence; return generic not found                     |
| ElevenLabs API failure                   | 502    | Log error; return `{ message: "Voice service unavailable" }` |
| Database insertion/update failure        | 500    | Log internal error; return generic server error              |

All endpoint handlers wrap core logic in try/catch, log errors via `console.error()` or a centralized logger, and return appropriate status codes and messages.

## 8. Performance Considerations

- Caching the list of verification phrases in memory.
- Offloading long-running ElevenLabs calls (voice model creation) to background jobs or asynchronous mechanisms if latency is a concern.
- Leverage Supabase RLS and indexes on `voice_samples(user_id)` for efficient queries.

## 9. Implementation Steps

1. **Schemas**: Create `src/lib/schemas/voiceSampleSchemas.ts` with Zod definitions for:
   - `getPhraseSchema` (no input)
   - `createVoiceSampleSchema`
   - `verifyVoiceSampleSchema`
2. **Service**: Implement `src/lib/services/voiceSampleService.ts`:
   - `getRandomPhrase()`
   - `createVoiceSample(userId, command)`
   - `verifyVoiceSample(userId, id, command)`
3. **API Routes**:
   - `src/pages/api/voice-sample/phrase.ts` (GET)
   - `src/pages/api/voice-sample/index.ts` (POST)
   - `src/pages/api/voice-sample/[id]/verify.ts` (PATCH)
   - In each, import Supabase from context, validate input, call service, handle errors.

---

_End of Implementation Plan_
