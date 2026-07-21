"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Check, X, Loader2, Clock } from "lucide-react";

export default function RoutinePage() {
  const [routines, setRoutines] = useState<
    {
      id: string;
      title: string;
      description: string | null;
      duration_minutes: number | null;
      order_index: number;
    }[]
  >([
    { id: "1", title: "Opening Prayer", description: "A moment of silence and opening prayer.", duration_minutes: 10, order_index: 0 },
    { id: "2", title: "Scripture Reading", description: "Reading and reflection on the evening's passage.", duration_minutes: 15, order_index: 1 },
    { id: "3", title: "Circle Questions", description: "Guided discussion through the prepared questions.", duration_minutes: 45, order_index: 2 },
    { id: "4", title: "Sharing & Prayer", description: "Open sharing and communal prayer.", duration_minutes: 30, order_index: 3 },
    { id: "5", title: "Closing Blessing", description: "A sending blessing for the week ahead.", duration_minutes: 10, order_index: 4 },
  ]);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalMinutes = routines.reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    startTransition(() => {
      setRoutines([
        ...routines,
        {
          id: Date.now().toString(),
          title: newTitle,
          description: newDesc || null,
          duration_minutes: parseInt(newDuration) || null,
          order_index: routines.length,
        },
      ]);
      setNewTitle("");
      setNewDesc("");
      setNewDuration("");
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      setRoutines(routines.filter((r) => r.id !== id));
    });
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= routines.length) return;
    const newRoutines = [...routines];
    [newRoutines[index], newRoutines[newIndex]] = [newRoutines[newIndex], newRoutines[index]];
    setRoutines(newRoutines.map((r, i) => ({ ...r, order_index: i })));
  };

  const startEdit = (r: typeof routines[0]) => {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditDesc(r.description ?? "");
    setEditDuration(r.duration_minutes?.toString() ?? "");
  };

  const saveEdit = (id: string) => {
    startTransition(() => {
      setRoutines(
        routines.map((r) =>
          r.id === id
            ? { ...r, title: editTitle, description: editDesc || null, duration_minutes: parseInt(editDuration) || null }
            : r
        )
      );
      setEditingId(null);
    });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-charcoal">Meeting Routine</h2>
        {totalMinutes > 0 && (
          <span className="text-sm text-charcoal-muted flex items-center gap-1.5">
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            ~{totalMinutes} min total
          </span>
        )}
      </div>

      {/* Add new */}
      <div className="bg-cream-warm rounded-xl border border-border-soft p-5 mb-8 space-y-3">
        <label className="text-sm text-charcoal-light font-medium block">
          Add a routine step
        </label>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Step title (e.g., Opening Prayer)"
          className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm"
        />
        <input
          type="text"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm"
        />
        <div className="flex gap-3">
          <input
            type="number"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
            placeholder="Duration (min)"
            className="w-40 px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="px-5 py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Step
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {routines.map((r, index) => (
          <div key={r.id} className="bg-cream-warm rounded-xl border border-border-soft p-5">
            {editingId === r.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm"
                  autoFocus
                />
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full px-4 py-2 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm"
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="Duration (min)"
                    className="w-40 px-4 py-2 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm"
                  />
                  <button onClick={() => saveEdit(r.id)} className="p-2 text-sage hover:text-sage-dark">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-charcoal-muted hover:text-charcoal">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-terracotta-pale flex items-center justify-center text-sm font-medium text-terracotta">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3
                    className="font-medium text-charcoal cursor-pointer hover:text-terracotta transition-colors"
                    onClick={() => startEdit(r)}
                  >
                    {r.title}
                  </h3>
                  {r.description && (
                    <p className="text-sm text-charcoal-muted mt-1">{r.description}</p>
                  )}
                  {r.duration_minutes && (
                    <p className="text-xs text-charcoal-muted mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={1.5} />
                      {r.duration_minutes} min
                    </p>
                  )}
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
                    disabled={index === routines.length - 1}
                    className="p-2 text-charcoal-muted hover:text-charcoal transition-colors disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
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
