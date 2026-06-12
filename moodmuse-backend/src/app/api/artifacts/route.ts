import { NextRequest, NextResponse } from "next/server";
import { IS_DEMO, demoDb } from "@/lib/demo";
import type { CreateArtifactBody } from "@/types";

// ---- POST /api/artifacts — enshrine a finished creation -----------------

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateArtifactBody;

    if (!body.project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    if (!body.imageBase64 && !body.imageUrl) {
      return NextResponse.json({ error: "Provide imageBase64 or imageUrl" }, { status: 400 });
    }

    if (IS_DEMO) {
      const project = demoDb.getProject(body.project_id);
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      await new Promise((r) => setTimeout(r, 800));

      const artifact = demoDb.insertArtifact({
        user_id: "demo-user",
        project_id: project.id,
        mood: project.mood,
        artifact_name: project.museum_title,
        final_image_url: null,
        model_3d_url: null,
        model_3d_status: "none",
        museum_room: project.museum_room,
        museum_description: project.museum_description,
      });

      return NextResponse.json({
        artifactId: artifact.id,
        projectId: artifact.project_id,
        mood: artifact.mood,
        artifactName: artifact.artifact_name,
        finalImageUrl: artifact.final_image_url,
        model3dStatus: artifact.model_3d_status,
        museumRoom: artifact.museum_room,
        museumDescription: artifact.museum_description,
        createdAt: artifact.created_at,
      });
    }

    // ---- Live mode --------------------------------------------------------
    const { requireUser } = await import("@/lib/auth");
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { uploadImage } = await import("@/lib/storage");
    const { startForgeJob, pollForgeJob } = await import("@/lib/forge3d");

    const userId = await requireUser();

    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", body.project_id)
      .eq("user_id", userId)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let finalImageUrl = body.imageUrl ?? "";
    if (body.imageBase64) {
      finalImageUrl = await uploadImage("creations", userId, body.imageBase64);
    }

    const { data: artifact, error: dbErr } = await supabaseAdmin
      .from("artifacts")
      .insert({
        user_id: userId,
        project_id: project.id,
        mood: project.mood,
        artifact_name: project.museum_title,
        final_image_url: finalImageUrl,
        museum_room: project.museum_room,
        museum_description: project.museum_description,
        model_3d_status: body.generate_3d ? "pending" : "none",
      })
      .select()
      .single();

    if (dbErr || !artifact) {
      return NextResponse.json(
        { error: "Failed to save artifact", detail: dbErr?.message },
        { status: 500 }
      );
    }

    if (body.generate_3d && finalImageUrl) {
      try {
        const jobId = await startForgeJob(finalImageUrl);
        await supabaseAdmin
          .from("artifacts")
          .update({ model_3d_job_id: jobId })
          .eq("id", artifact.id);
        pollForgeJob(artifact.id, jobId).catch(console.error);
      } catch (err) {
        console.error("3D forge kickoff failed:", err);
        await supabaseAdmin
          .from("artifacts")
          .update({ model_3d_status: "failed" })
          .eq("id", artifact.id);
      }
    }

    return NextResponse.json({
      artifactId: artifact.id,
      projectId: artifact.project_id,
      mood: artifact.mood,
      artifactName: artifact.artifact_name,
      finalImageUrl: artifact.final_image_url,
      model3dStatus: artifact.model_3d_status,
      museumRoom: artifact.museum_room,
      museumDescription: artifact.museum_description,
      createdAt: artifact.created_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("POST /api/artifacts", message);
    return NextResponse.json(
      { error: "Artifact creation failed", detail: message },
      { status: 500 }
    );
  }
}

// ---- GET /api/artifacts — list user's artifacts -------------------------

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const mood = url.searchParams.get("mood") ?? undefined;
    const room = url.searchParams.get("museum_room") ?? undefined;

    if (IS_DEMO) {
      const data = demoDb.getArtifacts({ mood, museum_room: room });
      return NextResponse.json(
        data.map((a) => ({
          artifactId: a.id,
          projectId: a.project_id,
          mood: a.mood,
          artifactName: a.artifact_name,
          finalImageUrl: a.final_image_url,
          model3dUrl: a.model_3d_url,
          model3dStatus: a.model_3d_status,
          museumRoom: a.museum_room,
          museumDescription: a.museum_description,
          createdAt: a.created_at,
        }))
      );
    }

    const { requireUser } = await import("@/lib/auth");
    const { supabaseAdmin } = await import("@/lib/supabase");

    const userId = await requireUser();

    let query = supabaseAdmin
      .from("artifacts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (mood) query = query.eq("mood", mood);
    if (room) query = query.eq("museum_room", room);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch artifacts", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      (data ?? []).map((a) => ({
        artifactId: a.id,
        projectId: a.project_id,
        mood: a.mood,
        artifactName: a.artifact_name,
        finalImageUrl: a.final_image_url,
        model3dUrl: a.model_3d_url,
        model3dStatus: a.model_3d_status,
        museumRoom: a.museum_room,
        museumDescription: a.museum_description,
        createdAt: a.created_at,
      }))
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
