/**
 * Optional image-to-3D generation via Tripo AI (primary) or Meshy AI (fallback).
 *
 * Both follow the same pattern:
 *   1. POST image → receive job ID
 *   2. Poll job → receive .glb URL when done
 *
 * For the hackathon MVP we fire-and-forget: kick off the job, store the
 * job ID, and poll from a separate endpoint or cron.
 */

import { supabaseAdmin } from "./supabase";

// ---- Tripo AI -----------------------------------------------------------

interface TripoCreateResponse {
  data: { task_id: string };
}

interface TripoStatusResponse {
  data: {
    status: "running" | "success" | "failed";
    output?: { model: string };   // .glb download URL
  };
}

async function tripoCreate(imageUrl: string): Promise<string> {
  const res = await fetch("https://api.tripo3d.ai/v2/openapi/task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TRIPO_API_KEY}`,
    },
    body: JSON.stringify({ type: "image_to_model", file: { url: imageUrl } }),
  });

  if (!res.ok) throw new Error(`Tripo create failed: ${res.status}`);
  const json = (await res.json()) as TripoCreateResponse;
  return json.data.task_id;
}

async function tripoStatus(
  taskId: string
): Promise<{ status: string; glbUrl?: string }> {
  const res = await fetch(
    `https://api.tripo3d.ai/v2/openapi/task/${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TRIPO_API_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error(`Tripo status failed: ${res.status}`);
  const json = (await res.json()) as TripoStatusResponse;

  return {
    status: json.data.status,
    glbUrl: json.data.output?.model,
  };
}

// ---- Meshy AI (fallback) ------------------------------------------------

async function meshyCreate(imageUrl: string): Promise<string> {
  const res = await fetch(
    "https://api.meshy.ai/openapi/v2/image-to-3d",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
      },
      body: JSON.stringify({ image_url: imageUrl, enable_pbr: false }),
    }
  );

  if (!res.ok) throw new Error(`Meshy create failed: ${res.status}`);
  const json = await res.json();
  return json.result as string;  // task ID
}

async function meshyStatus(
  taskId: string
): Promise<{ status: string; glbUrl?: string }> {
  const res = await fetch(
    `https://api.meshy.ai/openapi/v2/image-to-3d/${taskId}`,
    {
      headers: { Authorization: `Bearer ${process.env.MESHY_API_KEY}` },
    }
  );

  if (!res.ok) throw new Error(`Meshy status failed: ${res.status}`);
  const json = await res.json();

  return {
    status: json.status,
    glbUrl: json.model_urls?.glb,
  };
}

// ---- Public API ---------------------------------------------------------

type Provider = "tripo" | "meshy";

function pickProvider(): Provider {
  if (process.env.TRIPO_API_KEY) return "tripo";
  if (process.env.MESHY_API_KEY) return "meshy";
  throw new Error("No 3D provider API key configured");
}

/** Kick off an image-to-3D job. Returns the external job ID. */
export async function startForgeJob(imageUrl: string): Promise<string> {
  const provider = pickProvider();
  if (provider === "tripo") return tripoCreate(imageUrl);
  return meshyCreate(imageUrl);
}

/** Check job status. Returns normalized status + optional glbUrl. */
export async function checkForgeJob(
  jobId: string
): Promise<{ status: "pending" | "complete" | "failed"; glbUrl?: string }> {
  const provider = pickProvider();
  const result =
    provider === "tripo"
      ? await tripoStatus(jobId)
      : await meshyStatus(jobId);

  if (result.status === "success" || result.status === "SUCCEEDED") {
    return { status: "complete", glbUrl: result.glbUrl };
  }
  if (result.status === "failed" || result.status === "FAILED") {
    return { status: "failed" };
  }
  return { status: "pending" };
}

/**
 * Poll a forge job and update the artifact row when done.
 * Called fire-and-forget from the artifact creation endpoint.
 */
export async function pollForgeJob(
  artifactId: string,
  jobId: string
): Promise<void> {
  const MAX_POLLS = 60;
  const INTERVAL_MS = 5_000;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, INTERVAL_MS));

    try {
      const result = await checkForgeJob(jobId);

      if (result.status === "complete" && result.glbUrl) {
        await supabaseAdmin
          .from("artifacts")
          .update({ model_3d_url: result.glbUrl, model_3d_status: "complete" })
          .eq("id", artifactId);
        return;
      }

      if (result.status === "failed") {
        await supabaseAdmin
          .from("artifacts")
          .update({ model_3d_status: "failed" })
          .eq("id", artifactId);
        return;
      }
    } catch {
      // Transient error — keep polling
    }
  }

  // Timed out
  await supabaseAdmin
    .from("artifacts")
    .update({ model_3d_status: "failed" })
    .eq("id", artifactId);
}
