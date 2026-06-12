import { NextRequest, NextResponse } from "next/server";
import { MOODS, type Mood, type GenerateProjectBody } from "@/types";
import { IS_DEMO, mockGenerate, demoDb } from "@/lib/demo";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateProjectBody;

    // ---- Validate mood --------------------------------------------------
    if (!body.mood || !MOODS.includes(body.mood)) {
      return NextResponse.json(
        { error: `Invalid mood. Must be one of: ${MOODS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!body.imageBase64 && !body.imageUrl) {
      return NextResponse.json(
        { error: "Provide imageBase64 or imageUrl" },
        { status: 400 }
      );
    }

    if (IS_DEMO) {
      // ---- Demo mode: mock response, in-memory store --------------------
      const result = mockGenerate(body.mood as Mood);

      // Simulate a small delay so the UI feels real
      await new Promise((r) => setTimeout(r, 1500));

      const project = demoDb.insertProject({
        user_id: "demo-user",
        mood: body.mood,
        materials_image_url: null,
        detected_materials: result.detectedMaterials,
        project_title: result.projectTitle,
        concept: result.concept,
        emotional_explanation: result.emotionalExplanation,
        instructions: result.instructions,
        estimated_time: result.estimatedTime,
        difficulty: result.difficulty,
        museum_title: result.museumTitle,
        museum_description: result.museumDescription,
        artifact_meaning: result.artifactMeaning,
        museum_room: result.museumRoom,
      });

      return NextResponse.json({
        projectId: project.id,
        mood: project.mood,
        detectedMaterials: project.detected_materials,
        projectTitle: project.project_title,
        concept: project.concept,
        emotionalExplanation: project.emotional_explanation,
        instructions: project.instructions,
        estimatedTime: project.estimated_time,
        difficulty: project.difficulty,
        museumTitle: project.museum_title,
        museumDescription: project.museum_description,
        artifactMeaning: project.artifact_meaning,
        museumRoom: project.museum_room,
        materialsImageUrl: project.materials_image_url,
        createdAt: project.created_at,
      });
    }

    // ---- Live mode: Claude + Supabase -----------------------------------
    const { requireUser, AuthError } = await import("@/lib/auth");
    const { uploadImage } = await import("@/lib/storage");
    const { generateProject } = await import("@/lib/claude");
    const { supabaseAdmin } = await import("@/lib/supabase");

    const userId = await requireUser();

    let materialsImageUrl = body.imageUrl ?? "";
    let imageBase64ForClaude = body.imageBase64 ?? "";

    if (body.imageBase64) {
      materialsImageUrl = await uploadImage("materials", userId, body.imageBase64);
    }

    if (!body.imageBase64 && body.imageUrl) {
      const res = await fetch(body.imageUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      imageBase64ForClaude = `data:${contentType};base64,${buf.toString("base64")}`;
    }

    const result = await generateProject(body.mood as Mood, imageBase64ForClaude);

    const { data: project, error: dbError } = await supabaseAdmin
      .from("projects")
      .insert({
        user_id: userId,
        mood: body.mood,
        materials_image_url: materialsImageUrl,
        detected_materials: result.detectedMaterials,
        project_title: result.projectTitle,
        concept: result.concept,
        emotional_explanation: result.emotionalExplanation,
        instructions: result.instructions,
        estimated_time: result.estimatedTime,
        difficulty: result.difficulty,
        museum_title: result.museumTitle,
        museum_description: result.museumDescription,
        artifact_meaning: result.artifactMeaning,
        museum_room: result.museumRoom,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to save project", detail: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      projectId: project.id,
      mood: project.mood,
      detectedMaterials: project.detected_materials,
      projectTitle: project.project_title,
      concept: project.concept,
      emotionalExplanation: project.emotional_explanation,
      instructions: project.instructions,
      estimatedTime: project.estimated_time,
      difficulty: project.difficulty,
      museumTitle: project.museum_title,
      museumDescription: project.museum_description,
      artifactMeaning: project.artifact_meaning,
      museumRoom: project.museum_room,
      materialsImageUrl: project.materials_image_url,
      createdAt: project.created_at,
    });
  } catch (err) {
    const { AuthError } = await import("@/lib/auth").catch(() => ({
      AuthError: class extends Error {},
    }));
    if (err instanceof AuthError) {
      return NextResponse.json({ error: (err as Error).message }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/projects/generate", message);
    return NextResponse.json(
      { error: "Project generation failed", detail: message },
      { status: 500 }
    );
  }
}
