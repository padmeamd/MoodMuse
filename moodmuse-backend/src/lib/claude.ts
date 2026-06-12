import Anthropic from "@anthropic-ai/sdk";
import type { Mood, ClaudeProjectResponse } from "@/types";
import { MOOD_TONE, MOOD_TO_ROOM } from "@/types";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const SYSTEM_PROMPT = `You are two voices inside a museum of feelings.

Voice 1 — The Curator: You are shown a photograph. Identify ONLY the tangible, usable craft materials visible in the image. Ignore backgrounds, hands, furniture, and screens. Return plain, recognisable nouns a person would understand.

Voice 2 — The Alchemist & Archivist: Using the detected materials and the chosen mood, design a single creative project and name it as a museum artifact.

Rules:
- The project MUST use ONLY materials visible in the photograph.
- It must be achievable in under 30 minutes.
- It must feel emotionally specific to the mood — never generic.
- Write as a poetic museum curator — specific, sincere, no cliches, no corporate or self-help language.
- Do NOT say "express yourself creatively" or similar filler.
- Return ONLY valid JSON, no markdown fences, no preamble.`;

function buildUserPrompt(mood: Mood): string {
  const room = MOOD_TO_ROOM[mood];
  const tone = MOOD_TONE[mood];

  return `The visitor is feeling: **${mood}**
Tone guidance: ${tone}
Museum room: ${room}

Look at the attached photograph. First identify every usable material. Then design one project and its museum identity.

Return ONLY this JSON structure:
{
  "detectedMaterials": ["material1", "material2"],
  "projectTitle": "string",
  "concept": "1-2 sentence description",
  "emotionalExplanation": "why this project answers this feeling",
  "materialsUsed": ["subset of detected materials actually used"],
  "instructions": [{"step": 1, "text": "..."}],
  "estimatedTime": "e.g. 20 minutes",
  "difficulty": "Gentle | Considered | Devoted",
  "museumTitle": "evocative title, e.g. The Stars I Followed Home",
  "museumDescription": "poetic plaque text, 2-3 sentences",
  "artifactMeaning": "what this object preserves for its maker",
  "museumRoom": "${room}"
}`;
}

/**
 * Send a materials photo + mood to Claude Vision and get back a structured
 * creative project with museum identity.
 */
export async function generateProject(
  mood: Mood,
  imageBase64: string
): Promise<ClaudeProjectResponse> {
  // Strip data-uri prefix if present
  const cleaned = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
  const mediaType = (mimeMatch?.[1] ?? "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: cleaned },
          },
          { type: "text", text: buildUserPrompt(mood) },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const raw = textBlock.text.trim();

  // Attempt to parse — strip potential markdown fences just in case
  const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

  let parsed: ClaudeProjectResponse;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  // Validate required fields
  const required = [
    "detectedMaterials",
    "projectTitle",
    "concept",
    "instructions",
    "museumTitle",
  ] as const;
  for (const key of required) {
    if (!parsed[key]) {
      throw new Error(`Claude response missing required field: ${key}`);
    }
  }

  return parsed;
}
