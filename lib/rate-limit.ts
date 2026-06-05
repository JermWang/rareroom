import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Distributed fixed-window rate limit backed by Postgres (works across
// serverless instances). Returns true when the request is allowed.
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  // Fail-open if the limiter isn't configured/available so legit traffic is
  // never blocked by an infra issue. (Configure SUPABASE_SERVICE_ROLE_KEY in prod.)
  if (!admin) return true;
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds
  });
  if (error) return true;
  return data === true;
}

// Builds a bucket key scoped to a route, preferring the user id, falling back to IP.
export function rateLimitKey(req: Request, scope: string, userId?: string | null): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `${scope}:${userId ?? ip}`;
}
