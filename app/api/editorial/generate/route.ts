import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'
import Groq from 'groq-sdk'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const NEWS_SOURCES = [
  // Pure startup/VC/funding
  { url: 'https://techcrunch.com/category/startups/feed/', category: 'startups', name: 'TechCrunch Startups' },
  { url: 'https://techcrunch.com/category/venture/feed/', category: 'startups', name: 'TechCrunch Venture' },
  { url: 'https://news.crunchbase.com/feed/', category: 'startups', name: 'Crunchbase News' },
  { url: 'https://venturebeat.com/category/entrepreneur/feed/', category: 'startups', name: 'VentureBeat' },
  { url: 'https://www.entrepreneur.com/latest.rss', category: 'startups', name: 'Entrepreneur' },
  { url: 'https://feeds.feedburner.com/pitchbook-news-latest-headlines', category: 'startups', name: 'PitchBook' },

  // Tech companies + business
  { url: 'https://techcrunch.com/feed/', category: 'technology', name: 'TechCrunch' },
  { url: 'https://www.forbes.com/innovation/feed/', category: 'technology', name: 'Forbes Innovation' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'technology', name: 'The Verge' },

  // AI companies
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: 'ai-robotics', name: 'TechCrunch AI' },
  { url: 'https://venturebeat.com/category/ai/feed/', category: 'ai-robotics', name: 'VB AI' },

  // Fintech companies
  { url: 'https://techcrunch.com/category/fintech/feed/', category: 'finance', name: 'TechCrunch Fintech' },

  // Product launches
  { url: 'https://www.producthunt.com/feed', category: 'technology', name: 'Product Hunt' },
]

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }
  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing GROQ_API_KEY or OPENAI_API_KEY' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const manual = url.searchParams.get('manual') === 'true'

  if (
    !manual &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

  const parser = new Parser({
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DSRT-Bot/1.0)',
    },
  })

  const stats = {
    sources_checked: 0,
    items_fetched: 0,
    items_skipped_duplicate: 0,
    items_skipped_filter: 0,
    items_published: 0,
    errors: [] as string[],
  }

  const shuffled = [...NEWS_SOURCES].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, 5)

  for (const source of picked) {
    try {
      stats.sources_checked++
      const feed = await parser.parseURL(source.url)
      const items = (feed.items || []).slice(0, 3)
      stats.items_fetched += items.length

      for (const item of items) {
        if (!item.link || !item.title) continue

        const { data: existing } = await supabase
          .from('processed_news')
          .select('id')
          .eq('source_url', item.link)
          .maybeSingle()

        if (existing) {
          stats.items_skipped_duplicate++
          continue
        }

        const enriched = await enrichNewsItem(item, source, groq)

        if (!enriched) {
          stats.items_skipped_filter++
          // Still mark as processed so we don't retry
          await supabase.from('processed_news').insert({
            source_url: item.link,
            source_name: source.name,
            editorial_post_id: null,
          })
          continue
        }

        const { data: category } = await supabase
          .from('editorial_categories')
          .select('id')
          .eq('slug', source.category)
          .single()

        if (!category) {
          stats.errors.push(`Category not found: ${source.category}`)
          continue
        }

        const { data: post, error: insertError } = await supabase
          .from('editorial_posts')
          .insert({
            category_id: category.id,
            headline: enriched.headline,
            summary: enriched.summary,
            body: enriched.body,
            why_it_matters: enriched.why_it_matters,
            tags: enriched.tags,
            related_topics: enriched.related_topics,
            cover_image_url: enriched.cover_image_url,
            source_url: item.link,
            source_name: source.name,
            published_at: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          stats.errors.push(`Insert: ${insertError.message?.slice(0, 80)}`)
          continue
        }

        await supabase.from('processed_news').insert({
          source_url: item.link,
          source_name: source.name,
          editorial_post_id: post.id,
        })

        stats.items_published++
        await new Promise((r) => setTimeout(r, 300))
      }
    } catch (err: any) {
      stats.errors.push(`Source ${source.name}: ${err.message?.slice(0, 80)}`)
    }
  }

  return NextResponse.json({ success: true, ...stats })
}

async function enrichNewsItem(item: any, source: any, groq: Groq) {
  try {
    const rawContent =
      item.contentSnippet || item.content || item.summary || item.title

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are DSRT Editorial, a professional news desk for a builder ecosystem. Always return valid JSON. No markdown around the JSON.',
        },
        {
          role: 'user',
          content: `Rewrite this real news article for builders on DSRT.

IMPORTANT FILTER: This article MUST be about one of:
- A specific company or startup (funding, launch, growth, hiring, pivot, acquisition)
- Investment / VC / fundraising activity
- Founder or entrepreneur story
- Product launch or business milestone
- Business strategy or corporate development
- Company financials, IPOs, or M&A

If the article is about general economics, politics, sports, celebrity gossip, weather, or non-business news, return EXACTLY:
{"skip": true}

Otherwise return JSON in this exact format (no markdown, no code blocks):
{
  "headline": "Sharp factual headline under 110 chars",
  "summary": "2-3 sentence summary of key facts",
  "body": "4-6 paragraph article. Stay factual. Plain text.",
  "why_it_matters": "2-3 sentences why builders and founders should care",
  "tags": ["3-5", "lowercase", "tags"],
  "related_topics": ["4-5 concrete project ideas inspired by this"]
}

Original headline: ${item.title}
Source: ${source.name}
Content: ${rawContent?.slice(0, 1500)}

Be factual. Do not invent facts.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1500,
    })

    const content = completion.choices[0].message.content
    if (!content) return null

    const parsed = JSON.parse(content)

    // Skip non-startup/business news
    if (parsed.skip === true) {
      return null
    }

    if (!parsed.headline || !parsed.summary) {
      return null
    }

    const coverImage = extractImage(item) || getFallback(source.category)

    return {
      headline: parsed.headline,
      summary: parsed.summary,
      body: parsed.body || parsed.summary,
      why_it_matters: parsed.why_it_matters || '',
      tags: parsed.tags || [],
      related_topics: parsed.related_topics || [],
      cover_image_url: coverImage,
    }
  } catch (err) {
    console.error('Enrichment error:', err)
    return null
  }
}

function extractImage(item: any): string | null {
  if (item.enclosure?.url) return item.enclosure.url
  if (item['media:content']?.['$']?.url) return item['media:content']['$'].url
  if (item['media:thumbnail']?.['$']?.url) return item['media:thumbnail']['$'].url
  const content = item['content:encoded'] || item.content || ''
  const match = content.match(/<img[^>]+src="([^">]+)"/i)
  if (match) return match[1]
  return null
}

function getFallback(category: string): string {
  const queries: Record<string, string> = {
    technology: 'technology,office',
    'ai-robotics': 'ai,neural-network',
    startups: 'startup,team',
    biotech: 'laboratory',
    aerospace: 'aircraft',
    climate: 'wind-turbine',
    finance: 'finance,chart',
    manufacturing: 'factory',
    agriculture: 'farm',
    semiconductor: 'chip',
    ev: 'electric-car',
    retail: 'retail',
    maritime: 'ship',
    aviation: 'airplane',
    education: 'university',
    space: 'space',
    research: 'science',
  }
  return `https://source.unsplash.com/1200x630/?${queries[category] || 'business'}`
}