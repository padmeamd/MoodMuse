import Anthropic from "@anthropic-ai/sdk";
import type { Mood, ConjureResponse, HallKey } from "@/types";
import { MOOD_TONE, MOOD_TO_HALL, HALLS } from "@/types";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// -- JSON parsing with repair --------------------------------------------

function parseJSON<T>(raw: string): T {
  // Strip markdown fences
  let s = raw.trim()
    .replace(/^```json?\s*\n?/i, "")
    .replace(/\n?\s*```$/i, "");

  // First try clean parse
  try { return JSON.parse(s); } catch { /* continue */ }

  // Repair: strip trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, "$1");

  // Repair: try to extract first { ... } block
  const match = s.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* continue */ }
  }

  throw new Error(`Failed to parse JSON: ${raw.slice(0, 300)}`);
}

// -- Material detection ---------------------------------------------------

const MATERIALS_SYSTEM = `You are the Curator of a museum of feelings.
You are shown a photograph of objects and craft materials.
Identify only tangible, usable creative materials visible with confidence.
Ignore furniture, walls, people, screens, and background objects unless they are clearly being used as materials.
Return JSON only.

Required JSON:
{
  "materials": ["item 1", "item 2"]
}`;

export async function detectMaterials(imageBase64: string): Promise<string[]> {
  const cleaned = imageBase64.replace(/^data:image\/[^;]+;base64,/, "");
  const mimeMatch = imageBase64.match(/^data:(image\/[^;]+);base64,/);
  const mediaType = (mimeMatch?.[1] ?? "image/jpeg") as
    "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: MATERIALS_SYSTEM,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: cleaned } },
        { type: "text", text: "What usable craft/creative materials do you see? Return JSON only." },
      ],
    }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude returned no text");

  const parsed = parseJSON<{ materials: string[] }>(text.text);
  if (!Array.isArray(parsed.materials)) throw new Error("Claude response missing materials array");

  return parsed.materials;
}

// -- Project + identity generation ----------------------------------------

function buildConjureSystem(moodKey: Mood, hallKey: HallKey): string {
  const hall = HALLS.find((h) => h.key === hallKey);
  const tone = MOOD_TONE[moodKey];

  return `You are MoodMuse, an AI curator inside a magical museum of feelings.

You transform a user's mood and available materials into one meaningful creative project.

The project must:
- use only the listed materials
- be achievable in under 30 minutes
- feel emotionally meaningful
- avoid generic craft ideas
- feel like creating a museum artifact, not following a basic tutorial
- match the mood
- be specific and practical

The visual style is:
- magical museum
- celestial theatre
- Victorian curiosity cabinet
- vintage carousel
- velvet curtains
- moons, stars, gold plaques, memory rooms

The visitor is feeling: ${moodKey}
Tone guidance: ${tone}
Museum hall: ${hall?.name ?? "Unknown"} (key: ${hallKey})

Return strict JSON only. No markdown fences. No preamble.

Required JSON:
{
  "project": {
    "title": "string",
    "concept": "string",
    "emotional_explanation": "string",
    "materials_used": ["string"],
    "steps": [{"n": 1, "text": "string"}],
    "est_minutes": 20,
    "difficulty": "Gentle"
  },
  "identity": {
    "artifact_name": "string",
    "museum_title": "string",
    "museum_description": "string",
    "artifact_meaning": "string",
    "hall_key": "${hallKey}"
  }
}`;
}

export async function conjureProject(
  moodKey: Mood,
  materials: string[]
): Promise<ConjureResponse> {
  const hallKey = MOOD_TO_HALL[moodKey];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: buildConjureSystem(moodKey, hallKey),
    messages: [{
      role: "user",
      content: `Materials available: ${materials.join(", ")}\n\nCreate one project. Return JSON only.`,
    }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude returned no text");

  const parsed = parseJSON<ConjureResponse>(text.text);

  // Validate required fields
  if (!parsed.project?.title) throw new Error("Missing project.title");
  if (!parsed.project?.steps?.length) throw new Error("Missing project.steps");
  if (!parsed.identity?.museum_title) throw new Error("Missing identity.museum_title");

  // Ensure hall_key matches
  parsed.identity.hall_key = hallKey;

  return parsed;
}
