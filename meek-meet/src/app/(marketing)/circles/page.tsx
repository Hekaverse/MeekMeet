import { createClient } from "@/lib/supabase/server";
import CircleCard from "../_components/circle-card";
import SearchForm from "./_components/search-form";

export const metadata = {
  title: "Find Your Circle | Meek Meet",
};

interface Props {
  searchParams: Promise<{ q?: string; location?: string }>;
}

// Sanitize search input to prevent injection and limit length
function sanitizeSearch(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, 100);
  // Remove any null bytes or control characters
  const cleaned = trimmed.replace(/[\x00-\x1F\x7F]/g, "");
  return cleaned || undefined;
}

export default async function CirclesPage({ searchParams }: Props) {
  const raw = await searchParams;
  const q = sanitizeSearch(raw.q);
  const location = sanitizeSearch(raw.location);

  const supabase = await createClient();

  let dbQuery = supabase
    .from("circles")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (q) {
    dbQuery = dbQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (location) {
    dbQuery = dbQuery.ilike("location", `%${location}%`);
  }

  const { data: circles, error } = await dbQuery;

  if (error) {
    console.error("Failed to fetch circles:", error);
  }

  return (
    <section className="min-h-screen pt-32 pb-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
            Find Your Circle
          </span>
          <h1 className="font-serif text-5xl md:text-6xl text-charcoal mb-6">
            Circles Near You
          </h1>
          <p className="text-lg text-charcoal-muted max-w-2xl mx-auto mb-10">
            Warm gatherings of faith, happening under the new moon across Australia.
            Each circle is shepherded by a faithful leader from your community.
          </p>
          <SearchForm />
        </div>

        {circles && circles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {circles.map((circle, i) => (
              <CircleCard key={circle.id} circle={circle} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-wheat-pale rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="font-serif text-2xl text-wheat-dark">?</span>
            </div>
            <h3 className="font-serif text-xl text-charcoal mb-2">
              No circles found
            </h3>
            <p className="text-charcoal-muted max-w-md mx-auto">
              Try adjusting your search terms or clearing the filters to see all available circles.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
