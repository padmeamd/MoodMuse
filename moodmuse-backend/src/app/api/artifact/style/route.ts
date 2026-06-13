import { NextRequest, NextResponse } from "next/server";
import { demoDb } from "@/lib/demo";
import { HAS_SUPABASE, supabaseAdmin } from "@/lib/supabase";
import { renderArtifactCard } from "@/lib/stylize";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artifactId, originalImageBase64, moodKey, artifactName, museumDescription } = body as {
      artifactId?: string;
      originalImageBase64?: string;
      moodKey?: string;
      artifactName?: string;
      museumDescription?: string;
    };

    if (!artifactId) {
      return NextResponse.json({ error: "Missing artifactId" }, { status: 400 });
    }
    if (!originalImageBase64) {
      return NextResponse.json({ error: "Missing originalImageBase64" }, { status: 400 });
    }
    if (!moodKey) {
      return NextResponse.json({ error: "Missing moodKey" }, { status: 400 });
    }

    // Simulate forging delay
    await new Promise((r) => setTimeout(r, 2000));

    // Render the card with the user's actual uploaded photo
    const stylizedImageUrl = renderArtifactCard({
      imageBase64: originalImageBase64,
      artifactName: artifactName || "Artifact",
      moodKey,
      museumDescription,
    });

    // Update artifact record
    if (HAS_SUPABASE && supabaseAdmin) {
      await supabaseAdmin
        .from("artifacts")
        .update({ stylized_image_url: stylizedImageUrl, style_status: "complete" })
        .eq("id", artifactId);
    } else {
      demoDb.updateArtifact(artifactId, {
        stylized_image_url: stylizedImageUrl,
        style_status: "complete",
      });
    }

    return NextResponse.json({ artifactId, stylizedImageUrl, styleStatus: "complete" });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/artifact/style", message);
    return NextResponse.json({ error: "Stylization failed", details: message }, { status: 500 });
  }
}
