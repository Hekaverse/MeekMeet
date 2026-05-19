"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, MapPin, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<{
    full_name: string | null;
    location: string | null;
    role: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, location, role")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name ?? "");
        setLocation(data.location ?? "");
      }
      setIsLoading(false);
    }

    loadProfile();
  }, [supabase]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null, location: location || null })
      .eq("id", user.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-wheat animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl text-charcoal mb-2">Your Profile</h1>
      <p className="text-charcoal-muted mb-8">
        Update your name and location to help circles find you.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-cream-warm rounded-2xl border border-border-soft p-8 space-y-6"
      >
        {/* Role badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-wheat-pale flex items-center justify-center">
            <User className="w-5 h-5 text-wheat-dark" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-charcoal-muted">Role</p>
            <p className="text-sm font-medium text-char capitalize">
              {profile?.role ?? "member"}
            </p>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-sm text-charcoal-light font-medium">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm text-charcoal-light font-medium flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Suburb / City"
            className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm tracking-wide font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </motion.div>
    </div>
  );
}
