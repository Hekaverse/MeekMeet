import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar } from "lucide-react";

export const revalidate = 60;

export default async function MeetingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*, circles(name, slug)")
    .gte("scheduled_at", new Date().toISOString())
    .eq("is_cancelled", false)
    .order("scheduled_at", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl text-charcoal mb-2">My Meetings</h1>
      <p className="text-charcoal-muted mb-8">
        All upcoming gatherings across your circles.
      </p>

      {meetings && meetings.length > 0 ? (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-cream-warm rounded-xl border border-border-soft p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-wheat-pale flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-wheat-dark" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-charcoal">
                    {meeting.circles?.name}
                  </p>
                  <p className="text-sm text-charcoal-muted mt-1">
                    {new Date(meeting.scheduled_at).toLocaleDateString("en-AU", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-charcoal-muted">
                    {new Date(meeting.scheduled_at).toLocaleTimeString("en-AU", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {meeting.duration_minutes && ` · ${meeting.duration_minutes} min`}
                  </p>
                  {meeting.location_name && (
                    <p className="text-xs text-charcoal-muted mt-1">
                      {meeting.location_name}
                    </p>
                  )}
                </div>
              </div>
              <Link
                href={`/circles/${meeting.circles?.slug}`}
                className="px-6 py-2.5 bg-midnight text-cream text-sm rounded-full hover:bg-midnight-soft transition-all text-center"
              >
                View Circle
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-cream-warm rounded-xl border border-border-soft p-12 text-center">
          <p className="text-charcoal-muted mb-4">
            No upcoming gatherings found.
          </p>
          <Link
            href="/circles"
            className="px-6 py-3 bg-midnight text-cream text-sm rounded-full hover:bg-midnight-soft transition-all inline-block"
          >
            Find a Circle
          </Link>
        </div>
      )}
    </div>
  );
}
