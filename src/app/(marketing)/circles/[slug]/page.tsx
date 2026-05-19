import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

// Static export fallback — will be replaced with dynamic data in Phase 4
export async function generateStaticParams() {
  return [{ slug: "sample" }];
}

export default async function CircleDetailPage({ params }: Props) {
  const { slug } = await params;

  if (slug !== "sample") {
    notFound();
  }

  return (
    <section className="min-h-screen pt-32 pb-20 bg-cream">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
            Circle Details
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-4">
            Sample Circle
          </h1>
          <p className="text-charcoal-muted">
            This page will display full circle details, meeting times, location,
            and RSVP functionality once connected to Supabase.
          </p>
        </div>
      </div>
    </section>
  );
}
