import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend } from "@/lib/resend";

// This endpoint sends reminder emails for meetings happening tomorrow.
// Call it daily via a cron job (e.g., cron-job.org) or Vercel Cron.
export async function GET(request: NextRequest) {
  // Optional: require a secret key to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Find meetings happening between 24h and 48h from now
  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*, circles(name, slug), rsvps(user_id, profiles(email, full_name))")
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

      try {
        await getResend().emails.send({
          from: "Meek Meet <hello@meekmeet.com>",
          to: email,
          subject: `Reminder: ${(meeting as any).circles?.name} tomorrow`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf6ee; color: #2c2c2c;">
              <h1 style="font-size: 24px; margin-bottom: 8px;">Hello ${name},</h1>
              <p style="font-size: 16px; line-height: 1.6;">
                This is a gentle reminder that <strong>${(meeting as any).circles?.name}</strong> is gathering tomorrow.
              </p>
              <div style="background: #f5efe0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 4px;"><strong>Date:</strong> ${meetingDate}</p>
                <p style="margin: 0 0 4px;"><strong>Time:</strong> ${meetingTime}</p>
                ${meeting.location_name ? `<p style="margin: 0;"><strong>Location:</strong> ${meeting.location_name}</p>` : ""}
                ${meeting.location_address ? `<p style="margin: 4px 0 0;"><small>${meeting.location_address}</small></p>` : ""}
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
        console.error(`Failed to send email to ${email}:`, err);
      }
    }
  }

  return NextResponse.json({ sent, meetings: meetings.length });
}
