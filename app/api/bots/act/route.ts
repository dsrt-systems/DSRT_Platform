import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const BOT_PERSONAS = [
  {
    email: 'kunal.dev@dsrt.bot',
    full_name: 'Kunal Dev',
    username: 'kunaldev',
    tagline: 'Full stack @ CGEC | building in public',
    bio: 'Junior year. Obsessed with Next.js and Postgres.',
    location: 'Cooch Behar, India',
    brings: ['builder', 'maker'],
    interest_topics: ['saas', 'devtools', 'productivity'],
    style: 'student, enthusiastic, technical, casual',
    avatar_seed: 'kunal',
  },
  {
    email: 'sanya.malhotra@dsrt.bot',
    full_name: 'Sanya Malhotra',
    username: 'sanyamalhotra',
    tagline: 'Product Designer | ex-Zomato',
    bio: 'Designing for the next billion users. Formerly at Zomato and Swiggy.',
    location: 'Bangalore, India',
    brings: ['builder', 'launcher'],
    interest_topics: ['creator', 'productivity', 'social'],
    style: 'professional, design-focused, thoughtful',
    avatar_seed: 'sanya',
  },
  {
    email: 'rishi.agarwal@dsrt.bot',
    full_name: 'Rishi Agarwal',
    username: 'rishiagarwal',
    tagline: 'Founder building for SMBs',
    bio: 'Second-time founder. Building something for Indian SMBs.',
    location: 'Mumbai, India',
    brings: ['visionary', 'launcher'],
    interest_topics: ['fintech', 'saas'],
    style: 'confident, visionary, business-oriented',
    avatar_seed: 'rishi',
  },
  {
    email: 'ishani.roy@dsrt.bot',
    full_name: 'Ishani Roy',
    username: 'ishaniroy',
    tagline: 'AI Researcher @ NIT Durgapur',
    bio: 'Exploring multimodal agents and RAG systems.',
    location: 'Durgapur, India',
    brings: ['builder', 'professional'],
    interest_topics: ['ai', 'devtools'],
    style: 'academic, serious, technical',
    avatar_seed: 'ishani',
  },
  {
    email: 'deepak.singh@dsrt.bot',
    full_name: 'Deepak Singh',
    username: 'deepaksingh',
    tagline: 'Hardware hacker + drone builder',
    bio: 'Drones, ESP32s, and cheap sensors. Prototyping in a garage.',
    location: 'Delhi, India',
    brings: ['builder', 'maker'],
    interest_topics: ['robotics', 'iot', 'aerospace'],
    style: 'maker, hands-on, casual',
    avatar_seed: 'deepak',
  },
  {
    email: 'nisha.reddy@dsrt.bot',
    full_name: 'Nisha Reddy',
    username: 'nishareddy',
    tagline: 'Climate tech founder',
    bio: 'Building solutions for carbon capture at industrial scale.',
    location: 'Hyderabad, India',
    brings: ['visionary', 'professional'],
    interest_topics: ['climate', 'cleantech'],
    style: 'mission-driven, serious, hopeful',
    avatar_seed: 'nisha',
  },
  {
    email: 'aryan.mehta@dsrt.bot',
    full_name: 'Aryan Mehta',
    username: 'aryanmehta',
    tagline: 'iOS developer, indie hacker',
    bio: 'Shipped 6 iOS apps. Now on my 7th. Solo but not alone.',
    location: 'Pune, India',
    brings: ['builder'],
    interest_topics: ['saas', 'productivity', 'creator'],
    style: 'indie hacker, casual, results-oriented',
    avatar_seed: 'aryan',
  },
  {
    email: 'priya.venkat@dsrt.bot',
    full_name: 'Priya Venkat',
    username: 'priyavenkat',
    tagline: 'ML @ big tech | mentor to students',
    bio: 'Working on recommendation systems. Love teaching ML to beginners.',
    location: 'Bangalore, India',
    brings: ['professional', 'mentor'],
    interest_topics: ['ai', 'edtech'],
    style: 'senior, mentor-tone, encouraging',
    avatar_seed: 'priyav',
  },
  {
    email: 'karthik.iyer@dsrt.bot',
    full_name: 'Karthik Iyer',
    username: 'karthikiyer',
    tagline: 'Building EdTech for tier-2 India',
    bio: 'Ex-teacher turned founder. Making STEM affordable and interactive.',
    location: 'Chennai, India',
    brings: ['visionary', 'launcher'],
    interest_topics: ['edtech', 'social'],
    style: 'passionate, story-driven',
    avatar_seed: 'karthik',
  },
  {
    email: 'rhea.nair@dsrt.bot',
    full_name: 'Rhea Nair',
    username: 'rheanair',
    tagline: 'Growth marketer for early-stage startups',
    bio: 'Helped 3 startups go from 0 to 10k users. SEO + content + community.',
    location: 'Kochi, India',
    brings: ['launcher'],
    interest_topics: ['saas', 'creator', 'social'],
    style: 'growth-focused, sharp, insight-heavy',
    avatar_seed: 'rhea',
  },
  {
    email: 'sameer.khan@dsrt.bot',
    full_name: 'Sameer Khan',
    username: 'sameerkhan',
    tagline: 'Fintech engineer + open source contributor',
    bio: 'Backend engineer at a YC fintech. Contributing to open source on weekends.',
    location: 'Bangalore, India',
    brings: ['builder', 'professional'],
    interest_topics: ['fintech', 'devtools'],
    style: 'engineering-first, thoughtful, direct',
    avatar_seed: 'sameer',
  },
  {
    email: 'ananya.ghosh@dsrt.bot',
    full_name: 'Ananya Ghosh',
    username: 'ananyaghosh',
    tagline: 'Biotech grad exploring genomics AI',
    bio: 'PhD in genomics. Curious about how ML can accelerate drug discovery.',
    location: 'Kolkata, India',
    brings: ['builder', 'professional'],
    interest_topics: ['biotech', 'ai'],
    style: 'academic, curious, deep-thinking',
    avatar_seed: 'ananya',
  },
]

