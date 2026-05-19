"use client";

import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";

export default function ShepherdApplyPage() {
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
            This form will be connected to our application system in a future update.
            For now, please reach out via email to express your interest.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-cream-warm rounded-3xl border border-border-soft p-10 text-center"
        >
          <div className="w-16 h-16 bg-wheat-pale rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-6 h-6 text-wheat-dark" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl text-charcoal mb-4">
            Applications Opening Soon
          </h2>
          <p className="text-charcoal-muted mb-8 max-w-md mx-auto">
            We are preparing a thoughtful application process to ensure every
            shepherd is equipped to lead with gentleness and integrity.
          </p>
          <a
            href="mailto:hello@meekmeet.org"
            className="inline-flex items-center gap-2 px-8 py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all duration-300 text-sm tracking-wide"
          >
            <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
            Email Us Your Interest
          </a>
        </motion.div>
      </div>
    </section>
  );
}
