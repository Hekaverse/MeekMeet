"use server";

import { createClient } from "@/lib/supabase/server";
import { getResend } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import { isValidUuid, escapeHtml, assertNonEmptyString } from "@/lib/validation";

export async function getApplications(status?: "pending" | "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  let query = supabase
    .from("shepherd_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function approveApplication(applicationId: string, userId: string) {
  if (!isValidUuid(applicationId)) throw new Error("Invalid application ID");
  if (!isValidUuid(userId)) throw new Error("Invalid user ID");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  // Atomically mark the application approved and promote the user to
  // shepherd (role changes are only allowed via this RPC).
  const { error: reviewError } = await supabase.rpc(
    "review_shepherd_application",
    { p_application_id: applicationId, p_decision: "approved" }
  );

  if (reviewError) throw new Error(reviewError.message);

  // Send approval email
  const { data: application } = await supabase
    .from("shepherd_applications")
    .select("full_name, email")
    .eq("id", applicationId)
    .single();

  if (application?.email) {
    const safeName = escapeHtml(assertNonEmptyString(application.full_name, "Name", 100));
    try {
      await getResend().emails.send({
        from: "Meek Meet <hello@meekmeet.com>",
        to: application.email,
        subject: "Welcome, Shepherd — Your Application is Approved",
        html: `
          <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf6ee; color: #2c2c2c;">
            <h1 style="font-size: 24px; margin-bottom: 8px;">Hello ${safeName},</h1>
            <p style="font-size: 16px; line-height: 1.6;">
              It is with great joy that we welcome you as a <strong>Meek Meet Shepherd</strong>.
            </p>
            <div style="background: #f5efe0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0;">Your shepherd dashboard is now live. You can create your first circle, set your questions, and schedule your first gathering.</p>
            </div>
            <a href="https://meekmeet.com/dashboard/shepherd" style="display: inline-block; padding: 12px 24px; background: #1e2337; color: #faf6ee; text-decoration: none; border-radius: 24px; margin-top: 8px;">Go to Shepherd Dashboard</a>
            <hr style="border: 0; border-top: 1px solid #e8e0cc; margin: 24px 0;" />
            <p style="font-size: 12px; color: #6b6b6b;">
              Meek Meet · A warm community of faith
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Failed to send approval email:", err);
    }
  }

  revalidatePath("/dashboard/admin/applications");
}

export async function rejectApplication(applicationId: string) {
  if (!isValidUuid(applicationId)) throw new Error("Invalid application ID");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  const { error: reviewError } = await supabase.rpc(
    "review_shepherd_application",
    { p_application_id: applicationId, p_decision: "rejected" }
  );

  if (reviewError) throw new Error(reviewError.message);

  // Send rejection email
  const { data: application } = await supabase
    .from("shepherd_applications")
    .select("full_name, email")
    .eq("id", applicationId)
    .single();

  if (application?.email) {
    const safeName = escapeHtml(assertNonEmptyString(application.full_name, "Name", 100));
    try {
      await getResend().emails.send({
        from: "Meek Meet <hello@meekmeet.com>",
        to: application.email,
        subject: "Update on Your Shepherd Application",
        html: `
          <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf6ee; color: #2c2c2c;">
            <h1 style="font-size: 24px; margin-bottom: 8px;">Hello ${safeName},</h1>
            <p style="font-size: 16px; line-height: 1.6;">
              Thank you for your interest in becoming a Meek Meet shepherd. After prayerful consideration, we are unable to move forward with your application at this time.
            </p>
            <p style="font-size: 14px; color: #6b6b6b; margin-top: 16px;">
              This does not reflect on your character or calling. We encourage you to remain connected with your local community and consider reapplying in the future.
            </p>
            <hr style="border: 0; border-top: 1px solid #e8e0cc; margin: 24px 0;" />
            <p style="font-size: 12px; color: #6b6b6b;">
              Meek Meet · A warm community of faith
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Failed to send rejection email:", err);
    }
  }

  revalidatePath("/dashboard/admin/applications");
}


export async function getPendingDocuments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  const { data, error } = await supabase
    .from("shepherd_application_documents")
    .select(`
      *,
      application:shepherd_applications(*, profile:profiles(full_name, email))
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function reviewDocument(
  documentId: string,
  decision: "verified" | "rejected",
  notes?: string
) {
  if (!isValidUuid(documentId)) throw new Error("Invalid document ID");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("shepherd_application_documents")
    .update({
      status: decision,
      reviewed_at: now,
      reviewed_by: user.id,
    })
    .eq("id", documentId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/verification");
  revalidatePath("/dashboard/admin/applications");
}

export async function getApplicationDocuments(applicationId: string) {
  if (!isValidUuid(applicationId)) throw new Error("Invalid application ID");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  const { data, error } = await supabase
    .from("shepherd_application_documents")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}


export async function getDocumentSignedUrl(storagePath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  const { data, error } = await supabase.storage
    .from("shepherd-documents")
    .createSignedUrl(storagePath, 60 * 60); // 1 hour

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
