import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SB_URL = Deno.env.get('SB_URL')
const SB_SECRET_KEY = Deno.env.get('SB_SECRET_KEY')

interface CircleInsight {
  circle_id: string
  response_count: number
  top_themes: Array<{ theme: string; count: number; sentiment: string; sample_quotes: string[] }>
  sentiment_summary: { positive: number; neutral: number; negative: number }
  consensus_items: Array<{ statement: string; agreement_level: number; evidence: string }>
  anonymised_quotes: string[]
  raw_summary: string
}

interface RegionalInsightResult {
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
You will receive circle-level insight summaries from many communities within the same region.
Synthesise them into a single regional insight report.

Rules:
- Preserve privacy: never name individuals or specific circles.
- Combine recurring themes across communities, summing mention counts.
- Provide an overall sentiment summary.
- Identify up to 5 regional consensus items with agreement levels and evidence.
- Provide a 3-4 sentence raw_summary of what communities in this region are saying.
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
    const {
      region_type = 'lga',
      region_code,
      region_name,
      time_window = 'all_time',
    } = await req.json()

    if (!region_code || !region_name) {
      return new Response(
        JSON.stringify({ error: 'Missing region_code or region_name' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Whitelisted mapping — state_electorate/federal_electorate have no _code suffix
    const REGION_COLUMN: Record<string, string> = {
      lga: 'lga_code',
      state: 'state_code',
      country: 'country_code',
      state_electorate: 'state_electorate',
      federal_electorate: 'federal_electorate',
    }
    const regionColumn = REGION_COLUMN[region_type]
    if (!regionColumn) {
      return new Response(JSON.stringify({ error: `Invalid region_type: ${region_type}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SB_URL, SB_SECRET_KEY)

    const { data: insights, error: insightsError } = await supabase
      .from('circle_insights')
      .select('*, circles!inner(lga_code, state_code, country_code, state_electorate, federal_electorate)')
      .eq('time_window', time_window)
      .eq(`circles.${regionColumn}`, region_code)

    if (insightsError) throw insightsError

    const rows: CircleInsight[] = (insights ?? []) as CircleInsight[]
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ synthesized: 0, reason: 'No circle insights for this region' }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    const promptText =
      `Regional circle summaries for ${region_name} (${region_type}, ${time_window}):\n\n` +
      rows
        .map(
          (r, i) =>
            `Community ${i + 1} (${r.response_count} responses):\nThemes: ${r.top_themes
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

    const parsed: RegionalInsightResult = JSON.parse(content)

    const totalResponses = rows.reduce((sum, r) => sum + (r.response_count ?? 0), 0)

    const { error: upsertError } = await supabase.from('regional_insights').upsert(
      {
        region_type,
        region_code,
        region_name,
        time_window,
        generated_at: new Date().toISOString(),
        circle_count: rows.length,
        response_count: totalResponses,
        top_themes: parsed.top_themes,
        sentiment_summary: parsed.sentiment_summary,
        consensus_items: parsed.consensus_items,
        anonymised_quotes: parsed.anonymised_quotes,
        raw_summary: parsed.raw_summary,
      },
      { onConflict: 'region_type,region_code,time_window' }
    )

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({
        synthesized: totalResponses,
        circles: rows.length,
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
    console.error('synthesize-region error:', err)
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
