"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Heart, Users, Lightbulb, Leaf } from "lucide-react";
import AsciiArt from "./AsciiArt";

const values = [
  {
    icon: Heart,
    title: "We Listen First",
    description:
      "Before we speak, we listen. Before we lead, we serve. Every concern shared in our circle is held with tenderness and respect.",
    verse: "My dear brothers and sisters, take note of this: Everyone should be quick to listen. — James 1:19",
  },
  {
    icon: Users,
    title: "We Gather as Family",
    description:
      "No hierarchy, no performance. Just ordinary people coming together in parks and halls, sharing bread and burdens alike.",
    verse: "How good and pleasant it is when God's people live together in unity! — Psalm 133:1",
  },
  {
    icon: Lightbulb,
    title: "We Speak Truth",
    description:
      "Your concerns become data. Your hopes become evidence. We transform quiet prayers into powerful, measurable calls for change.",
    verse: "Speak up for those who cannot speak for themselves. — Proverbs 31:8",
  },
  {
    icon: Leaf,
    title: "We Grow Together",
    description:
      "Month by month, new moon by new moon, we plant seeds of justice in our neighborhoods and watch them bear fruit.",
    verse: "They will be called oaks of righteousness, a planting of the Lord. — Isaiah 61:3",
  },
];

export default function WhoWeAre() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="who-we-are" className="relative py-28 bg-cream grain-texture">
      {/* ASCII Olive Branch - left side */}
      <div className="absolute top-20 left-4 md:left-8 hidden md:block">
        <AsciiArt name="olive" color="sage" />
      </div>
      
      {/* ASCII Flame - right side */}
      <div className="absolute bottom-20 right-4 md:right-8 hidden md:block">
        <AsciiArt name="flame" color="terracotta" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
            Our Foundation
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6">
            Who We Are
          </h2>
          <div className="ornament-divider max-w-xs mx-auto mb-8">
            <span className="text-wheat text-lg">&#10022;</span>
          </div>
          <p className="text-lg text-charcoal-muted max-w-3xl mx-auto leading-relaxed font-light">
            Meek Meet is not an organisation. It is a movement of gentle hearts. 
            We are the ones who have been overlooked, the ones who serve in silence, 
            the ones who believe that love — not loudness — changes the world.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
              className="group card-warm p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-border-soft hover:border-wheat/40"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-wheat-pale rounded-xl group-hover:bg-wheat/20 transition-all duration-500">
                  <value.icon
                    className="w-5 h-5 text-wheat-dark group-hover:text-terracotta transition-colors duration-500"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-charcoal mb-3 group-hover:text-terracotta transition-colors duration-500">
                    {value.title}
                  </h3>
                  <p className="text-charcoal-muted leading-relaxed mb-4">
                    {value.description}
                  </p>
                  <p className="text-sm text-sage-dark italic font-light border-l-2 border-sage/30 pl-3">
                    {value.verse}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
