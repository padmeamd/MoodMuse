/**
 * AI service — uses OpenAI GPT-4o for vision + text generation.
 * All calls go through fetch, no extra SDK needed.
 */

import type { Mood, ConjureResponse, HallKey } from "@/types";
import { MOOD_TONE, MOOD_TO_HALL, HALLS } from "@/types";

const OPENAI_API_KEY = () => process.env.OPENAI_API_KEY!;

// -- JSON parsing with repair --------------------------------------------

function parseJSON<T>(raw: string): T {
  let s = raw.trim()
    .replace(/^```json?\s*\n?/i, "")
    .replace(/\n?\s*```$/i, "");

  try { return JSON.parse(s); } catch { /* continue */ }

  s = s.replace(/,\s*([}\]])/g, "$1");

  const match = s.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* continue */ }
  }

  throw new Error(`Failed to parse JSON: ${raw.slice(0, 300)}`);
}

// -- OpenAI chat helper --------------------------------------------------

interface ChatMessage {
  role: "system" | "user";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

async function chatCompletion(messages: ChatMessage[], maxTokens = 1500): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY()}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no content");
  return text;
}

// -- Material detection (GPT-4o Vision) ----------------------------------

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
  // Ensure proper data URI format
  let dataUri = imageBase64;
  if (!dataUri.startsWith("data:")) {
    dataUri = `data:image/jpeg;base64,${dataUri}`;
  }

  const text = await chatCompletion([
    { role: "system", content: MATERIALS_SYSTEM },
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: dataUri } },
        { type: "text", text: "What usable craft/creative materials do you see in this photo? Return JSON only." },
      ],
    },
  ], 500);

  const parsed = parseJSON<{ materials: string[] }>(text);
  if (!Array.isArray(parsed.materials)) throw new Error("Response missing materials array");
  return parsed.materials;
}

// -- Project + identity generation (GPT-4o) ------------------------------

function buildConjureSystem(moodKey: Mood, hallKey: HallKey): string {
  const hall = HALLS.find((h) => h.key === hallKey);
  const tone = MOOD_TONE[moodKey];

  return `You are MoodMuse, an AI curator inside a magical museum of feelings.

You transform a user's mood and available materials into one meaningful creative project.

The project must:
- use ONLY the listed materials — do not invent materials that weren't provided
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

  const text = await chatCompletion([
    { role: "system", content: buildConjureSystem(moodKey, hallKey) },
    { role: "user", content: `Materials available: ${materials.join(", ")}\n\nCreate one project. Return JSON only.` },
  ]);

  const parsed = parseJSON<ConjureResponse>(text);

  if (!parsed.project?.title) throw new Error("Missing project.title");
  if (!parsed.project?.steps?.length) throw new Error("Missing project.steps");
  if (!parsed.identity?.museum_title) throw new Error("Missing identity.museum_title");

  parsed.identity.hall_key = hallKey;
  return parsed;
}

// -- Artifact vision analysis (GPT-4o Vision) ----------------------------

const VISION_PROMPT = `You are the Archivist of a magical museum of feelings. You are shown a photograph of a handmade artifact a person just created.

Analyze it carefully and return a JSON object describing the artifact visually. Be specific and poetic.

Required JSON:
{
  "dominant_color": "the main color as a CSS hex, e.g. #8B4513",
  "accent_color": "a secondary color as CSS hex",
  "shape": "one word: round, tall, flat, angular, organic, flowing, stacked, folded, twisted, layered",
  "material_feel": "one phrase: paper and ink, fabric and thread, clay and earth, wood and string, mixed media",
  "one_line": "A single evocative sentence describing what you see, written as a museum label",
  "glyph": "one unicode emoji that best represents this object"
}`;

export interface ArtifactVision {
  dominant_color: string;
  accent_color: string;
  shape: string;
  material_feel: string;
  one_line: string;
  glyph: string;
}

export async function analyzeArtifact(imageBase64: string): Promise<ArtifactVision> {
  let dataUri = imageBase64;
  if (!dataUri.startsWith("data:")) {
    dataUri = `data:image/jpeg;base64,${dataUri}`;
  }

  const text = await chatCompletion([
    { role: "system", content: VISION_PROMPT },
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: dataUri } },
        { type: "text", text: "Describe this artifact. Return JSON only." },
      ],
    },
  ], 300);

  return parseJSON<ArtifactVision>(text);
}
