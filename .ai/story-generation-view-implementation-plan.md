# Story Generation View Implementation Plan

## 1. Overview

The Story Generation view (`/stories/[slug]`) is where users can view the full content of a selected fairy tale and initiate the audio generation process using their cloned voice. The view presents a preview of the story text, allows generation initiation via a "Generate" button, and displays real-time generation progress using a polling mechanism. Upon completion, the user is redirected to the "My Library" view where they can listen to the generated story.

## 2. View Routing

**Path:** `/stories/[slug]`

- Dynamic parameter: `slug` - unique story identifier (e.g., "little-red-riding-hood")
- Implemented as Astro page: `src/pages/stories/[slug].astro`
- Requires user authentication (middleware checks session)
- Redirects to `/my-library` after successful generation

## 3. Component Structure

```
src/pages/stories/[slug].astro (Astro page)
├── Layout
│   └── StoryGenerationView (React island)
│       ├── StoryContentDisplay
│       │   ├── h1 (story title)
│       │   └── article (content preview)
│       ├── GenerationSection
│       │   ├── GenerateButton (Shadcn Button)
│       │   └── VoiceSampleWarning (conditional)
│       └── GenerationProgressDisplay (conditional, when generation active)
│           ├── StatusIndicator
│           ├── Progress (Shadcn Progress)
│           ├── ProgressText
│           └── EstimatedTimeDisplay
└── ErrorMessage (conditional, on errors)
```

## 4. Component Details

### 4.1 StoryGenerationView (main React component)

**Description:** Main view container that orchestrates story display and manages the generation process. Responsible for fetching data, managing generation state, API polling, and handling user interactions.

**Main elements:**

- Main container (`div` with Tailwind classes)
- StoryContentDisplay - displays story content
- GenerationSection - section with button and warnings
- GenerationProgressDisplay - progress bar (conditional)
- ErrorMessage - error messages (conditional)

**Handled interactions:**

- Component mount: fetches story data, checks if user has voice sample
- "Generate" button click: calls `handleStartGeneration`
- Polling: automatically queries API for generation status every 2-3 seconds
- Unmount: clears polling interval

**Validation handled:**

- Checks if user has saved voice sample before enabling generation
- Validates `story_id` is a valid UUID before sending request
- Blocks repeated clicks during ongoing generation
- Checks API responses for errors (404, 409, 422, 500)

**Types:**

- `StoryGenerationViewProps` (props interface)
- `StoryDto` (story data)
- `GenerationState` (generation state)
- `CreateStoryGenerationCommand` (request DTO)
- `CreateStoryGenerationResponseDto` (response DTO)
- `StoryGenerationDto` (generation data from API)

**Props:**

```typescript
interface StoryGenerationViewProps {
  story: StoryDto;
  userHasVoiceSample: boolean;
  client: "load"; // Astro client directive
}
```

### 4.2 StoryContentDisplay

**Description:** Presentational component displaying the story title and content in a readable format. Provides semantic HTML structure and appropriate styles for long text.

**Main elements:**

- `section` as semantic container
- `h1` with story title
- `article` with story content (scrollable for long texts)
- Tailwind styles for typography and spacing

**Handled interactions:**

- None (purely presentational component)

**Validation handled:**

- Checks that `title` and `content` are not empty before rendering

**Types:**

- `StoryContentDisplayProps`

**Props:**

```typescript
interface StoryContentDisplayProps {
  title: string;
  content: string;
}
```

### 4.3 GenerationSection

**Description:** Section containing the generation initiation button and conditional warning when user doesn't have a voice sample. Manages button state (active/inactive/loading).

**Main elements:**

- `div` as container
- GenerateButton (Shadcn Button component)
- VoiceSampleWarning (conditional message with link to `/voice-sample`)

**Handled interactions:**

- "Generate" button click: propagates event to parent via `onGenerate` prop

**Validation handled:**

- Button inactive when `disabled={true}` (no voice sample or generation in progress)
- Shows loading state when `isLoading={true}`

**Types:**

- `GenerationSectionProps`

**Props:**

```typescript
interface GenerationSectionProps {
  onGenerate: () => void;
  disabled: boolean;
  isLoading: boolean;
  userHasVoiceSample: boolean;
}
```

### 4.4 GenerateButton

**Description:** Button to initiate story generation. Based on Shadcn Button component with additional states and icon.

**Main elements:**

- `Button` from Shadcn (variant "default")
- Microphone icon or spinner (conditional, when loading)
- Text "Generate Story" or "Generating..."

**Handled interactions:**

- `onClick`: calls `onGenerate` callback

**Validation handled:**

- `disabled` prop blocks clicks
- `aria-disabled` for screen readers

**Types:**

- `GenerateButtonProps`

**Props:**

```typescript
interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}
```

### 4.5 VoiceSampleWarning

