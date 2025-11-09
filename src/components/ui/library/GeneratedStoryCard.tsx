import { useCallback, useMemo } from "react";
import { AlertCircleIcon, HeadphonesIcon, Trash2Icon } from "lucide-react";

import Button from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AudioPlayer from "@/components/ui/library/AudioPlayer";
import ProgressDisplay from "@/components/ui/library/ProgressDisplay";
import StatusBadge from "@/components/ui/library/StatusBadge";
import { cn } from "@/lib/utils";
import type { GeneratedStoryCardProps } from "@/types";

const STATUS_HELPER_TEXT: Record<GeneratedStoryCardProps["generation"]["status"], string> = {
  pending: "Story queued. We'll start generating shortly.",
  in_progress: "Hang tight — your personalized narration is on the way.",
  completed: "Enjoy your story with the built-in audio player.",
  failed: "We couldn't generate this story. You can try again later.",
};

const hasPlayableAudio = (status: GeneratedStoryCardProps["generation"]["status"], url: string | null) =>
  status === "completed" && typeof url === "string" && url.length > 0;

const showProgress = (status: GeneratedStoryCardProps["generation"]["status"]) =>
  status === "pending" || status === "in_progress";

const GeneratedStoryCard = ({
  generation,
  isAudioActive,
  registerAudio,
  unregisterAudio,
  onPlay,
  onPause,
  onDelete,
}: GeneratedStoryCardProps) => {
  const { id, story_title, status, progress, result_url } = generation;

  const helperText = useMemo(() => STATUS_HELPER_TEXT[status], [status]);
  const playableAudioUrl = hasPlayableAudio(status, result_url) ? (result_url as string) : null;

  const handlePlay = () => {
    if (!playableAudioUrl) {
      return;
    }
    void onPlay(id, playableAudioUrl);
  };

  const handlePause = () => {
    onPause(id);
  };

  const handleDelete = () => {
    onDelete(id);
  };

  const audioRef = useCallback(
    (node: HTMLAudioElement | null) => {
      if (node) {
        registerAudio?.(id, node);
      } else {
        unregisterAudio?.(id);
      }
    },
    [id, registerAudio, unregisterAudio]
  );

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <CardTitle className="flex flex-col gap-2 text-lg">
          <span className="line-clamp-2 text-balance font-semibold leading-snug">{story_title}</span>
          <StatusBadge status={status} />
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HeadphonesIcon aria-hidden="true" className="size-4 shrink-0" />
          <span>{helperText}</span>
        </div>

        {showProgress(status) ? <ProgressDisplay progress={progress ?? 0} status={status} /> : null}

        {status === "failed" ? (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>Unable to generate this story. Please try again later.</span>
          </div>
        ) : null}

        {playableAudioUrl ? (
          <AudioPlayer
            ref={audioRef}
            audioUrl={playableAudioUrl}
            isActive={isAudioActive}
            onPlay={handlePlay}
            onPause={handlePause}
          />
        ) : null}
      </CardContent>

      <CardFooter className={cn("border-t border-border/60 pt-6")}>
        <Button
          type="button"
          variant="destructive"
          className="w-full gap-2"
          onClick={handleDelete}
          aria-label={`Delete ${story_title}`}
        >
          <Trash2Icon aria-hidden="true" className="size-4" />
          Delete Story
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GeneratedStoryCard;
