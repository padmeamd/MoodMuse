/**
 * Demo mode — zero-config, no API keys needed.
 * In-memory store + mock Claude responses.
 */

import { randomUUID } from "crypto";
import type { Mood, ConjureResponse, ProjectRow, ArtifactRow } from "@/types";
import { MOOD_TO_HALL } from "@/types";

// -- Feature flag --------------------------------------------------------

export const IS_DEMO = !process.env.ANTHROPIC_API_KEY;

export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "demo-user-00000000";

// -- In-memory DB --------------------------------------------------------

const projects: ProjectRow[] = [];
const artifacts: ArtifactRow[] = [];

export const demoDb = {
  insertProject(p: Omit<ProjectRow, "id" | "created_at">): ProjectRow {
    const row: ProjectRow = { ...p, id: randomUUID(), created_at: new Date().toISOString() };
    projects.push(row);
    return row;
  },

  getProject(id: string): ProjectRow | null {
    return projects.find((p) => p.id === id) ?? null;
  },

  insertArtifact(a: Omit<ArtifactRow, "id" | "created_at">): ArtifactRow {
    const row: ArtifactRow = { ...a, id: randomUUID(), created_at: new Date().toISOString() };
    artifacts.push(row);
    return row;
  },

  getAllArtifacts(): ArtifactRow[] {
    return [...artifacts];
  },
};

// -- Mock material detection ---------------------------------------------

export function mockDetectMaterials(): string[] {
  return ["colored pencils", "blank paper", "washi tape", "old postcards"];
}

// -- Mock conjure responses per mood -------------------------------------

