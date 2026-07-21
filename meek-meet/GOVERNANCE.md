# Meek Meet — Data Governance & Ethics

## Our Promise

Meek Meet exists to give everyday people a respectful, powerful voice in their communities. That responsibility requires rigorous care for privacy, accuracy, and fairness.

## Principles

1. **Voice, not surveillance.** We collect community reflections, not personal data.
2. **Aggregation by design.** Individual responses are never exposed publicly.
3. **Transparency.** We publish how insights are generated and how authorities receive reports.
4. **Human oversight.** AI synthesises; humans approve reports before they are sent to authorities.
5. **Right to be forgotten.** Users can delete their account and responses at any time.

## Data Handling

| Data | Storage | Access | Retention |
|------|---------|--------|-----------|
| Raw responses | Supabase, RLS-protected | Responder + circle shepherds | 24 months default |
| Aggregated insights | Supabase | Members/shepherds (circle), public (regional/global) | Indefinite |
| Verification documents | Supabase Storage | User + admins | Until application decision + 12 months |
| Reports | Supabase | Shepherd + admin + submitted authority | Indefinite |

## AI Usage

- Groq LLM is used to synthesise themes, sentiment, consensus, and follow-up questions.
- Only batched, anonymised text is sent to the LLM.
- Generated questions include lineage metadata linking them to the insight that produced them.
- Human shepherds review and approve every report before it is sent to an authority.

## Authority Submissions

- Reports may only be submitted by verified shepherds or admins.
- Each submission is logged in `authority_submissions`.
- Authorities may reply; replies are tracked and surfaced to the originating circle.

## Proposed Ethics Board

As Meek Meet scales, establish an independent oversight body with:
- Community representation
- Faith leader representation
- Civic/data ethics expert
- Technical advisor

The board reviews the annual transparency report and escalations.

## Annual Transparency Report

Meek Meet will publish:
- Total number of circles and responses
- Number of reports submitted to authorities
- Summary of authority responses received
- Any data incidents or policy changes
