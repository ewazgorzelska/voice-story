import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { logError, logWarn } from "@/lib/logger";

import type {
  EnrichedGenerationDto,
  GetStoryGenerationsResponseDto,
  GetStoriesResponseDto,
  PaginationMetaDto,
} from "@/types";

interface UseMyLibraryOptions {
  initialPage?: number;
  pageSize?: number;
}

export interface UseMyLibraryReturn {
  generations: EnrichedGenerationDto[];
  pagination: PaginationMetaDto | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  deleteGeneration: (id: string) => Promise<void>;
  refreshLibrary: () => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 12;
const STORIES_CACHE_PAGE_SIZE = 100;
const POLLING_INTERVAL_MS = 4000;

export function useMyLibrary(options: UseMyLibraryOptions = {}): UseMyLibraryReturn {
  const initialPage = options.initialPage ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const [generations, setGenerations] = useState<EnrichedGenerationDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMetaDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPageState] = useState(initialPage);
  const [storiesMap, setStoriesMap] = useState<Map<string, string>>(new Map());

  const isClient = useMemo(() => typeof window !== "undefined", []);
  const isFetchingRef = useRef(false);

  const pollingTimerRef = useRef<number | null>(null);

  const fetchStories = useCallback(
    async (uncachedIds: string[]): Promise<Map<string, string>> => {
      if (uncachedIds.length === 0) {
        return storiesMap;
      }

      try {
        const storiesResponse = await fetch(`/api/stories?pageSize=${STORIES_CACHE_PAGE_SIZE}&sort=asc`);

        if (!storiesResponse.ok) {
          logError("Failed to fetch stories metadata", storiesResponse.status);
          return storiesMap;
        }

        const storiesData: GetStoriesResponseDto = await storiesResponse.json();
        const nextMap = new Map(storiesMap);
        storiesData.data.forEach((story) => {
          nextMap.set(story.id, story.title);
        });
        setStoriesMap(nextMap);
        return nextMap;
      } catch (err) {
        logError("Error fetching stories metadata", err);
        return storiesMap;
      }
    },
    [storiesMap]
  );

  const fetchGenerations = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!isClient) {
        return;
      }

      if (isFetchingRef.current) {
        return;
      }

      const showLoading = options?.showLoading ?? true;

      if (showLoading) {
        setIsLoading(true);
        setError(null);
      }

      isFetchingRef.current = true;

      try {
        const url = new URL("/api/story-generations", window.location.origin);
        url.searchParams.set("page", currentPage.toString());
        url.searchParams.set("pageSize", pageSize.toString());

        const response = await fetch(url.toString());

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch generations");
        }

        const data: GetStoryGenerationsResponseDto = await response.json();

        const storyIds = data.data.map((generation) => generation.story_id);
        const uncachedIds = storyIds.filter((id) => !storiesMap.has(id));
        const storyLookup = await fetchStories(uncachedIds);

        const enriched = data.data.map<EnrichedGenerationDto>((generation) => {
          const storyTitle = storyLookup.get(generation.story_id);

          if (!storyTitle) {
            logWarn("Story title not found for generation", generation.id, generation.story_id);
          }

          return {
            ...generation,
            story_title: storyTitle ?? "Unknown Story",
          };
        });

        setGenerations(enriched);
        setPagination(data.meta);
      } catch (err) {
        logError("Failed to load library", err);
        setError(err instanceof Error ? err.message : "Failed to load your library");
      } finally {
        isFetchingRef.current = false;
        setIsLoading((prev) => (showLoading ? false : prev));
      }
    },
    [currentPage, fetchStories, isClient, pageSize, storiesMap]
  );

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    const hasActiveGenerations = generations.some(
      (generation) => generation.status === "pending" || generation.status === "in_progress"
    );

    if (!hasActiveGenerations) {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      return;
    }

    if (pollingTimerRef.current) {
      return;
    }

    pollingTimerRef.current = window.setInterval(() => {
      fetchGenerations({ showLoading: false }).catch((err) => {
        logError("Polling refresh failed", err);
      });
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [fetchGenerations, generations, isClient]);

  const deleteGeneration = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/story-generations/${id}`, {
          method: "DELETE",
        });

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        if (response.status === 404) {
          throw new Error("This story has already been deleted.");
        }

        if (response.status === 409) {
          throw new Error(
            "Cannot delete a story while it's being generated. Please wait for generation to complete or fail."
          );
        }

        if (!response.ok) {
          throw new Error("Failed to delete story. Please try again.");
        }

        await fetchGenerations();
      } catch (err) {
        logError("Failed to delete story generation", err);
        if (err instanceof Error) {
          throw err;
        }
        throw new Error("Failed to delete story. Please try again.");
      }
    },
    [fetchGenerations]
  );

  const refreshLibrary = useCallback(() => {
    return fetchGenerations();
  }, [fetchGenerations]);

  const setCurrentPage = useCallback((page: number) => {
    if (Number.isNaN(page) || page < 1) {
      logWarn("Attempted to set invalid page", page);
      return;
    }
    setCurrentPageState(page);
  }, []);

  return {
    generations,
    pagination,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    deleteGeneration,
    refreshLibrary,
  };
}

export default useMyLibrary;
