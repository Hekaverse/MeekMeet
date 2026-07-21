import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SB_URL = Deno.env.get('SB_URL')
const SB_SECRET_KEY = Deno.env.get('SB_SECRET_KEY')

interface GeneratedQuestion {
  question: string
  category: string
  context: string
}

interface GeneratedResult {
  questions: GeneratedQuestion[]
}

const SYSTEM_PROMPT = `You are a facilitator for Meek Meet circles.
You will receive a circle's recent insight summary: its top themes, consensus items, and anonymised quotes.
Your job is to generate 3-5 follow-up discussion questions that help the circle go deeper on the most important or unresolved issues.

Rules:
- Questions must be open-ended, locally actionable, and non-partisan.
- Each question should connect to a specific theme or consensus item from the input.
- Include one sentence of context explaining why the question matters.
- Avoid religious framing.
- Categorise each question into one of: Community, Governance, Environment, Family, Economy, Education, Health, Justice, Technology, Culture.

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "string",
      "category": "string",
      "context": "string"
    }
  ]
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
    const { circle_id, insight_id } = await req.json()
    if (!circle_id || !insight_id) {
      return new Response(
        JSON.stringify({ error: 'Missing circle_id or insight_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SB_URL, SB_SECRET_KEY)

    const { data: insight, error: insightError } = await supabase
      .from('circle_insights')
      .select('*')
      .eq('id', insight_id)
      .single()

    if (insightError || !insight) {
      return new Response(
        JSON.stringify({ error: 'Insight not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const promptText = `Circle insight summary:\n\nTop themes:\n${(insight.top_themes ?? [])
      .map(
        (t: any) =>
          `- ${t.theme} (${t.sentiment}, ${t.count} mentions). Quotes: ${(t.sample_quotes ?? [])
            .slice(0, 2)
            .join('; ')}`
      )
      .join('\n')}\n\nConsensus items:\n${(insight.consensus_items ?? [])
      .map((c: any) => `- ${c.statement} (${c.agreement_level}% agreement)`)
      .join('\n')}\n\nSummary:\n${insight.raw_summary ?? ''}`

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: promptText },
        ],
        temperature: 0.7,
        max_tokens: 1536,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) throw new Error(`Groq error: ${groqRes.status}`)

    const groqData = await groqRes.json()
    const content = groqData.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty LLM response')

    const parsed: GeneratedResult = JSON.parse(content)
    const questions = parsed.questions ?? []

    // Insert generated questions and lineage
    for (const q of questions) {
      const { data: inserted, error: insertError } = await supabase
        .from('generated_questions')
        .insert({
          circle_id,
          question: q.question,
          category: q.category,
          context: q.context,
          generated_by: 'ai_synthesis',
          status: 'active',
        })
        .select('id')
        .single()

      if (insertError || !inserted) {
        console.error('Failed to insert generated question:', insertError)
        continue
      }

      await supabase.from('question_lineage').insert({
        generated_question_id: inserted.id,
        source_type: 'circle_insights',
        source_id: insight_id,
        insight_snippet: `${insight.raw_summary ?? ''}`.slice(0, 500),
      })
    }

    return new Response(
      JSON.stringify({ generated: questions.length }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    console.error('generate-next-questions error:', err)
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
