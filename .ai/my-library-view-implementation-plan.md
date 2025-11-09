# View Implementation Plan: My Library

## 1. Overview

The My Library view is a personal dashboard where authenticated users can access, manage, and play their generated audio stories. The view displays a paginated grid of story generation cards, each showing the story's title, generation status, and playback controls for completed stories. Users can play/pause audio directly from cards, delete unwanted generations with confirmation, and navigate through multiple pages of content. The interface provides real-time feedback on generation progress and handles various states including loading, empty, and error conditions.

## 2. View Routing

**Path**: `/my-library`

**Astro Page**: `src/pages/my-library.astro`

The page should:

- Check user authentication (redirect to login if not authenticated)
- Import and render the `MyLibraryView` React component as a client-side island
- Pass any server-side data if needed (e.g., initial page from query params)

## 3. Component Structure

```
MyLibraryView (src/components/MyLibraryView.tsx)
├── div.container
│   ├── LibraryHeader (inline within MyLibraryView)
│   │   ├── h1 (title)
│   │   └── StatusFilter (optional, future enhancement)
│   ├── ErrorDisplay (conditional, inline)
│   ├── LibraryGrid (src/components/ui/library/LibraryGrid.tsx)
│   │   ├── GeneratedStoryCard[] (src/components/ui/library/GeneratedStoryCard.tsx)
│   │   │   ├── Card (shadcn/ui)
│   │   │   ├── CardHeader
│   │   │   │   ├── CardTitle (story title)
│   │   │   │   └── StatusBadge (src/components/ui/library/StatusBadge.tsx)
│   │   │   ├── CardContent
│   │   │   │   ├── ProgressDisplay (for pending/in_progress)
│   │   │   │   └── AudioPlayer (for completed, src/components/ui/library/AudioPlayer.tsx)
│   │   │   └── CardFooter
│   │   │       └── Button (delete)
│   │   ├── SkeletonCard[] (existing, reused)
│   │   └── EmptyLibraryState (src/components/ui/library/EmptyLibraryState.tsx)
│   ├── LibraryPagination (reuse from src/components/ui/story/StoryPagination.tsx)
│   └── DeleteConfirmationDialog (src/components/ui/library/DeleteConfirmationDialog.tsx)
```

## 4. Component Details

### 4.1 MyLibraryView

**Purpose**: Root container component that orchestrates the entire library view, manages data fetching, pagination, deletion, and audio playback coordination.

**Main Elements**:

- Container `div` with responsive padding
- `h1` heading with "My Library" title
- Error display area (conditional)
- `LibraryGrid` component
- `LibraryPagination` component
- `DeleteConfirmationDialog` component (modal)
- ARIA live region for status announcements

**Handled Events**:

- Component mount: Fetch initial data
- Page change: Fetch new page of generations
- Delete initiation: Open confirmation dialog
- Delete confirmation: Call API and refresh list
- Audio play: Coordinate single playback across cards

**Validation Conditions**:

- None (validation happens in child components and API)

**Types Used**:

- `MyLibraryViewProps` (component props)
- `EnrichedGenerationDto[]` (enriched generation data)
- `PaginationMetaDto` (pagination metadata)
- `LibraryViewState` (internal state)
- Return type from `useMyLibrary` hook

**Props** (MyLibraryViewProps):

```typescript
interface MyLibraryViewProps {
  initialPage?: number;
  pageSize?: number;
}
```

### 4.2 LibraryGrid

**Purpose**: Layout component that renders a responsive grid of generation cards, skeleton loaders, or empty state based on current data and loading status.

**Main Elements**:

- Container `div` with grid layout (CSS Grid or Tailwind grid classes)
- Conditional rendering of:
  - `GeneratedStoryCard[]` when data exists
  - `SkeletonCard[]` during loading
  - `EmptyLibraryState` when no data

**Handled Events**:

- Pass-through of events from child cards (play, pause, delete)

**Validation Conditions**:

- None (display logic only)

**Types Used**:

- `LibraryGridProps`
- `EnrichedGenerationDto[]`

**Props** (LibraryGridProps):

```typescript
interface LibraryGridProps {
  generations: EnrichedGenerationDto[];
  isLoading: boolean;
  pageSize: number;
  activeAudioId: string | null;
  onPlay: (id: string, url: string) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
}
```

### 4.3 GeneratedStoryCard

**Purpose**: Display individual generated story with status information, playback controls (for completed stories), and delete button.

**Main Elements**:

