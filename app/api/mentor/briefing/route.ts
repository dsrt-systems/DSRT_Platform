import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - fetch today's briefing for current user
export async function GET(request: Request) {
  const { createClient: serverClient } = await import('@/lib/supabase/server')
  const sb = serverClient()

  const {
    data: { user },
  } = await sb.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get today's briefing
  const today = new Date().toISOString().split('T')[0]
  const { data } = await sb
    .from('mentor_briefings')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ briefing: null })
  }

  return NextResponse.json({ briefing: data })
}

// POST - generate new briefing (called by cron OR manually)
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const manual = url.searchParams.get('manual') === 'true'
  const userIdParam = url.searchParams.get('user_id')

  if (
    !manual &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

  // Get users to generate briefings for
  let usersQuery = supabase
    .from('users')
    .select(
      '*, user_skills(skills(name)), user_education(institution_name), notif_prefs'
    )
    .eq('onboarding_complete', true)
    .eq('is_bot', false)

  if (userIdParam) {
    usersQuery = usersQuery.eq('id', userIdParam)
  }

  const { data: users } = await usersQuery
  if (!users || users.length === 0) {
    return NextResponse.json({ generated: 0 })
  }

  const stats = { generated: 0, errors: [] as string[] }
  const today = new Date().toISOString().split('T')[0]

  for (const user of users) {
    try {
      // Skip if already briefed today
      const { data: existing } = await supabase
        .from('mentor_briefings')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .maybeSingle()

      if (existing) continue

      // Get context: ventures, projects, recent activity
      const [{ data: ventures }, { data: projects }, { data: recentNews }] =
        await Promise.all([
          supabase
            .from('startups')
            .select('name, stage, tagline')
            .eq('founder_id', user.id)
            .limit(3),
          supabase
            .from('projects')
            .select('title, stage')
            .eq('creator_id', user.id)
            .limit(3),
          supabase
            .from('editorial_posts')
            .select('headline, editorial_categories(name)')
            .order('published_at', { ascending: false })
            .limit(5),
        ])

      const userContext = `
User: ${user.full_name}
Bio: ${user.bio || 'No bio'}
Roles: ${user.brings?.join(', ') || 'None'}
Interests: ${user.interest_topics?.join(', ') || 'None'}
Skills: ${user.user_skills?.map((s: any) => s.skills?.name).filter(Boolean).join(', ') || 'None'}
${ventures && ventures.length > 0 ? `Ventures: ${ventures.map((v) => `${v.name} (${v.stage})`).join(', ')}` : ''}
${projects && projects.length > 0 ? `Projects: ${projects.map((p) => `${p.title} (${p.stage})`).join(', ')}` : ''}
Recent DSRT news: ${recentNews?.map((n: any) => n.headline).slice(0, 3).join(' | ')}
`

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are DSRT Mentor sending a personalized morning briefing. Write in 2nd person ("you"). Structure:

1. Brief personal greeting (1 line)
2. One insight/observation relevant to their work
3. 2-3 actionable suggestions for today
4. One relevant news item from DSRT that they should check

Keep it under 200 words. Warm but direct. Never generic. Reference their actual context.`,
          },
          {
            role: 'user',
            content: `Generate today's briefing.\n\n${userContext}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      })

      const briefing = completion.choices[0].message.content?.trim()
      if (!briefing) continue

      // Extract action items (simple regex - anything starting with "-" or numbered)
      const actionMatches = briefing.match(/(?:^|\n)[-*\d.]+\s+(.+)/g) || []
      const actionItems = actionMatches
        .map((m) => m.replace(/(?:^|\n)[-*\d.]+\s+/, '').trim())
        .slice(0, 5)

      await supabase.from('mentor_briefings').insert({
        user_id: user.id,
        briefing,
        action_items: actionItems,
      })

      stats.generated++
      await new Promise((r) => setTimeout(r, 400))
    } catch (err: any) {
      stats.errors.push(`${user.username}: ${err.message?.slice(0, 40)}`)
    }
  }

  return NextResponse.json({ success: true, ...stats })
}