import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Statically cacheable: this handler takes no request input, so `revalidate`
// gives it true ISR. The only caller is /voice, which reads global + regional
// aggregates for the all_time window.
export const revalidate = 300;

export async function GET() {
  // These aggregate tables have public SELECT policies, so an anon client is
  // sufficient — no need for the service role on a public endpoint.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  try {
    const [{ data: global }, { data: regional }] = await Promise.all([
      supabase
        .from("global_insights")
        .select("*")
        .eq("time_window", "all_time")
        .order("generated_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("regional_insights")
        .select("*")
        .eq("time_window", "all_time")
        .order("response_count", { ascending: false })
        .limit(50),
    ]);

    return NextResponse.json({
      global: global ?? null,
      regional: regional ?? [],
      meta: {
        time_window: "all_time",
        generated_at: new Date().toISOString(),
        note: "All data is anonymised and aggregated. No individual responses are exposed.",
      },
    });
  } catch (err) {
    console.error("public insights error:", err);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
