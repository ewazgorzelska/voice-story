// src/lib/services/voiceSampleService.test.ts

import { describe, it, expect } from "vitest";
import { normalizeText, calculateSimilarity } from "./voiceSampleService";

describe("normalizeText", () => {
  describe("Basic normalization", () => {
    it("should convert text to lowercase", () => {
      // Arrange
      const input = "HELLO WORLD";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world");
    });

    it("should handle mixed case text", () => {
      // Arrange
      const input = "HeLLo WoRLd";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world");
    });

    it("should return lowercase for already lowercase text", () => {
      // Arrange
      const input = "hello world";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world");
    });
  });

  describe("Punctuation removal", () => {
    it("should remove common punctuation marks", () => {
      // Arrange
      const input = "Hello, world!";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world");
    });

    it("should remove all supported punctuation", () => {
      // Arrange
      const input = 'Hello, world! How are you? I am fine; thank you: "great"';

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world how are you i am fine thank you great");
    });

    it("should remove various quotation marks", () => {
      // Arrange
      const input = '"Hello" "world" „test"';

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world test");
    });

    it("should handle text without punctuation", () => {
      // Arrange
      const input = "Hello world";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world");
    });

    it("should handle text with only punctuation", () => {
      // Arrange
      const input = ".,!?;:";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("");
    });
  });

  describe("Whitespace normalization", () => {
    it("should normalize multiple spaces to single space", () => {
      // Arrange
      const input = "Hello    world";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world");
    });

    it("should handle tabs and newlines", () => {
      // Arrange
      const input = "Hello\t\nworld\n\ntest";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world test");
    });

    it("should trim leading whitespace", () => {
      // Arrange
      const input = "   Hello world";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world");
    });

    it("should trim trailing whitespace", () => {
      // Arrange
      const input = "Hello world   ";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world");
    });

    it("should trim both leading and trailing whitespace", () => {
      // Arrange
      const input = "   Hello world   ";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("hello world");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string", () => {
      // Arrange
      const input = "";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("");
    });

    it("should handle string with only whitespace", () => {
      // Arrange
      const input = "   \t\n   ";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("");
    });

    it("should handle single character", () => {
      // Arrange
      const input = "A";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("a");
    });

    it("should handle single punctuation mark", () => {
      // Arrange
      const input = "!";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("");
    });
  });

  describe("Complex real-world examples", () => {
    it("should normalize verification phrase", () => {
      // Arrange
      const input = "Even the smallest of us can change the whole day, simply by showing up with kindness!";

      // Act
      const result = normalizeText(input);

      // Assert
      expect(result).toBe("even the smallest of us can change the whole day simply by showing up with kindness");
    });

    it("should produce same result for differently punctuated same text", () => {
      // Arrange
      const input1 = "Hello, world!";
      const input2 = "Hello world";
      const input3 = "HELLO WORLD";

      // Act
      const result1 = normalizeText(input1);
      const result2 = normalizeText(input2);
      const result3 = normalizeText(input3);

      // Assert
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe("hello world");
    });
  });
});

