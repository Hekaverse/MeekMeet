import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("applicationId") as string | null;
    const documentType = formData.get("documentType") as string | null;

    if (!file || !applicationId || !documentType) {
      return NextResponse.json(
        { error: "Missing file, applicationId, or documentType" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    if (!["wwcc", "police_check", "first_aid", "photo_id"].includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    // Verify the application belongs to the current user and is pending
    const { data: application, error: appError } = await supabase
      .from("shepherd_applications")
      .select("id, user_id, status")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only upload documents for your own application" },
        { status: 403 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Documents can only be uploaded for pending applications" },
        { status: 400 }
      );
    }

    // Sanitize filename and build storage path: userId/applicationId/documentType-timestamp.ext
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeName = `${documentType}-${Date.now()}.${extension}`;
    const storagePath = `${user.id}/${applicationId}/${safeName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("shepherd-documents")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload document" },
        { status: 500 }
      );
    }

    // Record the document in the database
    const { error: dbError } = await supabase
      .from("shepherd_application_documents")
      .insert({
        application_id: applicationId,
        user_id: user.id,
        document_type: documentType,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        status: "pending",
      });

    if (dbError) {
      console.error("Document record error:", dbError);
      // Best-effort cleanup
      await supabase.storage.from("shepherd-documents").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to record document" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      path: storagePath,
      documentType,
    });
  } catch (err) {
    console.error("Unexpected upload error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
