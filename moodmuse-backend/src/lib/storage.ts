import { supabaseAdmin } from "./supabase";
import { randomUUID } from "crypto";

/**
 * Upload a base64-encoded image to a Supabase Storage bucket.
 * Returns the public (or signed) URL.
 *
 * @param bucket   - "materials" | "creations"
 * @param userId   - owner, used as folder prefix for RLS
 * @param base64   - raw base64 string (no data-uri prefix) or data-uri
 */
export async function uploadImage(
  bucket: string,
  userId: string,
  base64: string
): Promise<string> {
  // Strip optional data-uri prefix
  const cleaned = base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleaned, "base64");

  // Detect mime from the original prefix, default to jpeg
  const mimeMatch = base64.match(/^data:(image\/\w+);base64,/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const ext = mime.split("/")[1] ?? "jpg";

  const path = `${userId}/${randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (error) {
    throw new Error(`Storage upload failed (${bucket}): ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
