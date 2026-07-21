"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, X } from "lucide-react";

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/circles?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    setLocation("");
    router.push("/circles");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or description..."
          className="w-full pl-10 pr-4 py-3 bg-cream-warm border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-2 focus:ring-wheat"
        />
      </div>
      <div className="relative flex-1 sm:max-w-[200px]">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or area..."
          className="w-full pl-10 pr-4 py-3 bg-cream-warm border border-border-soft rounded-xl text-sm text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:ring-2 focus:ring-wheat"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-6 py-3 bg-midnight text-cream text-sm rounded-full hover:bg-midnight-soft transition-all"
        >
          Search
        </button>
        {(searchParams.get("q") || searchParams.get("location")) && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-3 border border-charcoal/10 text-charcoal text-sm rounded-full hover:border-terracotta hover:text-terracotta transition-all"
            title="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
