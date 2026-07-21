"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getResend } from "@/lib/resend";
import {
  assertNonEmptyString,
  assertOptionalDate,
  isValidEmail,
  escapeHtml,
  isValidUuid,
} from "@/lib/validation";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Prevent duplicate pending applications
  const { data: existing } = await supabase
    .from("shepherd_applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) throw new Error("You already have a pending application.");

  // Validate all inputs
  const name = assertNonEmptyString(data.name, "Name", 100);
  const email = assertNonEmptyString(data.email, "Email", 255);
  if (!isValidEmail(email)) throw new Error("Invalid email address");

  const phone = assertNonEmptyString(data.phone, "Phone", 50);
  const location = assertNonEmptyString(data.location, "Location", 200);
  const denomination = assertNonEmptyString(data.denomination, "Denomination", 100);
  const wwccNumber = assertNonEmptyString(data.wwccNumber, "WWCC Number", 100);
  const wwccExpiry = assertOptionalDate(data.wwccExpiry, "WWCC Expiry");
  const policeCheckDate = assertOptionalDate(data.policeCheckDate, "Police Check Date");
  const firstAidExpiry = assertOptionalDate(data.firstAidExpiry, "First Aid Expiry");
  const emergencyName = assertNonEmptyString(data.emergencyName, "Emergency Contact Name", 100);
  const emergencyPhone = assertNonEmptyString(data.emergencyPhone, "Emergency Contact Phone", 50);
  const referenceName = assertNonEmptyString(data.referenceName, "Reference Name", 100);
  const referenceContact = assertNonEmptyString(data.referenceContact, "Reference Contact", 255);

  const { data: inserted, error } = await supabase
    .from("shepherd_applications")
    .insert({
      user_id: user.id,
      full_name: name,
      email,
      phone,
      location,
      denomination,
      tradition: denomination,
      wwcc_number: wwccNumber,
      wwcc_expiry: wwccExpiry,
      police_check_date: policeCheckDate,
      first_aid_expiry: firstAidExpiry,
      emergency_name: emergencyName,
      emergency_phone: emergencyPhone,
      reference_name: referenceName,
      reference_contact: referenceContact,
      motivation: "Applied via web form",
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message ?? "Failed to create application");

  // Send confirmation email with escaped HTML
  const safeName = escapeHtml(name);
  const safeLocation = escapeHtml(location);
  const safeDenomination = escapeHtml(denomination);

  try {
    await getResend().emails.send({
      from: "Meek Meet <hello@meekmeet.com>",
      to: email,
      subject: "Your Shepherd Application — Meek Meet",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf6ee; color: #2c2c2c;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">Hello ${safeName},</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for applying to become a Meek Meet shepherd. We have received your application and will review it with prayer and care.
          </p>
          <div style="background: #f5efe0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Location:</strong> ${safeLocation}</p>
            <p style="margin: 4px 0 0;"><strong>Denomination:</strong> ${safeDenomination}</p>
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
  return inserted.id;
}

export async function createOrUpdateRsvp(
  meetingId: string,
  status: "going" | "maybe" | "not_going"
) {
  if (!isValidUuid(meetingId)) throw new Error("Invalid meeting ID");
  if (!["going", "maybe", "not_going"].includes(status)) {
    throw new Error("Invalid RSVP status");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("rsvps").upsert(
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
  if (!isValidUuid(meetingId)) throw new Error("Invalid meeting ID");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
