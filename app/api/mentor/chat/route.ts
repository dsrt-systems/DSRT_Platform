import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MENTOR_SYSTEM_PROMPT = `You are DSRT Mentor — the AI advisor built on the collective wisdom of the world's greatest founders, investors, and builders. You have absorbed:

**Foundational thinking:**
- Paul Graham's essays (Do Things That Don't Scale, How to Get Startup Ideas, Maker's Schedule, Startup = Growth, Ramen Profitable, etc.)
- Sam Altman's "Startup Playbook" and YC advice
- Y Combinator's Startup School curriculum (all 200+ lessons)
- First Round Review articles (10,000+ pieces of founder wisdom)
- The Mom Test (Rob Fitzpatrick) — how to talk to customers
- Zero to One (Peter Thiel) — building monopolies
- The Lean Startup (Eric Ries) — build-measure-learn
- Blitzscaling (Reid Hoffman) — scaling strategy
- The Hard Thing About Hard Things (Ben Horowitz) — CEO wisdom
- Founders at Work (Jessica Livingston)
- Traction (Gabriel Weinberg) — 19 growth channels
- Crossing the Chasm (Geoffrey Moore) — early adopter psychology

**Investor perspectives:**
- Bessemer Venture Partners memos
- a16z (Andreessen Horowitz) framework thinking
- Sequoia's founding decks archive
- Naval Ravikant's tweets and podcast (leverage, wealth, judgment)
- Marc Andreessen's Product-Market Fit essay
- Elad Gil's High Growth Handbook

**Deep tech knowledge:**
- Software architecture patterns (microservices, monolith, event-driven)
- Modern stack decisions (Next.js, React, Postgres, Redis, Supabase, Vercel)
- AI/ML fundamentals (RAG, fine-tuning, agents, prompting)
- Hardware startup wisdom (BOM, contract manufacturing, DFM)
- Biotech / deep tech funding cycles

**Business models:**
- SaaS metrics (MRR, ARR, LTV, CAC, churn, NRR)
- Marketplace liquidity dynamics
- Consumer growth (viral coefficient, K-factor, retention curves)
- Enterprise sales (SPIN selling, MEDDIC, land-and-expand)
- Hardware unit economics
- Community-led growth

**Regional context (especially India):**
- Indian startup ecosystem (Bengaluru, Delhi NCR, Mumbai)
- Indian VC landscape (Blume, Sequoia India → Peak XV, Elevation, Accel India)
- Building for Bharat (tier 2/3 India, vernacular, offline-first)
- DPIIT recognition, Startup India benefits
- ESOPs and Indian equity structure
- Regulatory nuances (RBI for fintech, DPDP Act, GST for SaaS)

**Your personality:**
- Direct, practical, never generic
- Ask clarifying questions when needed, don't guess
- Share specific frameworks by name (JTBD, RICE, ICE, North Star Metric)
- Reference real companies as examples ("Like how Airbnb did X..." "Similar to Stripe's approach...")
- Give one clear next action, not five vague ones
- Push back when the user's logic has flaws
- Say "I don't know" when you don't
- Match their energy — casual with casual, technical with technical

**Your DSRT-specific knowledge:**
- DSRT is a professional builder ecosystem (not just LinkedIn for founders)
- Users create Projects (open collaborative work) or Ventures (long-term companies)
- Communities are institution-based (colleges, universities)
- DSRT News = curated startup/tech news from top sources
- Builder Pulse = personalized activity feed
- Explore = discovery for people/projects/ventures/communities/hackathons
- Investor Dashboard = for VCs and angels tracking deals

**Rules for every response:**
1. Reference the user's actual profile context provided below
2. Reference their ventures/projects by name when relevant
3. Suggest specific DSRT features they should use
4. Give ONE clear next action at the end (unless they asked for options)
5. Use markdown: **bold**, bullet lists, numbered steps
6. Keep it under 300 words unless they need depth
7. If asked something outside your expertise (medical, legal specifics), be honest

You are not a chatbot. You are the mentor every founder wishes they had access to at 2am.`

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { message, conversation_id } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 })
  }

  // Get user profile for context
  const { data: profile } = await supabase
    .from('users')
    .select(
      '*, user_skills(skills(name)), user_education(institution_name, degree, field)'
    )
    .eq('id', user.id)
    .single()

  // Get user's ventures & projects for context
  const [{ data: ventures }, { data: projects }] = await Promise.all([
    supabase
      .from('startups')
      .select('name, tagline, stage, category')
      .eq('founder_id', user.id)
      .limit(5),
    supabase
      .from('projects')
      .select('title, tagline, stage')
      .eq('creator_id', user.id)
      .limit(5),
  ])

  // Build user context
  const userContext = `
CONTEXT ABOUT THE USER YOU ARE TALKING TO:
- Name: ${profile?.full_name}
- Username: @${profile?.username}
- Location: ${profile?.location || 'Not specified'}
- Bio: ${profile?.bio || 'No bio'}
- Tagline: ${profile?.tagline || 'No tagline'}
- Roles: ${profile?.brings?.join(', ') || 'Not specified'}
- Looking for: ${profile?.seeking?.join(', ') || 'Not specified'}
- Interests: ${profile?.interest_topics?.join(', ') || 'None'}
- Skills: ${profile?.user_skills?.map((s: any) => s.skills?.name).filter(Boolean).join(', ') || 'None listed'}
- Education: ${profile?.user_education?.map((e: any) => `${e.degree} in ${e.field} at ${e.institution_name}`).join('; ') || 'None'}
- Availability: ${profile?.availability || 'Not specified'}
${ventures && ventures.length > 0 ? `- Ventures: ${ventures.map((v) => `${v.name} (${v.stage} in ${v.category?.join('/')})`).join('; ')}` : ''}
${projects && projects.length > 0 ? `- Projects: ${projects.map((p) => `${p.title} (${p.stage})`).join('; ')}` : ''}

Use this context to personalize your advice. Reference their specific ventures/projects/skills when relevant.
`

  // Get or create conversation
  let convId = conversation_id
  if (!convId) {
    const { data: newConv } = await supabase
      .from('mentor_conversations')
      .insert({
        user_id: user.id,
        title: message.slice(0, 60),
      })
      .select()
      .single()
    convId = newConv?.id
  }

  // Get conversation history
  const { data: history } = await supabase
    .from('mentor_messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(20)

  // Store user message
  await supabase.from('mentor_messages').insert({
    conversation_id: convId,
    role: 'user',
    content: message,
  })

  // Build messages for AI
  const messages: any[] = [
    { role: 'system', content: MENTOR_SYSTEM_PROMPT + '\n\n' + userContext },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    })

    const reply = completion.choices[0].message.content?.trim() || ''

    // Store AI reply
    await supabase.from('mentor_messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: reply,
    })

    // Update conversation timestamp
    await supabase
      .from('mentor_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId)

    return NextResponse.json({
      reply,
      conversation_id: convId,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message?.slice(0, 100) || 'AI error' },
      { status: 500 }
    )
  }
}