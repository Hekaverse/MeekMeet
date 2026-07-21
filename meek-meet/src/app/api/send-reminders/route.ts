import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/validation";
import { isAuthorizedCron } from "@/lib/cron-auth";

// This endpoint sends reminder emails for meetings happening tomorrow.
// It runs with the Supabase service role so it can read across RLS boundaries.
// Trigger it daily via Vercel Cron (vercel.json) or an external scheduler.
export async function GET(request: NextRequest) {
  // Authorize via CRON_SECRET Bearer header (sent automatically by Vercel Cron).
  // The endpoint is idempotent; additional rate limiting can be added later.
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find meetings happening between 24h and 48h from now
  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*, circles(name, slug), rsvps(user_id, status, profiles(email, full_name))")
    .gte("scheduled_at", tomorrowStart.toISOString())
    .lte("scheduled_at", tomorrowEnd.toISOString())
    .eq("is_cancelled", false);

  if (!meetings || meetings.length === 0) {
    return NextResponse.json({ sent: 0, message: "No meetings tomorrow" });
  }

  let sent = 0;

  for (const meeting of meetings) {
    const goingRsvps =
      (meeting as any).rsvps?.filter((r: any) => r.status === "going") ?? [];

    for (const rsvp of goingRsvps) {
      const email = rsvp.profiles?.email;
      const name = rsvp.profiles?.full_name ?? "Friend";
      if (!email) continue;

      const meetingDate = new Date(meeting.scheduled_at).toLocaleDateString(
        "en-AU",
        {
          weekday: "long",
          month: "long",
          day: "numeric",
        }
      );
      const meetingTime = new Date(meeting.scheduled_at).toLocaleTimeString(
        "en-AU",
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );

      const safeName = escapeHtml(name);
      const safeCircleName = escapeHtml((meeting as any).circles?.name ?? "Your circle");
      const safeLocationName = escapeHtml(meeting.location_name ?? "");
      const safeLocationAddress = escapeHtml(meeting.location_address ?? "");

      try {
        await getResend().emails.send({
          from: "Meek Meet <hello@meekmeet.com>",
          to: email,
          subject: `Reminder: ${safeCircleName} tomorrow`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf6ee; color: #2c2c2c;">
              <h1 style="font-size: 24px; margin-bottom: 8px;">Hello ${safeName},</h1>
              <p style="font-size: 16px; line-height: 1.6;">
                This is a gentle reminder that <strong>${safeCircleName}</strong> is gathering tomorrow.
              </p>
              <div style="background: #f5efe0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 4px;"><strong>Date:</strong> ${meetingDate}</p>
                <p style="margin: 0 0 4px;"><strong>Time:</strong> ${meetingTime}</p>
                ${safeLocationName ? `<p style="margin: 0;"><strong>Location:</strong> ${safeLocationName}</p>` : ""}
                ${safeLocationAddress ? `<p style="margin: 4px 0 0;"><small>${safeLocationAddress}</small></p>` : ""}
              </div>
              <p style="font-size: 14px; color: #6b6b6b;">
                Blessed are the meek, for they shall inherit the earth.
              </p>
              <hr style="border: 0; border-top: 1px solid #e8e0cc; margin: 24px 0;" />
              <p style="font-size: 12px; color: #6b6b6b;">
                Meek Meet · A warm community of faith
              </p>
            </div>
          `,
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send email to user ${rsvp.user_id}:`, err);
      }
    }
  }

  return NextResponse.json({ sent, meetings: meetings.length });
}
