import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Clock, Calendar, Settings, ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function ShepherdDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch circles this user shepherds
  const { data: myCircles } = await supabase
    .from("circles")
    .select("*")
    .eq("shepherd_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl text-charcoal mb-2">Shepherd Dashboard</h1>
      <p className="text-charcoal-muted mb-8">
        Manage your circles, questions, routine, and meetings.
      </p>

      {myCircles && myCircles.length > 0 ? (
        <div className="space-y-8">
          {myCircles.map((circle) => (
            <div
              key={circle.id}
              className="bg-cream-warm rounded-2xl border border-border-soft p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl text-charcoal">
                    {circle.name}
                  </h2>
                  <p className="text-sm text-charcoal-muted mt-1">
                    {circle.location}
                  </p>
                </div>
                <Link
                  href={`/circles/${circle.slug}`}
                  className="text-sm text-terracotta hover:text-terracotta-light transition-colors flex items-center gap-1"
                >
                  View public page <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href={`/dashboard/shepherd/${circle.id}/questions`}
                  className="bg-cream rounded-xl border border-border-soft p-5 hover:border-wheat/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-wheat-pale flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-wheat-dark" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-medium text-charcoal group-hover:text-terracotta transition-colors">
                      Questions
                    </h3>
                  </div>
                  <p className="text-sm text-charcoal-muted">
                    Edit the questions asked in your circle.
                  </p>
                </Link>

                <Link
                  href={`/dashboard/shepherd/${circle.id}/routine`}
                  className="bg-cream rounded-xl border border-border-soft p-5 hover:border-wheat/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-terracotta-pale flex items-center justify-center">
                      <Clock className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-medium text-charcoal group-hover:text-terracotta transition-colors">
                      Routine
                    </h3>
                  </div>
                  <p className="text-sm text-charcoal-muted">
                    Define the flow and structure of your gatherings.
                  </p>
                </Link>

                <Link
                  href={`/dashboard/shepherd/${circle.id}/meetings`}
                  className="bg-cream rounded-xl border border-border-soft p-5 hover:border-wheat/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sage-pale flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-sage-dark" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-medium text-charcoal group-hover:text-terracotta transition-colors">
                      Meetings
                    </h3>
                  </div>
                  <p className="text-sm text-charcoal-muted">
                    Schedule times, locations, and manage RSVPs.
                  </p>
                </Link>

                <Link
                  href={`/dashboard/shepherd/${circle.id}/settings`}
                  className="bg-cream rounded-xl border border-border-soft p-5 hover:border-wheat/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-pale flex items-center justify-center">
                      <Settings className="w-5 h-5 text-sky-soft" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-medium text-charcoal group-hover:text-terracotta transition-colors">
                      Settings
                    </h3>
                  </div>
                  <p className="text-sm text-charcoal-muted">
                    Update your circle name, description, and image.
                  </p>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-cream-warm rounded-2xl border border-border-soft p-12 text-center">
          <p className="text-charcoal-muted mb-4">
            You are not shepherding any circles yet.
          </p>
          <Link
            href="/shepherd"
            className="px-6 py-3 bg-midnight text-cream text-sm rounded-full hover:bg-midnight-soft transition-all inline-block"
          >
            Apply to Become a Shepherd
          </Link>
        </div>
      )}
    </div>
  );
}
