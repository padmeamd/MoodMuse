import { NextResponse } from "next/server";
import { IS_DEMO, demoDb } from "@/lib/demo";

const ROOMS = [
  { name: "Hall of Nostalgia", emoji: "🌙", moods: ["nostalgic", "reflective", "lonely"] },
  { name: "Hall of Dreams", emoji: "✨", moods: ["hopeful", "inspired", "creative"] },
  { name: "Hall of Healing", emoji: "🌊", moods: ["healing", "overwhelmed"] },
  { name: "Hall of Ambition", emoji: "🔥", moods: ["ambitious"] },
  { name: "Hall of Curiosity", emoji: "🎭", moods: ["curious"] },
];

export async function GET() {
  try {
    let allArtifacts: {
      id: string;
      artifact_name: string;
      mood: string;
      final_image_url: string | null;
      model_3d_url: string | null;
      model_3d_status: string;
      museum_room: string;
      museum_description: string;
      created_at: string;
    }[];

    if (IS_DEMO) {
      allArtifacts = demoDb.getAllArtifacts();
    } else {
      const { requireUser } = await import("@/lib/auth");
      const { supabaseAdmin } = await import("@/lib/supabase");

      const userId = await requireUser();

      const { data, error } = await supabaseAdmin
        .from("artifacts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch museum", detail: error.message },
          { status: 500 }
        );
      }
      allArtifacts = data ?? [];
    }

    const rooms = ROOMS.map((room) => ({
      name: room.name,
      emoji: room.emoji,
      moods: room.moods,
      artifacts: allArtifacts
        .filter((a) => a.museum_room === room.name)
        .map((a) => ({
          artifactId: a.id,
          artifactName: a.artifact_name,
          mood: a.mood,
          finalImageUrl: a.final_image_url,
          model3dUrl: a.model_3d_url,
          model3dStatus: a.model_3d_status,
          museumDescription: a.museum_description,
          createdAt: a.created_at,
        })),
    }));

    return NextResponse.json({ rooms });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
