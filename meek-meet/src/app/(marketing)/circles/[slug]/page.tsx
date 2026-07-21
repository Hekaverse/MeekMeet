import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapPin, Clock, Calendar, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import RsvpSection from "../_components/rsvp-section";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CircleDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch circle
  const { data: circle } = await supabase
    .from("circles")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!circle) {
    notFound();
  }

  // Fetch related data in parallel
  const [
    { data: questions },
    { data: routines },
    { data: meetings },
  ] = await Promise.all([
    supabase
      .from("circle_questions")
      .select("*")
      .eq("circle_id", circle.id)
      .eq("is_active", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("circle_routines")
      .select("*")
      .eq("circle_id", circle.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("public_meetings")
      .select("id, scheduled_at, duration_minutes, location_name, location_address")
      .eq("circle_id", circle.id)
      .eq("is_cancelled", false)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
  ]);

  // Fetch user RSVPs for these meetings
  let userRsvps: { meeting_id: string; status: string }[] = [];
  if (user && meetings && meetings.length > 0) {
    const { data: rsvps } = await supabase
      .from("rsvps")
      .select("meeting_id, status")
      .eq("user_id", user.id)
      .in(
        "meeting_id",
        meetings.map((m) => m.id)
      );
    userRsvps = rsvps ?? [];
  }

  const totalRoutineMinutes =
    (routines ?? []).reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0);

  return (
    <section className="min-h-screen pt-32 pb-20 bg-cream">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/circles"
            className="text-sm text-charcoal-muted hover:text-terracotta transition-colors"
          >
            ← All Circles
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
            Circle
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-4">
            {circle.name}
          </h1>
          <p className="text-lg text-charcoal-muted max-w-2xl">
            {circle.description || "A warm gathering under the new moon."}
          </p>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-6 mb-12 text-sm text-charcoal-muted">
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
            {circle.location}
          </span>
          {circle.meeting_place && (
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-wheat" strokeWidth={1.5} />
              {circle.meeting_place}
            </span>
          )}
          {circle.meeting_address && (
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sage" strokeWidth={1.5} />
              {circle.meeting_address}
            </span>
          )}
        </div>

        {/* Upcoming Meetings */}
        {meetings && meetings.length > 0 && (
          <div className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
              Upcoming Gatherings
            </h2>
            <RsvpSection
              meetings={meetings}
              userRsvps={
                userRsvps.map((r) => ({
                  meeting_id: r.meeting_id,
                  status: r.status as "going" | "maybe" | "not_going",
                }))
              }
              isAuthenticated={!!user}
            />
          </div>
        )}

        {/* Routine / Flow */}
        {routines && routines.length > 0 && (
          <div className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 flex items-center gap-3">
              <Clock className="w-5 h-5 text-wheat" strokeWidth={1.5} />
              The Flow
              {totalRoutineMinutes > 0 && (
                <span className="text-sm font-sans text-charcoal-muted font-normal">
                  (~{totalRoutineMinutes} min)
                </span>
              )}
            </h2>
            <div className="space-y-0">
              {routines.map((routine, i) => (
                <div
                  key={routine.id}
                  className="flex gap-4 py-4 border-b border-border-soft last:border-0"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wheat-pale flex items-center justify-center">
                    <span className="text-sm font-medium text-wheat-dark">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-charcoal">{routine.title}</h3>
                    {routine.description && (
                      <p className="text-sm text-charcoal-muted mt-1">
                        {routine.description}
                      </p>
                    )}
                    {routine.duration_minutes && (
                      <p className="text-xs text-charcoal-muted mt-1">
                        {routine.duration_minutes} min
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        {questions && questions.length > 0 && (
          <div className="mb-16">
            <h2 className="font-serif text-2xl text-charcoal mb-6 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-sage" strokeWidth={1.5} />
              Circle Questions
            </h2>
            <div className="space-y-4">
              {questions.map((question, i) => (
                <div
                  key={question.id}
                  className="bg-cream-warm rounded-xl border border-border-soft p-5"
                >
                  <span className="text-xs tracking-wider uppercase text-terracotta font-medium mb-2 block">
                    Question {i + 1}
                  </span>
                  <p className="text-charcoal font-serif text-lg">
                    {question.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-midnight rounded-3xl p-8 md:p-12 text-center">
          {user ? (
            <>
              <h2 className="font-serif text-2xl md:text-3xl text-cream mb-4">
                You're connected
              </h2>
              <p className="text-cream/60 max-w-md mx-auto mb-6">
                Head to your dashboard to see all your upcoming gatherings and circle updates.
              </p>
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-wheat text-midnight font-medium tracking-wide text-sm rounded-full hover:bg-wheat-light transition-all inline-block"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl md:text-3xl text-cream mb-4">
                Join this Circle
              </h2>
              <p className="text-cream/60 max-w-md mx-auto mb-6">
                Sign in to RSVP for upcoming gatherings and connect with your community.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="px-8 py-3 bg-wheat text-midnight font-medium tracking-wide text-sm rounded-full hover:bg-wheat-light transition-all"
                >
                  Sign In to RSVP
                </Link>
                <Link
                  href="/shepherd"
                  className="px-8 py-3 border-2 border-wheat/30 text-wheat font-medium tracking-wide text-sm rounded-full hover:border-wheat hover:text-wheat-light transition-all"
                >
                  Become a Shepherd
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
