"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  isValidUuid,
  assertNonEmptyString,
  assertOptionalString,
  isValidUrl,
} from "@/lib/validation";

async function verifyShepherd(circleId: string) {
  if (!isValidUuid(circleId)) throw new Error("Invalid circle ID");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: shepherdRecord } = await supabase
    .from("circle_shepherds")
    .select("id, role")
    .eq("circle_id", circleId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!shepherdRecord) {
    throw new Error("You are not the shepherd of this circle");
  }

  return { supabase, isLead: shepherdRecord.role === "lead" };
}

// ========== QUESTIONS ==========

export async function createQuestion(circleId: string, content: string) {
  const { supabase } = await verifyShepherd(circleId);
  const safeContent = assertNonEmptyString(content, "Content", 1000);

  const { data: maxOrder } = await supabase
    .from("circle_questions")
    .select("order_index")
    .eq("circle_id", circleId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from("circle_questions").insert({
    circle_id: circleId,
    content: safeContent,
    order_index: (maxOrder?.order_index ?? -1) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${circleId}/questions`);
  revalidatePath(`/circles/[slug]`);
}

export async function updateQuestion(
  id: string,
  content: string,
  isActive: boolean
) {
  if (!isValidUuid(id)) throw new Error("Invalid question ID");
  const safeContent = assertNonEmptyString(content, "Content", 1000);

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
    .update({ content: safeContent, is_active: Boolean(isActive) })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${question.circle_id}/questions`);
  revalidatePath(`/circles/[slug]`);
}

export async function deleteQuestion(id: string) {
  if (!isValidUuid(id)) throw new Error("Invalid question ID");

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
  const { supabase } = await verifyShepherd(circleId);

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new Error("Invalid order");
  }

  for (const id of orderedIds) {
    if (!isValidUuid(id)) throw new Error("Invalid question ID in order");
  }

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
  const { supabase } = await verifyShepherd(circleId);
  const safeTitle = assertNonEmptyString(title, "Title", 200);
  const safeDescription = assertOptionalString(description, "Description", 2000);
  const safeDuration =
    typeof durationMinutes === "number" && durationMinutes > 0 && durationMinutes <= 1440
      ? durationMinutes
      : null;

  const { data: maxOrder } = await supabase
    .from("circle_routines")
    .select("order_index")
    .eq("circle_id", circleId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from("circle_routines").insert({
    circle_id: circleId,
    title: safeTitle,
    description: safeDescription,
    duration_minutes: safeDuration,
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
  if (!isValidUuid(id)) throw new Error("Invalid routine ID");
  const safeTitle = assertNonEmptyString(title, "Title", 200);
  const safeDescription = assertOptionalString(description, "Description", 2000);
  const safeDuration =
    typeof durationMinutes === "number" && durationMinutes > 0 && durationMinutes <= 1440
      ? durationMinutes
      : null;

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
    .update({
      title: safeTitle,
      description: safeDescription,
      duration_minutes: safeDuration,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${routine.circle_id}/routine`);
  revalidatePath(`/circles/[slug]`);
}

export async function deleteRoutine(id: string) {
  if (!isValidUuid(id)) throw new Error("Invalid routine ID");

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
  const { supabase } = await verifyShepherd(circleId);

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new Error("Invalid order");
  }

  for (const id of orderedIds) {
    if (!isValidUuid(id)) throw new Error("Invalid routine ID in order");
  }

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
  notes: string,
  meetingType: "in_person" | "digital" | "hybrid" = "in_person",
  joinUrl?: string
) {
  const { supabase } = await verifyShepherd(circleId);

  const safeScheduledAt = assertNonEmptyString(scheduledAt, "Scheduled date", 50);
  const scheduledDate = new Date(safeScheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new Error("Invalid scheduled date");
  }

  const safeDuration =
    typeof durationMinutes === "number" && durationMinutes > 0 && durationMinutes <= 1440
      ? durationMinutes
      : 120;
  const safeLocationName = assertOptionalString(locationName, "Location name", 200);
  const safeLocationAddress = assertOptionalString(locationAddress, "Location address", 500);
  const safeNotes = assertOptionalString(notes, "Notes", 5000);
  const safeMeetingType = ["in_person", "digital", "hybrid"].includes(meetingType)
    ? meetingType
    : "in_person";
  const safeJoinUrl = joinUrl && joinUrl.trim() ? assertOptionalString(joinUrl, "Join URL", 500) : null;

  const { error } = await supabase.from("meetings").insert({
    circle_id: circleId,
    scheduled_at: safeScheduledAt,
    duration_minutes: safeDuration,
    location_name: safeLocationName,
    location_address: safeLocationAddress,
    notes: safeNotes,
    meeting_type: safeMeetingType,
    join_url: safeJoinUrl,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${circleId}/meetings`);
  revalidatePath(`/circles/[slug]`);
}

export async function cancelMeeting(id: string) {
  if (!isValidUuid(id)) throw new Error("Invalid meeting ID");

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
  if (!isValidUuid(id)) throw new Error("Invalid meeting ID");

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
  const { supabase } = await verifyShepherd(circleId);

  const safeName = assertNonEmptyString(data.name, "Name", 200);
  const safeDescription = assertOptionalString(data.description, "Description", 5000);
  const safeLocation = assertNonEmptyString(data.location, "Location", 200);
  const safeMeetingPlace = assertOptionalString(data.meetingPlace, "Meeting place", 200);
  const safeMeetingAddress = assertOptionalString(data.meetingAddress, "Meeting address", 500);

  let safeImageUrl: string | null = null;
  if (data.imageUrl && data.imageUrl.trim()) {
    if (!isValidUrl(data.imageUrl.trim())) {
      throw new Error("Image URL must be a valid URL");
    }
    safeImageUrl = data.imageUrl.trim();
  }

  const { error } = await supabase
    .from("circles")
    .update({
      name: safeName,
      description: safeDescription,
      location: safeLocation,
      meeting_place: safeMeetingPlace,
      meeting_address: safeMeetingAddress,
      image_url: safeImageUrl,
    })
    .eq("id", circleId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/shepherd/${circleId}/settings`);
  revalidatePath(`/circles/[slug]`);
}