- `Card` wrapper (shadcn/ui)
- `CardHeader`:
  - `CardTitle` with story title
  - `StatusBadge` component showing generation status
- `CardContent`:
  - `ProgressDisplay` (visible for pending/in_progress statuses)
  - `AudioPlayer` (visible for completed status with valid result_url)
  - Error message (visible for failed status)
- `CardFooter`:
  - Delete `Button` (destructive variant)

**Handled Events**:

- Play button click: Call `onPlay(id, url)`
- Pause button click: Call `onPause(id)`
- Delete button click: Call `onDelete(id)`

**Validation Conditions**:

- **Show AudioPlayer**: `generation.status === "completed" && generation.result_url !== null && generation.result_url !== ""`
- **Show ProgressDisplay**: `generation.status === "pending" || generation.status === "in_progress"`
- **Show error message**: `generation.status === "failed"`
- **Disable delete during deletion**: `isDeleting === true`

**Types Used**:

- `GeneratedStoryCardProps`
- `EnrichedGenerationDto`
- `GenerationStatus`

**Props** (GeneratedStoryCardProps):

```typescript
interface GeneratedStoryCardProps {
  generation: EnrichedGenerationDto;
  isAudioActive: boolean;
  onPlay: (id: string, url: string) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
}
```

### 4.4 AudioPlayer

**Purpose**: Provide audio playback controls for completed story generations, including play/pause toggle, volume control, and seek bar.

**Main Elements**:

- `<audio>` element (hidden, controlled via ref)
- Play/Pause button (icon button)
- Volume slider input
- Seek bar (range input showing current time / duration)
- Time display (current time / total duration)
- ARIA labels for all interactive elements

**Handled Events**:

- Play button click: Call `onPlay()`, start audio playback
- Pause button click: Call `onPause()`, pause audio
- Volume change: Update audio element volume
- Seek change: Update audio element currentTime
- Audio events: `loadedmetadata`, `timeupdate`, `ended`, `error`

**Validation Conditions**:

- **Valid audio URL**: Must be non-empty string before attempting to load
- **Audio loaded**: Show duration only after metadata loaded
- **Play button enabled**: Audio is ready to play

**Types Used**:

- `AudioPlayerProps`
- `AudioPlayerState` (internal state)

**Props** (AudioPlayerProps):

```typescript
interface AudioPlayerProps {
  audioUrl: string;
  isActive: boolean;
  onPlay: () => void;
  onPause: () => void;
}
```

### 4.5 StatusBadge

**Purpose**: Visual indicator showing the current generation status with appropriate color coding and icon.

**Main Elements**:

- `span` or `div` badge with Tailwind styling
- Status icon (optional)
- Status text (e.g., "Pending", "In Progress", "Completed", "Failed")

**Handled Events**:

- None (display only)

**Validation Conditions**:

- None (display based on props)

**Types Used**:

- `StatusBadgeProps`
- `GenerationStatus`

**Props** (StatusBadgeProps):

```typescript
interface StatusBadgeProps {
  status: GenerationStatus;
  className?: string;
}
```

### 4.6 ProgressDisplay

**Purpose**: Show generation progress for pending and in-progress stories using a progress bar and percentage.

**Main Elements**:

- Progress bar (`<progress>` element or custom div-based bar)
- Percentage text (e.g., "45%")
- Status text (e.g., "Generating your story...")
- ARIA attributes: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

**Handled Events**:

- None (display only)

**Validation Conditions**:

- **Progress value**: Must be between 0 and 100

**Types Used**:

- `ProgressDisplayProps`

**Props** (ProgressDisplayProps):

```typescript
interface ProgressDisplayProps {
  progress: number;
  status: GenerationStatus;
}
```

### 4.7 DeleteConfirmationDialog

**Purpose**: Modal dialog to confirm deletion of a generated story, preventing accidental deletions.

**Main Elements**:

- Dialog overlay (modal backdrop)
- Dialog content:
  - Dialog title: "Delete Story?"
  - Dialog description: Warning message, story title
  - Warning for in-progress generations
  - Error message (if deletion fails)
  - Action buttons:
    - Cancel button (outline variant)
    - Confirm delete button (destructive variant, disabled during deletion)

**Handled Events**:

- Confirm button click: Call `onConfirm()`, await completion
- Cancel button click: Call `onCancel()`, close dialog
- Escape key: Call `onCancel()`, close dialog
- Outside click: Call `onCancel()`, close dialog

**Validation Conditions**:

- **Disable confirm button**: `isDeleting === true`
- **Show warning**: `generation.status === "in_progress"`
- **Show error**: `error !== null`

