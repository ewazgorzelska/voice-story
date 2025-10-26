# Voice Sample API Testing Guide

## Overview

This document provides comprehensive testing instructions for the Voice Sample Management API endpoints.

## Endpoints Implemented

1. **GET /api/voice-sample/phrase** - Get random verification phrase
2. **POST /api/voice-sample** - Create voice sample
3. **PATCH /api/voice-sample/:id/verify** - Verify voice sample

## Testing Prerequisites

- Supabase instance running with `voice_samples` table
- Valid authentication token for authenticated endpoints
- ElevenLabs API key configured (or using placeholder mode)

## Test Cases

### 1. GET /api/voice-sample/phrase

#### Test 1.1: Successfully retrieve verification phrase

```bash
curl -X GET http://localhost:4321/api/voice-sample/phrase
```

**Expected Response (200):**

```json
{
  "phrase": "Jestem misiem o bardzo małym rozumku."
}
```

**Validation:**

- Status code is 200
- Response contains `phrase` field
- Phrase is one of the predefined phrases in Polish

#### Test 1.2: Handle server error gracefully

**Expected Response (500):**

```json
{
  "message": "Failed to retrieve verification phrase"
}
```

---

### 2. POST /api/voice-sample

#### Test 2.1: Successfully create voice sample

```bash
curl -X POST http://localhost:4321/api/voice-sample \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio/sample.mp3",
    "verification_phrase": "Jestem misiem o bardzo małym rozumku."
  }'
```

**Expected Response (201):**

```json
{
  "id": "uuid-here",
  "user_id": "user-uuid-here",
  "created_at": "2025-10-26T12:00:00Z",
  "verified": false
}
```

**Validation:**

- Status code is 201
- Response contains all required fields
- `verified` is false by default
- Voice sample is created in database
- ElevenLabs API was called (or placeholder used)

#### Test 2.2: Reject unauthenticated request

```bash
curl -X POST http://localhost:4321/api/voice-sample \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio/sample.mp3",
    "verification_phrase": "Test phrase"
  }'
```

**Expected Response (401):**

```json
{
  "message": "Unauthorized"
}
```

#### Test 2.3: Reject invalid JSON

```bash
curl -X POST http://localhost:4321/api/voice-sample \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d 'invalid-json'
```

**Expected Response (400):**

```json
{
  "message": "Invalid JSON in request body"
}
```

#### Test 2.4: Reject invalid audio URL

```bash
curl -X POST http://localhost:4321/api/voice-sample \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "not-a-url",
    "verification_phrase": "Test phrase"
  }'
```

**Expected Response (422):**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "code": "invalid_string",
      "message": "Invalid audio URL format",
      "path": ["audio_url"]
    }
  ]
}
```

#### Test 2.5: Reject missing verification phrase

```bash
curl -X POST http://localhost:4321/api/voice-sample \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio/sample.mp3"
  }'
```

**Expected Response (422):**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "code": "invalid_type",
      "message": "Required",
      "path": ["verification_phrase"]
    }
  ]
}
```

#### Test 2.6: Reject duplicate voice sample

```bash
# First request succeeds
curl -X POST http://localhost:4321/api/voice-sample \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio/sample.mp3",
    "verification_phrase": "Test phrase"
  }'

# Second request with same user
curl -X POST http://localhost:4321/api/voice-sample \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio/sample2.mp3",
    "verification_phrase": "Test phrase"
  }'
```

**Expected Response (409):**

```json
{
  "message": "Voice sample already exists for this user"
}
```

#### Test 2.7: Handle ElevenLabs API failure

**Expected Response (502):**

```json
{
  "message": "Voice service unavailable"
}
```

---

### 3. PATCH /api/voice-sample/:id/verify

#### Test 3.1: Successfully verify voice sample

```bash
curl -X PATCH http://localhost:4321/api/voice-sample/<sample-id>/verify \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true
  }'
```

**Expected Response (200):**

```json
{
  "id": "uuid-here",
  "verified": true
}
```

**Validation:**

- Status code is 200
- Response contains `id` and `verified` fields
- `verified` is true
- Database record is updated

#### Test 3.2: Reject unauthenticated request

```bash
curl -X PATCH http://localhost:4321/api/voice-sample/<sample-id>/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true
  }'
```

**Expected Response (401):**

```json
{
  "message": "Unauthorized"
}
```

#### Test 3.3: Reject invalid UUID

```bash
curl -X PATCH http://localhost:4321/api/voice-sample/invalid-uuid/verify \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true
  }'
```

