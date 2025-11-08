interface PlaybackPreviewProps {
  src: string;
}

export default function PlaybackPreview({ src }: PlaybackPreviewProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Preview Your Recording</h2>
      <audio
        controls
        src={src}
        className="w-full [&::-webkit-media-controls-panel]:bg-muted [&::-webkit-media-controls-panel]:dark:bg-muted"
        aria-label="Playback preview of your voice recording"
      >
        <track kind="captions" src="" label="No captions available" default />
        Your browser does not support the audio element.
      </audio>
      <p className="text-sm text-muted-foreground mt-2">
        Listen to your recording. If you&apos;re not satisfied, you can re-record.
      </p>
    </div>
  );
}