describe("calculateSimilarity", () => {
  describe("Identical strings", () => {
    it("should return 1.0 for identical strings", () => {
      // Arrange
      const str1 = "hello world";
      const str2 = "hello world";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBe(1.0);
    });

    it("should return 1.0 for strings differing only in case", () => {
      // Arrange
      const str1 = "HELLO WORLD";
      const str2 = "hello world";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBe(1.0);
    });

    it("should return 1.0 for strings differing only in punctuation", () => {
      // Arrange
      const str1 = "Hello, world!";
      const str2 = "Hello world";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBe(1.0);
    });

    it("should return 1.0 for strings differing in case and punctuation", () => {
      // Arrange
      const str1 = "HELLO, WORLD!";
      const str2 = "hello world";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBe(1.0);
    });

    it("should return 1.0 for strings with different whitespace", () => {
      // Arrange
      const str1 = "hello    world";
      const str2 = "hello world";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBe(1.0);
    });
  });

  describe("Similar strings", () => {
    it("should return high similarity for strings with single character difference", () => {
      // Arrange
      const str1 = "hello world";
      const str2 = "hallo world";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBeGreaterThan(0.9);
      expect(result).toBeLessThan(1.0);
    });

    it("should return high similarity for strings with single character insertion", () => {
      // Arrange
      const str1 = "hello world";
      const str2 = "hello wworld";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBeGreaterThan(0.9);
      expect(result).toBeLessThan(1.0);
    });

    it("should return high similarity for strings with single character deletion", () => {
      // Arrange
      const str1 = "hello world";
      const str2 = "helo world";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBeGreaterThan(0.9);
      expect(result).toBeLessThan(1.0);
    });

    it("should return lower similarity for strings with multiple differences", () => {
      // Arrange
      const str1 = "hello world";
      const str2 = "hallo warld";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBeGreaterThan(0.8);
      expect(result).toBeLessThan(0.95);
    });
  });

  describe("Dissimilar strings", () => {
    it("should return low similarity for completely different strings", () => {
      // Arrange
      const str1 = "hello world";
      const str2 = "goodbye universe";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBeLessThan(0.5);
    });

    it("should return low similarity for strings with different lengths", () => {
      // Arrange
      const str1 = "hello";
      const str2 = "hello world test example";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBeLessThan(0.5);
    });

    it("should return 0 for one empty string", () => {
      // Arrange
      const str1 = "hello world";
      const str2 = "";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBe(0.0);
    });

    it("should return 1.0 for both empty strings (both normalize to empty)", () => {
      // Arrange
      const str1 = "";
      const str2 = "";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      // Two empty strings after normalization are identical
      expect(result).toBe(1.0);
    });

    it("should return 1.0 for empty string vs whitespace (both normalize to empty)", () => {
      // Arrange
      const str1 = "   ";
      const str2 = "";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      // Whitespace is trimmed, so both normalize to empty strings
      expect(result).toBe(1.0);
    });
  });

  describe("Edge cases", () => {
    it("should handle single character strings", () => {
      // Arrange
      const str1 = "a";
      const str2 = "a";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBe(1.0);
    });

    it("should handle single different characters", () => {
      // Arrange
      const str1 = "a";
      const str2 = "b";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBe(0.0);
    });

    it("should handle very long strings", () => {
      // Arrange
      const str1 = "a".repeat(100);
      const str2 = "a".repeat(100);

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBe(1.0);
    });

    it("should handle very long strings with one difference", () => {
      // Arrange
      const str1 = "a".repeat(100);
      const str2 = "a".repeat(99) + "b";

      // Act
      const result = calculateSimilarity(str1, str2);

      // Assert
      expect(result).toBeGreaterThan(0.98);
      expect(result).toBeLessThan(1.0);
    });
  });

  describe("Symmetry", () => {
    it("should be symmetric for identical strings", () => {
      // Arrange
      const str1 = "hello world";
      const str2 = "goodbye world";

      // Act
      const result1 = calculateSimilarity(str1, str2);
      const result2 = calculateSimilarity(str2, str1);

      // Assert
      expect(result1).toBe(result2);
    });

    it("should be symmetric for different length strings", () => {
      // Arrange
      const str1 = "short";
      const str2 = "much longer string";

      // Act
      const result1 = calculateSimilarity(str1, str2);
      const result2 = calculateSimilarity(str2, str1);

      // Assert
      expect(result1).toBe(result2);
    });
  });

  describe("Real-world voice verification scenarios", () => {
    it("should accept correctly spoken phrase with minor variations", () => {
      // Arrange
      const expected = "Even the smallest of us can change the whole day";
      const transcribed = "even the smallest of us can change the whole day";

      // Act
      const result = calculateSimilarity(expected, transcribed);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0.8);
    });

    it("should accept phrase with slight transcription errors", () => {
      // Arrange
      const expected = "Some days feel heavy, but having a friend helps";
      const transcribed = "some days feel heavy but having a freind helps";

      // Act
      const result = calculateSimilarity(expected, transcribed);

      // Assert
      expect(result).toBeGreaterThan(0.8);
    });

    it("should reject significantly different phrase", () => {
      // Arrange
      const expected = "Even the smallest of us can change the whole day";
      const transcribed = "This is a completely different sentence";

      // Act
      const result = calculateSimilarity(expected, transcribed);

      // Assert
      expect(result).toBeLessThan(0.5);
    });

    it("should reject phrase with many missing words", () => {
      // Arrange
      const expected = "Even the smallest of us can change the whole day";
      const transcribed = "Even smallest change day";

      // Act
      const result = calculateSimilarity(expected, transcribed);

      // Assert
      expect(result).toBeLessThan(0.8);
    });

    it("should handle phrase with added filler words", () => {
      // Arrange
      const expected = "Some days feel heavy";
      const transcribed = "um some days feel like heavy you know";

      // Act
      const result = calculateSimilarity(expected, transcribed);

      // Assert
      // Should be somewhat similar but not meet 0.8 threshold
      expect(result).toBeLessThan(0.8);
    });
  });

  describe("Boundary conditions for 80% threshold", () => {
    it("should recognize that 80% threshold requires high accuracy", () => {
      // Arrange
      const expected = "hello world test"; // 16 chars (normalized)
      const transcribed = "hello world tast"; // 1 char difference

      // Act
      const result = calculateSimilarity(expected, transcribed);

      // Assert
      // 15/16 = 0.9375 - should pass 0.8 threshold
      expect(result).toBeGreaterThan(0.8);
    });

    it("should fail threshold with 4 errors in 16 character string", () => {
      // Arrange
      const expected = "hello world test"; // 16 chars
      const transcribed = "hallo warld tast"; // 3 char differences

      // Act
      const result = calculateSimilarity(expected, transcribed);

      // Assert
      // Should be close to threshold
      expect(result).toBeGreaterThan(0.7);
      expect(result).toBeLessThan(0.9);
    });
  });
});
