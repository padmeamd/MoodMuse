import { NextRequest, NextResponse } from "next/server";
import { MOODS, type Mood } from "@/types";
import { IS_DEMO, DEMO_USER_ID, mockConjure, demoDb } from "@/lib/demo";
import { HAS_SUPABASE, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const moodKey: string | undefined = body.moodKey;
    const materials: string[] | undefined = body.materials;

    if (!moodKey || !MOODS.includes(moodKey as Mood)) {
      return NextResponse.json(
        { error: "Invalid or missing moodKey", details: `Must be one of: ${MOODS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: "Missing materials", details: "Send a non-empty array of material strings" },
        { status: 400 }
      );
    }

    // -- Generate project + identity --------------------------------------
    let result;
    if (IS_DEMO) {
      await new Promise((r) => setTimeout(r, 1500));
      result = mockConjure();
    } else {
      const { conjureProject } = await import("@/lib/claude");
      result = await conjureProject(moodKey as Mood, materials);
    }

    // -- Persist project --------------------------------------------------
    const userId = DEMO_USER_ID;

    const projectData = {
      user_id: userId,
      mood_key: moodKey,
      title: result.project.title,
      concept: result.project.concept,
      emotional_explanation: result.project.emotional_explanation,
      materials: result.project.materials_used,
      steps: result.project.steps,
      est_minutes: result.project.est_minutes,
      difficulty: result.project.difficulty,
      artifact_name: result.identity.artifact_name,
      museum_title: result.identity.museum_title,
      museum_description: result.identity.museum_description,
      artifact_meaning: result.identity.artifact_meaning,
      hall_key: result.identity.hall_key,
    };

    let projectId: string;

    if (HAS_SUPABASE && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("projects")
        .insert(projectData)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to save project", details: error.message },
          { status: 500 }
        );
      }
      projectId = data.id;
    } else {
      const row = demoDb.insertProject(projectData);
      projectId = row.id;
    }

    return NextResponse.json({
      projectId,
      project: result.project,
      identity: result.identity,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/conjure", message);
    return NextResponse.json(
      { error: "Project generation failed", details: message },
      { status: 500 }
    );
  }
}
