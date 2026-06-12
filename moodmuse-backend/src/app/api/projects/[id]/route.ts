import { NextRequest, NextResponse } from "next/server";
import { IS_DEMO, demoDb } from "@/lib/demo";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (IS_DEMO) {
      const data = demoDb.getProject(id);
      if (!data) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({
        projectId: data.id,
        mood: data.mood,
        detectedMaterials: data.detected_materials,
        projectTitle: data.project_title,
        concept: data.concept,
        emotionalExplanation: data.emotional_explanation,
        instructions: data.instructions,
        estimatedTime: data.estimated_time,
        difficulty: data.difficulty,
        museumTitle: data.museum_title,
        museumDescription: data.museum_description,
        artifactMeaning: data.artifact_meaning,
        museumRoom: data.museum_room,
        materialsImageUrl: data.materials_image_url,
        createdAt: data.created_at,
      });
    }

    // Live mode
    const { requireUser, AuthError } = await import("@/lib/auth");
    const { supabaseAdmin } = await import("@/lib/supabase");

    const userId = await requireUser();

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      projectId: data.id,
      mood: data.mood,
      detectedMaterials: data.detected_materials,
      projectTitle: data.project_title,
      concept: data.concept,
      emotionalExplanation: data.emotional_explanation,
      instructions: data.instructions,
      estimatedTime: data.estimated_time,
      difficulty: data.difficulty,
      museumTitle: data.museum_title,
      museumDescription: data.museum_description,
      artifactMeaning: data.artifact_meaning,
      museumRoom: data.museum_room,
      materialsImageUrl: data.materials_image_url,
      createdAt: data.created_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