**Description:** Warning component displayed when user doesn't have a saved voice sample. Contains link to recording view.

**Main elements:**

- `div` with warning styles (yellow/orange background)
- Information icon
- Message text
- Link to `/voice-sample`

**Handled interactions:**

- Link click: navigate to `/voice-sample`

**Validation handled:**

- None

**Types:**

- No props (static component)

**Props:**

```typescript
interface VoiceSampleWarningProps {}
```

### 4.6 GenerationProgressDisplay

**Description:** Component displaying current story generation progress. Shows text status, visual progress bar, and estimated time remaining until completion.

**Main elements:**

- `div` as container with padding and border
- StatusIndicator - colored dot + status text
- Progress (Shadcn) - visual progress bar
- ProgressText - textual percentage representation (e.g., "45%")
- EstimatedTimeDisplay - estimated time remaining (e.g., "~2 minutes")

**Handled interactions:**

- No direct interactions (presentational component, updated by parent)

**Validation handled:**

- `progress` must be in range 0-100
- `status` must be one of: 'pending', 'in_progress', 'completed', 'failed'

**Types:**

- `GenerationProgressDisplayProps`
- `GenerationStatus` (enum type)

**Props:**

```typescript
type GenerationStatus = "pending" | "in_progress" | "completed" | "failed";

interface GenerationProgressDisplayProps {
  status: GenerationStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
}
```

### 4.7 StatusIndicator

**Description:** Small component displaying colored status indicator with textual description.

**Main elements:**

- `div` with flex layout
- `span` as colored dot (different color for each status)
- `span` with status text

**Handled interactions:**

- None

**Validation handled:**

- Status must be one of allowed values

**Types:**

- `StatusIndicatorProps`

**Props:**

```typescript
interface StatusIndicatorProps {
  status: GenerationStatus;
}
```

### 4.8 EstimatedTimeDisplay

**Description:** Component calculating and displaying estimated time remaining until generation completion.

**Main elements:**

- `div` with clock icon
- `span` with formatted time (e.g., "~2 min 30 sec")

**Handled interactions:**

- None

**Validation handled:**

