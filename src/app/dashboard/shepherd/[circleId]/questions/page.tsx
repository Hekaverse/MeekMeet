"use client";

import { useState, useTransition } from "react";
import { createQuestion, updateQuestion, deleteQuestion, reorderQuestions } from "../actions";
import { Plus, Trash2, ArrowUp, ArrowDown, Check, X, Loader2 } from "lucide-react";

interface Props {
  params: Promise<{ circleId: string }>;
}

export default function QuestionsPage({ params }: Props) {
  // Note: In a real app we'd fetch via parent layout or useSWR
  // For now this is a placeholder showing the UI structure
  const [questions, setQuestions] = useState([
    { id: "1", content: "What burden are you carrying that you long to lay down?", order_index: 0, is_active: true },
    { id: "2", content: "Where have you seen God's faithfulness this month?", order_index: 1, is_active: true },
    { id: "3", content: "What does it mean to you to inherit the earth?", order_index: 2, is_active: true },
  ]);
  const [newQuestion, setNewQuestion] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!newQuestion.trim()) return;
    startTransition(async () => {
      // await createQuestion(circleId, newQuestion);
      setQuestions([...questions, { id: Date.now().toString(), content: newQuestion, order_index: questions.length, is_active: true }]);
      setNewQuestion("");
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      // await deleteQuestion(id);
      setQuestions(questions.filter((q) => q.id !== id));
    });
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions.map((q, i) => ({ ...q, order_index: i })));
  };

  const handleToggleActive = (id: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, is_active: !q.is_active } : q)));
  };

  const startEdit = (q: typeof questions[0]) => {
    setEditingId(q.id);
    setEditContent(q.content);
  };

  const saveEdit = (id: string) => {
    startTransition(async () => {
      // await updateQuestion(id, editContent, questions.find(q => q.id === id)?.is_active ?? true);
      setQuestions(questions.map((q) => (q.id === id ? { ...q, content: editContent } : q)));
      setEditingId(null);
    });
  };

  return (
    <div className="max-w-3xl">
      <h2 className="font-serif text-2xl text-charcoal mb-6">Circle Questions</h2>

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
            disabled={isPending}
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
                    disabled={index === 0}
                    className="p-2 text-charcoal-muted hover:text-charcoal transition-colors disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 1)}
                    disabled={index === questions.length - 1}
                    className="p-2 text-charcoal-muted hover:text-charcoal transition-colors disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(q.id)}
                    className={`p-2 transition-colors ${
                      q.is_active ? "text-sage hover:text-sage-dark" : "text-charcoal-muted hover:text-charcoal"
                    }`}
                    title={q.is_active ? "Active" : "Inactive"}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 text-charcoal-muted hover:text-terracotta transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
