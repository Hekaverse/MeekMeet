"use client";

import { useState, useTransition, useEffect } from "react";
import { getAuthorities, createAuthority, deleteAuthority, seedSampleAuthorities } from "./actions";
import { Building2, Mail, MapPin, Plus, Trash2, Globe, Loader2, AlertCircle } from "lucide-react";

interface Authority {
  id: string;
  authority_type: string;
  region_type: string;
  region_code: string;
  region_name: string;
  name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  office_address?: string | null;
  website_url?: string | null;
}

const authorityTypeLabels: Record<string, string> = {
  council: "Local Council",
  mp_state: "State MP",
  mp_federal: "Federal MP",
  government_department: "Department",
  organisation: "Organisation",
};

export default function AuthoritiesPage() {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    authority_type: "council",
    region_type: "lga",
    region_code: "",
    region_name: "",
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    office_address: "",
    website_url: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAuthorities();
      setAuthorities(data as Authority[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load authorities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createAuthority(form);
        setForm({
          authority_type: "council",
          region_type: "lga",
          region_code: "",
          region_name: "",
          name: "",
          contact_name: "",
          contact_email: "",
          contact_phone: "",
          office_address: "",
          website_url: "",
        });
        setShowForm(false);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create authority");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this authority?")) return;
    startTransition(async () => {
      try {
        await deleteAuthority(id);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete authority");
      }
    });
  };

  const handleSeed = () => {
    startTransition(async () => {
      try {
        await seedSampleAuthorities();
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to seed authorities");
      }
    });
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="font-serif text-2xl text-charcoal mb-6">Authorities</h1>
        <div className="flex items-center gap-3 text-charcoal-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-charcoal">Authorities</h1>
          <p className="text-charcoal-muted">Manage councils, MPs, and departments that receive community reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={isPending}
            className="px-4 py-2 bg-cream-warm border border-border-soft text-charcoal rounded-full hover:border-wheat transition-colors text-sm disabled:opacity-50"
          >
            Seed Samples
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-colors text-sm flex items-center gap-2"
          >
            {showForm ? "Cancel" : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add Authority"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-terracotta-pale rounded-xl text-terracotta text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-cream-warm rounded-xl border border-border-soft p-6 mb-8 grid sm:grid-cols-2 gap-4">
          <select
            value={form.authority_type}
            onChange={(e) => setForm({ ...form, authority_type: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm"
          >
            {Object.entries(authorityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={form.region_type}
            onChange={(e) => setForm({ ...form, region_type: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm"
          >
            <option value="lga">LGA</option>
            <option value="state_electorate">State Electorate</option>
            <option value="federal_electorate">Federal Electorate</option>
            <option value="state">State</option>
            <option value="country">Country</option>
          </select>
          <input
            placeholder="Region code (e.g., sydney)"
            value={form.region_code}
            onChange={(e) => setForm({ ...form, region_code: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm"
          />
          <input
            placeholder="Region name (e.g., City of Sydney)"
            value={form.region_name}
            onChange={(e) => setForm({ ...form, region_name: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm"
          />
          <input
            placeholder="Authority name (e.g., Lord Mayor of Sydney)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm sm:col-span-2"
          />
          <input
            placeholder="Contact name"
            value={form.contact_name}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm"
          />
          <input
            placeholder="Contact email"
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm"
          />
          <input
            placeholder="Contact phone"
            value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm"
          />
          <input
            placeholder="Website URL"
            value={form.website_url}
            onChange={(e) => setForm({ ...form, website_url: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm"
          />
          <input
            placeholder="Office address"
            value={form.office_address}
            onChange={(e) => setForm({ ...form, office_address: e.target.value })}
            className="px-4 py-3 bg-cream border border-border-soft rounded-xl text-sm sm:col-span-2"
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !form.region_code || !form.region_name || !form.name}
            className="sm:col-span-2 py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Authority"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {authorities.map((a) => (
          <div key={a.id} className="bg-cream-warm rounded-xl border border-border-soft p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                  <span className="font-medium text-charcoal">{a.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-wheat-pale text-wheat-dark rounded-full">
                    {authorityTypeLabels[a.authority_type]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-charcoal-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {a.region_name}
                  </span>
                  {a.contact_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {a.contact_email}
                    </span>
                  )}
                  {a.website_url && (
                    <a
                      href={a.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-terracotta transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Website
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={isPending}
                className="p-2 text-charcoal-muted hover:text-terracotta transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {authorities.length === 0 && (
          <div className="text-center py-12 bg-cream-warm rounded-xl border border-border-soft">
            <p className="text-charcoal-muted">No authorities yet. Add one or seed sample data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
