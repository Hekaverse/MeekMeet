import { createClient } from "@/lib/supabase/server";
import { User, Mail } from "lucide-react";
import StatusToggleButton from "./_components/status-toggle-button";

export default async function AdminInboxPage() {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("admin_messages")
    .select("id, name, email, subject, message, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal mb-2">Inbox</h1>
      <p className="text-charcoal-muted mb-8">
        Messages sent to the Meek Meet team.
      </p>

      {!messages || messages.length === 0 ? (
        <div className="text-center py-20 bg-cream-warm rounded-2xl border border-border-soft">
          <p className="text-charcoal-muted">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-cream-warm rounded-2xl border border-border-soft p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        msg.status === "resolved"
                          ? "bg-sage-pale text-sage-dark"
                          : "bg-wheat-pale text-wheat-dark"
                      }`}
                    >
                      {msg.status === "resolved" ? "Resolved" : "Open"}
                    </span>
                    <span className="text-xs text-charcoal-muted">
                      {new Date(msg.created_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="font-medium text-charcoal">{msg.subject}</h3>
                  <p className="text-sm text-charcoal whitespace-pre-wrap">{msg.message}</p>

                  <div className="flex flex-wrap gap-4 pt-3 border-t border-border-soft">
                    <span className="flex items-center gap-2 text-sm text-charcoal">
                      <User className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                      {msg.name}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-charcoal">
                      <Mail className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                      {msg.email}
                    </span>
                  </div>
                </div>

                <StatusToggleButton messageId={msg.id} status={msg.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
