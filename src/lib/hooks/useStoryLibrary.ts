import { useState, useEffect, useCallback } from "react";
import type { StorySummaryDto, PaginationMetaDto, GetStoriesResponseDto } from "@/types";

interface UseStoryLibraryParams {
  initialPage?: number;
  pageSize?: number;
}

interface UseStoryLibraryReturn {
  stories: StorySummaryDto[];
  pagination: PaginationMetaDto | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export function useStoryLibrary({ initialPage = 1, pageSize = 12 }: UseStoryLibraryParams = {}): UseStoryLibraryReturn {
  const [stories, setStories] = useState<StorySummaryDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMetaDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/stories", window.location.origin);
      url.searchParams.set("page", currentPage.toString());
      url.searchParams.set("pageSize", pageSize.toString());
      url.searchParams.set("sort", "asc");

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Redirect to login page on authentication errors
          window.location.href = "/";
          return;
        }
        throw new Error(`Failed to fetch stories: ${response.statusText}`);
      }

      const data: GetStoriesResponseDto = await response.json();

      setStories(data.data);
      setPagination(data.meta);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load stories";
      setError(errorMessage);
      console.error("Error fetching stories:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return {
    stories,
    pagination,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
  };
}
