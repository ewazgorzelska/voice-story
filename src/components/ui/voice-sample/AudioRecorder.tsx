import { useRef, useState, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import Button from "../button";

type RecordingState = "idle" | "recording" | "recorded";

interface AudioRecorderProps {
  state: RecordingState;
  onComplete: (blob: Blob) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  onStateChange: (state: RecordingState) => void;
}

export default function AudioRecorder({
  state,
  onComplete,
  onError,
  disabled = false,
  onStateChange,
}: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        // Check minimum duration (at least 1 second)
        if (recordingTimeRef.current < 1) {
          onError("Recording must be at least 1 second long");
          resetRecording();
          return;
        }

        onComplete(blob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorder.start();
      onStateChange("recording");
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      // Start timer
      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
      }, 1000);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          onError("Please allow microphone access to record your voice sample.");
        } else {
          onError("Failed to access microphone. Please check your device settings.");
        }
      } else {
        onError("An unknown error occurred while accessing the microphone.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecording = () => {
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    onStateChange("idle");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Recording</h2>

      <div className="flex flex-col items-center gap-4">
        {state === "recording" && (
          <div className="text-2xl font-mono font-bold text-destructive dark:text-red-400 animate-pulse bg-destructive/10 dark:bg-red-950/30 px-6 py-3 rounded-lg border border-destructive/20 dark:border-red-900/50">
            {formatTime(recordingTime)}
          </div>
        )}

        {state === "idle" && (
          <Button size="lg" onClick={startRecording} disabled={disabled} className="gap-2 ">
            <Mic className="h-5 w-5" />
            Start Recording
          </Button>
        )}

        {state === "recording" && (
          <Button size="lg" variant="destructive" onClick={stopRecording} disabled={disabled} className="gap-2">
            <Square className="h-5 w-5" />
            Stop Recording
          </Button>
        )}

        {state === "recorded" && (
          <div className="text-sm text-muted-foreground bg-muted/50 dark:bg-muted/30 px-4 py-2 rounded-md">
            Recording complete ({formatTime(recordingTime)})
          </div>
        )}
      </div>
    </div>
  );
}
