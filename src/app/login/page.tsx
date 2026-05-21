"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setIsMagicLinkSent(true);
    }

    setIsLoading(false);
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-cream grain-texture">
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-cream-warm to-parchment" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md mx-auto px-6"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-charcoal-muted hover:text-terracotta transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to home
        </Link>

        <div className="text-center mb-10">
          <img
            src="/logo.png"
            alt="Meek Meet"
            className="h-16 w-auto mx-auto rounded-xl mb-6"
          />
          <h1 className="font-serif text-3xl text-charcoal mb-2">
            Welcome Back
          </h1>
          <p className="text-charcoal-muted">
            Sign in to join your circle and connect with your community.
          </p>
        </div>

        {isMagicLinkSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-cream-warm rounded-3xl border border-border-soft p-8 text-center"
          >
            <div className="w-16 h-16 bg-wheat-pale rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-wheat-dark" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-xl text-charcoal mb-2">
              Check your email
            </h2>
            <p className="text-sm text-charcoal-muted">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
          </motion.div>
        ) : (
          <div className="bg-cream-warm rounded-3xl border border-border-soft p-8 space-y-6">
            {error && (
              <div className="p-3 bg-terracotta-pale rounded-xl text-sm text-terracotta">
                {error}
              </div>
            )}

            {/* Magic Link */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <label className="text-sm text-charcoal-light font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none transition-colors text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all duration-300 text-sm tracking-wide font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Magic Link"
                )}
              </button>
            </form>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border-soft" />
              <span className="text-xs text-charcoal-muted uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border-soft" />
            </div>

            {/* OAuth */}
            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 border-2 border-charcoal/10 rounded-full hover:border-terracotta hover:text-terracotta transition-all duration-300 text-sm text-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        <p className="text-center text-xs text-charcoal-muted mt-6">
          By signing in, you agree to our Terms and Code of Love.
        </p>
      </motion.div>
    </section>
  );
}
