"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, TrendingUp, MessageCircle, Heart, Users, Loader2, Quote } from "lucide-react";
import Link from "next/link";

interface InsightData {
  id: string;
  region_name?: string;
  response_count: number;
  circle_count?: number;
  top_themes: Array<{ theme: string; count: number; sentiment: string; sample_quotes: string[] }>;
  sentiment_summary: { positive: number; neutral: number; negative: number; dominant: string };
  consensus_items: Array<{ statement: string; agreement_level: number; evidence: string }>;
  raw_summary: string;
}

export default function VoicePage() {
  const [globalInsight, setGlobalInsight] = useState<InsightData | null>(null);
  const [regionalInsights, setRegionalInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/public/insights")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setGlobalInsight(data.global);
        setRegionalInsights(data.regional ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="min-h-screen pt-32 pb-20 bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen pt-32 pb-20 bg-cream flex items-center justify-center">
        <p className="text-charcoal-muted">
          Insights could not be loaded right now. Please try again later.
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-20 bg-cream">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
            The Voice of the Meek
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-6">
            What Communities Are Saying
          </h1>
          <p className="text-lg text-charcoal-muted max-w-2xl mx-auto">
            Anonymised, aggregated insights from Meek Meet circles across regions.
            No individual voices are exposed — only the patterns that emerge when many speak together.
          </p>
        </motion.div>

        {globalInsight ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="bg-midnight text-cream rounded-3xl p-8 md:p-12 mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-wheat" strokeWidth={1.5} />
              <span className="text-xs tracking-[0.2em] uppercase text-wheat">Global Snapshot</span>
            </div>
            <p className="font-serif text-2xl md:text-3xl leading-relaxed mb-8">
              {globalInsight.raw_summary}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-cream/10 rounded-xl p-4 text-center">
                <Users className="w-5 h-5 text-wheat mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-2xl font-serif">{globalInsight.response_count}</p>
                <p className="text-xs text-cream/60 uppercase tracking-wide">Responses</p>
              </div>
              <div className="bg-cream/10 rounded-xl p-4 text-center">
                <TrendingUp className="w-5 h-5 text-wheat mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-2xl font-serif capitalize">{globalInsight.sentiment_summary.dominant}</p>
                <p className="text-xs text-cream/60 uppercase tracking-wide">Dominant Sentiment</p>
              </div>
              <div className="bg-cream/10 rounded-xl p-4 text-center">
                <MessageCircle className="w-5 h-5 text-wheat mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-2xl font-serif">{globalInsight.top_themes.length}</p>
                <p className="text-xs text-cream/60 uppercase tracking-wide">Top Themes</p>
              </div>
              <div className="bg-cream/10 rounded-xl p-4 text-center">
                <Heart className="w-5 h-5 text-wheat mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-2xl font-serif">{globalInsight.consensus_items.length}</p>
                <p className="text-xs text-cream/60 uppercase tracking-wide">Consensus Areas</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-cream-warm rounded-3xl border border-border-soft p-10 text-center mb-12">
            <p className="text-charcoal-muted">Global insights will appear once circles begin sharing their voices.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {regionalInsights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * i }}
              className="bg-cream-warm rounded-2xl border border-border-soft p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
                <h3 className="font-serif text-xl text-charcoal">{insight.region_name}</h3>
              </div>
              <p className="text-sm text-charcoal-muted mb-4">
                {insight.response_count} responses · {insight.circle_count ?? 0} circles ·{" "}
                <span className="capitalize">{insight.sentiment_summary.dominant} sentiment</span>
              </p>
              <p className="text-charcoal mb-4">{insight.raw_summary}</p>
              {insight.top_themes.length > 0 && (
                <div className="space-y-2">
                  {insight.top_themes.slice(0, 3).map((theme, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm text-charcoal">
                      <Quote className="w-3.5 h-3.5 text-wheat flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span>{theme.theme}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-charcoal-muted mb-4">
            Want your community&apos;s voice to be heard?
          </p>
          <Link
            href="/shepherd/apply"
            className="inline-flex items-center gap-2 px-8 py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm tracking-wide"
          >
            Start a Circle
          </Link>
        </div>
      </div>
    </section>
  );
}
