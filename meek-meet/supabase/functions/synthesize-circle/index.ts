import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SB_URL = Deno.env.get('SB_URL')
const SB_SECRET_KEY = Deno.env.get('SB_SECRET_KEY')

interface MeetingAnalytics {
  meeting_id: string
  total_responses: number
  themes: Array<{ theme: string; count: number; sentiment: string; sample_quotes: string[] }>
  sentiment_summary: { positive: number; neutral: number; negative: number }
  consensus_items: Array<{ statement: string; agreement_level: number; evidence: string }>
  anonymised_quotes: string[]
  raw_summary: string
  generated_at: string
}

interface CircleInsightResult {
  top_themes: Array<{
    theme: string
    count: number
    sentiment: 'positive' | 'neutral' | 'negative'
    sample_quotes: string[]
  }>
  sentiment_summary: {
    positive: number
    neutral: number
    negative: number
    dominant: 'positive' | 'neutral' | 'negative'
  }
  consensus_items: Array<{
    statement: string
    agreement_level: number
    evidence: string
  }>
  anonymised_quotes: string[]
  raw_summary: string
}

const SYSTEM_PROMPT = `You are a civic intelligence analyst for Meek Meet.
You will receive summaries from several community meetings held by the same circle.
Synthesise them into a single circle-level insight report.

Rules:
- Preserve privacy: never name individuals.
- Combine recurring themes, summing their mention counts and preserving the strongest sample quotes.
- Provide an overall sentiment summary across all meetings.
- Identify up to 5 consensus items with agreement levels and brief evidence.
- Provide a 3-4 sentence raw_summary of the circle's collective voice.
- Quotes must be short (under 150 characters) and anonymised.

Respond ONLY with valid JSON in this exact format:
{
  "top_themes": [
    {
      "theme": "string",
      "count": number,
      "sentiment": "positive|neutral|negative",
      "sample_quotes": ["string"]
    }
  ],
  "sentiment_summary": {
    "positive": number,
    "neutral": number,
    "negative": number,
    "dominant": "positive|neutral|negative"
  },
  "consensus_items": [
    {
      "statement": "string",
      "agreement_level": number,
      "evidence": "string"
    }
  ],
  "anonymised_quotes": ["string"],
  "raw_summary": "string"
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  if (!GROQ_API_KEY || !SB_URL || !SB_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { circle_id, time_window = 'all_time' } = await req.json()
    if (!circle_id) {
      return new Response(JSON.stringify({ error: 'Missing circle_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SB_URL, SB_SECRET_KEY)

    let since: string | null = null
    if (time_window === 'last_30_days') {
      since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    } else if (time_window === 'last_90_days') {
      since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    }

    let query = supabase
      .from('meeting_analytics')
      .select('*, meetings!inner(circle_id, scheduled_at, status)')
      .eq('meetings.circle_id', circle_id)

    if (since) {
      query = query.gte('meetings.scheduled_at', since)
    }

    const { data: analytics, error: analyticsError } = await query

    if (analyticsError) throw analyticsError

    const rows: MeetingAnalytics[] = (analytics ?? []) as MeetingAnalytics[]
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ synthesized: 0, reason: 'No meeting analytics for this circle' }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    const promptText = `Circle meeting summaries to synthesise (${time_window}):\n\n` + rows
      .map(
        (r, i) =>
          `Meeting ${i + 1} (${r.total_responses} responses):\nThemes: ${r.themes
            .map((t) => `${t.theme} (${t.sentiment}, ${t.count})`)
            .join(', ')}\nSummary: ${r.raw_summary}\n`
      )
      .join('\n')

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: promptText },
        ],
        temperature: 0.4,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) throw new Error(`Groq error: ${groqRes.status}`)

    const groqData = await groqRes.json()
    const content = groqData.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty LLM response')

    const parsed: CircleInsightResult = JSON.parse(content)

    const totalResponses = rows.reduce((sum, r) => sum + (r.total_responses ?? 0), 0)

    const { error: upsertError } = await supabase.from('circle_insights').upsert(
      {
        circle_id,
        time_window,
        generated_at: new Date().toISOString(),
        response_count: totalResponses,
        meeting_count: rows.length,
        top_themes: parsed.top_themes,
        sentiment_summary: parsed.sentiment_summary,
        consensus_items: parsed.consensus_items,
        anonymised_quotes: parsed.anonymised_quotes,
        raw_summary: parsed.raw_summary,
      },
      { onConflict: 'circle_id,time_window' }
    )

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({
        synthesized: totalResponses,
        meetings: rows.length,
        themes: parsed.top_themes.length,
        dominant_sentiment: parsed.sentiment_summary.dominant,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    console.error('synthesize-circle error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
