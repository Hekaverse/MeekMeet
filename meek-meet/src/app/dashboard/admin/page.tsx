import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  MapPin,
  Calendar,
  CalendarCheck,
  FileText,
  Heart,
  MessageCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data: stats } = await supabase.rpc("get_admin_stats");

  const cards = [
    { label: "Shepherds", value: stats?.total_shepherds, icon: Users, color: "text-terracotta" },
    { label: "Circles", value: stats?.total_circles, icon: MapPin, color: "text-sage" },
    { label: "Scheduled Meetings", value: stats?.total_scheduled_meetings, icon: Calendar, color: "text-wheat-dark" },
    { label: "Completed Meetings", value: stats?.total_completed_meetings, icon: CalendarCheck, color: "text-sage" },
    { label: "Pending Applications", value: stats?.pending_applications, icon: FileText, color: "text-terracotta" },
    { label: "Members", value: stats?.total_members, icon: Heart, color: "text-wheat-dark" },
    { label: "Responses", value: stats?.total_responses, icon: MessageCircle, color: "text-sage" },
    { label: "Active RSVPs", value: stats?.active_rsvps, icon: CheckCircle, color: "text-terracotta" },
  ];

  const quickLinks = [
    { href: "/dashboard/admin/applications", label: "Review Applications", description: "Approve or reject shepherd applications" },
    { href: "/dashboard/admin/shepherds", label: "Shepherds", description: "All active shepherds and their circles" },
    { href: "/dashboard/admin/circles", label: "Circles", description: "Every circle across the community" },
    { href: "/dashboard/admin/meetings", label: "Meetings", description: "Recent and upcoming gatherings" },
    { href: "/dashboard/admin/inbox", label: "Inbox", description: "Messages from the community" },
    { href: "/dashboard/admin/questions", label: "Questions", description: "Fresh news questions for circles" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-charcoal mb-2">Admin Overview</h1>
      <p className="text-charcoal-muted mb-8">
        A bird&apos;s-eye view of the Meek Meet community.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-cream-warm rounded-2xl border border-border-soft p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${card.color}`} strokeWidth={1.5} />
                <span className="text-xs tracking-wider uppercase text-charcoal-muted font-medium">
                  {card.label}
                </span>
              </div>
              <p className="font-serif text-4xl text-charcoal">
                {card.value ?? "—"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <h2 className="font-serif text-2xl text-charcoal mb-6">Manage</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-cream-warm rounded-2xl border border-border-soft p-6 hover:border-wheat transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-charcoal">{link.label}</h3>
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-terracotta transition-colors" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-charcoal-muted">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
