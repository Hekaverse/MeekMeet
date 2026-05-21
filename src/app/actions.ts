"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getResend } from "@/lib/resend";

interface ApplicationData {
  name: string;
  email: string;
  phone: string;
  location: string;
  denomination: string;
  wwccNumber: string;
  wwccExpiry: string;
  policeCheckDate: string;
  firstAidExpiry: string;
  emergencyName: string;
  emergencyPhone: string;
  referenceName: string;
  referenceContact: string;
}

export async function submitApplication(data: ApplicationData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    denomination: data.denomination,
    wwcc_number: data.wwccNumber,
    wwcc_expiry: data.wwccExpiry || null,
    police_check_date: data.policeCheckDate || null,
    first_aid_expiry: data.firstAidExpiry || null,
    emergency_name: data.emergencyName,
    emergency_phone: data.emergencyPhone,
    reference_name: data.referenceName,
    reference_contact: data.referenceContact,
    status: "pending",
  });

  if (error) throw new Error(error.message);

  // Send confirmation email
  try {
    await getResend().emails.send({
      from: "Meek Meet <hello@meekmeet.com>",
      to: data.email,
      subject: "Your Shepherd Application — Meek Meet",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf6ee; color: #2c2c2c;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">Hello ${data.name},</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for applying to become a Meek Meet shepherd. We have received your application and will review it with prayer and care.
          </p>
          <div style="background: #f5efe0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Location:</strong> ${data.location}</p>
            <p style="margin: 4px 0 0;"><strong>Denomination:</strong> ${data.denomination}</p>
          </div>
          <p style="font-size: 14px; color: #6b6b6b;">
            We will verify your documents and contact your reference. Expect to hear from us within 5 business days.
          </p>
          <hr style="border: 0; border-top: 1px solid #e8e0cc; margin: 24px 0;" />
          <p style="font-size: 12px; color: #6b6b6b;">
            Meek Meet · A warm community of faith
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }

  revalidatePath("/shepherd/apply");
}

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