**Expected Response (422):**

```json
{
  "message": "Invalid voice sample ID format",
  "errors": [
    {
      "code": "invalid_string",
      "message": "Invalid uuid",
      "path": []
    }
  ]
}
```

#### Test 3.4: Reject invalid JSON

```bash
curl -X PATCH http://localhost:4321/api/voice-sample/<sample-id>/verify \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d 'invalid-json'
```

**Expected Response (400):**

```json
{
  "message": "Invalid JSON in request body"
}
```

#### Test 3.5: Reject invalid verified value

```bash
curl -X PATCH http://localhost:4321/api/voice-sample/<sample-id>/verify \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": "yes"
  }'
```

**Expected Response (422):**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "code": "invalid_type",
      "message": "Verified must be a boolean",
      "path": ["verified"]
    }
  ]
}
```

#### Test 3.6: Reject non-existent voice sample

```bash
curl -X PATCH http://localhost:4321/api/voice-sample/00000000-0000-0000-0000-000000000000/verify \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true
  }'
```

**Expected Response (404):**

```json
{
  "message": "Voice sample not found"
}
```

#### Test 3.7: Reject unauthorized access (different user)

```bash
# User A creates voice sample
curl -X POST http://localhost:4321/api/voice-sample \
  -H "Authorization: Bearer <user-a-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio/sample.mp3",
    "verification_phrase": "Test phrase"
  }'

# User B tries to verify User A's sample
curl -X PATCH http://localhost:4321/api/voice-sample/<user-a-sample-id>/verify \
  -H "Authorization: Bearer <user-b-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true
  }'
```

**Expected Response (404):**

```json
{
  "message": "Voice sample not found"
}
```

**Note:** Returns 404 instead of 403 to avoid leaking information about sample existence.

---

## Integration Testing Checklist

- [ ] All endpoints return correct status codes
- [ ] Authentication is properly enforced
- [ ] Input validation catches all invalid inputs
- [ ] Error messages are clear and consistent
- [ ] Database constraints are respected (unique user_id)
- [ ] ElevenLabs API integration works (or placeholder)
- [ ] Ownership checks prevent unauthorized access
- [ ] CORS headers are set appropriately (if needed)
- [ ] Rate limiting is in place (if configured)
- [ ] Logging captures important events and errors

---

## Security Testing Checklist

- [ ] Authentication tokens are validated
- [ ] Users can only access their own resources
- [ ] SQL injection is prevented (Supabase client handles this)
- [ ] SSRF protection on audio URLs (HTTPS only)
- [ ] Sensitive data not exposed in responses (elevenlabs_voice_id)
- [ ] Error messages don't leak sensitive information
- [ ] Input validation prevents XSS and other attacks

---

## Performance Testing

### Load Testing Scenarios

1. **Concurrent phrase requests:**
   - 100 simultaneous GET /phrase requests
   - Expected: All succeed with 200 status

2. **Concurrent voice sample creation:**
   - 10 simultaneous POST requests from different users
   - Expected: All succeed with 201 status

3. **Database query performance:**
   - Check query execution time for existing sample lookup
   - Expected: < 100ms with proper indexing on user_id

---

## Environment-Specific Testing

### Development Environment

- Uses placeholder ElevenLabs integration
- Verbose error logging enabled
- No rate limiting

### Production Environment

- Real ElevenLabs API integration
- Sanitized error messages
- Rate limiting enabled
- HTTPS enforced

---

## Troubleshooting

### Common Issues

**Issue:** 401 Unauthorized on authenticated endpoints

- **Solution:** Check that Authorization header is properly formatted: `Bearer <token>`
- **Solution:** Verify token is valid and not expired

**Issue:** 409 Conflict when creating voice sample

- **Solution:** User already has a voice sample; delete existing one first (or use PATCH to update)

**Issue:** 502 Voice service unavailable

- **Solution:** Check ElevenLabs API key is configured
- **Solution:** Verify ElevenLabs API is accessible
- **Solution:** Check network connectivity

**Issue:** 422 Validation failed

- **Solution:** Review error details in response
- **Solution:** Ensure all required fields are provided
- **Solution:** Verify data types match schema

---

## Next Steps

After testing is complete:

1. Set up automated testing with Jest/Vitest
2. Configure CI/CD pipeline to run tests
3. Add monitoring and alerting for production
4. Implement rate limiting
5. Add request logging and analytics
6. Complete ElevenLabs API integration
7. Set up staging environment for pre-production testing
