"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toggleMessageStatus } from "../../actions";

export default function StatusToggleButton({
  messageId,
  status,
}: {
  messageId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isResolved = status === "resolved";

  return (
    <button
      onClick={() => startTransition(() => toggleMessageStatus(messageId, status))}
      disabled={isPending}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-60 ${
        isResolved
          ? "bg-cream-warm text-charcoal hover:bg-wheat-pale"
          : "bg-midnight text-cream hover:bg-midnight-soft"
      }`}
    >
      {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />}
      {isResolved ? "Reopen" : "Mark resolved"}
    </button>
  );
}
