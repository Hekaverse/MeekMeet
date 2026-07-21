"use client";

import { useEffect, useState, useTransition } from "react";
import { getPendingDocuments, reviewDocument, getDocumentSignedUrl } from "../actions";
import { FileCheck, X, Eye, Shield, FileText, Loader2, AlertCircle } from "lucide-react";

interface Document {
  id: string;
  document_type: "wwcc" | "police_check" | "first_aid" | "photo_id";
  file_name: string;
  mime_type: string;
  storage_path: string;
  status: string;
  created_at: string;
  application: {
    id: string;
    full_name: string;
    email: string;
    wwcc_number?: string | null;
    wwcc_expiry?: string | null;
    police_check_date?: string | null;
    first_aid_expiry?: string | null;
  };
}

const documentLabels: Record<string, string> = {
  wwcc: "Working With Children Check",
  police_check: "National Police Check",
  first_aid: "First Aid Certificate",
  photo_id: "Photo ID",
};

export default function VerificationPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPendingDocuments();
      setDocuments(data as Document[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDecision = (documentId: string, decision: "verified" | "rejected") => {
    startTransition(async () => {
      try {
        await reviewDocument(documentId, decision);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update document");
      }
    });
  };

  const openPreview = async (doc: Document) => {
    try {
      const url = await getDocumentSignedUrl(doc.storage_path);
      setPreviewUrl(url);
      setPreviewName(doc.file_name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="font-serif text-2xl text-charcoal mb-6">Document Verification</h1>
        <div className="flex items-center gap-3 text-charcoal-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading pending documents...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-serif text-2xl text-charcoal mb-2">Document Verification</h1>
      <p className="text-charcoal-muted mb-6">Review and verify uploaded shepherd documents.</p>

      {error && (
        <div className="mb-6 p-4 bg-terracotta-pale rounded-xl text-terracotta text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-cream-warm rounded-xl border border-border-soft p-10 text-center">
          <Shield className="w-10 h-10 text-sage-dark mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-charcoal-muted">No pending documents to verify.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-cream-warm rounded-xl border border-border-soft p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                    <span className="font-medium text-charcoal">
                      {documentLabels[doc.document_type]}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-wheat-pale text-wheat-dark rounded-full">
                      {doc.mime_type.split("/").pop()?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-muted mb-1">{doc.file_name}</p>
                  <p className="text-sm text-charcoal">
                    <span className="text-charcoal-muted">Applicant:</span>{" "}
                    <strong>{doc.application.full_name}</strong> · {doc.application.email}
                  </p>
                  {doc.document_type === "wwcc" && doc.application.wwcc_number && (
                    <p className="text-sm text-charcoal-muted mt-1">
                      WWCC: {doc.application.wwcc_number} (expires{" "}
                      {new Date(doc.application.wwcc_expiry ?? "").toLocaleDateString("en-AU")})
                    </p>
                  )}
                  {doc.document_type === "police_check" && doc.application.police_check_date && (
                    <p className="text-sm text-charcoal-muted mt-1">
                      Police check date:{" "}
                      {new Date(doc.application.police_check_date).toLocaleDateString("en-AU")}
                    </p>
                  )}
                  {doc.document_type === "first_aid" && doc.application.first_aid_expiry && (
                    <p className="text-sm text-charcoal-muted mt-1">
                      First aid expires:{" "}
                      {new Date(doc.application.first_aid_expiry).toLocaleDateString("en-AU")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPreview(doc)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-cream border border-border-soft text-charcoal rounded-full hover:border-wheat transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                    View
                  </button>
                  <button
                    onClick={() => handleDecision(doc.id, "verified")}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sage text-cream rounded-full hover:bg-sage-dark transition-colors text-sm disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4" strokeWidth={1.5} />
                    Verify
                  </button>
                  <button
                    onClick={() => handleDecision(doc.id, "rejected")}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-terracotta text-cream rounded-full hover:bg-terracotta-dark transition-colors text-sm disabled:opacity-50"
                  >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-midnight/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cream rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border-soft">
              <h3 className="font-medium text-charcoal truncate">{previewName}</h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-2 text-charcoal-muted hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {previewName.toLowerCase().endsWith(".pdf") ? (
                <iframe src={previewUrl} className="w-full h-[70vh]" title={previewName} />
              ) : (
                <img
                  src={previewUrl}
                  alt={previewName}
                  className="max-w-full max-h-[70vh] mx-auto object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
