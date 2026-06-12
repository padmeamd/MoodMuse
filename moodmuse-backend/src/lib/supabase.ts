import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Server-side admin client — bypasses RLS. Use only in trusted server code. */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Per-request client that forwards the user's auth token so RLS applies.
 * Call this inside route handlers / server actions.
 */
export async function supabaseForUser() {
  const hdrs = await headers();
  const authHeader = hdrs.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
