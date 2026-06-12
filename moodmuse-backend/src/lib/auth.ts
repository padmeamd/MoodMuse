import { supabaseForUser } from "./supabase";

/**
 * Extracts and verifies the authenticated user from the request's
 * Authorization header. Returns the user id or throws.
 */
export async function requireUser(): Promise<string> {
  const supabase = await supabaseForUser();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Unauthorized — valid Bearer token required");
  }
  return user.id;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
