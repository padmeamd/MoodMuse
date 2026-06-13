import { NextResponse } from "next/server";
import { HALLS } from "@/types";
import { IS_DEMO, DEMO_USER_ID, demoDb } from "@/lib/demo";
import { HAS_SUPABASE, supabaseAdmin } from "@/lib/supabase";
import type { ArtifactRow } from "@/types";

export async function GET() {
  try {
    let allArtifacts: ArtifactRow[];

    if (HAS_SUPABASE && supabaseAdmin) {
      const userId = DEMO_USER_ID; // TODO: replace with real auth
      const { data, error } = await supabaseAdmin
        .from("artifacts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch museum", details: error.message },
          { status: 500 }
        );
      }
      allArtifacts = (data ?? []) as ArtifactRow[];
    } else {
      allArtifacts = demoDb.getAllArtifacts();
    }

    const halls = HALLS.map((hall) => ({
      key: hall.key,
      name: hall.name,
      emoji: hall.emoji,
      artifacts: allArtifacts
        .filter((a) => a.hall_key === hall.key)
        .map((a) => ({
          id: a.id,
          artifact_name: a.artifact_name,
          museum_title: a.museum_title,
          museum_description: a.museum_description,
          artifact_meaning: a.artifact_meaning,
          mood_key: a.mood_key,
          source_image_url: a.source_image_url,
          stylized_image_url: a.stylized_image_url,
          style_status: a.style_status,
          glb_url: a.glb_url,
          model_status: a.model_status,
          created_at: a.created_at,
        })),
    }));

    return NextResponse.json({ halls });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/museum", message);
    return NextResponse.json(
      { error: "Failed to load museum", details: message },
      { status: 500 }
    );
  }
}
