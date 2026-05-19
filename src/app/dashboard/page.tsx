"use client";

import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-serif text-3xl text-charcoal mb-2">Dashboard</h1>
        <p className="text-charcoal-muted mb-8">
          Welcome to your Meek Meet dashboard.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "My Circles", desc: "Circles you have joined will appear here." },
          { title: "Upcoming Meetings", desc: "Your next gatherings under the new moon." },
          { title: "Nearby Circles", desc: "Discover circles meeting near your location." },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
            className="bg-cream-warm rounded-2xl border border-border-soft p-6"
          >
            <h3 className="font-serif text-lg text-charcoal mb-2">{card.title}</h3>
            <p className="text-sm text-charcoal-muted">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
