"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { createQuestion, updateQuestion, deleteQuestion, reorderQuestions } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, ArrowUp, ArrowDown, Check, X, Loader2 } from "lucide-react";

interface Props {
  params: Promise<{ circleId: string }>;
}

interface Question {
  id: string;
  content: string;
  order_index: number;
  is_active: boolean;
}

export default function QuestionsPage({ params }: Props) {
  const [circleId, setCircleId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const loadQuestions = useCallback(async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("circle_questions")
      .select("id, content, order_index, is_active")
      .eq("circle_id", id)
      .order("order_index", { ascending: true });

    if (error) {
      setError("Failed to load questions.");
    } else {
      setQuestions((data ?? []) as Question[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    params.then(({ circleId: id }) => {
      setCircleId(id);
      loadQuestions(id);
    });
  }, [params, loadQuestions]);

  const handleAdd = () => {
    if (!newQuestion.trim() || !circleId) return;
    setError(null);
    startTransition(async () => {
      try {
        await createQuestion(circleId, newQuestion);
        setNewQuestion("");
        await loadQuestions(circleId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add question");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!circleId) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteQuestion(id);
        await loadQuestions(circleId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete question");
      }
    });
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    if (!circleId) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    const reordered = newQuestions.map((q, i) => ({ ...q, order_index: i }));
    setQuestions(reordered);

    startTransition(async () => {
      try {
        await reorderQuestions(circleId, reordered.map((q) => q.id));
        await loadQuestions(circleId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reorder questions");
        await loadQuestions(circleId);
      }
    });
  };

  const handleToggleActive = (id: string) => {
    if (!circleId) return;
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    const nextActive = !question.is_active;
    setQuestions(questions.map((q) => (q.id === id ? { ...q, is_active: nextActive } : q)));

    startTransition(async () => {
      try {
        await updateQuestion(id, question.content, nextActive);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update question");
        await loadQuestions(circleId);
      }
    });
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditContent(q.content);
  };

  const saveEdit = (id: string) => {
    if (!circleId) return;
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    setError(null);
    startTransition(async () => {
      try {
        await updateQuestion(id, editContent, question.is_active);
        setEditingId(null);
        await loadQuestions(circleId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update question");
      }
    });
  };

  if (loading && questions.length === 0) {
    return (
      <div className="max-w-3xl">
        <h2 className="font-serif text-2xl text-charcoal mb-6">Circle Questions</h2>
        <div className="flex items-center gap-3 text-charcoal-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading questions...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="font-serif text-2xl text-charcoal mb-6">Circle Questions</h2>

      {error && (
        <div className="mb-6 p-4 bg-terracotta-pale rounded-xl text-terracotta text-sm">
          {error}
        </div>
      )}

      {/* Add new */}
      <div className="bg-cream-warm rounded-xl border border-border-soft p-5 mb-8">
        <label className="text-sm text-charcoal-light font-medium mb-2 block">
          Add a new question
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="e.g., What are you grateful for today?"
            className="flex-1 px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !circleId}
            className="px-5 py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className={`bg-cream-warm rounded-xl border p-5 transition-colors ${
              q.is_active ? "border-border-soft" : "border-border-soft opacity-60"
            }`}
          >
            {editingId === q.id ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 px-4 py-2 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm"
                  autoFocus
                />
                <button
                  onClick={() => saveEdit(q.id)}
                  className="p-2 text-sage hover:text-sage-dark transition-colors"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-2 text-charcoal-muted hover:text-charcoal transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-wheat-pale flex items-center justify-center text-sm font-medium text-wheat-dark">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p
                    className="text-charcoal font-serif text-lg cursor-pointer hover:text-terracotta transition-colors"
                    onClick={() => startEdit(q)}
                  >
                    {q.content}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0 || isPending}
                    className="p-2 text-charcoal-muted hover:text-charcoal transition-colors disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 1)}
                    disabled={index === questions.length - 1 || isPending}
                    className="p-2 text-charcoal-muted hover:text-charcoal transition-colors disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(q.id)}
                    disabled={isPending}
                    className={`p-2 transition-colors ${
                      q.is_active ? "text-sage hover:text-sage-dark" : "text-charcoal-muted hover:text-charcoal"
                    }`}
                    title={q.is_active ? "Active" : "Inactive"}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={isPending}
                    className="p-2 text-charcoal-muted hover:text-terracotta transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {questions.length === 0 && !loading && (
        <div className="text-center py-12 bg-cream-warm rounded-xl border border-border-soft">
          <p className="text-charcoal-muted">No questions yet. Add your first question above.</p>
        </div>
      )}
    </div>
  );
}
