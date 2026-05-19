import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  children: React.ReactNode;
  params: Promise<{ circleId: string }>;
}

export default async function CircleManageLayout({ children, params }: Props) {
  const { circleId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: circle } = await supabase
    .from("circles")
    .select("*")
    .eq("id", circleId)
    .eq("shepherd_id", user.id)
    .single();

  if (!circle) notFound();

  const tabs = [
    { href: `/dashboard/shepherd/${circleId}/questions`, label: "Questions" },
    { href: `/dashboard/shepherd/${circleId}/routine`, label: "Routine" },
    { href: `/dashboard/shepherd/${circleId}/meetings`, label: "Meetings" },
    { href: `/dashboard/shepherd/${circleId}/settings`, label: "Settings" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/shepherd"
          className="text-sm text-charcoal-muted hover:text-terracotta transition-colors mb-4 inline-block"
        >
          ← Back to Shepherd Dashboard
        </Link>
        <h1 className="font-serif text-3xl text-charcoal">{circle.name}</h1>
        <p className="text-charcoal-muted">{circle.location}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border-soft">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-5 py-3 text-sm font-medium text-charcoal-light hover:text-charcoal transition-colors border-b-2 border-transparent hover:border-terracotta/30"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
