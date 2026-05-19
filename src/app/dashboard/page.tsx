import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Heart, ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch data in parallel
  const [
    { data: profile },
    { data: upcomingMeetings },
    { data: nearbyCircles },
    { data: myRsvps },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("meetings")
      .select("*, circles(name, slug)")
      .gte("scheduled_at", new Date().toISOString())
      .eq("is_cancelled", false)
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("circles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("rsvps")
      .select("*, meetings(*, circles(name, slug))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Extract unique circles from RSVPs
  const myCircles =
    myRsvps
      ?.map((r) => r.meetings?.circles)
      .filter(Boolean)
      .filter((c, i, arr) => arr.findIndex((t) => t?.id === c?.id) === i) ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="font-serif text-3xl text-charcoal mb-2">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-charcoal-muted">
          Your Meek Meet dashboard. Gatherings, circles, and connections.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-cream-warm rounded-2xl border border-border-soft p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-terracotta-pale flex items-center justify-center">
              <Heart className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
            </div>
            <span className="text-sm text-charcoal-muted">My Circles</span>
          </div>
          <p className="font-serif text-3xl text-charcoal">{myCircles.length}</p>
        </div>

        <div className="bg-cream-warm rounded-2xl border border-border-soft p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-wheat-pale flex items-center justify-center">
              <Calendar className="w-5 h-5 text-wheat-dark" strokeWidth={1.5} />
            </div>
            <span className="text-sm text-charcoal-muted">Upcoming</span>
          </div>
          <p className="font-serif text-3xl text-charcoal">
            {upcomingMeetings?.length ?? 0}
          </p>
        </div>

        <div className="bg-cream-warm rounded-2xl border border-border-soft p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sage-pale flex items-center justify-center">
              <MapPin className="w-5 h-5 text-sage-dark" strokeWidth={1.5} />
            </div>
            <span className="text-sm text-charcoal-muted">Nearby</span>
          </div>
          <p className="font-serif text-3xl text-charcoal">
            {nearbyCircles?.length ?? 0}
          </p>
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-charcoal">Upcoming Gatherings</h2>
          <Link
            href="/dashboard/meetings"
            className="text-sm text-terracotta hover:text-terracotta-light transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingMeetings && upcomingMeetings.length > 0 ? (
          <div className="space-y-4">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-cream-warm rounded-xl border border-border-soft p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-charcoal">
                    {meeting.circles?.name}
                  </p>
                  <p className="text-sm text-charcoal-muted mt-1">
                    {new Date(meeting.scheduled_at).toLocaleDateString("en-AU", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {meeting.location_name && (
                    <p className="text-xs text-charcoal-muted mt-1">
                      {meeting.location_name}
                    </p>
                  )}
                </div>
                <Link
                  href={`/circles/${meeting.circles?.slug}`}
                  className="px-5 py-2 bg-midnight text-cream text-sm rounded-full hover:bg-midnight-soft transition-all text-center"
                >
                  View Circle
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-cream-warm rounded-xl border border-border-soft p-8 text-center">
            <p className="text-charcoal-muted mb-2">No upcoming gatherings.</p>
            <Link
              href="/circles"
              className="text-sm text-terracotta hover:text-terracotta-light transition-colors"
            >
              Browse circles →
            </Link>
          </div>
        )}
      </div>

      {/* Nearby Circles */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-charcoal">Nearby Circles</h2>
          <Link
            href="/circles"
            className="text-sm text-terracotta hover:text-terracotta-light transition-colors flex items-center gap-1"
          >
            Browse all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {nearbyCircles && nearbyCircles.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {nearbyCircles.map((circle) => (
              <Link
                key={circle.id}
                href={`/circles/${circle.slug}`}
                className="bg-cream-warm rounded-xl border border-border-soft p-5 hover:border-terracotta/30 transition-colors"
              >
                <h3 className="font-serif text-lg text-charcoal mb-1">
                  {circle.name}
                </h3>
                <p className="text-sm text-charcoal-muted">{circle.location}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-cream-warm rounded-xl border border-border-soft p-8 text-center">
            <p className="text-charcoal-muted">No circles found nearby.</p>
          </div>
        )}
      </div>
    </div>
  );
}