**Types Used**:

- `DeleteConfirmationDialogProps`
- `EnrichedGenerationDto`

**Props** (DeleteConfirmationDialogProps):

```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  generation: EnrichedGenerationDto | null;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```

### 4.8 EmptyLibraryState

**Purpose**: Display a friendly message when the user has no generated stories, with a call-to-action to browse the story library.

**Main Elements**:

- Container `div` with centered content
- Icon or illustration (e.g., empty box icon)
- Heading: "No Stories Yet"
- Description text: "Generate your first story to get started"
- Call-to-action `Button` linking to `/stories`

**Handled Events**:

- Button click: Navigate to `/stories`

**Validation Conditions**:

- None

**Types Used**:

- `EmptyLibraryStateProps`

**Props** (EmptyLibraryStateProps):

```typescript
interface EmptyLibraryStateProps {
  message?: string;
  ctaText?: string;
  ctaHref?: string;
}
```

### 4.9 LibraryPagination

**Purpose**: Reuse existing `StoryPagination` component from `/components/ui/story/StoryPagination.tsx` for consistent pagination UI.

**Props**: Same as existing `StoryPagination` component.

## 5. Types

### 5.1 New Types to Add to `src/types.ts`

```typescript
//
//#region My Library View Models

/** Enriched generation DTO with story title for display */
export interface EnrichedGenerationDto extends StoryGenerationDto {
  /** Story title from stories table */
  story_title: string;
}

/** Audio player internal state */
export interface AudioPlayerState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Volume level (0.0 to 1.0) */
  volume: number;
  /** Whether audio is loading */
  isLoading: boolean;
  /** Error message if audio failed to load */
  error: string | null;
}

/** Props for MyLibraryView component */
export interface MyLibraryViewProps {
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Number of items per page */
  pageSize?: number;
}

/** Props for LibraryGrid component */
export interface LibraryGridProps {
  /** Array of enriched generation data */
  generations: EnrichedGenerationDto[];
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Number of items per page (for skeleton count) */
  pageSize: number;
  /** ID of currently playing audio (null if none) */
  activeAudioId: string | null;
  /** Handler for play action */
  onPlay: (id: string, url: string) => void;
  /** Handler for pause action */
  onPause: (id: string) => void;
  /** Handler for delete action */
  onDelete: (id: string) => void;
}

/** Props for GeneratedStoryCard component */
export interface GeneratedStoryCardProps {
  /** Generation data with enriched story title */
  generation: EnrichedGenerationDto;
  /** Whether this card's audio is currently active */
  isAudioActive: boolean;
  /** Handler for play action */
  onPlay: (id: string, url: string) => void;
  /** Handler for pause action */
  onPause: (id: string) => void;
  /** Handler for delete action */
  onDelete: (id: string) => void;
}

/** Props for AudioPlayer component */
export interface AudioPlayerProps {
  /** URL of the audio file to play */
  audioUrl: string;
  /** Whether this audio player is currently active */
  isActive: boolean;
  /** Handler called when play is triggered */
  onPlay: () => void;
  /** Handler called when pause is triggered */
  onPause: () => void;
}

/** Props for StatusBadge component */
export interface StatusBadgeProps {
  /** Current generation status */
  status: GenerationStatus;
  /** Additional CSS classes */
  className?: string;
}

/** Props for ProgressDisplay component */
export interface ProgressDisplayProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Current generation status */
  status: GenerationStatus;
}

/** Props for DeleteConfirmationDialog component */
export interface DeleteConfirmationDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Generation to be deleted (null if none) */
  generation: EnrichedGenerationDto | null;
  /** Whether deletion is in progress */
  isDeleting: boolean;
  /** Error message if deletion failed */
  error: string | null;
  /** Handler for confirm action */
  onConfirm: () => Promise<void>;
  /** Handler for cancel action */
  onCancel: () => void;
}

/** Props for EmptyLibraryState component */
export interface EmptyLibraryStateProps {
  /** Custom message to display */
  message?: string;
  /** CTA button text */
  ctaText?: string;
  /** CTA button href */
  ctaHref?: string;
}

//#endregion
```

### 5.2 Existing Types (Reference)

These types are already defined in `src/types.ts` and should be reused:

- `StoryGenerationDto`: Base generation data from API
- `GetStoryGenerationsResponseDto`: API response with data array and pagination
- `PaginationMetaDto`: Pagination metadata
- `GenerationStatus`: Union type of status values
- `StorySummaryDto`: Story summary with id, title, slug

