import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";

// This endpoint is called by Vercel Cron to trigger the
// generate-news-questions Supabase Edge Function daily.
export async function GET(request: NextRequest) {
  // Authorize via CRON_SECRET Bearer header (sent automatically by Vercel Cron).
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
    /https:\/\/([^.]+)\.supabase\.co/
  )?.[1];

  if (!projectRef) {
    return NextResponse.json(
      { error: "Could not determine Supabase project ref" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://${projectRef}.supabase.co/functions/v1/generate-news-questions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Edge function error:", payload);
      return NextResponse.json(
        { error: "Edge function failed", details: payload },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, ...payload });
  } catch (err) {
    console.error("Failed to trigger news questions:", err);
    return NextResponse.json(
      { error: "Failed to trigger news questions" },
      { status: 500 }
    );
  }
}
