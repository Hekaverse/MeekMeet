import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCron } from "@/lib/cron-auth";

// This endpoint runs daily via Vercel Cron to advance the meeting lifecycle:
// 1. Mark past meetings as completed (which triggers synthesis).
// 2. Generate circle insights for circles with newly completed meetings.
// 3. Generate next-questions for circles with fresh insights.
// 4. Generate draft circle reports once per calendar month.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const results = {
    completed: 0,
    insightsGenerated: 0,
    questionsGenerated: 0,
    reportsGenerated: 0,
    errors: [] as string[],
  };

  try {
    // 1. Complete past meetings
    const { data: pastMeetings, error: pastError } = await supabase
      .from("meetings")
      .select("id, circle_id, scheduled_at, duration_minutes, status")
      .lt("scheduled_at", now)
      .in("status", ["scheduled", "live"])
      .eq("is_cancelled", false);

    if (pastError) throw pastError;

    const completedIds: string[] = [];
    for (const meeting of pastMeetings ?? []) {
      const endTime = new Date(
        new Date(meeting.scheduled_at).getTime() + (meeting.duration_minutes ?? 120) * 60000
      );
      if (endTime < new Date()) {
        completedIds.push(meeting.id);
      }
    }

    if (completedIds.length > 0) {
      const { error: updateError } = await supabase
        .from("meetings")
        .update({ status: "completed", ended_at: now })
        .in("id", completedIds);

      if (updateError) throw updateError;
      results.completed = completedIds.length;
    }

    // 2. Generate circle insights for circles with completed meetings
    const { data: circleIds, error: circleError } = await supabase
      .from("meetings")
      .select("circle_id")
      .eq("status", "completed")
      .not("circle_id", "is", null);

    if (circleError) throw circleError;

    const uniqueCircleIds = Array.from(new Set((circleIds ?? []).map((m) => m.circle_id)));

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
      /https:\/\/([^.]+)\.supabase\.co/
    )?.[1];

    if (projectRef && process.env.SUPABASE_SECRET_KEY) {
      for (const circleId of uniqueCircleIds) {
        if (!circleId) continue;
        try {
          // Generate all-time insight
          const res = await fetch(
            `https://${projectRef}.supabase.co/functions/v1/synthesize-circle`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ circle_id: circleId, time_window: "all_time" }),
            }
          );
          if (res.ok) results.insightsGenerated++;
          else results.errors.push(`synthesize-circle ${circleId}: ${res.status}`);
        } catch (err) {
          results.errors.push(`synthesize-circle ${circleId}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }

      // 3. Generate next-questions for circles with insights
      for (const circleId of uniqueCircleIds) {
        if (!circleId) continue;
        try {
          const { data: insight } = await supabase
            .from("circle_insights")
            .select("id")
            .eq("circle_id", circleId)
            .eq("time_window", "all_time")
            .single();

          if (!insight) continue;

          const res = await fetch(
            `https://${projectRef}.supabase.co/functions/v1/generate-next-questions`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ circle_id: circleId, insight_id: insight.id }),
            }
          );
          if (res.ok) results.questionsGenerated++;
          else results.errors.push(`generate-next-questions ${circleId}: ${res.status}`);
        } catch (err) {
          results.errors.push(`generate-next-questions ${circleId}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }
    }

    // 4. Generate draft reports once per month for active circles
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const today = new Date();

    if (today.getDate() === 1) {
      for (const circleId of uniqueCircleIds) {
        if (!circleId) continue;
        try {
          const { data: existing } = await supabase
            .from("reports")
            .select("id")
            .eq("circle_id", circleId)
            .eq("report_type", "circle")
            .gte("generated_at", firstOfMonth.toISOString())
            .maybeSingle();

          if (existing) continue;

          const { data: circle } = await supabase
            .from("circles")
            .select("name, location")
            .eq("id", circleId)
            .single();

          const { data: insight } = await supabase
            .from("circle_insights")
            .select("*")
            .eq("circle_id", circleId)
            .eq("time_window", "all_time")
            .single();

          if (!insight) continue;

          await supabase.from("reports").insert({
            report_type: "circle",
            circle_id: circleId,
            title: `Monthly Circle Report: ${circle?.name ?? "Unnamed Circle"}`,
            summary: insight.raw_summary ?? "",
            content: {
              responseCount: insight.response_count ?? 0,
              meetingCount: insight.meeting_count ?? 0,
              timeWindow: "all_time",
              topThemes: insight.top_themes ?? [],
              sentimentSummary: insight.sentiment_summary ?? {},
              consensusItems: insight.consensus_items ?? [],
              anonymisedQuotes: insight.anonymised_quotes ?? [],
              rawSummary: insight.raw_summary ?? "",
            },
            status: "draft",
          });
          results.reportsGenerated++;
        } catch (err) {
          results.errors.push(`report ${circleId}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("meeting-lifecycle error:", err);
    return NextResponse.json(
      { error: "Internal error", results },
      { status: 500 }
    );
  }
}
