"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Send, CheckCircle, Heart } from "lucide-react";
import AsciiArt from "./AsciiArt";

export default function LeaderCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="join" className="relative py-28 bg-midnight text-cream overflow-hidden grain-texture">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-wheat/5 blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-terracotta/5 blur-[120px]" />

      <div className="absolute top-32 right-10 scripture-watermark text-3xl max-w-[220px] text-wheat/5 text-right hidden xl:block">
        Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.
      </div>

      <div className="absolute top-20 left-6 md:left-12 hidden md:block">
        <AsciiArt name="hands" color="wheat" />
      </div>
      <div className="absolute bottom-20 right-6 md:right-12 hidden md:block">
        <AsciiArt name="cross" color="cream" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Copy */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-xs tracking-[0.3em] uppercase text-wheat-light mb-4 block font-medium">
              Step Forward
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6 leading-tight">
              Become a{" "}
              <span className="text-gradient-warm italic">Shepherd</span>
            </h2>
            <div className="ornament-divider max-w-xs mb-8">
              <Heart className="w-4 h-4 text-wheat" strokeWidth={1.5} fill="currentColor" fillOpacity={0.3} />
            </div>
            <p className="text-lg text-cream/70 leading-relaxed mb-6 font-light">
              Every movement begins with one person who says <em>yes</em>. As a
              Meek Meet leader, you become the bridge between your community's
              quiet hopes and the change they long for.
            </p>
            <p className="text-cream/60 leading-relaxed mb-8">
              You will choose the gathering place, curate the questions, welcome
              the conversation, and receive the stories that prove your community's
              needs are real and beautiful. You do not need to be loud.
              You need only be faithful.
            </p>

            <div className="p-6 bg-wheat/5 rounded-2xl border border-wheat/10 mb-8">
              <p className="font-script text-2xl text-wheat/40 mb-2">
                &ldquo;Whoever wants to be first must be slave of all.&rdquo;
              </p>
              <p className="text-sm text-cream/40">— Mark 10:44</p>
            </div>

            <div className="space-y-3">
              {[
                "Automatic new moon scheduling for your location",
                "Warm dashboard to shepherd your community",
                "Curated question library across every domain",
                "Beautiful, anonymised response summaries",
                "Direct support from the Meek Meet family",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-4 h-4 text-wheat flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-sm text-cream/80">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: CTA Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-midnight-warm/60 backdrop-blur-sm rounded-3xl border border-wheat/15 p-8 md:p-10 text-center">
              <div className="w-16 h-16 flex items-center justify-center bg-wheat/10 rounded-2xl mx-auto mb-6">
                <Heart className="w-8 h-8 text-wheat" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl text-cream mb-3">
                Step Forward in Faith
              </h3>
              <p className="text-cream/60 leading-relaxed mb-8 max-w-sm mx-auto">
                The full application takes about 10 minutes. You will need your
                WWCC, police check, and first aid details ready.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Verified identity & safeguarding checks",
                  "Automatic new moon scheduling",
                  "Curated question library",
                  "Anonymised community reports",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-left max-w-xs mx-auto">
                    <CheckCircle className="w-4 h-4 text-wheat flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-cream/80">{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="/shepherd/apply"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-wheat text-midnight font-medium tracking-wide text-sm rounded-full hover:bg-wheat-light hover:shadow-xl transition-all duration-300 shadow-lg"
              >
                <Send className="w-4 h-4" strokeWidth={1.5} />
                Begin Your Application
              </a>

              <p className="text-xs text-cream/30 text-center leading-relaxed mt-6">
                Every application is reviewed with prayer and thorough verification.
                The meek are precious — and protecting them is sacred work.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
