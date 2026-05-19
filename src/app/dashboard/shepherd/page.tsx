"use client";

import { motion } from "framer-motion";

export default function ShepherdDashboardPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-serif text-3xl text-charcoal mb-2">Shepherd Dashboard</h1>
        <p className="text-charcoal-muted mb-8">
          Manage your circle, questions, routine, and meetings.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          { title: "Questions", desc: "Edit the questions asked in your circle." },
          { title: "Routine", desc: "Define the flow and structure of your gatherings." },
          { title: "Meetings", desc: "Schedule times, locations, and manage RSVPs." },
          { title: "Circle Settings", desc: "Update your circle name, description, and image." },
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
