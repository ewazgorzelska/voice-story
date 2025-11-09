# UI Architecture for Voice Story App

## 1. UI Structure Overview

The Voice Story App uses Astro for routing and layouts, with React islands for dynamic functionality. The application is wrapped in a global `QueryClientProvider` and `UserContextProvider` in `Layout.astro` to manage data fetching (React Query) and user session state (Context API). Navigation is responsive with a desktop navbar and a mobile drawer, implemented via Shadcn/ui components and Tailwind CSS.

## 2. View List

### 2.1 Registration View

- View path: `/register`
- Main purpose: Allow new users to create an account
- Key information: Email, password inputs; validation errors as inline message
- Key components: `Form`, `Input`, `Button`,
- UX/accessibility/security: ARIA labels on inputs, client-side and server-side validation, password requirements, CSRF-safe httpOnly cookie

### 2.2 Login View

- View path: `/login`
- Main purpose: Authenticate existing users
- Key information: Email, password inputs; invalid credentials error
- Key components: `Form`, `Input`, `Button`, validation errors as inline message
- UX/accessibility/security: Focus management, screen-reader announcements for errors, JWT stored in httpOnly cookie

### 2.3 Voice Sample Recording View

- View path: `/voice-sample`
- Main purpose: Record and verify user’s voice sample
- Key information: Verification phrase display (from GET `/api/voice-sample/phrase`), record controls, playback preview, submission status, inline message as feedback,
- Key components: `AudioRecorder`, `Button`, `ProgressIndicator`,
- UX/accessibility/security: Visual feedback on recording state, keyboard operability, audio element ARIA roles, limit one sample per user

### 2.4 Story Library View

- View path: `/stories`
- Main purpose: Browse available stories to select for generation
- Key information: Story cards with title, thumbnail, baseline description, pagination controls (GET `/api/stories`), inline message as feedback
- Key components: `Card`, `Button`, `Pagination`, `Skeleton`
- UX/accessibility/security: Keyboard navigation through cards, focus-visible focus states, alt text on thumbnails

### 2.5 Story Generation View

- View path: `/stories/[slug]`
- Main purpose: Display story content and initiate generation
- Key information: Story text preview, preference form collecting child age, minimum/maximum audio duration, optional motif prompt (remaining characters indicator), “Generate” button, real-time progress (polling GET `/api/story-generations/:id`), inline message as feedback
- Key components: `StoryPreferencesForm`, `Input`, `Textarea`, `Button`, `ProgressBar`
- UX/accessibility/security: Accessible progress bar with ARIA attributes, inline validation messages for required fields, enforce numeric inputs with min/max constraints, disable repeated submissions, rate-limit feedback

### 2.6 My Library View

- View path: `/my-library`
- Main purpose: List generated stories for playback and management
- Key information: Generated story cards with teaser summary, display of child age and duration range, play, pause, delete actions (GET `/api/story-generations`; DELETE endpoint)
- Key components: `AudioPlayer`, `Card`, `Button`, `ConfirmationDialog`, `Skeleton`, `Tag`
- UX/accessibility/security: Keyboard-accessible controls, confirmation on delete, ARIA live region for status updates

### 2.7 Error Views

- View paths: `/*` (404), global error boundary (500)
- Main purpose: Inform users of routing errors or application failures
- Key information: Error code and message, navigation link back home
- Key components: `ErrorBoundary`, `Button`
- UX/accessibility/security: Clear messaging, screen-reader support, minimal exposure of implementation details

## 3. User Journey Map

1. User lands on `/login` or `/register`.
2. On successful registration or login, user is redirected to `/voice-sample` if no sample exists, otherwise `/stories`.
3. In Voice Sample View, user fetches phrase, records, verifies, then is redirected to Story Library.
4. In `/stories`, user browses story cards and navigates to `/stories/[slug]` to view details.
5. User clicks **Generate**, sees progress bar until completion, then is redirected to `/my-library`.
6. In My Library, user sees generated stories, uses `AudioPlayer` to listen, or deletes unwanted items.
7. At any point, user can navigate via navbar/drawer to other views or logout.

## 4. Layout and Navigation Structure

- `Layout.astro` wraps pages in: `QueryClientProvider` ➔ `UserContextProvider` ➔ `<header>` ➔ `<main>` ➔ `<footer>`.
- Desktop: horizontal navbar with links to **Stories**, **My Library**, **Record Voice**, and **Logout**.
- Mobile: hamburger icon opens Shadcn/ui `Drawer` with the same links.
- Active route highlighted; keyboard focus managed via Tailwind focus-visible classes.

## 5. Key Components

- **Navbar**: Responsive navigation with ARIA roles and focus traps.
- **Drawer**: Mobile navigation container using `Dialog` patterns.
- **AudioRecorder**: Handles phrase fetch, recording, preview, and submission.
- **AudioPlayer**: Wraps native `<audio>` with custom controls and ARIA attributes.
- **Card**: Standardized layout for story and library items.
- **ProgressBar**: Accessible component showing generation status.
- **Form**: Wrapper with validation integration (React Hook Form + Zod).
- **StoryPreferencesForm**: Form island encapsulating age, duration, and motif inputs with validation and character counter.
- **Tag**: Badge-style component for showing metadata (e.g., age, duration range, motif keywords).
- **Skeleton**: Loading placeholder for cards and lists.
- **Toast**: Global notifications for success/error states.
- **ErrorBoundary**: Catches runtime errors and displays fallback UI.
