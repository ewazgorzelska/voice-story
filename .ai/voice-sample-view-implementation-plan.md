# View Implementation Plan: Voice Sample Recording (`/voice-sample`)

## 1. Overview
This view allows a logged-in user without an existing voice sample to record a short verification phrase, review and re-record if needed, then upload and save their sample via the backend API. It guides the user through: fetching a phrase, recording audio, previewing it, and submitting it, with clear feedback and accessibility support.

## 2. View Routing
Path: `/voice-sample`  
Render as an Astro page in `src/pages/voice-sample.astro`, embedding a React island `VoiceSampleView`.

## 3. Component Structure

VoiceSamplePage (Astro)
└── VoiceSampleView (React)
├── PhraseDisplay
├── AudioRecorder
├── PlaybackPreview
├── ButtonGroup
│ ├── RecordButton / StopButton
│ ├── ReRecordButton
│ └── SubmitButton
├── ProgressIndicator (for upload)
└── InlineMessage (error/success)


## 4. Component Details

### 4.1 VoiceSampleView
- Description: Orchestrates fetch, record, preview, upload, and navigation.
- Elements/Children:
  - `<PhraseDisplay phrase={phrase} />`
  - `<AudioRecorder onComplete={onRecorded} state={recordingState} />`
  - `{recorded && <PlaybackPreview src={audioUrl} />}`
  - `<ButtonGroup … />`
  - `{isUploading && <ProgressIndicator />}`
  - `{message && <InlineMessage type={message.type}>{message.text}</InlineMessage>}`
- Events:
  - `onMount`: fetch phrase & check existing sample
  - `onRecorded(blob)`: set audioBlob, create preview URL
  - Button clicks as defined below
- Validation:
  - Disable all controls if `sampleExists === true`
  - Disable Submit if no `audioBlob`
- Props: none

### 4.2 PhraseDisplay
- Description: Shows the verification phrase
- Elements: `<p aria-live="polite">{phrase}</p>`
- Props:
  - `phrase: string`

### 4.3 AudioRecorder
- Description: Handles MediaRecorder API
- Elements: Record/Stop button
- Events:
  - `onStart()`, `onStop()`
  - `onComplete(blob: Blob)`
- Props:
  - `state: 'idle' | 'recording' | 'recorded'`
  - `onComplete: (blob: Blob) => void`

### 4.4 PlaybackPreview
- Description: Renders `<audio controls src={src} />`
- Props:
  - `src: string`

### 4.5 ButtonGroup
- RecordButton / StopButton
  - Disabled when `isUploading` or `sampleExists`
  - Toggles recording state
- ReRecordButton
  - Visible when `recordingState === 'recorded'`
  - Resets state to `'idle'`
- SubmitButton
  - Disabled if no `audioBlob` or `isUploading`
  - On click → upload & POST
- Props: callbacks for each action

### 4.6 ProgressIndicator
- Displays upload progress spinner or bar

### 4.7 InlineMessage
- Shows error or success text
- Props:
  - `type: 'error' | 'success'`
  - `children: ReactNode`

## 5. Types

```ts
// From API
interface GetVoiceSamplePhraseResponseDto { phrase: string }
interface CreateVoiceSampleCommand {
  audio_url: string
  verification_phrase: string
}
interface VoiceSampleDto {
  id: string
  user_id: string
  created_at: string
  verified: boolean
}

// ViewModel
interface VoiceSampleState {
  phrase: string
  recordingState: 'idle' | 'recording' | 'recorded'
  audioBlob: Blob | null
  audioUrl: string | null
  isUploading: boolean
  message: { type: 'error' | 'success'; text: string } | null
  sampleExists: boolean
}
```

## 6. State Management
- Use React `useState` for `VoiceSampleState` fields.
- On mount in `useEffect` call custom `useVoiceSample()` hook:
  - `fetchPhrase(): Promise<string>`
  - `checkSampleExists(): Promise<boolean>`
- `useVoiceSample` returns phrase and sampleExists status plus `submitSample(blob)` action.

## 7. API Integration
- GET `/api/voice-sample/phrase` → `GetVoiceSamplePhraseResponseDto`
- (Optional) GET `/api/voice-sample` to detect existing sample via `VoiceSampleDto[]`
- Upload Blob to Supabase Storage:
  ```ts
  const { data: uploadResult, error: uploadErr } =
    await supabase.storage
      .from('voice-samples')
      .upload(path, audioBlob, { upsert: false })
  ```
  `const url = supabase.storage.from('voice-samples').getPublicUrl(path).publicUrl`
- POST `/api/voice-sample` with `CreateVoiceSampleCommand`
- Handle 201 → success; 409 → “already exists”; 422 → validation

## 8. User Interactions
1. Page load → phrase fetch + sampleExists check
2. Click **Record** → grant mic permission → start recording
3. Click **Stop** → stop recording → preview appears
4. Click **Re-record** → discard blob → back to idle
5. Click **Submit** → show `ProgressIndicator`
   - Upload audio → get URL → POST to API
   - On success → show success InlineMessage / redirect
   - On error → show error InlineMessage

## 9. Conditions and Validation
- `sampleExists === true` → show message “You already have a voice sample.”, disable controls
- Recording must produce a Blob; nothing less than 1 s (optional minimum check)
- SubmitButton enabled only if `audioBlob` exists
- Catch and display any API validation errors

## 10. Error Handling
- Mic permission denied → InlineMessage “Please allow microphone access.”
- Recording errors → InlineMessage “Recording failed, please retry.”
- Upload errors → InlineMessage “Upload failed, check your connection.”
- POST 409 → InlineMessage “Voice sample already exists.”
- POST 422 → InlineMessage with field error details

## 11. Implementation Steps
1. Create `src/pages/voice-sample.astro` with `<VoiceSampleView />` island.
2. Implement `src/components/VoiceSampleView.tsx`:
   - State definitions, `useEffect` for phrase & existence
   - Handlers for record, stop, re-record, submit
3. Implement `PhraseDisplay`, `AudioRecorder`, `PlaybackPreview`, `ButtonGroup`, `ProgressIndicator`, `InlineMessage` in `src/components/ui/voice-sample/`.
4. Create custom hook `useVoiceSample` in `src/lib/hooks/useVoiceSample.ts` encapsulating API calls and Supabase upload.
5. Style with Tailwind + Shadcn/ui buttons and states.
6. Add ARIA attributes: `aria-live` on messages, `role="status"` on progress.
7. Test flows: no-sample, record/preview/re-record, submit success, and each error.