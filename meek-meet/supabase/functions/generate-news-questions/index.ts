import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY')
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SB_URL = Deno.env.get('SB_URL')
const SB_SECRET_KEY = Deno.env.get('SB_SECRET_KEY')

const BLOCKED_KEYWORDS = [
  'death', 'killed', 'murder', 'murdered', 'stabbed', 'shot', 'shooting',
  'crash', 'crashed', 'collision', 'fire', 'burned', 'terror', 'terrorist',
  'war', 'invasion', 'rape', 'sexual assault', 'assault', 'kidnap',
  'abduction', 'hostage', 'bomb', 'explosion', 'drowned', 'suicide',
  'overdose', 'fatal', 'dies', 'dead', 'corpse', 'massacre', 'genocide',
]

const SYSTEM_PROMPT = `You are a thoughtful discussion facilitator for community groups called "Meek Meet Circles." 
Your job is to read news headlines and rephrase the underlying societal tension into universal, non-partisan discussion questions.

Rules:
- NEVER mention the specific event, person, country, or political party
- Focus on the human value tension (e.g., safety vs freedom, tradition vs progress, individual vs collective)
- Questions should feel timeless and locally relevant to Australian communities
- Avoid religious framing, partisan language, or inflammatory rhetoric
- Each question must include 1 sentence of context explaining why it matters today
- Prefer open-ended "how", "what", "why" questions over yes/no

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "string",
      "context": "string",
      "category": "Community|Culture|Economy|Environment|Education|Family|Governance|Health|Justice|Technology"
    }
  ]
}`

function isSafeArticle(article: { title?: string; description?: string }): boolean {
  const text = `${article.title ?? ''} ${article.description ?? ''}`.toLowerCase()
  return !BLOCKED_KEYWORDS.some((kw) => text.includes(kw))
}

interface NewsArticle {
  title: string
  description: string | null
  url: string
}

interface GeneratedQuestion {
  question: string
  context: string
  category: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  if (!NEWS_API_KEY || !GROQ_API_KEY || !SB_URL || !SB_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Defense in depth (verify_jwt = true in config.toml is the primary gate):
  // only callers holding the service key may trigger generation.
  if (req.headers.get('Authorization') !== `Bearer ${SB_SECRET_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. Fetch AU headlines
    const newsRes = await fetch(
      `https://newsapi.org/v2/top-headlines?country=au&pageSize=20&apiKey=${NEWS_API_KEY}`,
      { headers: { 'X-Api-Key': NEWS_API_KEY } }
    )

    if (!newsRes.ok) {
      throw new Error(`NewsAPI error: ${newsRes.status}`)
    }

    const newsData = await newsRes.json()
    const articles: NewsArticle[] = (newsData.articles ?? []).filter(isSafeArticle).slice(0, 5)

    if (articles.length === 0) {
      return new Response(JSON.stringify({ generated: 0, reason: 'No safe articles found' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 2. Generate questions from each article via Groq
    const allQuestions: Array<GeneratedQuestion & { source_headline: string; source_url: string }> = []

    for (const article of articles) {
      const userPrompt = `Headline: "${article.title}"
Description: "${article.description ?? ''}"

Convert this into 2 universal discussion questions.`

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
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          response_format: { type: 'json_object' },
        }),
      })

      if (!groqRes.ok) {
        console.error(`Groq error for article "${article.title}":`, groqRes.status)
        continue
      }

      const groqData = await groqRes.json()
      const content = groqData.choices?.[0]?.message?.content

      if (!content) continue

      try {
        const parsed = JSON.parse(content)
        const questions: GeneratedQuestion[] = parsed.questions ?? []
        for (const q of questions) {
          allQuestions.push({
            ...q,
            source_headline: article.title,
            source_url: article.url,
          })
        }
      } catch {
        console.error('Failed to parse LLM response:', content)
        continue
      }
    }

    // 3. Store in Supabase
    const supabase = createClient(SB_URL, SB_SECRET_KEY)

    // Delete expired questions first
    await supabase.from('news_questions').delete().lt('expires_at', new Date().toISOString())

    if (allQuestions.length > 0) {
      const { error: insertError } = await supabase.from('news_questions').insert(
        allQuestions.map((q) => ({
          question: q.question,
          context: q.context,
          category: q.category,
          source_headline: q.source_headline,
          source_url: q.source_url,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }))
      )

      if (insertError) {
        throw insertError
      }
    }

    return new Response(
      JSON.stringify({
        generated: allQuestions.length,
        articlesProcessed: articles.length,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    console.error('Edge Function error:', err)
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