## 6. State Management

### 6.1 Custom Hook: `useMyLibrary`

**Location**: `src/lib/hooks/useMyLibrary.ts`

**Purpose**: Manage library data fetching, pagination, deletion, and story title enrichment. This hook encapsulates all data operations for the My Library view.

**State Variables**:

```typescript
const [generations, setGenerations] = useState<EnrichedGenerationDto[]>([]);
const [pagination, setPagination] = useState<PaginationMetaDto | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState(initialPage);
const [stories, setStories] = useState<Map<string, string>>(new Map()); // story_id -> title map
```

**Methods**:

```typescript
// Fetch story generations with enriched titles
const fetchGenerations = useCallback(async () => {
  setIsLoading(true);
  setError(null);

  try {
    // 1. Fetch generations
    const url = new URL("/api/story-generations", window.location.origin);
    url.searchParams.set("page", currentPage.toString());
    url.searchParams.set("pageSize", pageSize.toString());

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Failed to fetch generations");

    const data: GetStoryGenerationsResponseDto = await response.json();

    // 2. Fetch stories if not cached
    const storyIds = data.data.map((g) => g.story_id);
    const uncachedIds = storyIds.filter((id) => !stories.has(id));

    if (uncachedIds.length > 0) {
      const storiesResponse = await fetch("/api/stories?pageSize=100");
      if (storiesResponse.ok) {
        const storiesData: GetStoriesResponseDto = await storiesResponse.json();
        const newMap = new Map(stories);
        storiesData.data.forEach((s) => newMap.set(s.id, s.title));
        setStories(newMap);
      }
    }

    // 3. Enrich generations with titles
    const enriched = data.data.map((gen) => ({
      ...gen,
      story_title: stories.get(gen.story_id) || "Unknown Story",
    }));

    setGenerations(enriched);
    setPagination(data.meta);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load library");
  } finally {
    setIsLoading(false);
  }
}, [currentPage, pageSize, stories]);

// Delete a generation
const deleteGeneration = useCallback(
  async (id: string) => {
    const response = await fetch(`/api/story-generations/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete generation");
    }

    // Refresh library after deletion
    await fetchGenerations();
  },
  [fetchGenerations]
);

// Manual refresh
const refreshLibrary = useCallback(() => {
  return fetchGenerations();
}, [fetchGenerations]);
```

**Return Type**:

```typescript
interface UseMyLibraryReturn {
  generations: EnrichedGenerationDto[];
  pagination: PaginationMetaDto | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  deleteGeneration: (id: string) => Promise<void>;
  refreshLibrary: () => Promise<void>;
}
```

### 6.2 Custom Hook: `useAudioPlayer`

**Location**: `src/lib/hooks/useAudioPlayer.ts`

**Purpose**: Coordinate audio playback across multiple cards, ensuring only one audio plays at a time.

**State Variables**:

```typescript
const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
```

**Methods**:

```typescript
const play = useCallback(
  (id: string, url: string) => {
    // Stop any currently playing audio
    if (activeAudioId && activeAudioId !== id) {
      const prevAudio = audioRefs.current.get(activeAudioId);
      if (prevAudio) {
        prevAudio.pause();
      }
    }

    setActiveAudioId(id);
  },
  [activeAudioId]
);

const pause = useCallback(
  (id: string) => {
    if (activeAudioId === id) {
      setActiveAudioId(null);
    }
  },
  [activeAudioId]
);

