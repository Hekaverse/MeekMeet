"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  MessageSquare,
  Layers,
  ShieldCheck,
  Settings,
  FileBarChart,
  Bell,
} from "lucide-react";
import AsciiArt from "./AsciiArt";

const features = [
  {
    icon: MessageSquare,
    title: "Gentle Questions",
    description:
      "A growing library of thoughtful questions spanning community, environment, housing, and daily life. Leaders choose what their people need most.",
    verse: "Let your conversation be always full of grace. — Colossians 4:6",
  },
  {
    icon: Layers,
    title: "Many Voices, One Story",
    description:
      "Questions flow across domains — local needs, environmental care, safety, affordability, spiritual well-being — weaving many threads into one tapestry.",
    verse: "Though one may be overpowered, two can defend themselves. — Ecclesiastes 4:12",
  },
  {
    icon: ShieldCheck,
    title: "Leaders Are Shepherds",
    description:
      "Verified leaders receive a warm dashboard to manage their community, select questions, adjust timelines, and review responses with care.",
    verse: "Be shepherds of God's flock that is under your care. — 1 Peter 5:2",
  },
  {
    icon: Settings,
    title: "Flexible & Kind",
    description:
      "While the new moon anchors us, leaders can suggest gentle adjustments. Changes are shared transparently with every participant.",
    verse: "Let your 'Yes' be 'Yes,' and your 'No,' 'No.' — Matthew 5:37",
  },
  {
    icon: FileBarChart,
    title: "Stories With Evidence",
    description:
      "Meet data becomes beautiful reports. Trends emerge. Patterns speak. The quietest communities find their voice in numbers that cannot be ignored.",
    verse: "Write on a scroll what you see and send it to the churches. — Revelation 1:11",
  },
  {
    icon: Bell,
    title: "No One Forgotten",
    description:
      "Gentle reminders arrive when a meet is scheduled, a location confirmed, questions ready. Everyone is kept in the loop with kindness.",
    verse: "Encourage one another and build each other up. — 1 Thessalonians 5:11",
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-28 bg-cream grain-texture">
      {/* ASCII Book - top left */}
      <div className="absolute top-16 left-4 md:left-10 hidden md:block">
        <AsciiArt name="book" color="wheat" />
      </div>

      {/* ASCII Dove - bottom right */}
      <div className="absolute bottom-16 right-4 md:right-10 hidden md:block">
        <AsciiArt name="dove" color="sage" />
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
            What We Do
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6">
            Our Tools
          </h2>
          <div className="ornament-divider max-w-xs mx-auto mb-8">
            <span className="text-wheat text-lg">&#10022;</span>
          </div>
          <p className="text-lg text-charcoal-muted max-w-3xl mx-auto leading-relaxed font-light">
            The Meek Meet app is built for people, not programmes. Simple, warm, 
            and driven by one purpose: turning community whispers into clear, loving action.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group card-warm p-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-border-soft hover:border-wheat/30"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-wheat-pale rounded-xl mb-6 group-hover:bg-wheat/20 transition-all duration-500">
                <feature.icon
                  className="w-5 h-5 text-wheat-dark group-hover:text-terracotta transition-colors duration-500"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="font-serif text-xl text-charcoal mb-3 group-hover:text-terracotta transition-colors duration-500">
                {feature.title}
              </h3>
              <p className="text-charcoal-muted text-sm leading-relaxed mb-4">
                {feature.description}
              </p>
              <p className="text-xs text-sage-dark italic border-l-2 border-sage/20 pl-3">
                {feature.verse}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
