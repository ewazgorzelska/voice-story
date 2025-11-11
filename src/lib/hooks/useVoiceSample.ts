import { useState, useCallback } from "react";
import type { GetVoiceSamplePhraseResponseDto, VoiceSampleDto } from "@/types";

interface UseVoiceSampleReturn {
  phrase: string | null;
  sampleExists: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchPhrase: () => Promise<void>;
  checkSampleExists: () => Promise<void>;
  submitSample: (blob: Blob, phrase: string) => Promise<void>;
}

export function useVoiceSample(): UseVoiceSampleReturn {
  const [phrase, setPhrase] = useState<string | null>(null);
  const [sampleExists, setSampleExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchPhrase = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/voice-sample/phrase");

      if (!response.ok) {
        throw new Error("Failed to fetch verification phrase");
      }

      const data: GetVoiceSamplePhraseResponseDto = await response.json();
      setPhrase(data.phrase);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSampleExists = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/voice-sample");

      if (!response.ok) {
        if (response.status === 404) {
          setSampleExists(false);
          return;
        }
        if (response.status === 401) {
          // User not authenticated - they can't use this feature
          setError("Please log in to record a voice sample");
          return;
        }
        throw new Error("Failed to check existing voice sample");
      }

      const data: VoiceSampleDto = await response.json();
      setSampleExists(!!data.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitSample = useCallback(async (blob: Blob, verificationPhrase: string) => {
    if (!verificationPhrase) {
      setError("Verification phrase is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Create FormData to send audio file and verification phrase
      const formData = new FormData();
      formData.append("audio", blob, "voice-sample.webm");
      formData.append("verification_phrase", verificationPhrase);

      const response = await fetch("/api/voice-sample", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Voice sample already exists");
        }
        if (response.status === 422) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Validation failed");
        }
        throw new Error("Failed to create voice sample");
      }

      const data = await response.json();
      setSampleExists(true);
      
      // Set success message from API response
      if (data.message) {
        setSuccessMessage(data.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    phrase,
    sampleExists,
    isLoading,
    error,
    successMessage,
    fetchPhrase,
    checkSampleExists,
    submitSample,
  };
}
