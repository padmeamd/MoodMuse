import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const HAS_SUPABASE = !!(supabaseUrl && supabaseServiceKey);

/** Server-side admin client — bypasses RLS. Only available when Supabase is configured. */
export const supabaseAdmin: SupabaseClient | null = HAS_SUPABASE
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
