"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth-provider";

const navLinks = [
  { href: "/about", label: "Who We Are" },
  { href: "/voice", label: "The Voice" },
  { href: "/circles", label: "Circles" },
  { href: "/#new-moon", label: "New Moon" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();

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
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="Meek Meet"
              width={48}
              height={48}
              className="h-12 w-auto rounded-lg group-hover:opacity-90 transition-opacity duration-300"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="link-warm text-sm tracking-wide text-charcoal-light hover:text-charcoal transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-2.5 text-sm tracking-wide bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all duration-300 shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/shepherd"
                  className="px-6 py-2.5 text-sm tracking-wide bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all duration-300 shadow-sm"
                >
                  Become a Shepherd
                </Link>
                <Link
                  href="/login"
                  className="text-sm tracking-wide text-charcoal-light hover:text-terracotta transition-colors duration-300"
                >
                  Log In
                </Link>
              </>
            )}
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
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-sm tracking-wide text-charcoal-light hover:text-terracotta transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm tracking-wide bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all duration-300"
                >
                  <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/shepherd"
                    onClick={() => setIsOpen(false)}
                    className="inline-block px-6 py-3 text-sm tracking-wide bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all duration-300"
                  >
                    Become a Shepherd
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm tracking-wide text-charcoal-light hover:text-terracotta transition-colors"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
