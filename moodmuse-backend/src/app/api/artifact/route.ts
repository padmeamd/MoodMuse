import { NextRequest, NextResponse } from "next/server";
import { IS_DEMO, DEMO_USER_ID, demoDb } from "@/lib/demo";
import { HAS_SUPABASE, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      moodKey,
      identity,
      sourceImageUrl,
    }: {
      projectId?: string;
      moodKey?: string;
      identity?: {
        artifact_name: string;
        museum_title: string;
        museum_description: string;
        artifact_meaning: string;
        hall_key: string;
      };
      sourceImageUrl?: string;
    } = body;

    if (!moodKey) {
      return NextResponse.json(
        { error: "Missing moodKey", details: "moodKey is required" },
        { status: 400 }
      );
    }

    if (!identity || !identity.museum_title || !identity.hall_key) {
      return NextResponse.json(
        { error: "Missing or incomplete identity", details: "identity with museum_title and hall_key is required" },
        { status: 400 }
      );
    }

    const userId = DEMO_USER_ID;

    const artifactData = {
      user_id: userId,
      project_id: projectId ?? null,
      mood_key: moodKey,
      hall_key: identity.hall_key,
      artifact_name: identity.artifact_name,
      museum_title: identity.museum_title,
      museum_description: identity.museum_description,
      artifact_meaning: identity.artifact_meaning,
      source_image_url: sourceImageUrl ?? null,
      glb_url: null,
      model_status: "pending" as const,
    };

    let artifactId: string;

    if (HAS_SUPABASE && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("artifacts")
        .insert(artifactData)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to save artifact", details: error.message },
          { status: 500 }
        );
      }
      artifactId = data.id;
    } else {
      const row = demoDb.insertArtifact(artifactData);
      artifactId = row.id;
    }

    return NextResponse.json({
      artifactId,
      status: "enshrined",
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/artifact", message);
    return NextResponse.json(
      { error: "Artifact creation failed", details: message },
      { status: 500 }
    );
  }
}
