import { getApplications } from "../actions";
import { CheckCircle, XCircle, Clock, User, Mail, MapPin, Church } from "lucide-react";
import { ApproveButton, RejectButton } from "./_components/action-buttons";

export const revalidate = 0;

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: "pending" | "approved" | "rejected" }>;
}) {
  const { status } = await searchParams;

  let applications: any[] = [];
  let error: string | null = null;

  try {
    applications = await getApplications(status);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const tabs = [
    { label: "Pending", value: "pending" as const, icon: Clock },
    { label: "Approved", value: "approved" as const, icon: CheckCircle },
    { label: "Rejected", value: "rejected" as const, icon: XCircle },
  ];

  if (error) {
    return (
      <div className="p-8 bg-terracotta-pale rounded-2xl border border-terracotta/20">
        <h1 className="font-serif text-xl text-terracotta mb-2">Error loading applications</h1>
        <p className="text-sm text-charcoal">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal mb-2">Shepherd Applications</h1>
      <p className="text-charcoal-muted mb-8">
        Review and verify applications from those called to lead.
      </p>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <a
          href="/dashboard/admin/applications"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !status
              ? "bg-midnight text-cream"
              : "bg-cream-warm text-charcoal hover:bg-wheat-pale"
          }`}
        >
          All
        </a>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <a
              key={tab.value}
              href={`/dashboard/admin/applications?status=${tab.value}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                status === tab.value
                  ? "bg-midnight text-cream"
                  : "bg-cream-warm text-charcoal hover:bg-wheat-pale"
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {tab.label}
            </a>
          );
        })}
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-cream-warm rounded-2xl border border-border-soft">
          <p className="text-charcoal-muted">No applications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <div
              key={app.id}
              className="bg-cream-warm rounded-2xl border border-border-soft p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left: Applicant Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.status === "pending"
                          ? "bg-wheat-pale text-wheat-dark"
                          : app.status === "approved"
                          ? "bg-sage-pale text-sage-dark"
                          : "bg-terracotta-pale text-terracotta"
                      }`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                    <span className="text-xs text-charcoal-muted">
                      Submitted {new Date(app.created_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                      <span className="text-sm text-charcoal font-medium">{app.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                      <span className="text-sm text-charcoal">{app.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sage" strokeWidth={1.5} />
                      <span className="text-sm text-charcoal">{app.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Church className="w-4 h-4 text-wheat" strokeWidth={1.5} />
                      <span className="text-sm text-charcoal capitalize">{app.denomination}</span>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="grid sm:grid-cols-3 gap-3 pt-4 border-t border-border-soft">
                    <div className="text-sm">
                      <span className="text-xs text-charcoal-muted block">WWCC</span>
                      <span className="text-charcoal">{app.wwcc_number || "—"}</span>
                      {app.wwcc_expiry && (
                        <span className="text-xs text-charcoal-muted block">
                          Expires {new Date(app.wwcc_expiry).toLocaleDateString("en-AU")}
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-xs text-charcoal-muted block">Police Check</span>
                      {app.police_check_date ? (
                        <span className="text-charcoal">
                          {new Date(app.police_check_date).toLocaleDateString("en-AU")}
                        </span>
                      ) : (
                        <span className="text-charcoal-muted">—</span>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-xs text-charcoal-muted block">First Aid</span>
                      {app.first_aid_expiry ? (
                        <span className="text-charcoal">
                          Expires {new Date(app.first_aid_expiry).toLocaleDateString("en-AU")}
                        </span>
                      ) : (
                        <span className="text-charcoal-muted">—</span>
                      )}
                    </div>
                  </div>

                  {/* Emergency & Reference */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-border-soft text-sm">
                    <div>
                      <span className="text-xs text-charcoal-muted block">Emergency Contact</span>
                      <span className="text-charcoal">{app.emergency_name}</span>
                      <span className="text-charcoal-muted block">{app.emergency_phone}</span>
                    </div>
                    <div>
                      <span className="text-xs text-charcoal-muted block">Reference</span>
                      <span className="text-charcoal">{app.reference_name}</span>
                      <span className="text-charcoal-muted block">{app.reference_contact}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                {app.status === "pending" && (
                  <div className="flex lg:flex-col gap-3">
                    <ApproveButton applicationId={app.id} userId={app.user_id} />
                    <RejectButton applicationId={app.id} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
