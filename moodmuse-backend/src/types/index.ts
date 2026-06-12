// -- Domain types ---------------------------------------------------------

export const MOODS = [
  "nostalgic",
  "inspired",
  "curious",
  "overwhelmed",
  "healing",
  "hopeful",
  "ambitious",
  "lonely",
  "creative",
  "reflective",
] as const;

export type Mood = (typeof MOODS)[number];

export const MOOD_TO_ROOM: Record<Mood, string> = {
  nostalgic: "Hall of Nostalgia",
  reflective: "Hall of Nostalgia",
  lonely: "Hall of Nostalgia",
  hopeful: "Hall of Dreams",
  inspired: "Hall of Dreams",
  creative: "Hall of Dreams",
  healing: "Hall of Healing",
  overwhelmed: "Hall of Healing",
  ambitious: "Hall of Ambition",
  curious: "Hall of Curiosity",
};

export const MOOD_TONE: Record<Mood, string> = {
  nostalgic:
    "warm, wistful, tender; the project should feel like preserving a memory",
  reflective:
    "quiet, contemplative, unhurried; space to think with your hands",
  lonely:
    "tender, companionable; the object should feel like company",
  hopeful:
    "forward-looking, bright, a small promise made physical",
  inspired:
    "energized, luminous; channel the spark before it fades",
  creative:
    "playful, experimental; permission to try something odd",
  healing:
    "gentle, slow, restorative; nothing sharp or rushed",
  overwhelmed:
    "grounding, tactile, simple; a single clear step at a time",
  ambitious:
    "forward-leaning, bold; a small monument to what's coming",
  curious:
    "exploratory, surprising; follow a question with your hands",
};

// -- DB row types ---------------------------------------------------------

export interface ProjectRow {
  id: string;
  user_id: string;
  mood: string;
  materials_image_url: string | null;
  detected_materials: string[];
  project_title: string;
  concept: string;
  emotional_explanation: string;
  instructions: { step: number; text: string }[];
  estimated_time: string;
  difficulty: string;
  museum_title: string;
  museum_description: string;
  artifact_meaning: string;
  museum_room: string;
  created_at: string;
}

export interface ArtifactRow {
  id: string;
  user_id: string;
  project_id: string | null;
  mood: string;
  artifact_name: string;
  final_image_url: string | null;
  model_3d_url: string | null;
  model_3d_status: "none" | "pending" | "complete" | "failed";
  model_3d_job_id: string | null;
  museum_room: string;
  museum_description: string;
  created_at: string;
}

// -- Claude response schema -----------------------------------------------

export interface ClaudeProjectResponse {
  detectedMaterials: string[];
  projectTitle: string;
  concept: string;
  emotionalExplanation: string;
  materialsUsed: string[];
  instructions: { step: number; text: string }[];
  estimatedTime: string;
  difficulty: string;
  museumTitle: string;
  museumDescription: string;
  artifactMeaning: string;
  museumRoom: string;
}

// -- API payloads ---------------------------------------------------------

export interface GenerateProjectBody {
  mood: Mood;
  imageBase64?: string;      // data-uri or raw base64
  imageUrl?: string;         // already-uploaded URL
}

export interface CreateArtifactBody {
  project_id: string;
  imageBase64?: string;
  imageUrl?: string;
  generate_3d?: boolean;
}

export interface ApiError {
  error: string;
  detail?: string;
}
