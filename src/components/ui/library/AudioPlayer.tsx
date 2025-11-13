import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";

import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AudioPlayerProps } from "@/types";

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }
  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(({ audioUrl, isActive, onPlay, onPause }, ref) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekValue, setSeekValue] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);

  const assignRef = useCallback(
    (node: HTMLAudioElement | null) => {
      audioRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  const handlePlayPause = useCallback(() => {
    if (!audioUrl) {
      setError("Audio unavailable. Please try again later.");
      return;
    }
    if (isActive) {
      onPause();
      return;
    }
    onPlay();
  }, [audioUrl, isActive, onPause, onPlay]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    setDuration(audio.duration || 0);
    setIsLoading(false);
    setError(null);
    if (Number.isFinite(volume)) {
      audio.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isSeeking) {
      return;
    }
    setCurrentTime(audio.currentTime);
    setSeekValue(audio.currentTime);
  }, [isSeeking]);

  const handleEnded = useCallback(() => {
    setCurrentTime(0);
    setSeekValue(0);
    onPause();
  }, [onPause]);

  const handleError = useCallback(() => {
    setError("Unable to load audio. Please try generating this story again.");
    setIsLoading(false);
    onPause();
  }, [onPause]);

  const handleSeekChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number.parseFloat(event.target.value);
    if (Number.isNaN(nextValue)) {
      return;
    }
    setSeekValue(nextValue);
  }, []);

  const commitSeek = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = seekValue;
    setCurrentTime(seekValue);
    setIsSeeking(false);
  }, [seekValue]);

  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
  }, []);

  const handleVolumeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number.parseFloat(event.target.value);
    if (Number.isNaN(nextVolume)) {
      return;
    }
    setVolume(nextVolume);
    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  }, []);

  const isMuted = useMemo(() => volume <= 0.001, [volume]);
  const playButtonLabel = isActive ? "Pause playback" : "Play story";

  useEffect(() => {
    if (!audioRef.current || !audioUrl) {
      return;
    }
    if (audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl;
      setIsLoading(true);
      setError(null);
      setCurrentTime(0);
      setSeekValue(0);
      // Explicitly load the audio to trigger metadata loading
      audioRef.current.load();
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [handleEnded, handleError, handleLoadedMetadata, handleTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isActive) {
      audio
        .play()
        .then(() => {
          setError(null);
        })
        .catch((err) => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error("Failed to start audio playback", err);
          }
          setError("Failed to play audio. Please try again.");
          onPause();
        });
      return;
    }

    audio.pause();
  }, [isActive, onPause]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-background/60 p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          aria-label={playButtonLabel}
          onClick={handlePlayPause}
          disabled={!!error || isLoading}
          className={cn("size-10 rounded-full")}
        >
          {isActive ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
        </Button>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span aria-live="polite" aria-atomic="true">
              {isLoading ? "Loading audio…" : error ? "Playback unavailable" : "Playback ready"}
            </span>
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={seekValue}
            onChange={handleSeekChange}
            onMouseDown={handleSeekStart}
            onMouseUp={commitSeek}
            onTouchStart={handleSeekStart}
            onTouchEnd={commitSeek}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary transition-colors"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.max(duration, 0)}
            aria-valuenow={seekValue}
            aria-valuetext={`${formatTime(seekValue)} of ${formatTime(duration)}`}
            disabled={isLoading || !!error || !duration}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isMuted ? (
            <VolumeXIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          ) : (
            <Volume2Icon aria-hidden="true" className="size-4 text-muted-foreground" />
          )}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-muted accent-primary transition-colors"
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={volume}
            aria-valuetext={`${Math.round(volume * 100)}%`}
          />
        </div>
        {error ? (
          <span className="text-xs font-medium text-destructive" role="alert">
            {error}
          </span>
        ) : null}
      </div>

      <audio ref={assignRef} preload="metadata" hidden aria-hidden="true">
        <track kind="captions" src="data:text/vtt,WEBVTT" label="Captions unavailable" />
      </audio>
    </div>
  );
});

AudioPlayer.displayName = "AudioPlayer";

export default AudioPlayer;
