"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, HeartPulse, FileCheck, UserCheck, AlertTriangle } from "lucide-react";
import AsciiArt from "./AsciiArt";

const requirements = [
  {
    icon: UserCheck,
    title: "Identity Verified",
    description:
      "Every leader submits government-issued photo ID. We confirm name, address, and identity before anyone is approved.",
    why: "The meek must know exactly who is shepherding them.",
  },
  {
    icon: Shield,
    title: "Working With Children Check",
    description:
      "A current, valid WWCC (or equivalent interstate check) is mandatory. We verify the certificate number and expiry directly.",
    why: "Children are the most vulnerable among us. This is non-negotiable.",
  },
  {
    icon: FileCheck,
    title: "National Police Check",
    description:
      "A police check issued within the last 12 months, clear of serious criminal offences. We do not accept expired or incomplete checks.",
    why: "The past matters when people are placing their trust in you.",
  },
  {
    icon: HeartPulse,
    title: "First Aid Certified",
    description:
      "A current first aid certificate (HLTAID011 or equivalent). Emergencies do not wait. Someone at every meet must be prepared.",
    why: "To love your neighbour includes being ready when they are hurt.",
  },
];

export default function SafetyTrust() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="safety" className="relative py-28 bg-cream-warm grain-texture overflow-hidden">
      {/* ASCII Shield - top left */}
      <div className="absolute top-16 left-4 md:left-10 hidden md:block">
        <AsciiArt name="cross" color="wheat" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
            Duty of Care
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6">
            Safety & Trust
          </h2>
          <div className="ornament-divider max-w-xs mx-auto mb-8">
            <span className="text-wheat text-lg">&#10022;</span>
          </div>
          <p className="text-lg text-charcoal-muted max-w-3xl mx-auto leading-relaxed font-light">
            The meek are precious — and protecting them is sacred work. 
            Every Meek Meet leader must meet strict verification standards 
            before they ever welcome a single soul.
          </p>
        </motion.div>

        {/* Warning banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="flex items-start gap-4 p-6 bg-terracotta-pale/60 rounded-2xl border border-terracotta/20">
            <AlertTriangle className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-charcoal-light font-medium mb-1">
                No exceptions. No shortcuts.
              </p>
              <p className="text-charcoal-muted text-sm leading-relaxed">
                If a leader cannot provide all four verifications, they cannot lead a Meek Meet. 
                This policy exists because the people who come to us — the quiet, the overlooked, 
                the vulnerable — deserve nothing less than complete confidence in their shepherd.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Requirements grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {requirements.map((req, index) => (
            <motion.div
              key={req.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
              className="group p-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-border-soft hover:border-terracotta/30 transition-all duration-500"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-terracotta-pale/60 rounded-xl group-hover:bg-terracotta/10 transition-all duration-500">
                  <req.icon
                    className="w-5 h-5 text-terracotta group-hover:text-terracotta-light transition-colors duration-500"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-charcoal mb-2 group-hover:text-terracotta transition-colors duration-500">
                    {req.title}
                  </h3>
                  <p className="text-charcoal-muted leading-relaxed mb-3">
                    {req.description}
                  </p>
                  <p className="text-sm text-sage-dark italic border-l-2 border-sage/30 pl-3">
                    {req.why}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scripture */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mt-16 max-w-2xl mx-auto"
        >
          <p className="font-script text-2xl md:text-3xl text-wheat-dark/40 mb-2">
            &ldquo;Leave them; they are blind guides. If the blind lead the blind, both will fall into a pit.&rdquo;
          </p>
          <p className="text-sm text-charcoal-muted tracking-wide">— Matthew 15:14</p>
          <p className="text-sm text-charcoal-muted mt-4 leading-relaxed">
            We take this warning seriously. Leadership is not a title — it is a trust. 
            And trust must be earned, verified, and protected.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
