"use client";

import { motion } from "framer-motion";

export default function CirclesPage() {
  return (
    <section className="min-h-screen pt-32 pb-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
            Find Your Circle
          </span>
          <h1 className="font-serif text-5xl md:text-6xl text-charcoal mb-6">
            Circles Near You
          </h1>
          <p className="text-lg text-charcoal-muted max-w-2xl mx-auto">
            Warm gatherings of faith, happening under the new moon across Australia.
            Each circle is shepherded by a faithful leader from your community.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Placeholder circle cards — will be populated from Supabase in Phase 4 */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-cream-warm rounded-2xl border border-border-soft p-8 text-center"
            >
              <div className="w-16 h-16 bg-wheat-pale rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="font-serif text-2xl text-wheat-dark">{i}</span>
              </div>
              <h3 className="font-serif text-xl text-charcoal mb-2">
                Coming Soon
              </h3>
              <p className="text-sm text-charcoal-muted">
                Circles will appear here once shepherd applications are approved.
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