- Handles case when `timeRemaining` is undefined (doesn't render)
- Formats time in readable way (seconds, minutes)

**Types:**

- `EstimatedTimeDisplayProps`

**Props:**

```typescript
interface EstimatedTimeDisplayProps {
  timeRemaining?: number; // in seconds
}
```

### 4.9 ErrorMessage

**Description:** Component displaying error messages in an accessible and visually distinct way.

**Main elements:**

- `div` with red background and border
- Error icon
- Message text
- Close button (optional)

**Handled interactions:**

- Close button click: calls `onDismiss`

**Validation handled:**

- Checks that `message` is not empty

**Types:**

- `ErrorMessageProps`

**Props:**

```typescript
interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
}
```

## 5. Types

### 5.1 API Types (already defined in `src/types.ts`)

**StoryDto** - represents complete story data:

```typescript
type StoryDto = Pick<StoryRow, "id" | "title" | "slug" | "content">;
// Expanded:
interface StoryDto {
  id: string; // UUID
  title: string;
  slug: string;
  content: string; // full story content
}
```

**CreateStoryGenerationCommand** - request body for POST /api/story-generations:

```typescript
type CreateStoryGenerationCommand = Pick<StoryGenInsert, "story_id">;
// Expanded:
interface CreateStoryGenerationCommand {
  story_id: string; // UUID of story to generate
}
```

**CreateStoryGenerationResponseDto** - response from POST /api/story-generations:

```typescript
type CreateStoryGenerationResponseDto = Pick<StoryGenRow, "id" | "status" | "progress">;
// Expanded:
interface CreateStoryGenerationResponseDto {
  id: string; // UUID of new generation
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number; // 0-100
}
```

**StoryGenerationDto** - complete generation data (from GET /api/story-generations/:id):

```typescript
type StoryGenerationDto = Pick<StoryGenRow, "id" | "story_id" | "status" | "progress" | "result_url">;
// Expanded:
interface StoryGenerationDto {
  id: string; // generation UUID
  story_id: string; // story UUID
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number; // 0-100
  result_url: string | null; // URL to generated audio (when completed)
}
```

### 5.2 New ViewModel Types (to be created)

**GenerationState** - internal generation state in component:

```typescript
interface GenerationState {
  isGenerating: boolean; // whether generation is in progress
  generationId: string | null; // ID of current generation (from API)
  status: "idle" | "pending" | "in_progress" | "completed" | "failed";
  progress: number; // 0-100
  error: string | null; // error message if occurred
  startTime: number | null; // timestamp of start (for time calculation)
  lastProgressUpdate: number | null; // timestamp of last progress update
  lastProgress: number; // last known progress (for calculating rate)
}
```

**StoryGenerationViewProps** - props for main view component:

```typescript
interface StoryGenerationViewProps {
  story: StoryDto; // story data from Astro
  userHasVoiceSample: boolean; // whether user has voice sample
  client: "load"; // Astro directive for hydration
}
```

**GenerationProgressDisplayProps** - props for progress component:

```typescript
type GenerationStatus = "pending" | "in_progress" | "completed" | "failed";

interface GenerationProgressDisplayProps {
  status: GenerationStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds, optional
}
```

**GenerationSectionProps** - props for button section:

```typescript
interface GenerationSectionProps {
  onGenerate: () => void;
  disabled: boolean;
  isLoading: boolean;
  userHasVoiceSample: boolean;
}
```

**GenerateButtonProps** - props for generate button:

```typescript
interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}
```

**StoryContentDisplayProps** - props for content display:

```typescript
interface StoryContentDisplayProps {
  title: string;
  content: string;
}
```

**StatusIndicatorProps** - props for status indicator:

```typescript
interface StatusIndicatorProps {
  status: GenerationStatus;
}
```

**EstimatedTimeDisplayProps** - props for time display:

```typescript
interface EstimatedTimeDisplayProps {
  timeRemaining?: number; // in seconds
}
```

**ErrorMessageProps** - props for error message:

```typescript
interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
}
```

### 5.3 Helper Types

**ApiError** - standardized API error:

```typescript
interface ApiError {
  code: number; // HTTP status code
  message: string; // error message
}
```

**PollingConfig** - polling configuration:

```typescript
interface PollingConfig {
  intervalMs: number; // polling frequency in ms (default 2000)
  maxRetries: number; // max retry attempts on error (default 3)
  backoffMultiplier: number; // multiplier for exponential backoff (default 1.5)
}
```

## 6. State Management

### 6.1 Local State in StoryGenerationView

Main `StoryGenerationView` component manages state using React hooks:

**useState - GenerationState:**

```typescript
const [generationState, setGenerationState] = useState<GenerationState>({
  isGenerating: false,
  generationId: null,
  status: "idle",
  progress: 0,
  error: null,
  startTime: null,
  lastProgressUpdate: null,
  lastProgress: 0,
});
```

**useState - Error handling:**

```typescript
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

**useRef - Polling interval:**

```typescript
const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

**useRef - Retry counter:**

```typescript
const retryCountRef = useRef<number>(0);
```

### 6.2 Custom Hook: useStoryGeneration

For better code organization, generation logic should be extracted into a custom hook that would return:

```typescript
{
    state,
    startGeneration,
    estimatedTime: calculateEstimatedTime(),
  };
```

### 6.3 State Flow

1. **Component mount:**
   - State initialized with `isGenerating: false`, `status: 'idle'`
   - Props `story` and `userHasVoiceSample` passed from Astro

2. **"Generate" click:**
   - Call `startGeneration()`
   - `isGenerating: true`
   - POST to API
   - Receive `generationId`
   - Start polling

3. **During polling:**
   - Every 2 seconds: GET `/api/story-generations/:id`
   - Update `status` and `progress`
   - Calculate `estimatedTime`

4. **Completion (success):**
   - `status: 'completed'`, `progress: 100`
   - Stop polling
   - Show success for 2 seconds
   - Redirect to `/my-library`

5. **Completion (error):**
   - `status: 'failed'`
   - Stop polling
   - Display error
   - Reset state, enable retry

6. **Unmount:**
   - Cleanup: stop polling (`clearInterval`)

## 7. API Integration

### 7.1 POST /api/story-generations - Initiate Generation

**Call:**

```typescript
const response = await fetch("/api/story-generations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // Authorization header added automatically by middleware/Supabase
  },
  body: JSON.stringify({
    story_id: story.id, // UUID from props
  }),
});
```

**Request Body Type:**

```typescript
CreateStoryGenerationCommand {
  story_id: string; // UUID
}
```

**Response Type (202 Accepted):**

```typescript
CreateStoryGenerationResponseDto {
  id: string; // UUID of new generation
  status: 'pending';
  progress: 0;
}
```

**Error Handling:**

- **400 Bad Request:** Invalid UUID (shouldn't occur with proper validation)
- **401 Unauthorized:** No authorization (redirect to /login)
- **404 Not Found:** Story doesn't exist (error message)
- **409 Conflict:** User has no voice sample or generation already in progress (error message)
- **422 Unprocessable Entity:** Validation error (error message)
- **429 Too Many Requests:** Rate limit (message "Try again in a moment")
- **500 Internal Server Error:** Server error (message "An error occurred, try again")

### 7.2 GET /api/story-generations/:id - Check Progress

**Call:**

```typescript
const response = await fetch(`/api/story-generations/${generationId}`, {
  method: "GET",
  headers: {
    // Authorization header added automatically
  },
});
```

**Response Type (200 OK):**

```typescript
StoryGenerationDto {
  id: string; // generation UUID
  story_id: string; // story UUID
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  result_url: string | null; // URL when completed, null otherwise
}
```

**Error Handling:**

- **401 Unauthorized:** No authorization (stop polling, redirect)
- **404 Not Found:** Generation doesn't exist or doesn't belong to user (stop polling, error)
- **500 Internal Server Error:** Try again (increment retry counter)

### 7.3 GET /api/stories/:slug - Fetch Story Data

**Call (Astro side, server-side):**

```typescript
const slug = Astro.params.slug;
const response = await fetch(`${import.meta.env.API_URL}/api/stories/${slug}`);
const story: StoryDto = await response.json();
```

**Response Type (200 OK):**

```typescript
StoryDto {
  id: string; // UUID
  title: string;
  slug: string;
  content: string; // full content
}
```

**Error Handling:**

- **404 Not Found:** Story doesn't exist (display 404 page or redirect to /stories)

### 7.4 Check Voice Sample (optional, server-side)

**Call (Astro side, server-side):**

```typescript
// Using Supabase client
const { data: voiceSample } = await supabase.from("voice_samples").select("id").eq("user_id", user.id).single();

const userHasVoiceSample = !!voiceSample;
```

## 8. User Interactions

### 8.1 "Generate" Button Click

**User action:** User clicks "Generate Story" button

**Prerequisites:**

- User is logged in
- User has saved voice sample
- No generation currently in progress

**Flow:**

1. Button click calls `handleStartGeneration()`
2. Button becomes disabled (`disabled={true}`)
3. Shows spinner/loading state
4. Send POST `/api/story-generations` with `story_id`
5. After receiving 202 response:
   - Save `generationId` in state
   - Hide button
   - Show `GenerationProgressDisplay`
   - Start polling
6. On error:
   - Display error message
   - Re-enable button
   - Allow retry

**User feedback:**

- Button changes text to "Generating..." with spinner
- Progress section appears with bar at 0%
- Status: "Waiting..." (pending)

### 8.2 Automatic Progress Update (polling)

**System action:** Automatic API polling every 2 seconds

**Flow:**

1. Every 2 seconds: GET `/api/story-generations/:id`
2. Receive current status and progress
3. Update UI:
   - Progress bar (Progress component)
   - Percentage text (e.g., "45%")
   - Status text (e.g., "Generation in progress...")
   - Estimated time remaining (e.g., "~1 minute 30 seconds")
4. When `status === 'completed'`:
   - Bar at 100%
   - Status: "Completed!"
   - Show success
   - After 2 seconds redirect to `/my-library`
5. When `status === 'failed'`:
   - Stop polling
   - Display error: "Generation failed"
   - Show "Try Again" button

**User feedback:**

- Animated progress bar (smooth CSS transition)
- Updating percentage
- Decreasing estimated time
- Colored status indicator (yellow: pending/in_progress, green: completed, red: failed)

### 8.3 Navigate Away During Generation

**User action:** User clicks navigation link or browser back button

**Flow:**

1. React useEffect cleanup calls `stopPolling()`
2. Interval is cleared
3. Generation continues in background (backend independent)
4. User can check status in `/my-library`

**User feedback:**

- None (user leaves view)
- In My Library will see generation in progress with current progress

### 8.4 Try to Generate Without Voice Sample

**User action:** User tries to click "Generate" but has no voice sample

**Flow:**

1. Button is disabled (`disabled={true}`)
2. Warning message displayed:
   "To generate a story, you must first record a voice sample."
3. Message contains link: "Record Now" → `/voice-sample`

**User feedback:**

- Button grayed out and non-clickable
- Warning message with clear call-to-action
- Tooltip on button (optional): "Voice sample required"

### 8.5 Close Error Message

**User action:** User clicks [X] on error message

**Flow:**

1. Call `onDismiss()` from `ErrorMessage`
2. Remove error from state: `setErrorMessage(null)`
3. Hide `ErrorMessage` component

**User feedback:**

- Message disappears with fade-out animation
- Return to normal view

## 9. Conditions and Validation

### 9.1 Authorization Conditions (middleware/Astro server-side)

**Component:** Astro page `[slug].astro`

**Conditions:**

- User must be logged in (active Supabase session)
- JWT token must be valid

**Validation:**

```typescript
// In [slug].astro file
const session = await Astro.locals.supabase.auth.getSession();
if (!session.data.session) {
  return Astro.redirect("/login");
}
```

**UI impact:**

- If no session: redirect to `/login` before loading view
- If valid session: view loads

### 9.2 Voice Sample Condition

**Component:** `StoryGenerationView`, `GenerationSection`

**Conditions:**

- User must have saved and verified voice sample
- Checked server-side in Astro and passed as prop

**Validation:**

```typescript
// In [slug].astro
const { data: voiceSample } = await supabase
  .from("voice_samples")
  .select("id, verified")
  .eq("user_id", user.id)
  .eq("verified", true)
  .single();

const userHasVoiceSample = !!voiceSample;
```

**UI impact:**

- If `userHasVoiceSample === false`:
  - "Generate" button disabled
  - Display `VoiceSampleWarning` with link to `/voice-sample`
- If `userHasVoiceSample === true`:
  - "Generate" button active
  - No warning

### 9.3 story_id Validation Before Sending

**Component:** `StoryGenerationView`, `startGeneration` function

**Conditions:**

- `story.id` must be valid UUID
- `story.id` cannot be empty/null

**Validation:**

```typescript
if (!story.id || !isValidUUID(story.id)) {
  setErrorMessage("Invalid story identifier");
  return;
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

**UI impact:**

- If validation fails:
  - Display error
  - Block request sending
  - Button remains active (theoretically shouldn't occur)

### 9.4 Generation State Validation (prevent duplicate)

**Component:** `StoryGenerationView`, `GenerateButton`

**Conditions:**

- Generation cannot already be in progress (`isGenerating === false`)
- `generationId` must be null (no active generation)

**Validation:**

```typescript
// In GenerateButton
<Button
  disabled={disabled || isLoading}
  onClick={onClick}
>
  {isLoading ? 'Generating...' : 'Generate Story'}
</Button>

// In StoryGenerationView
const handleStartGeneration = async () => {
  if (generationState.isGenerating) {
    return; // Prevent multiple clicks
  }
  // ... rest of logic
};
```

**UI impact:**

- When `isGenerating === true`:
  - Button disabled
  - Progress bar displayed instead of button
- When `isGenerating === false`:
  - Button active (if other conditions met)

### 9.5 API Response Validation

**Component:** `StoryGenerationView`, `pollProgress` function

**Conditions:**

- `status` must be one of: 'pending', 'in_progress', 'completed', 'failed'
- `progress` must be number 0-100

**Validation:**

```typescript
const validateGenerationData = (data: any): data is StoryGenerationDto => {
  const validStatuses = ["pending", "in_progress", "completed", "failed"];
  return (
    typeof data.id === "string" &&
    typeof data.story_id === "string" &&
    validStatuses.includes(data.status) &&
    typeof data.progress === "number" &&
    data.progress >= 0 &&
    data.progress <= 100
  );
};

// In pollProgress
const data = await response.json();
if (!validateGenerationData(data)) {
  throw new Error("Invalid data from API");
}
```

**UI impact:**

- If validation fails:
  - Treated as polling error
  - Increment retry counter
  - After 3 attempts: stop polling and display error

### 9.6 Progress Range Validation for Progress Component

**Component:** `GenerationProgressDisplay`, `Progress` (Shadcn)

**Conditions:**

- `progress` prop must be 0-100
- Shadcn `Progress` component requires value in range 0-100

**Validation:**

```typescript
// In GenerationProgressDisplay
const clampProgress = (progress: number): number => {
  return Math.max(0, Math.min(100, progress));
};

<Progress value={clampProgress(progress)} className="w-full" />
```

**UI impact:**

- Progress bar fills proportionally to value (0% = empty, 100% = full)
- Values outside range are automatically clamped

## 10. Error Handling

### 10.1 Generation Initialization Errors (POST /api/story-generations)

**Error type:** HTTP 4xx/5xx errors

**Scenarios:**

1. **401 Unauthorized** - No authorization or expired session
   - **Handling:** Redirect to `/login`
   - **UI:** Automatic redirect
2. **404 Not Found** - Story doesn't exist
   - **Handling:** Display error, redirect to `/stories`
   - **UI:** Message: "Story not found"

3. **409 Conflict** - User has no voice sample or generation already in progress
   - **Handling:** Display message, refresh state
   - **UI:** Message: "First record voice sample" or "Generation already in progress"

4. **422 Unprocessable Entity** - Validation error
   - **Handling:** Display error details
   - **UI:** Message with validation details

5. **429 Too Many Requests** - Rate limit
   - **Handling:** Delay, inform about limit
   - **UI:** Message: "Request limit exceeded. Try in a moment."

6. **500 Internal Server Error** - Server error
   - **Handling:** Retry or display error
   - **UI:** Message: "Server error occurred. Try again."

**Implementation:**

```typescript
try {
  const response = await fetch("/api/story-generations", {
    method: "POST",
    body: JSON.stringify({ story_id: story.id }),
  });

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  if (response.status === 404) {
    setErrorMessage("Story not found");
    setTimeout(() => (window.location.href = "/stories"), 2000);
    return;
  }

  if (response.status === 409) {
    const error = await response.json();
    setErrorMessage(error.message || "Cannot start generation");
    return;
  }

  if (response.status === 429) {
    setErrorMessage("Request limit exceeded. Try in a moment.");
    return;
  }

  if (!response.ok) {
    throw new Error("Failed to start generation");
  }

  const data = await response.json();
  // ... continuation
} catch (error) {
  console.error("Error starting generation:", error);
  setErrorMessage("Failed to start generation. Try again.");
}
```

### 10.2 Polling Errors (GET /api/story-generations/:id)

**Error type:** Network or API errors during polling

**Scenarios:**

1. **Network Error** - Connection loss
   - **Handling:** Retry with exponential backoff (max 3 attempts)
   - **UI:** Warning icon, tooltip "Connection issues"

2. **401 Unauthorized** - Session expired during polling
   - **Handling:** Stop polling, redirect to `/login`
   - **UI:** Message: "Session expired", redirect

3. **404 Not Found** - Generation was deleted
   - **Handling:** Stop polling, display error
   - **UI:** Message: "Generation doesn't exist"

4. **500 Internal Server Error** - Temporary server error
   - **Handling:** Retry with backoff
   - **UI:** Continue polling, no UI changes

**Implementation:**

```typescript
const pollProgress = async (generationId: string) => {
  try {
    const response = await fetch(`/api/story-generations/${generationId}`);

    if (response.status === 401) {
      stopPolling();
      window.location.href = "/login";
      return;
    }

    if (response.status === 404) {
      stopPolling();
      setErrorMessage("Generation not found");
      setState((prev) => ({ ...prev, isGenerating: false }));
      return;
    }

    if (!response.ok) {
      throw new Error("Polling failed");
    }

    const data = await response.json();
    // ... state update

    retryCountRef.current = 0; // Reset after success
  } catch (error) {
    console.error("Polling error:", error);
    retryCountRef.current += 1;

    if (retryCountRef.current >= 3) {
      stopPolling();
      setErrorMessage("Lost connection to server. Refresh page.");
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
    // Otherwise continue polling
  }
};
```

### 10.3 Backend Generation Error (status: 'failed')

**Error type:** Generation status changed to 'failed'

**Scenarios:**

- Text processing error
- ElevenLabs API error
- Generation timeout
- File save error

**Handling:**

```typescript
if (data.status === "failed") {
  stopPolling();
  setState((prev) => ({
    ...prev,
    isGenerating: false,
    status: "failed",
    error: "Generation failed",
  }));
  setErrorMessage("Failed to generate story. Try again later.");
}
```

**UI:**

- Progress bar changes color to red
- Error icon
- Message: "Failed to generate story"
- "Try Again" button (resets state and enables new attempt)

### 10.4 Missing Voice Sample

**Error type:** Business condition - user has no voice sample

**Handling:**

- Checked server-side before rendering
- Passed as prop `userHasVoiceSample={false}`

**UI:**

- "Generate" button disabled
- `VoiceSampleWarning` component displayed:
  ```
  ⚠️ To generate a story, you must first record a voice sample.
  [Record Now →]
  ```
- Link redirects to `/voice-sample`

### 10.5 Invalid Data from API

**Error type:** Unexpected data structure from API

**Handling:**

```typescript
const validateGenerationData = (data: any): data is StoryGenerationDto => {
  // ... type and value validation
};

if (!validateGenerationData(data)) {
  console.error("Invalid data structure:", data);
  throw new Error("Invalid data from API");
}
```

**UI:**

- Treated as polling error
- Retry mechanism
- After 3 attempts: error message and stop polling

### 10.6 Unexpected Component State

**Error type:** Component state in inconsistent state

**Handling:**

- Defensive programming in render logic
- Fallbacks for undefined/null values

**Implementation:**

```typescript
// In GenerationProgressDisplay
if (progress < 0 || progress > 100) {
  console.warn("Invalid progress value:", progress);
  progress = Math.max(0, Math.min(100, progress));
}

// In EstimatedTimeDisplay
if (timeRemaining !== undefined && timeRemaining < 0) {
  return null; // Don't render if value invalid
}
```

## 11. Implementation Steps

### Step 1: Prepare File Structure

- Create page file: `src/pages/stories/[slug].astro`
- Create components folder: `src/components/story-generation/`
- Create types file: `src/types/story-generation.types.ts` (or add to `src/types.ts`)
- Create custom hook file: `src/hooks/useStoryGeneration.ts`

### Step 2: Define Types

- Add new ViewModel types to `src/types/story-generation.types.ts`:
  - `GenerationState`
  - `StoryGenerationViewProps`
  - `GenerationProgressDisplayProps`
  - `GenerationSectionProps`
  - `GenerateButtonProps`
  - `StoryContentDisplayProps`
  - `StatusIndicatorProps`
  - `EstimatedTimeDisplayProps`
  - `ErrorMessageProps`
  - `ApiError`

### Step 3: Implement Astro Page

- In `src/pages/stories/[slug].astro`:
  - Get `slug` parameter from `Astro.params`
  - Check user authorization (middleware or inline)
  - Fetch story data: GET `/api/stories/:slug`
  - Check if user has voice sample (query to Supabase)
  - Handle 404 if story doesn't exist
  - Import `Layout` and `StoryGenerationView`
  - Pass props: `story`, `userHasVoiceSample`
  - Add `client:load` directive for hydration

```astro
---
import Layout from "../../layouts/Layout.astro";
import StoryGenerationView from "../../components/story-generation/StoryGenerationView";

const { slug } = Astro.params;
const supabase = Astro.locals.supabase;

// Auth check
const {
  data: { session },
} = await supabase.auth.getSession();
if (!session) {
  return Astro.redirect("/login");
}

// Fetch story
const { data: story, error: storyError } = await supabase
  .from("stories")
  .select("id, title, slug, content")
  .eq("slug", slug)
  .single();

if (storyError || !story) {
  return Astro.redirect("/404");
}

// Check voice sample
const { data: voiceSample } = await supabase
  .from("voice_samples")
  .select("id")
  .eq("user_id", session.user.id)
  .eq("verified", true)
  .single();

const userHasVoiceSample = !!voiceSample;
---

<Layout title={story.title}>
  <StoryGenerationView story={story} userHasVoiceSample={userHasVoiceSample} client:load />
</Layout>
```

### Step 4: Implement useStoryGeneration Custom Hook

- In `src/hooks/useStoryGeneration.ts`:
  - Define initial state
  - Implement `startGeneration()` function (POST request)
  - Implement `pollProgress()` function (GET request)
  - Implement `startPolling()` function (setInterval)
  - Implement `stopPolling()` function (clearInterval)
  - Implement `calculateEstimatedTime()` function
  - Add `useEffect` for cleanup
  - Handle all error cases
  - Return interface: `{ state, startGeneration, estimatedTime }`

### Step 5: Implement StoryGenerationView Component

- In `src/components/story-generation/StoryGenerationView.tsx`:
  - Import `useStoryGeneration` hook
  - Define props interface
  - Use hook: `const { state, startGeneration, estimatedTime } = useStoryGeneration(story.id)`
  - Import child components
  - Build layout with Tailwind (container, padding, max-width)
  - Conditional render `GenerationProgressDisplay` (when `state.isGenerating`)
  - Conditional render `ErrorMessage` (when `state.error`)
  - Pass appropriate props to child components

### Step 6: Implement StoryContentDisplay Component

- In `src/components/story-generation/StoryContentDisplay.tsx`:
  - Define props interface
  - Create layout: `<section>` wrapper
  - Add `<h1>` for title (Tailwind typography)
  - Add `<article>` for content (Tailwind prose)
  - Handle text formatting (whitespace, line breaks)
  - Add styles for scrolling (max-height, overflow)

### Step 7: Implement GenerationSection Component

- In `src/components/story-generation/GenerationSection.tsx`:
  - Define props interface
  - Create wrapper `<div>` with Tailwind spacing
  - Conditional render `VoiceSampleWarning` (when `!userHasVoiceSample`)
  - Render `GenerateButton` with props
  - Add styles for layout (flex, center alignment)

### Step 8: Implement GenerateButton Component

- In `src/components/story-generation/GenerateButton.tsx`:
  - Import `Button` from Shadcn
  - Define props interface
  - Conditional render text ("Generate" vs "Generating...")
  - Conditional render icon (mic vs spinner)
  - Handle `disabled` and `onClick` props
  - Add ARIA attributes (`aria-disabled`, `aria-busy`)
  - Styling: variant "default", size "lg"

### Step 9: Implement VoiceSampleWarning Component

- In `src/components/story-generation/VoiceSampleWarning.tsx`:
  - Create div with Tailwind alert styles (bg-yellow, border)
  - Add warning icon
  - Add message text
  - Add link to `/voice-sample` (Astro `<a>` tag)
  - Styling: padding, rounded, flex layout

### Step 10: Implement GenerationProgressDisplay Component

- In `src/components/story-generation/GenerationProgressDisplay.tsx`:
  - Import `Progress` from Shadcn
  - Define props interface
  - Create wrapper with border and padding
  - Add `StatusIndicator` component
  - Add `Progress` component (Shadcn)
  - Add percentage text (`{progress}%`)
  - Conditional render `EstimatedTimeDisplay`
  - Add ARIA attributes for accessibility:
    - `aria-label="Generation progress"`
    - `aria-valuenow={progress}`
    - `aria-valuemin={0}`
    - `aria-valuemax={100}`
    - `role="progressbar"`

### Step 11: Implement StatusIndicator Component

- In `src/components/story-generation/StatusIndicator.tsx`:
  - Define props interface
  - Create flex layout with dot and text
  - Map status to color:
    - `pending`: yellow
    - `in_progress`: blue
    - `completed`: green
    - `failed`: red
  - Map status to text:
    - `pending`: "Waiting..."
    - `in_progress`: "Generation in progress..."
    - `completed`: "Completed!"
    - `failed`: "Error"
  - Styling: dot (w-3 h-3 rounded-full), text (text-sm)

### Step 12: Implement EstimatedTimeDisplay Component

- In `src/components/story-generation/EstimatedTimeDisplay.tsx`:
  - Define props interface
  - Function `formatTime(seconds)` → "X min Y sec"
  - Conditional render (only when `timeRemaining` defined)
  - Layout: clock icon + formatted text
  - Styling: text-sm, text-gray

### Step 13: Implement ErrorMessage Component

- In `src/components/story-generation/ErrorMessage.tsx`:
  - Define props interface
  - Create div with Tailwind error styles (bg-red, border-red)
  - Add error icon
  - Add message text (`message` prop)
  - Conditional close button (when `dismissible`)
  - Handle `onDismiss` callback
  - Add ARIA attributes:
    - `role="alert"`
    - `aria-live="assertive"`
  - Styling: padding, rounded, flex layout, red theme

### Step 14: Styling and Responsiveness

- Ensure all components use Tailwind 4
- Add responsive breakpoints (sm, md, lg) where needed
- Test on different resolutions
- Ensure long texts wrap properly
- Check overflow for long story content
- Add smooth transitions for progress bar (CSS transition)
- Check focus states for all interactive elements

### Step 15: Accessibility (a11y)

- Add ARIA labels to all interactive elements
- Ensure Progress has proper attributes:
  - `role="progressbar"`
  - `aria-valuenow`
  - `aria-valuemin`
  - `aria-valuemax`
  - `aria-label`
- Add `aria-live="polite"` for progress updates
- Check keyboard navigation (Tab, Enter)
- Test with screen reader (e.g., NVDA, JAWS)
- Ensure colors have sufficient contrast (WCAG AA)
- Add focus-visible states

### Step 16: Test API Integration

- Test POST /api/story-generations:
  - Valid request (202)
  - Invalid story_id (400)
  - No authorization (401)
  - Story doesn't exist (404)
  - No voice sample (409)
  - Rate limit (429)
- Test polling GET /api/story-generations/:id:
  - Normal sequence: pending → in_progress → completed
  - Status failed
  - 404 during polling
  - Network errors (simulation)
- Test redirect to /my-library after success
- Test polling cleanup on unmount

### Step 17: Edge Cases and Error Handling

- Test scenarios:
  - User navigates away during generation
  - User refreshes page during generation
  - Generation fails after long time
  - Progress doesn't change for long time
  - API returns invalid data
  - User has multiple generations in progress (API should block)
  - Network timeout
  - Very long story content (scrolling)
- Add console.log/console.error for debugging
- Ensure all errors are user-friendly

### Step 18: Performance Optimization

- Ensure components use React.memo where appropriate
- Check for unnecessary re-renders
- Optimize polling frequency (2-3 seconds)
- Consider debouncing for calculateEstimatedTime
- Ensure cleanup works properly (no memory leaks)
- Lazy load components if needed

### Step 19: Documentation

- Add JSDoc comments to all functions and components
- Document props interfaces
- Describe generation flow in comments
- Add usage examples in comments
- Document all types and interfaces

### Step 20: Final Testing and Deployment

- Conduct full flow test:
  1. Login as user with voice sample
  2. Navigate to /stories
  3. Select story
  4. Click "Generate"
  5. Observe progress
  6. Check redirect to /my-library
  7. Verify audio is available
- Test flow without voice sample
- Check linting (no errors)
- Check TypeScript (no type errors)
- Test on different browsers (Chrome, Firefox, Safari)
- Code review
- Deploy to staging
- Final QA
- Deploy to production

---

## Summary

Implementation of Story Generation view requires:

- **1 Astro page**: `[slug].astro`
- **9 React components**: StoryGenerationView, StoryContentDisplay, GenerationSection, GenerateButton, VoiceSampleWarning, GenerationProgressDisplay, StatusIndicator, EstimatedTimeDisplay, ErrorMessage
- **1 custom hook**: `useStoryGeneration`
- **10+ TypeScript types**: Interfaces for props, state, DTOs
- **2 API calls**: POST /api/story-generations, GET /api/story-generations/:id (polling)
- **Full error handling**: 401, 404, 409, 422, 429, 500, network errors
- **Accessibility**: ARIA attributes, keyboard navigation, screen reader support
- **Responsiveness**: Mobile-first, Tailwind breakpoints
- **Polish**: Smooth animations, loading states, success/error feedback

Key aspects:

- **Polling mechanism** for real-time updates
- **Estimated time calculation** based on progress rate
- **Cleanup** on unmount to prevent memory leaks
- **Validation** at every step (auth, voice sample, UUID, API responses)
- **User feedback** at every stage (loading, progress, errors, success)
