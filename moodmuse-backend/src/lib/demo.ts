/**
 * Demo mode — zero-config, no API keys needed.
 * In-memory store + realistic mock Claude responses.
 */

import { randomUUID } from "crypto";
import type { Mood } from "@/types";
import { MOOD_TO_ROOM } from "@/types";

// ---- Feature flag ------------------------------------------------------

export const IS_DEMO =
  !process.env.ANTHROPIC_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL;

// ---- In-memory DB ------------------------------------------------------

interface StoredProject {
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

interface StoredArtifact {
  id: string;
  user_id: string;
  project_id: string | null;
  mood: string;
  artifact_name: string;
  final_image_url: string | null;
  model_3d_url: string | null;
  model_3d_status: string;
  museum_room: string;
  museum_description: string;
  created_at: string;
}

const projects: StoredProject[] = [];
const artifacts: StoredArtifact[] = [];

export const demoDb = {
  insertProject(p: Omit<StoredProject, "id" | "created_at">) {
    const row = { ...p, id: randomUUID(), created_at: new Date().toISOString() };
    projects.push(row);
    return row;
  },
  getProject(id: string) {
    return projects.find((p) => p.id === id) ?? null;
  },
  insertArtifact(a: Omit<StoredArtifact, "id" | "created_at">) {
    const row = { ...a, id: randomUUID(), created_at: new Date().toISOString() };
    artifacts.push(row);
    return row;
  },
  getArtifacts(filters?: { mood?: string; museum_room?: string }) {
    return artifacts.filter((a) => {
      if (filters?.mood && a.mood !== filters.mood) return false;
      if (filters?.museum_room && a.museum_room !== filters.museum_room) return false;
      return true;
    });
  },
  getAllArtifacts() {
    return [...artifacts];
  },
};

// ---- Mock Claude responses per mood ------------------------------------

interface MockResponse {
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
}

const MOCK_RESPONSES: Record<string, MockResponse> = {
  nostalgic: {
    detectedMaterials: ["colored pencils", "blank paper", "washi tape", "old postcards"],
    projectTitle: "The Places That Built Me",
    concept: "A hand-drawn constellation map of important memories, connected by golden paths that trace the journey between them.",
    emotionalExplanation: "Nostalgia is the feeling of carrying somewhere you can no longer return to. This makes that map holdable — a constellation you can keep in one hand and retrace whenever the distance feels too far.",
    materialsUsed: ["colored pencils", "blank paper", "washi tape"],
    instructions: [
      { step: 1, text: "Close your eyes. Name five places that shaped you — a kitchen, a bus stop, a bedroom window." },
      { step: 2, text: "Draw a small symbol for each place on the paper. Not a picture — a mark only you would recognize." },
      { step: 3, text: "Connect them with pencil lines like constellation paths. Some lines are long; some loop back." },
      { step: 4, text: "Border the map with washi tape, as if framing something worth preserving." },
    ],
    estimatedTime: "20 minutes",
    difficulty: "Gentle",
    museumTitle: "The Stars I Followed Home",
    museumDescription: "A personal cartography of remembered places, drawn not from geography but from feeling. Each mark is a door the maker once walked through and still carries.",
    artifactMeaning: "A way home, made small enough to carry — for the nights the way back feels far.",
  },
  inspired: {
    detectedMaterials: ["markers", "cardstock", "gold pen", "scissors"],
    projectTitle: "A Manifesto in Miniature",
    concept: "A palm-sized accordion book containing one bold declaration per page — the things you believe right now, while the spark is still bright.",
    emotionalExplanation: "Inspiration is a flame that burns fast. This captures it before it dims — not as a plan, but as a set of beliefs small enough to fit in a pocket.",
    materialsUsed: ["markers", "cardstock", "scissors"],
    instructions: [
      { step: 1, text: "Cut the cardstock into a long strip and fold it into an accordion of 5-6 panels." },
      { step: 2, text: "On each panel, write one thing you believe right now — bold, unqualified, no hedging." },
      { step: 3, text: "Decorate the borders with quick, energetic marks. Not careful — alive." },
      { step: 4, text: "Fold it shut. This is your pocket manifesto." },
    ],
    estimatedTime: "15 minutes",
    difficulty: "Gentle",
    museumTitle: "What I Believed on a Tuesday",
    museumDescription: "An accordion of certainties captured during a moment of clarity. Each fold holds a conviction the maker dared to write down before doubt returned.",
    artifactMeaning: "Proof that you once felt sure — and the permission to feel sure again.",
  },
  curious: {
    detectedMaterials: ["notebook", "pen", "sticky notes", "tape"],
    projectTitle: "The Cabinet of Questions",
    concept: "A collection of unanswered questions, each written on its own small card, arranged like specimens in a curiosity cabinet.",
    emotionalExplanation: "Curiosity isn't about finding answers — it's about making questions visible. This gives your wondering a physical form, a cabinet you can open when the world feels too explained.",
    materialsUsed: ["sticky notes", "pen", "notebook"],
    instructions: [
      { step: 1, text: "Tear or cut sticky notes into small rectangles — your specimen cards." },
      { step: 2, text: "Write one question per card. Questions you actually wonder about, not rhetorical ones." },
      { step: 3, text: "Arrange them in the notebook like pinned specimens — some clustered, some alone." },
      { step: 4, text: "Title the page: Cabinet of Questions, today's date." },
    ],
    estimatedTime: "18 minutes",
    difficulty: "Gentle",
    museumTitle: "Everything I Haven't Answered Yet",
    museumDescription: "A taxonomy of open questions, pinned like moths to a board. Each one still alive, still moving, still worth asking.",
    artifactMeaning: "Permission to not know — and to love the not-knowing.",
  },
  overwhelmed: {
    detectedMaterials: ["plain paper", "pen", "colored markers", "rubber bands"],
    projectTitle: "The Unburdening Scroll",
    concept: "Write everything weighing on you on a single long strip, then physically roll it up and bind it — making the weight holdable and finite.",
    emotionalExplanation: "When everything presses at once, the feeling has no edges. This gives it edges. A scroll can be rolled shut. A list has an end.",
    materialsUsed: ["plain paper", "pen", "rubber bands"],
    instructions: [
      { step: 1, text: "Tape or fold sheets into one long continuous strip." },
      { step: 2, text: "Write everything on your mind — small, large, silly, serious. One line per worry." },
      { step: 3, text: "When you reach the end, stop. That is all of it. See — it ends." },
      { step: 4, text: "Roll the scroll tightly and bind it with a rubber band. It is contained now." },
    ],
    estimatedTime: "15 minutes",
    difficulty: "Gentle",
    museumTitle: "The Day I Named Every Weight",
    museumDescription: "A scroll of burdens, written honestly and then rolled shut. The act of listing was the act of containing. The binding was the breath out.",
    artifactMeaning: "Proof that even the heaviest day has edges — and that you found them.",
  },
  healing: {
    detectedMaterials: ["fabric scraps", "needle and thread", "buttons", "ribbon"],
    projectTitle: "The Mending Patch",
    concept: "A small patchwork square made from scraps — not to fix anything, but to practice the motion of putting broken things beside each other.",
    emotionalExplanation: "Healing is not about going back to before. It's about making something from what remains. This patch doesn't hide the seams — it makes them the design.",
    materialsUsed: ["fabric scraps", "needle and thread", "buttons"],
    instructions: [
      { step: 1, text: "Choose 3-4 fabric scraps. Don't match them — let them be mismatched." },
      { step: 2, text: "Stitch them together loosely. Visible stitches, imperfect joins." },
      { step: 3, text: "Sew one button in the center, like a heartbeat." },
      { step: 4, text: "Hold it. This is a small thing that holds together despite everything." },
    ],
    estimatedTime: "25 minutes",
    difficulty: "Considered",
    museumTitle: "What I Stitched from What Remained",
    museumDescription: "A patchwork square that does not pretend to be whole. Its seams are visible, its pieces mismatched, and it holds together anyway. That is the point.",
    artifactMeaning: "Evidence that broken things can sit beside each other and still make something worth keeping.",
  },
  hopeful: {
    detectedMaterials: ["jar", "paper strips", "pen", "stickers"],
    projectTitle: "Letters to Next Year",
    concept: "A jar of tiny folded notes — promises, wishes, and gentle predictions — written to a future version of yourself.",
    emotionalExplanation: "Hope is belief aimed forward. These notes give it an address — a jar you can open later, when you need to remember that someone once believed in what's coming.",
    materialsUsed: ["jar", "paper strips", "pen"],
    instructions: [
      { step: 1, text: "Cut paper into small strips, enough for 8-10 notes." },
      { step: 2, text: "Write one small hope, wish, or prediction per strip. Be specific, not grand." },
      { step: 3, text: "Fold each one tightly and drop it in the jar." },
      { step: 4, text: "Seal it. Write today's date on the outside. Do not open for one year." },
    ],
    estimatedTime: "18 minutes",
    difficulty: "Gentle",
    museumTitle: "Promises Aimed at Next December",
    museumDescription: "A sealed jar of predictions and wishes, written on a hopeful afternoon. The notes inside are patient — they'll wait until the maker is ready to read them.",
    artifactMeaning: "A time capsule of optimism — proof that today, at least, you believed something good was coming.",
  },
  ambitious: {
    detectedMaterials: ["cardboard", "markers", "glue stick", "magazine clippings"],
    projectTitle: "The Monument to What's Next",
    concept: "A small standing monument — a folded cardboard tower marked with the single biggest thing you're building toward right now.",
    emotionalExplanation: "Ambition needs a landmark. Not a vision board of everything — a single tower for the one thing that matters most right now. Small enough to keep on a desk. Tall enough to see.",
    materialsUsed: ["cardboard", "markers", "glue stick"],
    instructions: [
      { step: 1, text: "Cut and fold cardboard into a small standing tower or obelisk — 15-20cm tall." },
      { step: 2, text: "On one face, write the single thing you're working toward. One sentence." },
      { step: 3, text: "On the other faces, write what it will feel like when you get there." },
      { step: 4, text: "Stand it up. This is your monument. It is small and it is serious." },
    ],
    estimatedTime: "22 minutes",
    difficulty: "Considered",
    museumTitle: "The Tower I Built Before the Tower",
    museumDescription: "A monument in cardboard and ink, raised before the real thing existed. It stands for the audacity of declaring what you want before you have it.",
    artifactMeaning: "A small act of declaring — because naming what you want is the first brick.",
  },
  lonely: {
    detectedMaterials: ["tea bag wrapper", "pen", "envelope", "pressed flower"],
    projectTitle: "A Letter to the Room",
    concept: "A short handwritten letter addressed to the empty room you're sitting in — as if it were listening, as if it could write back.",
    emotionalExplanation: "Loneliness is a conversation with no one on the other side. This letter doesn't fix that — but it turns the silence into a listener. Sometimes the room is enough.",
    materialsUsed: ["pen", "envelope", "tea bag wrapper"],
    instructions: [
      { step: 1, text: "Sit still for one minute. Notice the room — what it holds, how it sounds." },
      { step: 2, text: "Write a short letter beginning: Dear Room." },
      { step: 3, text: "Tell it one true thing about your day. Fold the letter." },
      { step: 4, text: "Seal it in the envelope. Tuck the tea wrapper inside as a timestamp." },
    ],
    estimatedTime: "12 minutes",
    difficulty: "Gentle",
    museumTitle: "A Letter the Walls Still Hold",
    museumDescription: "A letter written to an empty room on a quiet evening. The room did not answer, but it listened — and that was almost enough.",
    artifactMeaning: "Company you made for yourself, from nothing but honesty and paper.",
  },
  creative: {
    detectedMaterials: ["watercolors", "brush", "thick paper", "salt"],
    projectTitle: "A Color the World Doesn't Have Yet",
    concept: "Mix and layer watercolors to invent one single new color — then name it, describe where it lives, and paint a small swatch worth keeping.",
    emotionalExplanation: "Creativity is making something exist that didn't before. Not a painting — just one color. That's enough. Give it a name and it becomes yours.",
    materialsUsed: ["watercolors", "brush", "thick paper", "salt"],
    instructions: [
      { step: 1, text: "Wet the paper. Begin mixing colors — not toward a goal, just toward surprise." },
      { step: 2, text: "When one combination stops you, that's the one. Mix more of it." },
      { step: 3, text: "Paint a swatch. Sprinkle salt on it while wet for texture." },
      { step: 4, text: "Name the color. Write where it lives: 'the underside of a cloud at 4pm.'" },
    ],
    estimatedTime: "20 minutes",
    difficulty: "Gentle",
    museumTitle: "A Color That Didn't Exist Until Today",
    museumDescription: "A watercolor swatch of a shade the maker invented on an afternoon when making felt easy. It has a name now, and a place where it belongs.",
    artifactMeaning: "Proof that you can add something to the world just by mixing what's already here.",
  },
  reflective: {
    detectedMaterials: ["mirror", "dry-erase marker", "cloth", "string"],
    projectTitle: "A Message on the Glass",
    concept: "Write a single honest sentence on a mirror — something you need to read tomorrow morning, from the person you are tonight.",
    emotionalExplanation: "Reflection is literally looking at yourself. This makes that metaphor physical — a message left by tonight's version of you for tomorrow's.",
    materialsUsed: ["mirror", "dry-erase marker"],
    instructions: [
      { step: 1, text: "Stand in front of the mirror. Look for ten seconds before picking up the marker." },
      { step: 2, text: "Write one sentence you need to hear tomorrow. Not advice — a reminder." },
      { step: 3, text: "Photograph it before it's wiped away. The impermanence is the point." },
      { step: 4, text: "Tomorrow, after you read it, erase it. It did its work." },
    ],
    estimatedTime: "8 minutes",
    difficulty: "Gentle",
    museumTitle: "What Tonight Said to Tomorrow",
    museumDescription: "A message written on glass — temporary by design, permanent only in the photograph. Tonight's self, leaving something for morning.",
    artifactMeaning: "A bridge between two versions of yourself, made of dry-erase ink and honesty.",
  },
};

const DEFAULT_MOCK = MOCK_RESPONSES.nostalgic;

export function mockGenerate(mood: Mood) {
  const mock = MOCK_RESPONSES[mood] ?? DEFAULT_MOCK;
  const room = MOOD_TO_ROOM[mood];
  return { ...mock, museumRoom: room };
}
