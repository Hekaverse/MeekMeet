"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "#who-we-are", label: "Who We Are" },
  { href: "#vision", label: "Our Heart" },
  { href: "#how-it-works", label: "The Journey" },
  { href: "#new-moon", label: "New Moon" },
  { href: "#features", label: "What We Do" },
  { href: "#safety", label: "Safety" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-cream/90 border-b border-border-soft"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Meek Meet"
              className="h-12 w-auto rounded-lg group-hover:opacity-90 transition-opacity duration-300"
            />
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="link-warm text-sm tracking-wide text-charcoal-light hover:text-charcoal transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#join"
              className="px-6 py-2.5 text-sm tracking-wide bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all duration-300 shadow-sm"
            >
              Become a Leader
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-charcoal hover:text-terracotta transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-cream-warm border-b border-border-soft overflow-hidden"
          >
            <div className="px-6 py-8 space-y-5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-sm tracking-wide text-charcoal-light hover:text-terracotta transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#join"
                onClick={() => setIsOpen(false)}
                className="inline-block px-6 py-3 text-sm tracking-wide bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all duration-300"
              >
                Become a Leader
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
