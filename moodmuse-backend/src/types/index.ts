// -- Moods ----------------------------------------------------------------

export const MOODS = [
  "nostalgic", "inspired", "curious", "overwhelmed", "healing",
  "hopeful", "ambitious", "lonely", "creative", "reflective",
] as const;

export type Mood = (typeof MOODS)[number];

// -- Halls ----------------------------------------------------------------

export const HALL_KEYS = [
  "nostalgia", "dreams", "healing", "ambition", "curiosity",
] as const;

export type HallKey = (typeof HALL_KEYS)[number];

export interface Hall {
  key: HallKey;
  name: string;
  emoji: string;
}

export const HALLS: Hall[] = [
  { key: "nostalgia",  name: "Hall of Nostalgia",  emoji: "\u{1F319}" },
  { key: "dreams",     name: "Hall of Dreams",     emoji: "\u2728"    },
  { key: "healing",    name: "Hall of Healing",    emoji: "\u{1F30A}" },
  { key: "ambition",   name: "Hall of Ambition",   emoji: "\u{1F525}" },
  { key: "curiosity",  name: "Hall of Curiosity",  emoji: "\u{1F3AD}" },
];

export const MOOD_TO_HALL: Record<Mood, HallKey> = {
  nostalgic:    "nostalgia",
  reflective:   "nostalgia",
  lonely:       "nostalgia",
  hopeful:      "dreams",
  inspired:     "dreams",
  creative:     "dreams",
  healing:      "healing",
  overwhelmed:  "healing",
  ambitious:    "ambition",
  curious:      "curiosity",
};

export const MOOD_TONE: Record<Mood, string> = {
  nostalgic:    "warm, wistful, tender; the project should feel like preserving a memory",
  reflective:   "quiet, contemplative, unhurried; space to think with your hands",
  lonely:       "tender, companionable; the object should feel like company",
  hopeful:      "forward-looking, bright, a small promise made physical",
  inspired:     "energized, luminous; channel the spark before it fades",
  creative:     "playful, experimental; permission to try something odd",
  healing:      "gentle, slow, restorative; nothing sharp or rushed",
  overwhelmed:  "grounding, tactile, simple; a single clear step at a time",
  ambitious:    "forward-leaning, bold; a small monument to what's coming",
  curious:      "exploratory, surprising; follow a question with your hands",
};

// -- API shapes -----------------------------------------------------------

export interface ProjectOutput {
  title: string;
  concept: string;
  emotional_explanation: string;
  materials_used: string[];
  steps: { n: number; text: string }[];
  est_minutes: number;
  difficulty: "Gentle" | "Considered" | "Devoted";
}

export interface IdentityOutput {
  artifact_name: string;
  museum_title: string;
  museum_description: string;
  artifact_meaning: string;
  hall_key: HallKey;
}

export interface ConjureResponse {
  project: ProjectOutput;
  identity: IdentityOutput;
}

// -- DB row types ---------------------------------------------------------

export interface ProjectRow {
  id: string;
  user_id: string;
  mood_key: string;
  title: string;
  concept: string;
  emotional_explanation: string;
  materials: string[];        // jsonb
  steps: { n: number; text: string }[];  // jsonb
  est_minutes: number;
  difficulty: string;
  artifact_name: string;
  museum_title: string;
  museum_description: string;
  artifact_meaning: string;
  hall_key: string;
  created_at: string;
}

export interface ArtifactRow {
  id: string;
  user_id: string;
  project_id: string | null;
  mood_key: string;
  hall_key: string;
  artifact_name: string;
  museum_title: string;
  museum_description: string;
  artifact_meaning: string;
  source_image_url: string | null;
  glb_url: string | null;
  model_status: "pending" | "forging" | "ready" | "failed";
  created_at: string;
}

// -- API error ------------------------------------------------------------

export interface ApiError {
  error: string;
  details?: string;
}