const stop = useCallback(() => {
  if (activeAudioId) {
    const audio = audioRefs.current.get(activeAudioId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
  setActiveAudioId(null);
}, [activeAudioId]);

const isPlaying = useCallback(
  (id: string) => {
    return activeAudioId === id;
  },
  [activeAudioId]
);

const registerAudio = useCallback((id: string, audioElement: HTMLAudioElement) => {
  audioRefs.current.set(id, audioElement);
}, []);

const unregisterAudio = useCallback((id: string) => {
  audioRefs.current.delete(id);
}, []);
```

**Return Type**:

```typescript
interface UseAudioPlayerReturn {
  activeAudioId: string | null;
  play: (id: string, url: string) => void;
  pause: (id: string) => void;
  stop: () => void;
  isPlaying: (id: string) => boolean;
  registerAudio: (id: string, audioElement: HTMLAudioElement) => void;
  unregisterAudio: (id: string) => void;
}
```

### 6.3 Component-Level State

**MyLibraryView:**

- Delete dialog state (isOpen, generationToDelete, isDeleting, deleteError)

**AudioPlayer:**

- Local audio state (currentTime, duration, volume, isLoading, error)

## 7. API Integration

### 7.1 Fetch Generations

**Endpoint**: `GET /api/story-generations`

**Query Parameters**:

- `page`: number (1-indexed)
- `pageSize`: number
- `status`: GenerationStatus (optional)

**Request Type**: None (GET with query params)

**Response Type**: `GetStoryGenerationsResponseDto`

```typescript
{
  data: StoryGenerationDto[];
  meta: PaginationMetaDto;
}
```

**Response Status**:

- `200`: Success
- `401`: Unauthorized (redirect to login)
- `500`: Server error

**Implementation Location**: `useMyLibrary` hook

**Error Handling**:

- Network errors: Show error message with retry button
- 401: Redirect to login page
- 500: Show generic error message

### 7.2 Delete Generation

**Endpoint**: `DELETE /api/story-generations/:id`

**Path Parameters**:

- `id`: string (generation UUID)

**Request Type**: None (no body)

**Response Type**: None (204 No Content on success)

**Response Status**:

- `204`: Success
- `404`: Generation not found
- `409`: Cannot delete in-progress generation
- `500`: Server error

**Implementation Location**: `useMyLibrary` hook, called from dialog confirm handler

**Error Handling**:

- 404: Show "Generation not found" in dialog
- 409: Show "Cannot delete in-progress generation" in dialog
- Network errors: Show "Failed to delete" in dialog
- On success: Close dialog, refresh library

### 7.3 Fetch Stories (for titles)

**Endpoint**: `GET /api/stories`

**Query Parameters**:

- `pageSize`: 100 (fetch all stories at once)
- `sort`: "asc"

**Request Type**: None

**Response Type**: `GetStoriesResponseDto`

```typescript
{
  data: StorySummaryDto[];
  meta: PaginationMetaDto;
}
```

**Implementation Location**: `useMyLibrary` hook (called when stories not in cache)

**Caching Strategy**: Store in Map (story_id -> title) for session duration

## 8. User Interactions

### 8.1 View Library

**Trigger**: User navigates to `/my-library`

**Flow**:

1. MyLibraryView component mounts
2. useMyLibrary hook triggers fetchGenerations()
3. API calls made to fetch generations and stories
4. Data enriched with story titles
5. LibraryGrid renders cards

**Visual Feedback**:

- Show skeleton cards during loading
- Show empty state if no generations
- Show error message if fetch fails

### 8.2 Play Audio

**Trigger**: User clicks play button on a completed story card

**Flow**:

1. User clicks play icon on GeneratedStoryCard
2. Card calls `onPlay(generationId, audioUrl)`
3. useAudioPlayer stops any currently playing audio
4. useAudioPlayer sets activeAudioId to current generation
5. AudioPlayer component receives isActive=true
6. Audio element starts playback
7. Play icon changes to pause icon

**Visual Feedback**:

- Play icon animates to pause icon
- Progress bar shows current playback position
- Time display updates

**Accessibility**:

- ARIA label: "Play [Story Title]" / "Pause [Story Title]"
- ARIA live region announces: "Now playing [Story Title]"

### 8.3 Pause Audio

**Trigger**: User clicks pause button on active audio player

**Flow**:

1. User clicks pause icon on AudioPlayer
2. Component calls `onPause(generationId)`
3. Audio element pauses playback
4. Pause icon changes to play icon

**Visual Feedback**:

- Pause icon animates to play icon
- Progress bar remains at current position

**Accessibility**:

- ARIA label updates to "Play [Story Title]"
- ARIA live region announces: "Paused"

### 8.4 Adjust Volume

**Trigger**: User moves volume slider

**Flow**:

1. User interacts with volume slider
2. onChange handler updates audio element volume
3. Volume persists to localStorage (optional enhancement)

**Visual Feedback**:

- Slider position updates
- Volume icon changes based on level (muted/low/high)

**Accessibility**:

- ARIA label: "Volume"
- ARIA valuetext: "[Volume]%"

### 8.5 Seek Audio

**Trigger**: User clicks or drags seek bar

**Flow**:

1. User interacts with seek slider
2. onChange handler updates audio element currentTime
3. Playback continues from new position

**Visual Feedback**:

- Seek bar position updates
- Time display updates

**Accessibility**:

- ARIA label: "Seek"
- ARIA valuetext: "[Current Time] of [Duration]"

### 8.6 Delete Story

**Trigger**: User clicks delete button on a card

**Flow**:

1. User clicks delete button on GeneratedStoryCard
2. Card calls `onDelete(generationId)`
3. MyLibraryView opens DeleteConfirmationDialog
4. Dialog displays story title and warning (if in-progress)

**Visual Feedback**:

- Modal dialog appears with overlay
- Focus moves to dialog

**Accessibility**:

- Dialog traps focus
- Escape key closes dialog
- Focus returns to delete button after close

### 8.7 Confirm Delete

**Trigger**: User clicks confirm button in delete dialog

**Flow**:

1. User clicks "Delete" button in dialog
2. Dialog calls `onConfirm()` async handler
3. useMyLibrary.deleteGeneration() called
4. API DELETE request sent
5. On success: Dialog closes, library refreshes
6. On error: Error message shown in dialog

**Visual Feedback**:

- Confirm button shows loading spinner
- Both buttons disabled during deletion
- Success: Dialog closes smoothly
- Error: Error message appears in dialog

**Accessibility**:

- Loading state announced to screen readers
- Success/error announced via ARIA live region

### 8.8 Cancel Delete

**Trigger**: User clicks cancel button or presses Escape

**Flow**:

1. User cancels deletion
2. Dialog calls `onCancel()`
3. Dialog closes
4. No API call made

**Visual Feedback**:

- Dialog closes smoothly
- Focus returns to delete button

### 8.9 Change Page

**Trigger**: User clicks page number or next/previous button

**Flow**:

1. User clicks pagination control
2. LibraryPagination calls `onPageChange(newPage)`
3. MyLibraryView updates currentPage state
4. useMyLibrary.fetchGenerations() triggered
5. New page of generations loaded
6. Grid updates with new data

**Visual Feedback**:

- Skeleton cards appear during loading
- Smooth transition to new content
- Active page highlighted in pagination

**Accessibility**:

- Current page announced to screen readers
- Keyboard navigation supported

## 9. Conditions and Validation

### 9.1 Show Play Controls

**Condition**: `generation.status === "completed" && generation.result_url !== null && generation.result_url !== ""`

**Component**: GeneratedStoryCard

**Effect**: Render AudioPlayer component in CardContent

**Validation**: Check both status and result_url before rendering audio player

### 9.2 Show Progress Display

**Condition**: `generation.status === "pending" || generation.status === "in_progress"`

**Component**: GeneratedStoryCard

**Effect**: Render ProgressDisplay component showing progress bar and percentage

**Validation**: Progress value must be between 0 and 100

### 9.3 Show Error State

**Condition**: `generation.status === "failed"`

**Component**: GeneratedStoryCard

**Effect**: Render error message in CardContent with appropriate styling and icon

### 9.4 Enable Pagination

**Condition**: `pagination.total > pagination.page_size`

**Component**: MyLibraryView

**Effect**: Render LibraryPagination component

**Validation**: Check pagination metadata before rendering pagination controls

### 9.5 Show Empty State

**Condition**: `!isLoading && !error && generations.length === 0`

**Component**: LibraryGrid

**Effect**: Render EmptyLibraryState instead of cards

### 9.6 Show Error Display

**Condition**: `error !== null`

**Component**: MyLibraryView

**Effect**: Render error message banner with retry option

### 9.7 Show Loading Skeletons

**Condition**: `isLoading === true`

**Component**: LibraryGrid

**Effect**: Render array of SkeletonCard components (count = pageSize)

### 9.8 Disable Delete Button During Deletion

**Condition**: `isDeleting === true`

**Component**: DeleteConfirmationDialog

**Effect**: Disable confirm button, show loading spinner

### 9.9 Warn About In-Progress Deletion

**Condition**: `generation.status === "in_progress"`

**Component**: DeleteConfirmationDialog

**Effect**: Show additional warning message about deleting in-progress generation

### 9.10 Single Audio Playback

**Condition**: `activeAudioId !== null && activeAudioId !== currentGenerationId`

**Component**: AudioPlayer (via useAudioPlayer hook)

**Effect**: Pause other audio when new audio starts playing

**Validation**: Coordinated through useAudioPlayer hook state

## 10. Error Handling

### 10.1 Fetch Generations Fails

**Scenario**: Network error, server error, or API returns 500

**Handling**:

- Catch error in useMyLibrary.fetchGenerations()
- Set error state with user-friendly message
- Display error banner in MyLibraryView
- Provide "Retry" button to call fetchGenerations() again

**User Message**: "Failed to load your library. Please try again."

**Technical Logging**: Log full error to console.error

### 10.2 Audio Load Fails

**Scenario**: result_url is invalid, network error, or unsupported format

**Handling**:

- AudioPlayer catches audio element error event
- Set internal error state
- Display error message in place of player controls
- Disable play button

**User Message**: "Unable to load audio. Please try generating this story again."

**Technical Logging**: Log audio error to console.error

### 10.3 Delete Fails (404)

**Scenario**: Generation not found (already deleted or never existed)

**Handling**:

- Catch 404 in deleteGeneration()
- Show error in dialog: "This story has already been deleted."
- Provide "Close" button
- On close, refresh library to sync state

**User Message**: "This story has already been deleted."

### 10.4 Delete Fails (409)

**Scenario**: Attempting to delete in-progress generation

**Handling**:

- Catch 409 in deleteGeneration()
- Show error in dialog: "Cannot delete a story while it's being generated."
- Provide "Close" button

**User Message**: "Cannot delete a story while it's being generated. Please wait for generation to complete or fail."

### 10.5 Delete Fails (Network/Server Error)

**Scenario**: Network error, server error, or API returns 500

**Handling**:

- Catch error in deleteGeneration()
- Show error in dialog: "Failed to delete story. Please try again."
- Keep dialog open with "Retry" option
- User can retry or cancel

**User Message**: "Failed to delete story. Please try again."

### 10.6 No Stories Generated (Empty State)

**Scenario**: User has never generated any stories

**Handling**:

- Check generations.length === 0 && !isLoading && !error
- Render EmptyLibraryState component
- Show friendly message: "No Stories Yet"
- Provide call-to-action button: "Browse Story Library"
- Button links to `/stories`

**User Message**: "You haven't generated any stories yet. Browse our story library to create your first personalized story!"

### 10.7 Authentication Error

**Scenario**: User is not authenticated or session expired

**Handling**:

- Catch 401 in API calls
- Redirect to `/login` or root page
- Preserve intended destination for post-login redirect (optional)

**User Message**: None (automatic redirect)

### 10.8 Invalid Pagination

**Scenario**: User requests page that doesn't exist

**Handling**:

- API returns empty data array with correct meta
- Show EmptyLibraryState or navigate to last valid page
- Validate page number doesn't exceed total pages

**User Message**: "No stories found on this page."

### 10.9 Story Title Not Found

**Scenario**: Generation references story_id that doesn't exist in stories table

**Handling**:

- During enrichment, check if story_id exists in stories map
- If not found, use fallback: "Unknown Story"
- Log warning to console for debugging

**User Message**: Card displays "Unknown Story" as title

**Technical Logging**: console.warn("Story not found for generation:", generationId, storyId)

### 10.10 Multiple Rapid Deletes

**Scenario**: User attempts to delete multiple stories rapidly

**Handling**:

- Disable delete buttons globally during any deletion
- Queue delete operations or show "Please wait" message
- Prevent race conditions with proper state management

**User Message**: "Please wait for the current deletion to complete."

## 11. Implementation Steps

### Step 1: Create Type Definitions

- Add all new types to `src/types.ts` in the "My Library View Models" section
- Ensure all types are exported
- Verify no conflicts with existing types

### Step 2: Create useMyLibrary Hook

- Create file: `src/lib/hooks/useMyLibrary.ts`
- Implement state management for generations, pagination, loading, error
- Implement fetchGenerations() with story enrichment logic
- Implement deleteGeneration() with error handling
- Implement refreshLibrary() method
- Add proper TypeScript types for all functions
- Test hook in isolation if possible

### Step 3: Create useAudioPlayer Hook

- Create file: `src/lib/hooks/useAudioPlayer.ts`
- Implement state for activeAudioId
- Implement play(), pause(), stop(), isPlaying() methods
- Implement audio ref management (registerAudio, unregisterAudio)
- Ensure only one audio plays at a time
- Add proper TypeScript types

### Step 4: Create StatusBadge Component

- Create file: `src/components/ui/library/StatusBadge.tsx`
- Implement status-based styling (colors, icons)
- Map GenerationStatus to display text and colors:
  - pending: gray/yellow, "Pending"
  - in_progress: blue, "In Progress"
  - completed: green, "Completed"
  - failed: red, "Failed"
- Use Tailwind classes for styling
- Export component with proper types

### Step 5: Create ProgressDisplay Component

- Create file: `src/components/ui/library/ProgressDisplay.tsx`
- Implement progress bar using existing Progress component or custom
- Display percentage text
- Add ARIA attributes for accessibility
- Style with Tailwind
- Export component with proper types

### Step 6: Create AudioPlayer Component

- Create file: `src/components/ui/library/AudioPlayer.tsx`
- Implement `<audio>` element with ref
- Create play/pause button with icon toggle
- Create volume slider (input range)
- Create seek bar (input range)
- Display current time and duration
- Handle audio events: loadedmetadata, timeupdate, ended, error
- Implement all ARIA attributes
- Style with Tailwind
- Integrate with useAudioPlayer hook
- Export component with proper types

### Step 7: Create EmptyLibraryState Component

- Create file: `src/components/ui/library/EmptyLibraryState.tsx`
- Design friendly empty state UI (icon, message, CTA button)
- Use existing Button component
- Link CTA to `/stories`
- Style with Tailwind for centered layout
- Export component with proper types

### Step 8: Create DeleteConfirmationDialog Component

- Create file: `src/components/ui/library/DeleteConfirmationDialog.tsx`
- Implement using Shadcn/ui Dialog pattern (or create custom modal)
- Add dialog overlay and content
- Display story title in confirmation message
- Show warning for in-progress generations
- Display error message if deletion fails
- Implement Cancel and Delete buttons
- Handle Escape key and outside clicks
- Add proper ARIA attributes and focus management
- Style with Tailwind
- Export component with proper types

### Step 9: Create GeneratedStoryCard Component

- Create file: `src/components/ui/library/GeneratedStoryCard.tsx`
- Use existing Card components from shadcn/ui
- Implement CardHeader with title and StatusBadge
- Implement CardContent with conditional rendering:
  - ProgressDisplay for pending/in_progress
  - AudioPlayer for completed
  - Error message for failed
- Implement CardFooter with delete Button
- Wire up all event handlers (onPlay, onPause, onDelete)
- Style with Tailwind
- Export component with proper types

### Step 10: Create LibraryGrid Component

- Create file: `src/components/ui/library/LibraryGrid.tsx`
- Implement responsive grid layout (CSS Grid or Tailwind grid)
- Conditional rendering:
  - GeneratedStoryCard array when data exists
  - SkeletonCard array during loading
  - EmptyLibraryState when no data
- Pass all necessary props to child components
- Style with Tailwind (responsive: 1 col mobile, 2 tablet, 3-4 desktop)
- Export component with proper types

### Step 11: Create MyLibraryView Component

- Create file: `src/components/MyLibraryView.tsx`
- Import and use useMyLibrary hook
- Import and use useAudioPlayer hook
- Implement delete dialog state management
- Render header with title
- Render error display (conditional)
- Render LibraryGrid with all props
- Render LibraryPagination (conditional, reuse existing)
- Render DeleteConfirmationDialog
- Add ARIA live region for announcements
- Wire up all event handlers
- Style container with Tailwind
- Export component with proper types

### Step 12: Create Astro Page

- Create file: `src/pages/my-library.astro`
- Import Layout
- Check authentication (redirect if not authenticated)
- Import MyLibraryView as React island
- Render MyLibraryView with client:load directive
- Add any server-side data fetching if needed
- Set page title and meta tags

### Step 13: Add Navigation Link

- Update navigation component (navbar/drawer) to include "My Library" link
- Add link to `/my-library`
- Highlight active state when on my-library page
- Ensure link is accessible (ARIA, focus states)

### Step 14: Testing and Refinement

- Test all user flows:
  - View library with data
  - View empty library
  - Play/pause audio
  - Adjust volume and seek
  - Delete story (confirm and cancel)
  - Pagination
  - Error states
- Test accessibility:
  - Keyboard navigation
  - Screen reader announcements
  - Focus management
  - ARIA attributes
- Test edge cases:
  - Network failures
  - Invalid audio URLs
  - Concurrent deletes
  - Multiple audio players
  - Story title not found
- Refine styling for consistency with design system
- Optimize performance (memoization, lazy loading)

### Step 15: Add Polling for In-Progress Generations (Optional Enhancement)

- If real-time progress updates are desired:
  - Add polling logic to useMyLibrary hook
  - Poll GET /api/story-generations/:id for in_progress items
  - Update progress in real-time
  - Stop polling when status changes to completed/failed
- Use polling interval of 2-5 seconds
- Clean up intervals on unmount

### Step 16: Final Code Review and Documentation

- Review all components for code quality
- Ensure consistent error handling
- Verify all TypeScript types are correct
- Add JSDoc comments to complex functions
- Update project documentation if needed
- Commit changes with descriptive messages
