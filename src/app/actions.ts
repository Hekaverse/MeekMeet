"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOrUpdateRsvp(
  meetingId: string,
  status: "going" | "maybe" | "not_going"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("rsvps")
    .upsert(
      {
        meeting_id: meetingId,
        user_id: user.id,
        status,
      },
      { onConflict: "meeting_id,user_id" }
    );

  if (error) throw new Error(error.message);

  revalidatePath("/circles/[slug]", "page");
  revalidatePath("/dashboard", "layout");
}

export async function deleteRsvp(meetingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("meeting_id", meetingId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/circles/[slug]", "page");
  revalidatePath("/dashboard", "layout");
}
