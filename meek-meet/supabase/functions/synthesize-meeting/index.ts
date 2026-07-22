import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SB_URL = Deno.env.get('SB_URL')
const SB_SECRET_KEY = Deno.env.get('SB_SECRET_KEY')

interface ResponseRow {
  question_id: string
  question_content: string
  response_id: string
  response_content: string
  user_id: string
  created_at: string
}

interface SynthesisResult {
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
    agreement_level: number // 0-100
    evidence: string
  }>
  anonymised_quotes: string[]
  raw_summary: string
}

const SYSTEM_PROMPT = `You are a civic intelligence analyst for Meek Meet, a community listening platform.
Your job is to read a collection of community responses from one circle meeting and synthesise them into structured insights.

Rules:
- Preserve privacy: never name individuals or include identifying details.
- Identify 3-7 key themes with a sentiment label (positive/neutral/negative), estimated mention count, and 1-2 anonymised sample quotes per theme.
- Identify up to 3 consensus items: statements that a high proportion of respondents seem to agree with. Include an estimated agreement_level (0-100) and brief evidence.
- Provide an overall sentiment breakdown: positive, neutral, negative counts and the dominant sentiment.
- Provide a 2-3 sentence raw_summary of what the community is saying.
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
    const { meeting_id } = await req.json()
    if (!meeting_id) {
      return new Response(JSON.stringify({ error: 'Missing meeting_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SB_URL, SB_SECRET_KEY)

    // Fetch responses grouped by question
    const { data: responses, error: responsesError } = await supabase.rpc(
      'get_meeting_responses',
      { p_meeting_id: meeting_id }
    )

    if (responsesError) throw responsesError

    const rows: ResponseRow[] = responses ?? []
    if (rows.length === 0) {
      return new Response(JSON.stringify({ synthesized: 0, reason: 'No responses' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Fetch the meeting's circle for analytics attribution
    const { data: meetingRow } = await supabase
      .from('meetings')
      .select('circle_id')
      .eq('id', meeting_id)
      .single()

    // Build prompt
    const grouped = new Map<string, { question: string; answers: string[] }>()
    for (const row of rows) {
      const key = row.question_id
      if (!grouped.has(key)) {
        grouped.set(key, { question: row.question_content, answers: [] })
      }
      grouped.get(key)!.answers.push(row.response_content)
    }

    let promptText = 'Community responses from a Meek Meet circle meeting:\n\n'
    for (const [, item] of grouped) {
      promptText += `Question: ${item.question}\n`
      for (const answer of item.answers) {
        promptText += `- ${answer}\n`
      }
      promptText += '\n'
    }

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

    if (!groqRes.ok) {
      throw new Error(`Groq error: ${groqRes.status}`)
    }

    const groqData = await groqRes.json()
    const content = groqData.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty LLM response')

    const parsed: SynthesisResult = JSON.parse(content)

    // Upsert meeting analytics (column names match the meeting_analytics schema)
    const { error: upsertError } = await supabase
      .from('meeting_analytics')
      .upsert(
        {
          meeting_id,
          circle_id: meetingRow?.circle_id ?? null,
          total_responses: rows.length,
          themes: parsed.top_themes,
          sentiment_summary: parsed.sentiment_summary,
          consensus_items: parsed.consensus_items,
          anonymised_quotes: parsed.anonymised_quotes,
          raw_summary: parsed.raw_summary,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'meeting_id' }
      )

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({
        synthesized: rows.length,
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
    console.error('synthesize-meeting error:', err)
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
