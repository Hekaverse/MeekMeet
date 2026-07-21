"use server";

import { createClient } from "@/lib/supabase/server";

export interface ReportContent {
  responseCount: number;
  meetingCount: number;
  timeWindow: string;
  topThemes: Array<{
    theme: string;
    count: number;
    sentiment: string;
    sampleQuotes: string[];
  }>;
  sentimentSummary: {
    positive: number;
    neutral: number;
    negative: number;
    dominant: string;
  };
  consensusItems: Array<{
    statement: string;
    agreementLevel: number;
    evidence: string;
  }>;
  anonymisedQuotes: string[];
  rawSummary: string;
}

export interface CircleReport {
  id: string;
  circleName: string;
  circleLocation: string;
  generatedAt: string;
  content: ReportContent;
}

export async function generateCircleReport(
  circleId: string,
  timeWindow: "last_30_days" | "last_90_days" | "all_time" = "all_time"
): Promise<CircleReport> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify shepherd
  const { data: shepherd } = await supabase
    .from("circle_shepherds")
    .select("id")
    .eq("circle_id", circleId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shepherd) throw new Error("You are not a shepherd of this circle");

  // Fetch circle
  const { data: circle, error: circleError } = await supabase
    .from("circles")
    .select("name, location")
    .eq("id", circleId)
    .single();

  if (circleError || !circle) throw new Error("Circle not found");

  // Fetch or generate insight
  let { data: insight } = await supabase
    .from("circle_insights")
    .select("*")
    .eq("circle_id", circleId)
    .eq("time_window", timeWindow)
    .single();

  if (!insight) {
    // Trigger synthesis and wait briefly
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
      /https:\/\/([^.]+)\.supabase\.co/
    )?.[1];
    if (projectRef && process.env.SUPABASE_SECRET_KEY) {
      await fetch(
        `https://${projectRef}.supabase.co/functions/v1/synthesize-circle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ circle_id: circleId, time_window: timeWindow }),
        }
      );
      // Re-fetch
      const { data: fresh } = await supabase
        .from("circle_insights")
        .select("*")
        .eq("circle_id", circleId)
        .eq("time_window", timeWindow)
        .single();
      insight = fresh;
    }
  }

  if (!insight) {
    throw new Error("No insights available for this circle yet. Complete a meeting first.");
  }

  const content: ReportContent = {
    responseCount: insight.response_count ?? 0,
    meetingCount: insight.meeting_count ?? 0,
    timeWindow,
    topThemes: (insight.top_themes ?? []) as ReportContent["topThemes"],
    sentimentSummary: (insight.sentiment_summary ?? {
      positive: 0,
      neutral: 0,
      negative: 0,
      dominant: "neutral",
    }) as ReportContent["sentimentSummary"],
    consensusItems: (insight.consensus_items ?? []) as ReportContent["consensusItems"],
    anonymisedQuotes: (insight.anonymised_quotes ?? []) as string[],
    rawSummary: insight.raw_summary ?? "",
  };

  // Store report
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      report_type: "circle",
      circle_id: circleId,
      title: `Circle Report: ${circle.name}`,
      summary: content.rawSummary,
      content,
      generated_by: user.id,
      status: "draft",
    })
    .select("id, generated_at")
    .single();

  if (reportError || !report) throw new Error("Failed to save report");

  return {
    id: report.id,
    circleName: circle.name,
    circleLocation: circle.location ?? "Unknown location",
    generatedAt: report.generated_at,
    content,
  };
}
