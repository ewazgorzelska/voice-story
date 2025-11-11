import { useEffect, useState } from "react";
import { useVoiceSample } from "@/lib/hooks/useVoiceSample";
import PhraseDisplay from "./ui/voice-sample/PhraseDisplay";
import AudioRecorder from "./ui/voice-sample/AudioRecorder";
import InlineMessage from "./ui/voice-sample/InlineMessage";
import PlaybackPreview from "./ui/voice-sample/PlaybackPreview";
import ButtonGroup from "./ui/voice-sample/ButtonGroup";
import ProgressIndicator from "./ui/voice-sample/ProgressIndicator";

type RecordingState = "idle" | "recording" | "recorded";

interface MessageState {
  type: "error" | "success";
  text: string;
}

export default function VoiceSampleView() {
  const {
    phrase,
    sampleExists,
    isLoading: hookLoading,
    error: hookError,
    successMessage,
    fetchPhrase,
    checkSampleExists,
    submitSample,
  } = useVoiceSample();

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Fetch phrase and check existing sample on mount
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([fetchPhrase(), checkSampleExists()]);
    };

    initialize();
  }, [fetchPhrase, checkSampleExists]);

  // Handle hook errors
  useEffect(() => {
    if (hookError) {
      setMessage({ type: "error", text: hookError });
    }
  }, [hookError]);

  const handleRecorded = (blob: Blob) => {
    setAudioBlob(blob);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setRecordingState("recorded");
    setMessage(null);
  };

  const handleReRecord = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState("idle");
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (!audioBlob || !phrase) {
      setMessage({ type: "error", text: "Missing audio or verification phrase" });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      await submitSample(audioBlob, phrase);

      // Mark as redirecting to prevent showing "already have sample" message
      setIsRedirecting(true);

      // Use the verification message from the API response
      const successText = successMessage || "Voice sample uploaded successfully! Redirecting...";
      setMessage({
        type: "success",
        text: successText,
      });

      // Redirect to story library after success
      setTimeout(() => {
        window.location.href = "/stories";
      }, 3000); // Slightly longer to show verification message
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRecordingError = (error: string) => {
    setMessage({ type: "error", text: error });
  };

  // Show existing sample message (but not if we're redirecting after successful upload)
  if (sampleExists && !isRedirecting) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Voice Sample</h1>
        <InlineMessage type="success">
          You already have a voice sample. No need to record a new one.
          <br />
          <a href="/stories" className="underline hover:no-underline font-semibold mt-2 inline-block">
            Go to Story Library →
          </a>
        </InlineMessage>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Record Your Voice Sample</h1>

      <div className="space-y-6">
        {/* Phrase Display */}
        {phrase && <PhraseDisplay phrase={phrase} />}

        {/* Audio Recorder */}
        <AudioRecorder
          state={recordingState}
          onComplete={handleRecorded}
          onError={handleRecordingError}
          disabled={isUploading || hookLoading}
          onStateChange={setRecordingState}
        />

        {/* Playback Preview */}
        {recordingState === "recorded" && audioUrl && <PlaybackPreview src={audioUrl} />}

        {/* Button Group */}
        <ButtonGroup
          recordingState={recordingState}
          hasAudioBlob={!!audioBlob}
          isUploading={isUploading}
          disabled={hookLoading}
          onReRecord={handleReRecord}
          onSubmit={handleSubmit}
        />

        {/* Progress Indicator */}
        {isUploading && <ProgressIndicator />}

        {/* Messages */}
        {message && <InlineMessage type={message.type}>{message.text}</InlineMessage>}
      </div>
    </div>
  );
}
