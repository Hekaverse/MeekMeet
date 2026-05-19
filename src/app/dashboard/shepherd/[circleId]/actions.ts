"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyShepherd(circleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: circle } = await supabase
    .from("circles")
    .select("shepherd_id")
    .eq("id", circleId)
    .single();

  if (circle?.shepherd_id !== user.id) {
    throw new Error("You are not the shepherd of this circle");
  }

  return supabase;
}

// ========== QUESTIONS ==========

export async function createQuestion(circleId: string, content: string) {
  const supabase = await verifyShepherd(circleId);

  const { data: maxOrder } = await supabase
    .from("circle_questions")
    .select("order_index")
    .eq("circle_id", circleId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from("circle_questions").insert({
    circle_id: circleId,
    content,
    order_index: (maxOrder?.order_index ?? -1) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${circleId}/questions`);
  revalidatePath(`/circles/[slug]`);
}

export async function updateQuestion(id: string, content: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: question } = await supabase
    .from("circle_questions")
    .select("circle_id")
    .eq("id", id)
    .single();

  if (!question) throw new Error("Question not found");
  await verifyShepherd(question.circle_id);

  const { error } = await supabase
    .from("circle_questions")
    .update({ content, is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${question.circle_id}/questions`);
  revalidatePath(`/circles/[slug]`);
}

export async function deleteQuestion(id: string) {
  const supabase = await createClient();
  const { data: question } = await supabase
    .from("circle_questions")
    .select("circle_id")
    .eq("id", id)
    .single();

  if (!question) throw new Error("Question not found");
  await verifyShepherd(question.circle_id);

  const { error } = await supabase.from("circle_questions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${question.circle_id}/questions`);
  revalidatePath(`/circles/[slug]`);
}

export async function reorderQuestions(circleId: string, orderedIds: string[]) {
  const supabase = await verifyShepherd(circleId);

  const updates = orderedIds.map((id, index) =>
    supabase.from("circle_questions").update({ order_index: index }).eq("id", id)
  );

  await Promise.all(updates);
  revalidatePath(`/dashboard/shepherd/${circleId}/questions`);
  revalidatePath(`/circles/[slug]`);
}

// ========== ROUTINES ==========

export async function createRoutine(
  circleId: string,
  title: string,
  description: string,
  durationMinutes: number
) {
  const supabase = await verifyShepherd(circleId);

  const { data: maxOrder } = await supabase
    .from("circle_routines")
    .select("order_index")
    .eq("circle_id", circleId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from("circle_routines").insert({
    circle_id: circleId,
    title,
    description: description || null,
    duration_minutes: durationMinutes || null,
    order_index: (maxOrder?.order_index ?? -1) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${circleId}/routine`);
  revalidatePath(`/circles/[slug]`);
}

export async function updateRoutine(
  id: string,
  title: string,
  description: string,
  durationMinutes: number
) {
  const supabase = await createClient();
  const { data: routine } = await supabase
    .from("circle_routines")
    .select("circle_id")
    .eq("id", id)
    .single();

  if (!routine) throw new Error("Routine not found");
  await verifyShepherd(routine.circle_id);

  const { error } = await supabase
    .from("circle_routines")
    .update({ title, description: description || null, duration_minutes: durationMinutes || null })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${routine.circle_id}/routine`);
  revalidatePath(`/circles/[slug]`);
}

export async function deleteRoutine(id: string) {
  const supabase = await createClient();
  const { data: routine } = await supabase
    .from("circle_routines")
    .select("circle_id")
    .eq("id", id)
    .single();

  if (!routine) throw new Error("Routine not found");
  await verifyShepherd(routine.circle_id);

  const { error } = await supabase.from("circle_routines").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${routine.circle_id}/routine`);
  revalidatePath(`/circles/[slug]`);
}

export async function reorderRoutines(circleId: string, orderedIds: string[]) {
  const supabase = await verifyShepherd(circleId);

  const updates = orderedIds.map((id, index) =>
    supabase.from("circle_routines").update({ order_index: index }).eq("id", id)
  );

  await Promise.all(updates);
  revalidatePath(`/dashboard/shepherd/${circleId}/routine`);
  revalidatePath(`/circles/[slug]`);
}

// ========== MEETINGS ==========

export async function createMeeting(
  circleId: string,
  scheduledAt: string,
  durationMinutes: number,
  locationName: string,
  locationAddress: string,
  notes: string
) {
  const supabase = await verifyShepherd(circleId);

  const { error } = await supabase.from("meetings").insert({
    circle_id: circleId,
    scheduled_at: scheduledAt,
    duration_minutes: durationMinutes || 120,
    location_name: locationName || null,
    location_address: locationAddress || null,
    notes: notes || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${circleId}/meetings`);
  revalidatePath(`/circles/[slug]`);
}

export async function cancelMeeting(id: string) {
  const supabase = await createClient();
  const { data: meeting } = await supabase
    .from("meetings")
    .select("circle_id")
    .eq("id", id)
    .single();

  if (!meeting) throw new Error("Meeting not found");
  await verifyShepherd(meeting.circle_id);

  const { error } = await supabase
    .from("meetings")
    .update({ is_cancelled: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${meeting.circle_id}/meetings`);
  revalidatePath(`/circles/[slug]`);
}

export async function deleteMeeting(id: string) {
  const supabase = await createClient();
  const { data: meeting } = await supabase
    .from("meetings")
    .select("circle_id")
    .eq("id", id)
    .single();

  if (!meeting) throw new Error("Meeting not found");
  await verifyShepherd(meeting.circle_id);

  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${meeting.circle_id}/meetings`);
  revalidatePath(`/circles/[slug]`);
}

// ========== CIRCLE SETTINGS ==========

export async function updateCircle(
  circleId: string,
  data: {
    name: string;
    description: string;
    location: string;
    meetingPlace: string;
    meetingAddress: string;
    imageUrl: string;
  }
) {
  const supabase = await verifyShepherd(circleId);

  const { error } = await supabase
    .from("circles")
    .update({
      name: data.name,
      description: data.description || null,
      location: data.location,
      meeting_place: data.meetingPlace || null,
      meeting_address: data.meetingAddress || null,
      image_url: data.imageUrl || null,
    })
    .eq("id", circleId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${circleId}/settings`);
  revalidatePath(`/circles/[slug]`);
}
