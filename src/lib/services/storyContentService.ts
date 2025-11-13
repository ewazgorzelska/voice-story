// src/lib/services/storyContentService.ts

import { logError, logInfo } from "@/lib/logger";
import { createOpenRouterService } from "./openRouterService";
import type { ChatMessage } from "./openrouter.types";

/**
 * Story Content Service
 * Handles generation of personalized story content using OpenRouter API
 */

export interface StoryContentGenerationInput {
  /** Original story title */
  storyTitle: string;
  /** Original story content */
  storyContent: string;
  /** Child's age for content adaptation */
  childAge: number;
  /** Minimum desired duration in minutes */
  durationMinMinutes: number;
  /** Maximum desired duration in minutes */
  durationMaxMinutes: number;
  /** Optional thematic motif or prompt */
  motifPrompt: string | null;
}

export interface StoryContentGenerationOutput {
  /** Personalized story content */
  content: string;
  /** Short teaser/summary for the story */
  teaser: string;
}

/**
 * Generates personalized story content based on user preferences
 * Uses OpenRouter API to adapt the story for the child's age and preferences
 *
 * @param input - Story generation parameters
 * @returns Generated story content and teaser
 * @throws Error if generation fails
 */
export async function generateStoryContent(input: StoryContentGenerationInput): Promise<StoryContentGenerationOutput> {
  const startTime = Date.now();

  try {
    logInfo("Starting story content generation", {
      storyTitle: input.storyTitle,
      childAge: input.childAge,
      durationMin: input.durationMinMinutes,
      durationMax: input.durationMaxMinutes,
      hasMotif: !!input.motifPrompt,
    });

    const openRouter = createOpenRouterService();

    // Build the system prompt with story generation instructions
    const systemPrompt = buildSystemPrompt(input);

    // Build the user prompt with the original story content
    const userPrompt = buildUserPrompt(input);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Request structured JSON output
    const result = await openRouter.sendChatCompletion({
      messages,
      parameters: {
        temperature: 0.8, // More creative for story generation
        max_output_tokens: 4000, // Enough for detailed stories
      },
      responseFormat: { type: "json_object" },
    });

    // Parse the JSON response
    const sanitizedContent = extractJsonPayload(result.content);
    let parsedResult: { content: string; teaser: string };
    try {
      parsedResult = JSON.parse(sanitizedContent);
    } catch (error) {
      logError("Failed to parse OpenRouter JSON response", {
        error,
        rawContent: result.content,
        sanitizedContent,
      });
      throw new Error("Failed to parse story generation response");
    }

    // Validate the response structure
    if (!parsedResult.content || typeof parsedResult.content !== "string") {
      throw new Error("Generated story content is missing or invalid");
    }

    if (!parsedResult.teaser || typeof parsedResult.teaser !== "string") {
      throw new Error("Generated story teaser is missing or invalid");
    }

    const duration = Date.now() - startTime;
    logInfo("Story content generation completed", {
      duration,
      contentLength: parsedResult.content.length,
      teaserLength: parsedResult.teaser.length,
      usage: result.usage,
    });

    return {
      content: parsedResult.content.trim(),
      teaser: parsedResult.teaser.trim(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logError("Story content generation failed", { error, duration, input });
    throw error;
  }
}

/**
 * Builds the system prompt for story generation
 */
function buildSystemPrompt(input: StoryContentGenerationInput): string {
  const { childAge, durationMinMinutes, durationMaxMinutes, motifPrompt } = input;

  let prompt = `You are an expert children's story writer specializing in personalized bedtime stories.

Your task is to adapt a classic story for a ${childAge}-year-old child. The story should be engaging, age-appropriate, and suitable for narration.

IMPORTANT REQUIREMENTS:
1. **Target Duration**: The narrated story should take between ${durationMinMinutes} and ${durationMaxMinutes} minutes to read aloud at a natural pace (approximately 150 words per minute).
2. **Age Appropriateness**: Adjust vocabulary, sentence complexity, and themes to suit a ${childAge}-year-old child.
3. **Narration-Friendly**: Write in a flowing, narrative style suitable for audio. Avoid complex formatting, bullet points, or visual elements.
4. **Engaging**: Use vivid descriptions, dialogue, and emotional moments to capture the child's imagination.
5. **Safe Content**: Ensure the story is comforting and appropriate for bedtime. Avoid frightening or overly intense content.`;

  if (motifPrompt) {
    prompt += `\n6. **Thematic Element**: Incorporate this theme or motif into the story: "${motifPrompt}"`;
  }

  prompt += `

OUTPUT FORMAT:
You must respond with valid JSON containing exactly two fields:
{
  "content": "The full adapted story text, written in a flowing narrative style suitable for audio narration.",
  "teaser": "A compelling 2-3 sentence summary that captures the essence of this personalized version of the story."
}

Remember: The story should be a complete, coherent narrative that brings joy and wonder to a ${childAge}-year-old child at bedtime.`;

  return prompt;
}

/**
 * Builds the user prompt with the original story
 */
function buildUserPrompt(input: StoryContentGenerationInput): string {
  const { storyTitle, storyContent } = input;

  return `Here is the original story to adapt:

**Title**: ${storyTitle}

**Original Content**:
${storyContent}

Please create a personalized version of this story following the requirements specified in the system prompt. Return your response in the required JSON format.`;
}

/**
 * Attempts to extract a JSON payload from OpenRouter responses,
 * handling cases where the model wraps output in markdown code fences.
 */
function extractJsonPayload(rawContent: string): string {
  if (!rawContent) {
    return rawContent;
  }

  let candidate = rawContent.trim();

  // Handle fenced code blocks like ```json ... ```
  const fencedMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    candidate = fencedMatch[1].trim();
  }

  const jsonStart = candidate.indexOf("{");
  const jsonEnd = candidate.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    candidate = candidate.slice(jsonStart, jsonEnd + 1).trim();
  }

  return candidate;
}
