import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only allow relative redirects to prevent open redirect attacks
function sanitizeRedirect(next: string | null): string {
  if (!next) return "/dashboard";

  // Reject absolute URLs and protocol-relative URLs
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(next) || next.startsWith("//")) {
    return "/dashboard";
  }

  // Ensure the path starts with /
  if (!next.startsWith("/")) {
    return "/dashboard";
  }

  // Reject paths that try to escape the origin (path traversal or double-slash)
  if (next.includes("\\") || next.startsWith("//") || /\/\.\./.test(next)) {
    return "/dashboard";
  }

  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
