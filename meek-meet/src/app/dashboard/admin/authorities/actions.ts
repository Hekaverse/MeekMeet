"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAuthorities() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");

  const { data, error } = await supabase.from("authorities").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAuthority(formData: {
  authority_type: string;
  region_type: string;
  region_code: string;
  region_name: string;
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  office_address?: string;
  website_url?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");

  const { error } = await supabase.from("authorities").insert({
    authority_type: formData.authority_type,
    region_type: formData.region_type,
    region_code: formData.region_code,
    region_name: formData.region_name,
    name: formData.name,
    contact_name: formData.contact_name,
    contact_email: formData.contact_email,
    contact_phone: formData.contact_phone,
    office_address: formData.office_address,
    website_url: formData.website_url,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/authorities");
}

export async function deleteAuthority(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");

  const { error } = await supabase.from("authorities").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/authorities");
}

export async function seedSampleAuthorities() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");

  const sample = [
    {
      authority_type: "council",
      region_type: "lga",
      region_code: "sydney",
      region_name: "City of Sydney",
      name: "Lord Mayor of Sydney",
      contact_email: "council@cityofsydney.nsw.gov.au",
      website_url: "https://www.cityofsydney.nsw.gov.au",
    },
    {
      authority_type: "council",
      region_type: "lga",
      region_code: "brisbane",
      region_name: "Brisbane City Council",
      name: "Lord Mayor of Brisbane",
      contact_email: "council@brisbane.qld.gov.au",
      website_url: "https://www.brisbane.qld.gov.au",
    },
    {
      authority_type: "council",
      region_type: "lga",
      region_code: "melbourne",
      region_name: "City of Melbourne",
      name: "Lord Mayor of Melbourne",
      contact_email: "council@melbourne.vic.gov.au",
      website_url: "https://www.melbourne.vic.gov.au",
    },
  ];

  const { error } = await supabase.from("authorities").upsert(sample, { onConflict: "authority_type,region_code" });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/authorities");
}
