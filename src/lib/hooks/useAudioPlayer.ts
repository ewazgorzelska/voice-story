import { useCallback, useRef, useState } from "react";

import { logError, logWarn } from "@/lib/logger";

export interface UseAudioPlayerReturn {
  activeAudioId: string | null;
  play: (id: string, url: string) => Promise<void>;
  pause: (id: string) => void;
  stop: () => void;
  isPlaying: (id: string) => boolean;
  registerAudio: (id: string, audioElement: HTMLAudioElement) => void;
  unregisterAudio: (id: string) => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const pauseAudio = useCallback((id: string) => {
    const audio = audioRefs.current.get(id);
    if (!audio) {
      return;
    }
    audio.pause();
  }, []);

  const play = useCallback(
    async (id: string, url: string) => {
      if (!url) {
        throw new Error("Audio URL is required to play.");
      }

      if (activeAudioId && activeAudioId !== id) {
        pauseAudio(activeAudioId);
      }

      const audio = audioRefs.current.get(id);

      if (!audio) {
        logWarn("Attempted to play unregistered audio element", id);
        throw new Error("Unable to play audio. Please try again.");
      }

      if (audio.src !== url) {
        audio.src = url;
      }

      try {
        await audio.play();
        setActiveAudioId(id);
      } catch (err) {
        logError("Failed to play audio", err);
        throw err instanceof Error ? err : new Error("Failed to play audio. Please try again.");
      }
    },
    [activeAudioId, pauseAudio]
  );

  const pause = useCallback(
    (id: string) => {
      pauseAudio(id);
      if (activeAudioId === id) {
        setActiveAudioId(null);
      }
    },
    [activeAudioId, pauseAudio]
  );

  const stop = useCallback(() => {
    if (!activeAudioId) {
      return;
    }
    const audio = audioRefs.current.get(activeAudioId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setActiveAudioId(null);
  }, [activeAudioId]);

  const isPlaying = useCallback((id: string) => activeAudioId === id, [activeAudioId]);

  const registerAudio = useCallback(
    (id: string, audioElement: HTMLAudioElement) => {
      audioRefs.current.set(id, audioElement);
      if (activeAudioId === id && audioElement.paused) {
        // Keep state in sync if audio element paused externally.
        setActiveAudioId(null);
      }
    },
    [activeAudioId]
  );

  const unregisterAudio = useCallback(
    (id: string) => {
      if (activeAudioId === id) {
        setActiveAudioId(null);
      }
      audioRefs.current.delete(id);
    },
    [activeAudioId]
  );

  return {
    activeAudioId,
    play,
    pause,
    stop,
    isPlaying,
    registerAudio,
    unregisterAudio,
  };
}

export default useAudioPlayer;
