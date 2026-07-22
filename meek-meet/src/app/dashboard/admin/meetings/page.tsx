import { createClient } from "@/lib/supabase/server";
import { Calendar, MapPin } from "lucide-react";

const statusStyles: Record<string, string> = {
  scheduled: "bg-wheat-pale text-wheat-dark",
  live: "bg-sage-pale text-sage-dark",
  completed: "bg-sage-pale text-sage-dark",
};

export default async function AdminMeetingsPage() {
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, scheduled_at, status, is_cancelled, circles(name)")
    .order("scheduled_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal mb-2">Meetings</h1>
      <p className="text-charcoal-muted mb-8">
        The 50 most recent gatherings across all circles.
      </p>

      {!meetings || meetings.length === 0 ? (
        <div className="text-center py-20 bg-cream-warm rounded-2xl border border-border-soft">
          <p className="text-charcoal-muted">No meetings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => {
            const status = meeting.is_cancelled ? "cancelled" : meeting.status;
            return (
              <div
                key={meeting.id}
                className="bg-cream-warm rounded-2xl border border-border-soft p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusStyles[status] ?? "bg-terracotta-pale text-terracotta"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-charcoal font-medium">
                      <MapPin className="w-4 h-4 text-sage" strokeWidth={1.5} />
                      {(meeting.circles as any)?.name ?? "No circle"}
                    </span>
                  </div>
                  <span className="flex items-center gap-2 text-sm text-charcoal-muted">
                    <Calendar className="w-4 h-4 text-wheat-dark" strokeWidth={1.5} />
                    {new Date(meeting.scheduled_at).toLocaleString("en-AU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
