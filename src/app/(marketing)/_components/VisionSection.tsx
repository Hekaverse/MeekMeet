"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Eye, Heart, Shield, Globe } from "lucide-react";
import AsciiArt from "./AsciiArt";

const pillars = [
  {
    icon: Eye,
    title: "We See",
    description:
      "Every voice matters. We gather concerns, dreams, and lived experiences through gentle conversations and thoughtful questions.",
    verse: "The Lord is close to the brokenhearted and saves those who are crushed in spirit. — Psalm 34:18",
  },
  {
    icon: Shield,
    title: "We Stand",
    description:
      "Data becomes dignity. We transform quiet stories into powerful evidence, presenting them to those who can make change happen.",
    verse: "Learn to do right; seek justice. Defend the oppressed. — Isaiah 1:17",
  },
  {
    icon: Heart,
    title: "We Lift",
    description:
      "The overlooked find their voice here. We create safe spaces where the gentlest among us speak with confidence and hope.",
    verse: "He raises the poor from the dust and lifts the needy from the ash heap. — Psalm 113:7",
  },
  {
    icon: Globe,
    title: "We Unite",
    description:
      "Catholic, Protestant, Jehovah's Witness, Orthodox — all who hold the Bible dear find common ground in loving their neighbour.",
    verse: "There is one body and one Spirit... one Lord, one faith, one baptism. — Ephesians 4:4-5",
  },
];

export default function VisionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="vision" className="relative py-28 bg-midnight text-cream overflow-hidden grain-texture">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-wheat/5 blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-sage/5 blur-[120px]" />

      {/* Scripture watermark */}
      <div className="absolute top-20 left-10 scripture-watermark text-3xl max-w-[250px] text-wheat/5 hidden xl:block">
        Take my yoke upon you and learn from me, for I am gentle and humble in heart.
      </div>

      {/* ASCII Crown - right side */}
      <div className="absolute top-24 right-6 md:right-12 hidden md:block">
        <AsciiArt name="crown" color="wheat" />
      </div>

      {/* ASCII Tree - bottom left */}
      <div className="absolute bottom-16 left-6 md:left-12 hidden md:block">
        <AsciiArt name="tree" color="sage" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-wheat-light mb-4 block font-medium">
            Our Calling
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6">
            Our Heart
          </h2>
          <div className="ornament-divider max-w-xs mx-auto mb-8">
            <span className="text-wheat text-lg">&#10022;</span>
          </div>
          <p className="text-lg text-cream/70 max-w-3xl mx-auto leading-relaxed font-light">
            Meek Meet is more than meetings. It is a divine invitation made practical.
            When the gentle come together with purpose and faith, they do not merely 
            inherit the earth — <span className="text-wheat-light italic">they heal it.</span>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
              className="group p-8 bg-midnight-warm/60 backdrop-blur-sm rounded-2xl border border-wheat/10 hover:border-wheat/30 transition-all duration-500"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-wheat/10 rounded-xl group-hover:bg-wheat/20 transition-all duration-500">
                  <pillar.icon
                    className="w-5 h-5 text-wheat-light group-hover:text-wheat transition-colors duration-500"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-cream mb-3 group-hover:text-wheat-light transition-colors duration-500">
                    {pillar.title}
                  </h3>
                  <p className="text-cream/60 leading-relaxed mb-4">
                    {pillar.description}
                  </p>
                  <p className="text-sm text-wheat/40 italic font-light border-l-2 border-wheat/20 pl-3">
                    {pillar.verse}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center mt-16"
        >
          <p className="font-script text-3xl md:text-4xl text-wheat/30">
            &ldquo;The Spirit of the Sovereign Lord is on me... to preach good news to the poor.&rdquo;
          </p>
          <p className="text-sm text-cream/40 mt-2 tracking-wide">— Isaiah 61:1</p>
        </motion.div>
      </div>
    </section>
  );
}
