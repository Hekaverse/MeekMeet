"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { generateCircleReport } from "@/lib/reports/generate-report";
import { submitReportToAuthority } from "@/lib/reports/submit-to-authority";
import { FileText, Loader2, Printer, Quote, TrendingUp, Users, Calendar, Send, CheckCircle } from "lucide-react";

export default function ReportsPage() {
  const params = useParams();
  const circleId = params.circleId as string;
  const [report, setReport] = useState<Awaited<ReturnType<typeof generateCircleReport>> | null>(null);
  const [timeWindow, setTimeWindow] = useState<"all_time" | "last_30_days" | "last_90_days">("all_time");
  const [isPending, startTransition] = useTransition();
  const [submitPending, startSubmit] = useTransition();
  const [submittedTo, setSubmittedTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const r = await generateCircleReport(circleId, timeWindow);
        setReport(r);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate report");
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = () => {
    if (!report) return;
    setError(null);
    startSubmit(async () => {
      try {
        const result = await submitReportToAuthority(report.id);
        setSubmittedTo(result.authority);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit report");
      }
    });
  };

  if (!report) {
    return (
      <div className="max-w-3xl">
        <h2 className="font-serif text-2xl text-charcoal mb-6">Community Report</h2>

        {error && (
          <div className="mb-6 p-4 bg-terracotta-pale rounded-xl text-terracotta text-sm">
            {error}
          </div>
        )}

        <div className="bg-cream-warm rounded-xl border border-border-soft p-6 mb-6">
          <label className="text-sm text-charcoal-light font-medium mb-2 block">Time window</label>
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value as any)}
            className="w-full px-4 py-3 bg-cream border border-border-soft rounded-xl focus:border-terracotta focus:outline-none text-sm mb-4"
          >
            <option value="all_time">All time</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="last_90_days">Last 90 days</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full py-3 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate Report
          </button>
        </div>

        <p className="text-sm text-charcoal-muted">
          Reports synthesise circle responses into themes, sentiment, and consensus items.
          They are designed to be shared with local councils, MPs, or community leaders.
        </p>
      </div>
    );
  }

  const { content } = report;

  return (
    <div className="max-w-3xl print:max-w-none">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h2 className="font-serif text-2xl text-charcoal">Community Report</h2>
        <div className="flex items-center gap-2">
          {submittedTo ? (
            <span className="px-4 py-2 bg-sage-pale text-sage-dark rounded-full text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Sent to {submittedTo}
            </span>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitPending}
              className="px-4 py-2 bg-terracotta text-cream rounded-full hover:bg-terracotta-dark transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {submitPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit to Authority
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-cream-warm border border-border-soft text-charcoal rounded-full hover:border-wheat transition-colors text-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
          <button
            onClick={() => setReport(null)}
            className="px-4 py-2 bg-midnight text-cream rounded-full hover:bg-midnight-soft transition-colors text-sm"
          >
            New Report
          </button>
        </div>
      </div>

      {/* Report body */}
      <div className="bg-white rounded-2xl border border-border-soft p-8 md:p-12 shadow-sm print:shadow-none print:border-none">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-charcoal mb-3">
            {report.circleName}
          </h1>
          <p className="text-charcoal-muted">{report.circleLocation}</p>
          <p className="text-sm text-charcoal-muted mt-2">
            Generated {new Date(report.generatedAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-cream-warm rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-terracotta mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-serif text-charcoal">{content.responseCount}</p>
            <p className="text-xs text-charcoal-muted uppercase tracking-wide">Responses</p>
          </div>
          <div className="bg-cream-warm rounded-xl p-4 text-center">
            <Calendar className="w-5 h-5 text-wheat mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-serif text-charcoal">{content.meetingCount}</p>
            <p className="text-xs text-charcoal-muted uppercase tracking-wide">Meetings</p>
          </div>
          <div className="bg-cream-warm rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-sage mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-2xl font-serif text-charcoal capitalize">{content.sentimentSummary.dominant}</p>
            <p className="text-xs text-charcoal-muted uppercase tracking-wide">Dominant Sentiment</p>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="font-serif text-xl text-charcoal mb-3">Summary</h3>
          <p className="text-charcoal leading-relaxed">{content.rawSummary}</p>
        </div>

        <div className="mb-10">
          <h3 className="font-serif text-xl text-charcoal mb-4">Top Themes</h3>
          <div className="space-y-4">
            {content.topThemes.map((theme, i) => (
              <div key={i} className="bg-cream-warm rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-charcoal">{theme.theme}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                    theme.sentiment === 'positive' ? 'bg-sage-pale text-sage-dark' :
                    theme.sentiment === 'negative' ? 'bg-terracotta-pale text-terracotta' :
                    'bg-wheat-pale text-wheat-dark'
                  }`}>
                    {theme.sentiment}
                  </span>
                </div>
                <p className="text-sm text-charcoal-muted mb-3">{theme.count} mentions</p>
                {theme.sampleQuotes.length > 0 && (
                  <div className="space-y-2">
                    {theme.sampleQuotes.map((quote, j) => (
                      <div key={j} className="flex gap-3 text-sm text-charcoal">
                        <Quote className="w-4 h-4 text-wheat flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <span className="italic">&ldquo;{quote}&rdquo;</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {content.consensusItems.length > 0 && (
          <div className="mb-10">
            <h3 className="font-serif text-xl text-charcoal mb-4">Areas of Strong Agreement</h3>
            <div className="space-y-4">
              {content.consensusItems.map((item, i) => (
                <div key={i} className="bg-cream-warm rounded-xl p-5">
                  <p className="text-charcoal font-medium mb-2">{item.statement}</p>
                  <div className="w-full bg-cream rounded-full h-2 mb-2">
                    <div
                      className="bg-sage h-2 rounded-full"
                      style={{ width: `${item.agreementLevel}%` }}
                    />
                  </div>
                  <p className="text-xs text-charcoal-muted">{item.agreementLevel}% estimated agreement · {item.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pt-8 border-t border-border-soft">
          <p className="font-script text-xl text-wheat-dark">
            &ldquo;The meek do not shout — they prove.&rdquo;
          </p>
          <p className="text-xs text-charcoal-muted mt-2">
            Generated by Meek Meet · Responses are anonymised and aggregated.
          </p>
        </div>
      </div>
    </div>
  );
}
