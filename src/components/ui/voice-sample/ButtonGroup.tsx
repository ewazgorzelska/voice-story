import { RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type RecordingState = "idle" | "recording" | "recorded";

interface ButtonGroupProps {
  recordingState: RecordingState;
  hasAudioBlob: boolean;
  isUploading: boolean;
  disabled: boolean;
  onReRecord: () => void;
  onSubmit: () => void;
}

export default function ButtonGroup({
  recordingState,
  hasAudioBlob,
  isUploading,
  disabled,
  onReRecord,
  onSubmit,
}: ButtonGroupProps) {
  // Don't show buttons during idle or recording states
  if (recordingState !== "recorded") {
    return null;
  }

  return (
    <div className="flex gap-4 justify-center">
      <Button variant="outline" onClick={onReRecord} disabled={isUploading || disabled} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        Re-record
      </Button>

      <Button onClick={onSubmit} disabled={!hasAudioBlob || isUploading || disabled} className="gap-2">
        <Upload className="h-4 w-4" />
        {isUploading ? "Uploading..." : "Submit"}
      </Button>
    </div>
  );
}
