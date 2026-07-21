"use client";

import { BookOpen, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AsciiArt from "./AsciiArt";

export default function Footer() {
  return (
    <footer className="relative bg-cream-warm border-t border-border-soft">
      {/* ASCII Olive branch - center top of footer */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2">
        <AsciiArt name="olive" color="sage" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-6">
              <Image
                src="/logo.png"
                alt="Meek Meet"
                width={40}
                height={40}
                className="h-10 w-auto rounded-lg"
              />
            </Link>
            <p className="text-sm text-charcoal-muted leading-relaxed max-w-xs">
              A warm community where the meek gather, share their hearts, and 
              build something beautiful — one new moon at a time.
            </p>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-terracotta mb-6 font-medium">
              Navigate
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "Who We Are" },
                { href: "/about#heart", label: "Our Heart" },
                { href: "/about#journey", label: "The Journey" },
                { href: "/circles", label: "Circles" },
                { href: "/shepherd", label: "Become a Shepherd" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-charcoal-muted hover:text-terracotta transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-terracotta mb-6 font-medium">
              Reach Out
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                <span className="text-sm text-charcoal-muted">hello@meekmeet.org</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-charcoal-muted mt-0.5" strokeWidth={1.5} />
                <span className="text-sm text-charcoal-muted">
                  Serving communities across
                  <br />
                  Australia and beyond
                </span>
              </li>
              <li className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-charcoal-muted" strokeWidth={1.5} />
                <span className="text-sm text-charcoal-muted">Matthew 5:5</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-8 border-t border-border-soft mb-8">
          <p className="font-script text-2xl md:text-3xl text-center text-wheat-dark/40">
            &ldquo;And now these three remain: faith, hope and love. But the greatest of these is love.&rdquo;
          </p>
          <p className="text-xs text-center text-charcoal-muted mt-2 tracking-wide">— 1 Corinthians 13:13</p>
        </div>

        <div className="pt-6 border-t border-border-soft">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-charcoal-muted tracking-wider">
              &copy; {new Date().getFullYear()} Meek Meet. Made with love.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-charcoal-muted hover:text-terracotta transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-xs text-charcoal-muted hover:text-terracotta transition-colors">
                Terms
              </Link>
              <Link href="/terms" className="text-xs text-charcoal-muted hover:text-terracotta transition-colors">
                Code of Love
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
