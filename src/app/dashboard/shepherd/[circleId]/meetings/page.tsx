"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X, Loader2, Calendar, MapPin, Clock } from "lucide-react";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<
    {
      id: string;
      scheduled_at: string;
      duration_minutes: number;
      location_name: string | null;
      location_address: string | null;
      notes: string | null;
    }[]
  >([
    {
      id: "1",
      scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 120,
      location_name: "St. Marks Community Hall",
      location_address: "123 Chapel St, Sydney NSW",
      notes: "Bring a journal for reflection.",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("120");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!date || !time) return;
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    startTransition(() => {
      setMeetings([
        ...meetings,
        {
          id: Date.now().toString(),
          scheduled_at: scheduledAt,
          duration_minutes: parseInt(duration) || 120,
          location_name: locationName || null,
          location_address: locationAddress || null,
          notes: notes || null,
        },
      ]);
      setDate("");
      setTime("");
      setDuration("120");
      setLocationName("");
      setLocationAddress("");
      setNotes("");
      setShowForm(false);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      setMeetings(meetings.filter((m) => m.id !== id));
    });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-charcoal">Scheduled Meetings</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm font-medium flex items-center gap-2"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Schedule New"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-cream-warm rounded-xl border border-border-soft p-6 mb-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-charcoal-light font-medium mb-1.5 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-charcoal-light font-medium mb-1.5 block">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-charcoal-light font-medium mb-1.5 block">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="120"
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-charcoal-light font-medium mb-1.5 block flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
              Location Name
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g., St. Marks Community Hall"
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-charcoal-light font-medium mb-1.5 block">Address</label>
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="e.g., 123 Chapel St, Sydney NSW"
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-charcoal-light font-medium mb-1.5 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for attendees..."
              rows={3}
              className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm resize-none"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={isPending || !date || !time}
            className="w-full py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Schedule Meeting
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="bg-cream-warm rounded-xl border border-border-soft p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                  <p className="font-medium text-charcoal">{formatDate(meeting.scheduled_at)}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-charcoal-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-wheat" strokeWidth={1.5} />
                    {formatTime(meeting.scheduled_at)}
                    {meeting.duration_minutes && ` · ${meeting.duration_minutes} min`}
                  </span>
                  {meeting.location_name && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sage" strokeWidth={1.5} />
                      {meeting.location_name}
                    </span>
                  )}
                </div>
                {meeting.notes && (
                  <p className="text-sm text-charcoal-muted mt-2">{meeting.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(meeting.id)}
                className="p-2 text-charcoal-muted hover:text-terracotta transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {meetings.length === 0 && (
          <div className="text-center py-12 bg-cream-warm rounded-xl border border-border-soft">
            <p className="text-charcoal-muted">No meetings scheduled yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