const POST_PROMPTS: Record<string, string[]> = {
  build_log: [
    'Write a short build log about what you shipped today. 1-2 specific things. Be concrete.',
    'Share a technical problem you solved today. Explain briefly.',
    'Talk about a bug that took forever to find.',
    'Share a small win from today.',
  ],
  idea: [
    'Share an idea you cannot stop thinking about. 2-3 sentences.',
    'Post a hot take about your industry.',
    'Share an observation about builders / founders / your field.',
  ],
  discussion: [
    'Ask an honest question to the community.',
    'Share a thought that starts a discussion.',
    'Post a lesson you learned this week.',
  ],
  looking_for: [
    'Post that you are looking for a specific collaborator. Be specific about the skill.',
    'Ask for feedback on something you are building.',
    'Ask for recommendations (books, tools, people to follow).',
  ],
  milestone: [
    'Share a milestone you just hit. Numbers if possible.',
    'Celebrate a small win.',
  ],
}

export async function GET(request: Request) {
  // Validate env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Missing Supabase env vars' },
      { status: 500 }
    )
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 })
  }

  const url = new URL(request.url)
  const manual = url.searchParams.get('manual') === 'true'
  const count = parseInt(url.searchParams.get('count') || '1')

  if (
    !manual &&
    process.env.CRON_SECRET &&
    request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const stats = {
    bots_created: 0,
    bots_existing: 0,
    posts_created: 0,
    errors: [] as string[],
  }

  // Create bots if they don't exist
  for (const p of BOT_PERSONAS) {
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', p.username)
        .maybeSingle()

      if (existing) {
        stats.bots_existing++
        continue
      }

      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: p.email,
          password: `Bot${Date.now()}${Math.random().toString(36).slice(2, 8)}!`,
          email_confirm: true,
          user_metadata: { full_name: p.full_name },
        })

      if (authError || !authUser.user) {
        stats.errors.push(`Bot auth: ${p.username} - ${authError?.message}`)
        continue
      }

      await new Promise((r) => setTimeout(r, 400))

      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: p.username,
          full_name: p.full_name,
          tagline: p.tagline,
          bio: p.bio,
          location: p.location,
          brings: p.brings,
          interest_topics: p.interest_topics,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar_seed}`,
          is_bot: true,
          onboarding_complete: true,
        })
        .eq('id', authUser.user.id)

      if (updateError) {
        stats.errors.push(`Bot update: ${p.username}`)
      } else {
        stats.bots_created++
      }
    } catch (err: any) {
      stats.errors.push(`Bot ${p.username}: ${err.message?.slice(0, 50)}`)
    }
  }

  // Generate posts
  for (let i = 0; i < count; i++) {
    try {
      const persona =
        BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)]
      const postTypes = Object.keys(POST_PROMPTS)
      const postType = postTypes[Math.floor(Math.random() * postTypes.length)]
      const prompts = POST_PROMPTS[postType]
      const prompt = prompts[Math.floor(Math.random() * prompts.length)]

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are ${persona.full_name}, ${persona.tagline}. Style: ${persona.style}. You post on DSRT, a social network for builders. Keep it authentic and short (2-4 sentences). Do not sign the post. Do not use hashtags at the end. Just write the content directly.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 300,
      })

      const content = completion.choices[0].message.content?.trim()
      if (!content) continue

      const { data: bot } = await supabase
        .from('users')
        .select('id')
        .eq('username', persona.username)
        .single()

      if (!bot) continue

      const { error: postError } = await supabase.from('posts').insert({
        user_id: bot.id,
        type: postType,
        content,
        visibility: 'global',
      })

      if (postError) {
        stats.errors.push(`Post insert: ${postError.message?.slice(0, 60)}`)
      } else {
        stats.posts_created++
      }

      await new Promise((r) => setTimeout(r, 500))
    } catch (err: any) {
      stats.errors.push(`Post: ${err.message?.slice(0, 60)}`)
    }
  }

  return NextResponse.json({ success: true, ...stats })
}