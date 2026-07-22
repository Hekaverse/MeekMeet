import { createClient } from "@/lib/supabase/server";
import { User, Mail, MapPin } from "lucide-react";

export default async function AdminShepherdsPage() {
  const supabase = await createClient();

  const [{ data: shepherds }, { data: links }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "shepherd")
      .order("created_at", { ascending: false }),
    supabase.from("circle_shepherds").select("user_id, circles(name)"),
  ]);

  const circlesByUser = new Map<string, string[]>();
  for (const link of links ?? []) {
    const name = (link.circles as any)?.name;
    if (!name) continue;
    const list = circlesByUser.get(link.user_id) ?? [];
    list.push(name);
    circlesByUser.set(link.user_id, list);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal mb-2">Shepherds</h1>
      <p className="text-charcoal-muted mb-8">
        Everyone currently leading circles in the community.
      </p>

      {!shepherds || shepherds.length === 0 ? (
        <div className="text-center py-20 bg-cream-warm rounded-2xl border border-border-soft">
          <p className="text-charcoal-muted">No shepherds yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shepherds.map((shepherd) => {
            const circles = circlesByUser.get(shepherd.id) ?? [];
            return (
              <div
                key={shepherd.id}
                className="bg-cream-warm rounded-2xl border border-border-soft p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                      <span className="text-sm text-charcoal font-medium">
                        {shepherd.full_name ?? "Unnamed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                      <span className="text-sm text-charcoal">{shepherd.email ?? "—"}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-sage mt-0.5" strokeWidth={1.5} />
                    <div className="text-sm text-charcoal">
                      {circles.length > 0 ? (
                        circles.map((name) => (
                          <span
                            key={name}
                            className="inline-block mr-2 mb-1 px-3 py-1 rounded-full bg-sage-pale text-sage-dark text-xs font-medium"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-charcoal-muted">No circles</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
