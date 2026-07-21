import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default async function MyCirclesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("*, meetings(circle_id, circles(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Extract unique circles from RSVPs
  const circleMap = new Map();
  rsvps?.forEach((r) => {
    const circle = r.meetings?.circles;
    if (circle && !circleMap.has(circle.id)) {
      circleMap.set(circle.id, circle);
    }
  });
  const myCircles = Array.from(circleMap.values());

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl text-charcoal mb-2">My Circles</h1>
      <p className="text-charcoal-muted mb-8">
        Circles you have connected with through RSVPs.
      </p>

      {myCircles.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {myCircles.map((circle) => (
            <Link
              key={circle.id}
              href={`/circles/${circle.slug}`}
              className="bg-cream-warm rounded-xl border border-border-soft p-6 hover:border-terracotta/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-terracotta-pale flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-charcoal mb-1">
                    {circle.name}
                  </h3>
                  <p className="text-sm text-charcoal-muted">{circle.location}</p>
                  {circle.meeting_place && (
                    <p className="text-xs text-charcoal-muted mt-1">
                      {circle.meeting_place}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-cream-warm rounded-xl border border-border-soft p-12 text-center">
          <p className="text-charcoal-muted mb-4">
            You have not joined any circles yet.
          </p>
          <Link
            href="/circles"
            className="px-6 py-3 bg-midnight text-cream text-sm rounded-full hover:bg-midnight-soft transition-all inline-block"
          >
            Discover Circles
          </Link>
        </div>
      )}
    </div>
  );
}
