"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { submitApplication } from "@/app/actions";
import {
  Send,
  CheckCircle,
  User,
  Shield,
  HeartPulse,
  FileCheck,
  Upload,
  AlertCircle,
  Calendar,
  Users,
  MapPin,
  Mail,
  Phone,
  Church,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface FormData {
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
  hasReadPolicy: boolean;
  documentsAccurate: boolean;
  understandsChecks: boolean;
}

type DocumentType = "wwcc" | "police_check" | "first_aid";
type UploadStatus = "idle" | "uploading" | "success" | "error";

const initialForm: FormData = {
  name: "",
  email: "",
  phone: "",
  location: "",
  denomination: "",
  wwccNumber: "",
  wwccExpiry: "",
  policeCheckDate: "",
  firstAidExpiry: "",
  emergencyName: "",
  emergencyPhone: "",
  referenceName: "",
  referenceContact: "",
  hasReadPolicy: false,
  documentsAccurate: false,
  understandsChecks: false,
};

export default function ShepherdApplyPage() {
  const { user, isLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [files, setFiles] = useState<Record<DocumentType, File | null>>({
    wwcc: null,
    police_check: null,
    first_aid: null,
  });
  const [uploadStatus, setUploadStatus] = useState<Record<DocumentType, UploadStatus>>({
    wwcc: "idle",
    police_check: "idle",
    first_aid: "idle",
  });

  const allChecked =
    formData.hasReadPolicy && formData.documentsAccurate && formData.understandsChecks;

  const update = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const updateFile = (type: DocumentType, file: File | null) => {
    setFiles((prev) => ({ ...prev, [type]: file }));
    setUploadStatus((prev) => ({ ...prev, [type]: "idle" }));
    setError("");
  };

  const uploadDocument = async (
    applicationId: string,
    type: DocumentType,
    file: File
  ): Promise<boolean> => {
    setUploadStatus((prev) => ({ ...prev, [type]: "uploading" }));
    const data = new FormData();
    data.append("file", file);
    data.append("applicationId", applicationId);
    data.append("documentType", type);

    try {
      const res = await fetch("/api/upload-document", { method: "POST", body: data });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Upload failed");
      }
      setUploadStatus((prev) => ({ ...prev, [type]: "success" }));
      return true;
    } catch (err) {
      setUploadStatus((prev) => ({ ...prev, [type]: "error" }));
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked || !user) return;
    setSubmitting(true);
    setError("");

    try {
      const applicationId = await submitApplication(formData);

      // Upload documents in parallel if selected
      const documentTypes = Object.keys(files).filter(
        (k) => files[k as DocumentType] !== null
      ) as DocumentType[];

      if (documentTypes.length > 0) {
        const results = await Promise.all(
          documentTypes.map((type) =>
            files[type] ? uploadDocument(applicationId, type, files[type]) : Promise.resolve(true)
          )
        );
        if (results.some((ok) => !ok)) {
          setError(
            "Application submitted, but one or more document uploads failed. You can retry from your dashboard."
          );
          setSubmitting(false);
          return;
        }
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="min-h-screen pt-32 pb-20 bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="min-h-screen pt-32 pb-20 bg-cream">
        <div className="max-w-xl mx-auto px-6 text-center">
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
            Step Forward
          </span>
          <h1 className="font-serif text-4xl text-charcoal mb-6">
            Become a Shepherd
          </h1>
          <p className="text-charcoal-muted mb-8">
            Please sign in to submit your shepherd application. We need to verify your identity as part of our safety process.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm tracking-wide"
          >
            Sign In to Apply
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-32 pb-20 bg-cream">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
            Step Forward
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-6">
            Become a Shepherd
          </h1>
          <p className="text-lg text-charcoal-muted max-w-2xl mx-auto">
            Every movement begins with one person who says <em>yes</em>. Apply to shepherd your community with gentleness and integrity.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-cream-warm rounded-3xl border border-border-soft p-10 text-center"
          >
            <div className="w-16 h-16 bg-sage-pale rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-sage-dark" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl text-charcoal mb-4">
              Application Received
            </h2>
            <p className="text-charcoal-muted max-w-md mx-auto mb-6">
              Thank you for your willingness to serve. Our team will verify your documents and contact your reference. We will be in touch within 5 business days.
            </p>
            <p className="font-script text-xl text-wheat-dark">
              &ldquo;Well done, good and faithful servant.&rdquo;
            </p>
            <p className="text-xs text-charcoal-muted mt-1">— Matthew 25:23</p>
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm"
              >
                Go to Dashboard
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-cream-warm rounded-3xl border border-border-soft p-8 md:p-10"
          >
            {error && (
              <div className="mb-6 p-4 bg-terracotta-pale rounded-xl text-terracotta text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-xs tracking-[0.2em] uppercase text-terracotta font-medium flex items-center gap-2">
                  <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Personal Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => update("name", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-cream border border-border-soft text-charcoal placeholder-charcoal-muted rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-cream border border-border-soft text-charcoal placeholder-charcoal-muted rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-cream border border-border-soft text-charcoal placeholder-charcoal-muted rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                    <input
                      type="text"
                      required
                      placeholder="Suburb / Town / City"
                      value={formData.location}
                      onChange={(e) => update("location", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-cream border border-border-soft text-charcoal placeholder-charcoal-muted rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
                <div className="relative">
                  <Church className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                  <select
                    required
                    value={formData.denomination}
                    onChange={(e) => update("denomination", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-cream border border-border-soft text-charcoal rounded-xl focus:border-wheat focus:outline-none transition-colors appearance-none text-sm"
                  >
                    <option value="">Your Faith Family</option>
                    <option value="catholic">Catholic</option>
                    <option value="protestant">Protestant</option>
                    <option value="jehovahs-witness">Jehovah&apos;s Witness</option>
                    <option value="orthodox">Orthodox</option>
                    <option value="anglican">Anglican</option>
                    <option value="baptist">Baptist</option>
                    <option value="methodist">Methodist</option>
                    <option value="lutheran">Lutheran</option>
                    <option value="presbyterian">Presbyterian</option>
                    <option value="pentecostal">Pentecostal</option>
                    <option value="other">Other Bible-Believing</option>
                  </select>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-4 pt-6 border-t border-border-soft">
                <h3 className="text-xs tracking-[0.2em] uppercase text-terracotta font-medium flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Verification Documents
                </h3>

                <div className="p-4 bg-cream rounded-xl border border-border-soft space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                    <span className="text-sm text-charcoal font-medium">Working With Children Check</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="WWCC Certificate Number"
                      value={formData.wwccNumber}
                      onChange={(e) => update("wwccNumber", e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream border border-border-soft text-charcoal placeholder-charcoal-muted rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                    />
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                      <input
                        type="date"
                        required
                        value={formData.wwccExpiry}
                        onChange={(e) => update("wwccExpiry", e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-cream border border-border-soft text-charcoal rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={(e) => updateFile("wwcc", e.target.files?.[0] ?? null)}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-cream border border-border-soft rounded-lg text-charcoal-muted group-hover:text-charcoal group-hover:border-wheat transition-all text-sm">
                      <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {files.wwcc ? files.wwcc.name : "Upload WWCC Certificate"}
                    </div>
                    {uploadStatus.wwcc === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-terracotta" />}
                    {uploadStatus.wwcc === "success" && <CheckCircle className="w-4 h-4 text-sage-dark" />}
                    {uploadStatus.wwcc === "error" && <span className="text-xs text-terracotta">Failed</span>}
                  </label>
                </div>

                <div className="p-4 bg-cream rounded-xl border border-border-soft space-y-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                    <span className="text-sm text-charcoal font-medium">National Police Check</span>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                    <input
                      type="date"
                      required
                      value={formData.policeCheckDate}
                      onChange={(e) => update("policeCheckDate", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-cream border border-border-soft text-charcoal rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                    />
                  </div>
                  <p className="text-xs text-charcoal-muted">Must be issued within the last 12 months.</p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={(e) => updateFile("police_check", e.target.files?.[0] ?? null)}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-cream border border-border-soft rounded-lg text-charcoal-muted group-hover:text-charcoal group-hover:border-wheat transition-all text-sm">
                      <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {files.police_check ? files.police_check.name : "Upload Police Check"}
                    </div>
                    {uploadStatus.police_check === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-terracotta" />}
                    {uploadStatus.police_check === "success" && <CheckCircle className="w-4 h-4 text-sage-dark" />}
                    {uploadStatus.police_check === "error" && <span className="text-xs text-terracotta">Failed</span>}
                  </label>
                </div>

                <div className="p-4 bg-cream rounded-xl border border-border-soft space-y-3">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                    <span className="text-sm text-charcoal font-medium">First Aid Certificate</span>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                    <input
                      type="date"
                      required
                      value={formData.firstAidExpiry}
                      onChange={(e) => update("firstAidExpiry", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-cream border border-border-soft text-charcoal rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                    />
                  </div>
                  <p className="text-xs text-charcoal-muted">HLTAID011 or equivalent. Must be current.</p>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={(e) => updateFile("first_aid", e.target.files?.[0] ?? null)}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-cream border border-border-soft rounded-lg text-charcoal-muted group-hover:text-charcoal group-hover:border-wheat transition-all text-sm">
                      <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {files.first_aid ? files.first_aid.name : "Upload First Aid Certificate"}
                    </div>
                    {uploadStatus.first_aid === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-terracotta" />}
                    {uploadStatus.first_aid === "success" && <CheckCircle className="w-4 h-4 text-sage-dark" />}
                    {uploadStatus.first_aid === "error" && <span className="text-xs text-terracotta">Failed</span>}
                  </label>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4 pt-6 border-t border-border-soft">
                <h3 className="text-xs tracking-[0.2em] uppercase text-terracotta font-medium flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Emergency Contact
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Emergency Contact Name"
                    value={formData.emergencyName}
                    onChange={(e) => update("emergencyName", e.target.value)}
                    className="w-full px-4 py-3 bg-cream border border-border-soft text-charcoal placeholder-charcoal-muted rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Emergency Contact Phone"
                    value={formData.emergencyPhone}
                    onChange={(e) => update("emergencyPhone", e.target.value)}
                    className="w-full px-4 py-3 bg-cream border border-border-soft text-charcoal placeholder-charcoal-muted rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-4 pt-6 border-t border-border-soft">
                <h3 className="text-xs tracking-[0.2em] uppercase text-terracotta font-medium flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Character Reference
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Reference Name (Pastor / Leader)"
                    value={formData.referenceName}
                    onChange={(e) => update("referenceName", e.target.value)}
                    className="w-full px-4 py-3 bg-cream border border-border-soft text-charcoal placeholder-charcoal-muted rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Reference Phone or Email"
                    value={formData.referenceContact}
                    onChange={(e) => update("referenceContact", e.target.value)}
                    className="w-full px-4 py-3 bg-cream border border-border-soft text-charcoal placeholder-charcoal-muted rounded-xl focus:border-wheat focus:outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Declarations */}
              <div className="space-y-4 pt-6 border-t border-border-soft">
                <h3 className="text-xs tracking-[0.2em] uppercase text-terracotta font-medium flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Declarations
                </h3>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.hasReadPolicy}
                    onChange={(e) => update("hasReadPolicy", e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-charcoal/20 bg-cream text-terracotta focus:ring-terracotta/30"
                  />
                  <span className="text-sm text-charcoal-muted group-hover:text-charcoal transition-colors">
                    I have read and understood the Meek Meet Safety Policy and Code of Conduct.
                    I agree to uphold the safety, dignity, and wellbeing of every participant.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.documentsAccurate}
                    onChange={(e) => update("documentsAccurate", e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-charcoal/20 bg-cream text-terracotta focus:ring-terracotta/30"
                  />
                  <span className="text-sm text-charcoal-muted group-hover:text-charcoal transition-colors">
                    I confirm that all documents and information provided are true, accurate,
                    and current. I understand that providing false information will result in
                    permanent disqualification.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.understandsChecks}
                    onChange={(e) => update("understandsChecks", e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-charcoal/20 bg-cream text-terracotta focus:ring-terracotta/30"
                  />
                  <span className="text-sm text-charcoal-muted group-hover:text-charcoal transition-colors">
                    I understand that Meek Meet will verify my WWCC, police check, and first aid
                    certificate directly with issuing authorities. I consent to this verification.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!allChecked || submitting}
                className={`w-full flex items-center justify-center gap-3 px-8 py-4 font-medium tracking-wide text-sm rounded-full transition-all duration-300 shadow-lg ${
                  allChecked && !submitting
                    ? "bg-midnight text-cream hover:bg-midnight-soft hover:shadow-xl"
                    : "bg-charcoal/10 text-charcoal/30 cursor-not-allowed"
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" strokeWidth={1.5} />
                )}
                {submitting ? "Submitting..." : "Submit Application"}
              </button>

              <p className="text-xs text-charcoal-muted text-center leading-relaxed">
                By submitting, you commit to shepherding your community with
                gentleness and integrity. We review every application with prayer
                and thorough verification.
              </p>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
}
