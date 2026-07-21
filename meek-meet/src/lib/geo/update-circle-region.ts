"use server";

import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "./geocode";

export async function updateCircleRegion(circleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify admin or shepherd
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    const { data: shepherd } = await supabase
      .from("circle_shepherds")
      .select("id")
      .eq("circle_id", circleId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shepherd) throw new Error("Not authorized");
  }

  const { data: circle, error } = await supabase
    .from("circles")
    .select("location, meeting_address")
    .eq("id", circleId)
    .single();

  if (error || !circle) throw new Error("Circle not found");

  const address = [circle.meeting_address, circle.location].filter(Boolean).join(", ") || circle.location;
  if (!address) throw new Error("No address to geocode");

  const geo = await geocodeAddress(address);
  if (!geo) throw new Error("Geocoding failed or not configured");

  const { error: updateError } = await supabase
    .from("circles")
    .update({
      latitude: geo.latitude,
      longitude: geo.longitude,
      state_code: geo.adminAreaLevel1?.toLowerCase(),
      lga_name: geo.adminAreaLevel2,
      country_code: geo.country?.toUpperCase() ?? "AU",
    })
    .eq("id", circleId);

  if (updateError) throw new Error(updateError.message);

  return geo;
}
