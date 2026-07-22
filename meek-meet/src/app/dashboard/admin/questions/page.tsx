import { createClient } from "@/lib/supabase/server";
import { HelpCircle, Calendar, Clock } from "lucide-react";

export default async function AdminQuestionsPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("news_questions")
    .select("id, question, context, category, generated_at, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("generated_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal mb-2">News Questions</h1>
      <p className="text-charcoal-muted mb-8">
        Fresh discussion questions generated from current events.
      </p>

      {!questions || questions.length === 0 ? (
        <div className="text-center py-20 bg-cream-warm rounded-2xl border border-border-soft">
          <p className="text-charcoal-muted">No active questions right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-cream-warm rounded-2xl border border-border-soft p-6"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {q.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-terracotta-pale text-terracotta capitalize">
                      {q.category}
                    </span>
                  )}
                </div>

                <p className="font-serif text-lg text-charcoal flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-wheat-dark mt-1 flex-shrink-0" strokeWidth={1.5} />
                  {q.question}
                </p>

                {q.context && (
                  <p className="text-sm text-charcoal-muted">{q.context}</p>
                )}

                <div className="flex flex-wrap gap-4 pt-3 border-t border-border-soft text-xs text-charcoal-muted">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-sage" strokeWidth={1.5} />
                    Generated{" "}
                    {new Date(q.generated_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-terracotta" strokeWidth={1.5} />
                    Expires{" "}
                    {new Date(q.expires_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
