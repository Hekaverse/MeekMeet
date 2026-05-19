"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Users } from "lucide-react";
import Link from "next/link";
import type { Circle } from "@/types/supabase";

interface CircleCardProps {
  circle: Circle;
  index?: number;
  meetingCount?: number;
}

export default function CircleCard({ circle, index = 0, meetingCount = 0 }: CircleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        href={`/circles/${circle.slug}`}
        className="group block bg-cream-warm rounded-2xl border border-border-soft overflow-hidden card-warm"
      >
        <div className="h-48 bg-midnight/5 relative overflow-hidden">
          {circle.image_url ? (
            <img
              src={circle.image_url}
              alt={circle.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-4xl text-wheat/20">{circle.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/40 to-transparent" />
        </div>

        <div className="p-6">
          <h3 className="font-serif text-xl text-charcoal mb-2 group-hover:text-terracotta transition-colors">
            {circle.name}
          </h3>

          <p className="text-sm text-charcoal-muted line-clamp-2 mb-4">
            {circle.description || "A warm gathering under the new moon."}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-muted">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-terracotta" strokeWidth={1.5} />
              {circle.location}
            </span>
            {circle.meeting_place && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-wheat" strokeWidth={1.5} />
                {circle.meeting_place}
              </span>
            )}
            {meetingCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sage" strokeWidth={1.5} />
                {meetingCount} upcoming
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