const MOCK: Record<string, ConjureResponse> = {
  nostalgic: {
    project: {
      title: "The Places That Built Me",
      concept: "A hand-drawn constellation map of important memories, connected by golden paths that trace the journey between them.",
      emotional_explanation: "Nostalgia is the feeling of carrying somewhere you can no longer return to. This makes that map holdable — a constellation you can keep in one hand.",
      materials_used: ["colored pencils", "blank paper", "washi tape"],
      steps: [
        { n: 1, text: "Close your eyes. Name five places that shaped you — a kitchen, a bus stop, a bedroom window." },
        { n: 2, text: "Draw a small symbol for each place on the paper. Not a picture — a mark only you would recognize." },
        { n: 3, text: "Connect them with pencil lines like constellation paths. Some lines are long; some loop back." },
        { n: 4, text: "Border the map with washi tape, as if framing something worth preserving." },
      ],
      est_minutes: 20,
      difficulty: "Gentle",
    },
    identity: {
      artifact_name: "Shell Constellation, no. 1",
      museum_title: "The Stars I Followed Home",
      museum_description: "A personal cartography of remembered places, drawn not from geography but from feeling. Each mark is a door the maker once walked through and still carries.",
      artifact_meaning: "A way home, made small enough to carry — for the nights the way back feels far.",
      hall_key: "nostalgia",
    },
  },
  inspired: {
    project: {
      title: "A Manifesto in Miniature",
      concept: "A palm-sized accordion book containing one bold declaration per page — the things you believe right now.",
      emotional_explanation: "Inspiration is a flame that burns fast. This captures it before it dims.",
      materials_used: ["markers", "cardstock", "scissors"],
      steps: [
        { n: 1, text: "Cut the cardstock into a long strip and fold it into an accordion of 5-6 panels." },
        { n: 2, text: "On each panel, write one thing you believe right now — bold, unqualified, no hedging." },
        { n: 3, text: "Decorate the borders with quick, energetic marks." },
        { n: 4, text: "Fold it shut. This is your pocket manifesto." },
      ],
      est_minutes: 15,
      difficulty: "Gentle",
    },
    identity: {
      artifact_name: "Pocket Manifesto, no. 1",
      museum_title: "What I Believed on a Tuesday",
      museum_description: "An accordion of certainties captured during a moment of clarity.",
      artifact_meaning: "Proof that you once felt sure — and the permission to feel sure again.",
      hall_key: "dreams",
    },
  },
  curious: {
    project: {
      title: "The Cabinet of Questions",
      concept: "A collection of unanswered questions, each on its own card, arranged like specimens in a curiosity cabinet.",
      emotional_explanation: "Curiosity isn't about answers — it's about making questions visible.",
      materials_used: ["sticky notes", "pen", "notebook"],
      steps: [
        { n: 1, text: "Tear sticky notes into small rectangles — your specimen cards." },
        { n: 2, text: "Write one question per card. Real questions, not rhetorical ones." },
        { n: 3, text: "Arrange them in the notebook like pinned specimens." },
        { n: 4, text: "Title the page: Cabinet of Questions, today's date." },
      ],
      est_minutes: 18,
      difficulty: "Gentle",
    },
    identity: {
      artifact_name: "Question Cabinet, no. 1",
      museum_title: "Everything I Haven't Answered Yet",
      museum_description: "A taxonomy of open questions, pinned like moths to a board.",
      artifact_meaning: "Permission to not know — and to love the not-knowing.",
      hall_key: "curiosity",
    },
  },
  overwhelmed: {
    project: {
      title: "The Unburdening Scroll",
      concept: "Write everything weighing on you on a single long strip, then roll it up and bind it.",
      emotional_explanation: "When everything presses at once, the feeling has no edges. This gives it edges.",
      materials_used: ["plain paper", "pen", "rubber bands"],
      steps: [
        { n: 1, text: "Tape or fold sheets into one long continuous strip." },
        { n: 2, text: "Write everything on your mind. One line per worry." },
        { n: 3, text: "When you reach the end, stop. See — it ends." },
        { n: 4, text: "Roll the scroll tightly and bind it with a rubber band." },
      ],
      est_minutes: 15,
      difficulty: "Gentle",
    },
    identity: {
      artifact_name: "Burden Scroll, no. 1",
      museum_title: "The Day I Named Every Weight",
      museum_description: "A scroll of burdens, written honestly and then rolled shut.",
      artifact_meaning: "Proof that even the heaviest day has edges — and that you found them.",
      hall_key: "healing",
    },
  },
  healing: {
    project: {
      title: "The Mending Patch",
      concept: "A small patchwork square made from scraps — not to fix anything, but to practice putting broken things beside each other.",
      emotional_explanation: "Healing is making something from what remains. This patch doesn't hide the seams — it makes them the design.",
      materials_used: ["fabric scraps", "needle and thread", "buttons"],
      steps: [
        { n: 1, text: "Choose 3-4 fabric scraps. Don't match them." },
        { n: 2, text: "Stitch them together loosely. Visible stitches, imperfect joins." },
        { n: 3, text: "Sew one button in the center, like a heartbeat." },
        { n: 4, text: "Hold it. This is a small thing that holds together despite everything." },
      ],
      est_minutes: 25,
      difficulty: "Considered",
    },
    identity: {
      artifact_name: "Mending Patch, no. 1",
      museum_title: "What I Stitched from What Remained",
      museum_description: "A patchwork square that does not pretend to be whole.",
      artifact_meaning: "Evidence that broken things can sit beside each other and still make something worth keeping.",
      hall_key: "healing",
    },
  },
  hopeful: {
    project: {
      title: "Letters to Next Year",
      concept: "A jar of tiny folded notes — promises, wishes, and gentle predictions — written to a future self.",
      emotional_explanation: "Hope is belief aimed forward. These notes give it an address.",
      materials_used: ["jar", "paper strips", "pen"],
      steps: [
        { n: 1, text: "Cut paper into small strips, enough for 8-10 notes." },
        { n: 2, text: "Write one small hope per strip. Be specific, not grand." },
        { n: 3, text: "Fold each one tightly and drop it in the jar." },
        { n: 4, text: "Seal it. Write today's date on the outside." },
      ],
      est_minutes: 18,
      difficulty: "Gentle",
    },
    identity: {
      artifact_name: "Hope Jar, no. 1",
      museum_title: "Promises Aimed at Next December",
      museum_description: "A sealed jar of predictions and wishes, written on a hopeful afternoon.",
      artifact_meaning: "A time capsule of optimism.",
      hall_key: "dreams",
    },
  },
  ambitious: {
    project: {
      title: "The Monument to What's Next",
      concept: "A small standing monument — a folded cardboard tower marked with the single biggest thing you're building toward.",
      emotional_explanation: "Ambition needs a landmark. A single tower for the one thing that matters most right now.",
      materials_used: ["cardboard", "markers", "glue stick"],
      steps: [
        { n: 1, text: "Cut and fold cardboard into a small standing tower — 15-20cm tall." },
        { n: 2, text: "On one face, write the single thing you're working toward." },
        { n: 3, text: "On the other faces, write what it will feel like when you get there." },
        { n: 4, text: "Stand it up. This is your monument." },
      ],
      est_minutes: 22,
      difficulty: "Considered",
    },
    identity: {
      artifact_name: "Tower Monument, no. 1",
      museum_title: "The Tower I Built Before the Tower",
      museum_description: "A monument in cardboard and ink, raised before the real thing existed.",
      artifact_meaning: "A small act of declaring — because naming what you want is the first brick.",
      hall_key: "ambition",
    },
  },
  lonely: {
    project: {
      title: "A Letter to the Room",
      concept: "A short handwritten letter addressed to the empty room you're sitting in.",
      emotional_explanation: "Loneliness is a conversation with no one on the other side. This turns the silence into a listener.",
      materials_used: ["pen", "envelope", "tea bag wrapper"],
      steps: [
        { n: 1, text: "Sit still for one minute. Notice the room." },
        { n: 2, text: "Write a short letter beginning: Dear Room." },
        { n: 3, text: "Tell it one true thing about your day. Fold the letter." },
        { n: 4, text: "Seal it in the envelope. Tuck the tea wrapper inside." },
      ],
      est_minutes: 12,
      difficulty: "Gentle",
    },
    identity: {
      artifact_name: "Room Letter, no. 1",
      museum_title: "A Letter the Walls Still Hold",
      museum_description: "A letter written to an empty room on a quiet evening.",
      artifact_meaning: "Company you made for yourself, from nothing but honesty and paper.",
      hall_key: "nostalgia",
    },
  },
  creative: {
    project: {
      title: "A Color the World Doesn't Have Yet",
      concept: "Mix watercolors to invent one new color — then name it and describe where it lives.",
      emotional_explanation: "Creativity is making something exist that didn't before. Just one color. That's enough.",
      materials_used: ["watercolors", "brush", "thick paper", "salt"],
      steps: [
        { n: 1, text: "Wet the paper. Begin mixing colors — just toward surprise." },
        { n: 2, text: "When one combination stops you, that's the one. Mix more." },
        { n: 3, text: "Paint a swatch. Sprinkle salt on it while wet for texture." },
        { n: 4, text: "Name the color. Write where it lives." },
      ],
      est_minutes: 20,
      difficulty: "Gentle",
    },
    identity: {
      artifact_name: "Color Swatch, no. 1",
      museum_title: "A Color That Didn't Exist Until Today",
      museum_description: "A watercolor swatch of a shade the maker invented.",
      artifact_meaning: "Proof that you can add something to the world just by mixing what's already here.",
      hall_key: "dreams",
    },
  },
  reflective: {
    project: {
      title: "A Message on the Glass",
      concept: "Write a single honest sentence on a mirror — something you need to read tomorrow morning.",
      emotional_explanation: "Reflection is literally looking at yourself. This makes that metaphor physical.",
      materials_used: ["mirror", "dry-erase marker"],
      steps: [
        { n: 1, text: "Stand in front of the mirror. Look for ten seconds." },
        { n: 2, text: "Write one sentence you need to hear tomorrow." },
        { n: 3, text: "Photograph it before it's wiped away." },
        { n: 4, text: "Tomorrow, after you read it, erase it." },
      ],
      est_minutes: 8,
      difficulty: "Gentle",
    },
    identity: {
      artifact_name: "Mirror Message, no. 1",
      museum_title: "What Tonight Said to Tomorrow",
      museum_description: "A message written on glass — temporary by design, permanent only in the photograph.",
      artifact_meaning: "A bridge between two versions of yourself.",
      hall_key: "nostalgia",
    },
  },
};

const DEFAULT = MOCK.nostalgic;

export function mockConjure(moodKey: Mood): ConjureResponse {
  return MOCK[moodKey] ?? DEFAULT;
}
