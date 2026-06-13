/**
 * Mock mode for hackathon showcase.
 * MOCK_MODE=true in .env.local — no API keys needed.
 */

import { randomUUID } from "crypto";
import type { ConjureResponse, ProjectRow, ArtifactRow } from "@/types";

export const IS_DEMO =
  process.env.MOCK_MODE === "true" ||
  (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY);

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
  getArtifact(id: string): ArtifactRow | null {
    return artifacts.find((a) => a.id === id) ?? null;
  },
  updateArtifact(id: string, updates: Partial<ArtifactRow>): ArtifactRow | null {
    const idx = artifacts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    artifacts[idx] = { ...artifacts[idx], ...updates };
    return artifacts[idx];
  },
  getAllArtifacts(): ArtifactRow[] {
    return [...artifacts];
  },
};

// -- Mock responses ------------------------------------------------------

export function mockDetectMaterials(): string[] {
  return ["canvas", "markers", "pencils", "brushes"];
}

export function mockConjure(): ConjureResponse {
  return {
    project: {
      title: "The Girl Who Carried Her Chapters",
      concept: "Draw yourself in the center of the canvas surrounded by small symbols of recent meaningful events, memories, dreams, and transitions. The symbols should orbit around you like a personal constellation.",
      emotional_explanation: "This project fits nostalgia because it turns recent life moments into visual symbols, helping the creator remember what shaped them while still looking toward the future.",
      materials_used: ["canvas", "markers", "pencils", "brushes"],
      steps: [
        { n: 1, text: "Draw a simple silhouette or portrait of yourself in the center of the canvas." },
        { n: 2, text: "Around yourself, draw 6-8 small symbols connected to important recent events." },
        { n: 3, text: "Use stars, dots, or curved lines to connect the symbols like constellations." },
        { n: 4, text: "Add color accents to show which memories feel warm, painful, exciting, or unfinished." },
        { n: 5, text: "Write a small title at the bottom of the canvas." },
      ],
      est_minutes: 20,
      difficulty: "Gentle",
    },
    identity: {
      artifact_name: "The Stars She Took With Her",
      museum_title: "The Stars She Took With Her",
      museum_description: "A handmade constellation of recent memories, showing the creator surrounded by the moments, places, and dreams that quietly shaped her next chapter.",
      artifact_meaning: "This artifact preserves nostalgia as something alive: not a longing to return, but a map of what still travels with you.",
      hall_key: "nostalgia",
    },
  };
}
