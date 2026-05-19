"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Moon, Clock, MapPin, Sparkles, BookOpen } from "lucide-react";
import AsciiArt from "./AsciiArt";

function getNextNewMoon() {
  const now = new Date();
  const knownNewMoon = new Date("2024-01-11T11:57:00Z");
  const synodicMonth = 29.53058867 * 24 * 60 * 60 * 1000;
  
  let nextNewMoon = new Date(knownNewMoon.getTime());
  while (nextNewMoon <= now) {
    nextNewMoon = new Date(nextNewMoon.getTime() + synodicMonth);
  }
  
  return nextNewMoon;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}

export default function NewMoonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [nextNewMoon] = useState(() => getNextNewMoon());
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCountdown(getCountdown(nextNewMoon));
    const timer = setInterval(() => {
      setCountdown(getCountdown(nextNewMoon));
    }, 1000);
    return () => clearInterval(timer);
  }, [nextNewMoon]);

  return (
    <section id="new-moon" className="relative py-28 bg-parchment overflow-hidden grain-texture">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-wheat-pale/50 blur-[120px]" />

      {/* ASCII Moon - left side */}
      <div className="absolute top-24 left-4 md:left-10 hidden md:block">
        <AsciiArt name="moon" color="wheat" />
      </div>

      {/* ASCII Mountain - right side */}
      <div className="absolute bottom-24 right-4 md:right-10 hidden md:block">
        <AsciiArt name="mountain" color="charcoal" />
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
            Sacred Rhythm
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6">
            The New Moon
          </h2>
          <div className="ornament-divider max-w-xs mx-auto mb-8">
            <span className="text-wheat text-lg">&#10022;</span>
          </div>
          <p className="text-lg text-charcoal-muted max-w-3xl mx-auto leading-relaxed font-light">
            Across Scripture, the new moon marks new beginnings — a monthly reset 
            where darkness gives way to light. We gather when the moon rests, 
            for it is in darkness that even the smallest lights shine brightest.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="flex items-start gap-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-wheat/20">
            <BookOpen className="w-5 h-5 text-wheat-dark flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-charcoal-light italic leading-relaxed mb-2">
                &ldquo;Blow the trumpet at the new moon, at the full moon, on our solemn feast day. 
                For it is a statute for Israel, an ordinance of the God of Jacob.&rdquo;
              </p>
              <p className="text-sm text-charcoal-muted">— Psalm 81:3-4</p>
              <p className="text-sm text-charcoal-muted mt-2">
                From ancient Israel to modern Australia, the new moon has called God's people 
                to pause, reflect, and begin again. We honour this rhythm.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-wheat/25 p-8 md:p-12 shadow-lg shadow-wheat/5">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Moon className="w-5 h-5 text-wheat-dark" strokeWidth={1.5} />
              <span className="text-sm tracking-[0.2em] uppercase text-wheat-dark font-medium">
                Next New Moon Gathering
              </span>
              <Moon className="w-5 h-5 text-wheat-dark" strokeWidth={1.5} />
            </div>

            <div className="text-center mb-8">
              <p className="font-serif text-3xl md:text-4xl text-charcoal mb-2" suppressHydrationWarning>
                {mounted ? formatDate(nextNewMoon) : "Loading..."}
              </p>
              <div className="flex items-center justify-center gap-2 text-charcoal-muted" suppressHydrationWarning>
                <Clock className="w-4 h-4" />
                <span className="text-sm">{mounted ? formatTime(nextNewMoon) : "--:--"}</span>
                <span className="mx-2">&middot;</span>
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Your Local Time</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-lg mx-auto mb-8">
              {[
                { value: countdown.days, label: "Days" },
                { value: countdown.hours, label: "Hours" },
                { value: countdown.minutes, label: "Minutes" },
                { value: countdown.seconds, label: "Seconds" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-4 bg-cream-warm rounded-xl border border-wheat/15"
                >
                  <div className="font-serif text-3xl md:text-4xl text-terracotta mb-1" suppressHydrationWarning>
                    {mounted ? String(item.value).padStart(2, "0") : "--"}
                  </div>
                  <div className="text-xs tracking-wider uppercase text-charcoal-muted">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-4 max-w-lg mx-auto p-5 bg-sage-pale/50 rounded-xl border border-sage/15">
              <Sparkles className="w-5 h-5 text-sage-dark flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-sm text-charcoal-muted leading-relaxed">
                Leaders receive automatic new moon calculations for their location. 
                The timeline is generated, published, and can be gently adjusted if needed. 
                Every meet is anchored to the heavens.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
