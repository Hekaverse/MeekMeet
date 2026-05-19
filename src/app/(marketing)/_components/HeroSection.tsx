"use client";

import { motion } from "framer-motion";
import { ChevronDown, BookOpen } from "lucide-react";
import AsciiArt from "./AsciiArt";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grain-texture">
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-cream-warm to-parchment" />
      
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-wheat-pale/40 blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-sage-pale/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-terracotta-pale/20 blur-3xl" />

      {/* Floating scripture watermarks */}
      <div className="absolute top-32 left-8 md:left-20 scripture-watermark text-2xl md:text-3xl max-w-[200px] hidden lg:block">
        Blessed are the meek, for they shall inherit the earth.
      </div>
      <div className="absolute bottom-40 right-8 md:right-20 scripture-watermark text-xl md:text-2xl max-w-[180px] text-right hidden lg:block">
        But the meek shall inherit the land and delight themselves in abundant peace.
      </div>

      {/* ASCII Cross - top right */}
      <div className="absolute top-28 right-8 md:right-16 lg:right-24 opacity-60">
        <AsciiArt name="cross" color="wheat" />
      </div>

      {/* ASCII Dove - bottom left */}
      <div className="absolute bottom-32 left-6 md:left-12 lg:left-20 opacity-50">
        <AsciiArt name="dove" color="sage" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-8"
        >
          <img
            src="/logo.png"
            alt="Meek Meet"
            className="h-32 md:h-40 w-auto mx-auto rounded-2xl shadow-sm"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-wheat-pale/60 rounded-full mb-10"
        >
          <BookOpen className="w-3.5 h-3.5 text-wheat-dark" strokeWidth={1.5} />
          <span className="text-xs tracking-widest uppercase text-wheat-dark font-medium">
            Matthew 5:5
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-charcoal leading-[1.05] mb-8"
        >
          Blessed are
          <br />
          the{" "}
          <span className="text-gradient-warm italic">meek</span>,
          <br />
          <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
            for they shall
            <br />
            inherit the earth.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-lg md:text-xl text-charcoal-muted max-w-2xl mx-auto mb-6 leading-relaxed font-light"
        >
          A warm community where the quiet ones gather, share their hearts, and 
          build something beautiful — together. Under the new moon, every voice matters.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-sm tracking-[0.15em] uppercase text-sage-dark mb-12 font-medium"
        >
          From Australia — Reaching the World
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#join"
            className="px-10 py-4 bg-midnight text-cream font-medium tracking-wide text-sm rounded-full hover:bg-midnight-soft transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Lead Your Community
          </a>
          <a
            href="#who-we-are"
            className="px-10 py-4 border-2 border-charcoal/15 text-charcoal font-medium tracking-wide text-sm rounded-full hover:border-terracotta hover:text-terracotta transition-all duration-300"
          >
            Learn Our Story
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-16 font-script text-2xl md:text-3xl text-wheat-dark/60"
        >
          &ldquo;Come to me, all you who are weary and burdened, and I will give you rest.&rdquo;
          <span className="block text-sm font-sans text-charcoal-muted mt-1 tracking-wide">— Matthew 11:28</span>
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-wheat-dark" />
        </motion.div>
      </motion.div>
    </section>
  );
}
