import { useState } from "react";

import LibraryGrid from "@/components/ui/library/LibraryGrid";
import DeleteConfirmationDialog from "@/components/ui/library/DeleteConfirmationDialog";
import StoryPagination from "@/components/ui/story/StoryPagination";
import { logWarn } from "@/lib/logger";
import { useAudioPlayer } from "@/lib/hooks/useAudioPlayer";
import { useMyLibrary } from "@/lib/hooks/useMyLibrary";
import type { EnrichedGenerationDto, MyLibraryViewProps } from "@/types";

const DEFAULT_PAGE_SIZE = 12;

const MyLibraryView = ({ initialPage = 1, pageSize = DEFAULT_PAGE_SIZE }: MyLibraryViewProps) => {
  const { generations, pagination, isLoading, error, setCurrentPage, deleteGeneration, refreshLibrary } = useMyLibrary({
    initialPage,
    pageSize,
  });

  const { activeAudioId, play, pause, registerAudio, unregisterAudio } = useAudioPlayer();

  const [generationToDelete, setGenerationToDelete] = useState<EnrichedGenerationDto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleOpenDeleteDialog = (generation: EnrichedGenerationDto) => {
    setGenerationToDelete(generation);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setGenerationToDelete(null);
    setIsDeleting(false);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!generationToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteGeneration(generationToDelete.id);
      handleCloseDeleteDialog();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete story. Please try again.");
      setIsDeleting(false);
    }
  };

  const handlePlay = async (id: string, url: string) => {
    await play(id, url);
  };

  const handlePause = (id: string) => {
    pause(id);
  };

  const handleDeleteRequest = (id: string) => {
    const generation = generations.find((item) => item.id === id);
    if (!generation) {
      logWarn("Attempted to delete generation that was not found", id);
      return;
    }
    handleOpenDeleteDialog(generation);
  };

  return (
    <div className="container mx-auto flex-1 px-4 py-10">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">My Library</h1>
          <p className="text-muted-foreground">
            Access your generated stories, monitor their status, and listen back whenever you like.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshLibrary}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Refresh
        </button>
      </header>

      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Failed to load your library.</p>
              <p className="mt-1 text-destructive/80">Please try again, or refresh the page.</p>
            </div>
            <button
              type="button"
              onClick={refreshLibrary}
              className="inline-flex h-9 items-center justify-center rounded-md border border-destructive/40 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/10"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <LibraryGrid
        generations={generations}
        isLoading={isLoading}
        pageSize={pageSize}
        activeAudioId={activeAudioId}
        registerAudio={registerAudio}
        unregisterAudio={unregisterAudio}
        onPlay={handlePlay}
        onPause={handlePause}
        onDelete={handleDeleteRequest}
      />

      {pagination ? (
        <div className="mt-10 flex justify-center">
          <StoryPagination pagination={pagination} onPageChange={setCurrentPage} />
        </div>
      ) : null}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        generation={generationToDelete}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />
    </div>
  );
};

export default MyLibraryView;
