"use client";

import { useTransition } from "react";
import { approveApplication, rejectApplication } from "../../actions";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function ApproveButton({ applicationId, userId }: { applicationId: string; userId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          try {
            await approveApplication(applicationId, userId);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to approve");
          }
        })
      }
      disabled={isPending}
      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sage text-cream text-sm rounded-full hover:bg-sage-dark transition-all disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" strokeWidth={1.5} />}
      Approve
    </button>
  );
}

export function RejectButton({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          try {
            await rejectApplication(applicationId);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to reject");
          }
        })
      }
      disabled={isPending}
      className="flex items-center justify-center gap-2 px-5 py-2.5 border border-terracotta text-terracotta text-sm rounded-full hover:bg-terracotta-pale transition-all disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" strokeWidth={1.5} />}
      Reject
    </button>
  );
}
