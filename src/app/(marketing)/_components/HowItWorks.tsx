"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, MapPin, Calendar, Users, BarChart3, Landmark } from "lucide-react";
import AsciiArt from "./AsciiArt";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "A Leader Steps Forward",
    description:
      "Someone in a suburb, town, or city feels the call. They register their heart for their community and become a shepherd of a local Meek Meet.",
    verse: "Whoever wants to become great among you must be your servant. — Matthew 20:26",
  },
  {
    number: "02",
    icon: MapPin,
    title: "A Place is Chosen",
    description:
      "A park bench, a church hall, a community centre — somewhere warm and welcoming where anyone can find a seat and be heard.",
    verse: "For where two or three gather in my name, there am I with them. — Matthew 18:20",
  },
  {
    number: "03",
    icon: Calendar,
    title: "The New Moon Whispers",
    description:
      "Meek Meet calculates the next new moon for that place. The date arrives like a gentle promise. The community prepares their hearts.",
    verse: "He made the moon to mark the seasons. — Psalm 104:19",
  },
  {
    number: "04",
    icon: Users,
    title: "We Gather in the Dark",
    description:
      "On the night of the new moon, when the sky is darkest, our small lights shine brightest. Stories are shared. Tears are welcomed. Hope is kindled.",
    verse: "The light shines in the darkness, and the darkness has not overcome it. — John 1:5",
  },
  {
    number: "05",
    icon: BarChart3,
    title: "Voices Become Numbers",
    description:
      "Through the Meek Meet app, participants share their concerns about community, housing, environment, and life. Every answer is a prayer counted.",
    verse: "You number my wanderings; put my tears into Your bottle. — Psalm 56:8",
  },
  {
    number: "06",
    icon: Landmark,
    title: "Gentleness Moves Mountains",
    description:
      "The data becomes a story too loud to ignore. Reports reach councils, leaders, and decision-makers. The meek do not shout — they prove.",
    verse: "Truly I tell you, if you have faith as small as a mustard seed, you can say to this mountain, 'Move.' — Matthew 17:20",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="relative py-28 bg-cream-warm grain-texture">
      {/* ASCII People gathering - top right */}
      <div className="absolute top-16 right-4 md:right-10 hidden md:block">
        <AsciiArt name="people" color="charcoal" />
      </div>

      {/* ASCII Lamp - bottom left */}
      <div className="absolute bottom-20 left-4 md:left-10 hidden md:block">
        <AsciiArt name="lamp" color="wheat" />
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
            The Journey
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6">
            How It Works
          </h2>
          <div className="ornament-divider max-w-xs mx-auto mb-8">
            <span className="text-wheat text-lg">&#10022;</span>
          </div>
          <p className="text-lg text-charcoal-muted max-w-3xl mx-auto leading-relaxed font-light">
            From one person's courage to a movement that reshapes neighbourhoods.
            This is the gentle path from faith to action.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-wheat/50 via-wheat/20 to-transparent hidden sm:block" />

          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className={`relative flex flex-col md:flex-row items-start gap-6 md:gap-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <div className={`flex items-center gap-3 mb-3 ${index % 2 === 0 ? "md:justify-end" : "md:justify-start"}`}>
                    <span className="font-script text-4xl text-wheat/40">
                      {step.number}
                    </span>
                    <h3 className="font-serif text-2xl md:text-3xl text-charcoal">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-charcoal-muted leading-relaxed max-w-md ml-0 md:mx-auto mb-3">
                    {step.description}
                  </p>
                  <p className={`text-sm text-sage-dark italic font-light max-w-md ml-0 md:mx-auto ${index % 2 === 0 ? "md:ml-auto md:mr-0" : ""}`}>
                    {step.verse}
                  </p>
                </div>

                <div className="relative flex-shrink-0 w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-wheat/20 z-10">
                  <step.icon className="w-6 h-6 text-terracotta" strokeWidth={1.5} />
                </div>

                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
