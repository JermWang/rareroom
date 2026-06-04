import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");
  const rawNext = requestUrl.searchParams.get("next") ?? "/binder";
  const origin = requestUrl.origin;

  // Only allow internal redirects (no open-redirect via the `next` param).
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/binder";

  // The provider rejected or the user cancelled.
  if (oauthError) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(oauthError)}`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
