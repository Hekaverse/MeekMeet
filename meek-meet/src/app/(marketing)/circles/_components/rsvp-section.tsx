"use client";

import { useState, useTransition } from "react";
import { createOrUpdateRsvp, deleteRsvp } from "@/app/actions";
import { Check, Loader2 } from "lucide-react";

interface Meeting {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  location_name: string | null;
  location_address: string | null;
}

interface Rsvp {
  meeting_id: string;
  status: "going" | "maybe" | "not_going";
}

interface Props {
  meetings: Meeting[];
  userRsvps: Rsvp[];
  isAuthenticated: boolean;
}

export default function RsvpSection({ meetings, userRsvps, isAuthenticated }: Props) {
  const [rsvps, setRsvps] = useState<Record<string, string>>(
    Object.fromEntries(userRsvps.map((r) => [r.meeting_id, r.status]))
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRsvp = (meetingId: string, status: "going" | "maybe" | "not_going") => {
    setLoadingId(meetingId);
    startTransition(async () => {
      try {
        await createOrUpdateRsvp(meetingId, status);
        setRsvps((prev) => ({ ...prev, [meetingId]: status }));
      } catch (err) {
        console.error(err);
      }
      setLoadingId(null);
    });
  };

  const handleCancel = (meetingId: string) => {
    setLoadingId(meetingId);
    startTransition(async () => {
      try {
        await deleteRsvp(meetingId);
        setRsvps((prev) => {
          const next = { ...prev };
          delete next[meetingId];
          return next;
        });
      } catch (err) {
        console.error(err);
      }
      setLoadingId(null);
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-cream-warm rounded-xl border border-border-soft p-6 text-center">
        <p className="text-charcoal-muted mb-4">
          Sign in to RSVP for this gathering.
        </p>
        <a
          href="/login"
          className="px-6 py-2.5 bg-midnight text-cream text-sm rounded-full hover:bg-midnight-soft transition-all inline-block"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => {
        const currentStatus = rsvps[meeting.id];
        const isLoading = loadingId === meeting.id;

        return (
          <div
            key={meeting.id}
            className="bg-cream-warm rounded-xl border border-border-soft p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <p className="font-medium text-charcoal">
                {new Date(meeting.scheduled_at).toLocaleDateString("en-AU", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-charcoal-muted mt-1">
                {new Date(meeting.scheduled_at).toLocaleTimeString("en-AU", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {meeting.duration_minutes ? ` · ${meeting.duration_minutes} min` : ""}
              </p>
              {meeting.location_name && (
                <p className="text-xs text-charcoal-muted mt-1">
                  {meeting.location_name}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            ) : currentStatus ? (
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                    currentStatus === "going"
                      ? "bg-sage-pale text-sage-dark"
                      : currentStatus === "maybe"
                      ? "bg-wheat-pale text-wheat-dark"
                      : "bg-charcoal/5 text-charcoal-muted"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {currentStatus === "going"
                    ? "Going"
                    : currentStatus === "maybe"
                    ? "Maybe"
                    : "Not Going"}
                </span>
                <button
                  onClick={() => handleCancel(meeting.id)}
                  className="text-xs text-charcoal-muted hover:text-terracotta transition-colors underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRsvp(meeting.id, "going")}
                  className="px-4 py-2 bg-sage text-cream text-sm rounded-full hover:bg-sage-dark transition-all"
                >
                  Going
                </button>
                <button
                  onClick={() => handleRsvp(meeting.id, "maybe")}
                  className="px-4 py-2 bg-wheat text-midnight text-sm rounded-full hover:bg-wheat-dark transition-all"
                >
                  Maybe
                </button>
                <button
                  onClick={() => handleRsvp(meeting.id, "not_going")}
                  className="px-4 py-2 border border-charcoal/10 text-charcoal text-sm rounded-full hover:border-terracotta hover:text-terracotta transition-all"
                >
                  Can't Make It
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
