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
    tagline: 'Full stack developer | building in public',
    bio: 'Junior year CS at CGEC. Obsessed with Next.js, Postgres, and shipping things people actually use. Currently building 3 side projects.',
    location: 'Cooch Behar, India',
    brings: ['builder', 'maker'],
    interest_topics: ['saas', 'devtools', 'productivity'],
    style: 'student, enthusiastic, technical, casual, writes short posts',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'CGEC', degree: 'B.Tech', field: 'Computer Science', start_year: 2022, end_year: 2026, is_current: true },
    skills: ['React', 'Next.js', 'PostgreSQL', 'TypeScript', 'Node.js'],
  },
  {
    email: 'sanya.malhotra@dsrt.bot',
    full_name: 'Sanya Malhotra',
    username: 'sanyamalhotra',
    tagline: 'Product Designer | ex-Zomato, ex-Swiggy',
    bio: 'Designing for the next billion users. 6 years designing consumer products. Currently freelancing while exploring my next thing.',
    location: 'Bangalore, India',
    brings: ['builder', 'launcher'],
    interest_topics: ['creator', 'productivity', 'social'],
    style: 'professional, design-focused, thoughtful, mid-length posts',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'NID Ahmedabad', degree: 'M.Des', field: 'Product Design', start_year: 2016, end_year: 2018, is_current: false },
    skills: ['UI Design', 'UX Design', 'Figma', 'Product Management', 'User Research'],
  },
  {
    email: 'rishi.agarwal@dsrt.bot',
    full_name: 'Rishi Agarwal',
    username: 'rishiagarwal',
    tagline: 'Founder building for Indian SMBs',
    bio: 'Second-time founder. First startup was acquired in 2023. Now building banking infrastructure for small businesses. Ex-Razorpay.',
    location: 'Mumbai, India',
    brings: ['visionary', 'launcher'],
    interest_topics: ['fintech', 'saas'],
    style: 'confident, visionary, business-oriented, occasional hot takes',
    photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'IIT Bombay', degree: 'B.Tech', field: 'Mechanical Engineering', start_year: 2011, end_year: 2015, is_current: false },
    skills: ['Fundraising', 'Business Development', 'Strategy', 'Financial Modeling', 'Sales'],
  },
  {
    email: 'ishani.roy@dsrt.bot',
    full_name: 'Ishani Roy',
    username: 'ishaniroy',
    tagline: 'AI Researcher @ NIT Durgapur',
    bio: 'PhD student researching multimodal AI agents. Published 3 papers. Currently exploring RAG systems for scientific literature.',
    location: 'Durgapur, India',
    brings: ['builder', 'professional'],
    interest_topics: ['ai', 'devtools'],
    style: 'academic, serious, technical, deep insights',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'NIT Durgapur', degree: 'PhD', field: 'Computer Science', start_year: 2022, end_year: 2027, is_current: true },
    skills: ['Machine Learning', 'Deep Learning', 'NLP', 'Python', 'PyTorch'],
  },
  {
    email: 'deepak.singh@dsrt.bot',
    full_name: 'Deepak Singh',
    username: 'deepaksingh',
    tagline: 'Hardware hacker | drone + IoT builder',
    bio: 'Building autonomous drones for agriculture. Circuits, code, and a lot of soldering. My workshop is a small garage in Delhi.',
    location: 'Delhi, India',
    brings: ['builder', 'maker'],
    interest_topics: ['robotics', 'iot', 'aerospace'],
    style: 'maker, hands-on, casual, describes hardware in detail',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'DTU', degree: 'B.Tech', field: 'Electronics', start_year: 2019, end_year: 2023, is_current: false },
    skills: ['Embedded Systems', 'C++', 'PCB Design', 'ROS', 'Arduino'],
  },
  {
    email: 'nisha.reddy@dsrt.bot',
    full_name: 'Nisha Reddy',
    username: 'nishareddy',
    tagline: 'Climate tech founder | carbon capture',
    bio: 'PhD in chemical engineering. Building a novel process for capturing CO2 from cement manufacturing. Raised pre-seed last month.',
    location: 'Hyderabad, India',
    brings: ['visionary', 'professional'],
    interest_topics: ['climate', 'cleantech'],
    style: 'mission-driven, hopeful, science-backed',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'IIT Madras', degree: 'PhD', field: 'Chemical Engineering', start_year: 2018, end_year: 2023, is_current: false },
    skills: ['Chemistry', 'Process Engineering', 'R&D', 'Grant Writing', 'Team Leadership'],
  },
  {
    email: 'aryan.mehta@dsrt.bot',
    full_name: 'Aryan Mehta',
    username: 'aryanmehta',
    tagline: 'Indie iOS developer | shipped 6 apps',
    bio: 'Full-time indie dev since 2022. Total revenue: $180k across 6 apps. Currently working on my 7th. Live in Pune with my dog.',
    location: 'Pune, India',
    brings: ['builder'],
    interest_topics: ['saas', 'productivity', 'creator'],
    style: 'indie hacker, casual, revenue-transparent, shares numbers',
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'BITS Pilani', degree: 'B.E.', field: 'Computer Science', start_year: 2016, end_year: 2020, is_current: false },
    skills: ['iOS Development', 'Swift', 'SwiftUI', 'App Store Optimization', 'Product Design'],
  },
  {
    email: 'priya.venkat@dsrt.bot',
    full_name: 'Priya Venkat',
    username: 'priyavenkat',
    tagline: 'ML Engineer @ big tech | mentor',
    bio: 'Working on recommendation systems at a large tech company. Mentor 3 students informally. Love teaching ML from first principles.',
    location: 'Bangalore, India',
    brings: ['professional', 'mentor'],
    interest_topics: ['ai', 'edtech'],
    style: 'senior, mentor-tone, encouraging, occasionally reflective',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'IIT Madras', degree: 'M.Tech', field: 'Data Science', start_year: 2014, end_year: 2016, is_current: false },
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'Recommendation Systems', 'Mentoring'],
  },
  {
    email: 'karthik.iyer@dsrt.bot',
    full_name: 'Karthik Iyer',
    username: 'karthikiyer',
    tagline: 'EdTech founder | teacher turned builder',
    bio: 'Taught physics for 8 years. Now building an interactive STEM platform used in 30+ schools across Tamil Nadu.',
    location: 'Chennai, India',
    brings: ['visionary', 'launcher'],
    interest_topics: ['edtech', 'social'],
    style: 'passionate, story-driven, education-obsessed',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'Anna University', degree: 'M.Sc', field: 'Physics', start_year: 2009, end_year: 2011, is_current: false },
    skills: ['Curriculum Design', 'Product Management', 'B2B Sales', 'Content Creation', 'Physics'],
  },
  {
    email: 'rhea.nair@dsrt.bot',
    full_name: 'Rhea Nair',
    username: 'rheanair',
    tagline: 'Growth marketer | 3 startups scaled',
    bio: 'Helped 3 early-stage startups go from 0 to 10k users. SEO, content, community. Currently consulting while building my own thing.',
    location: 'Kochi, India',
    brings: ['launcher'],
    interest_topics: ['saas', 'creator', 'social'],
    style: 'growth-focused, sharp, data-driven, share tactical insights',
    photo_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'Christ University', degree: 'MBA', field: 'Marketing', start_year: 2016, end_year: 2018, is_current: false },
    skills: ['SEO', 'Content Marketing', 'Growth Hacking', 'Community Building', 'Analytics'],
  },
  {
    email: 'sameer.khan@dsrt.bot',
    full_name: 'Sameer Khan',
    username: 'sameerkhan',
    tagline: 'Backend engineer @ YC fintech',
    bio: 'Working on payment infrastructure at a YC-backed fintech. Weekend hobby is contributing to open source. Rust enthusiast.',
    location: 'Bangalore, India',
    brings: ['builder', 'professional'],
    interest_topics: ['fintech', 'devtools'],
    style: 'engineering-first, thoughtful, direct, technical deep-dives',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'IIIT Hyderabad', degree: 'B.Tech', field: 'CSE', start_year: 2015, end_year: 2019, is_current: false },
    skills: ['Rust', 'Go', 'PostgreSQL', 'Distributed Systems', 'Open Source'],
  },
  {
    email: 'ananya.ghosh@dsrt.bot',
    full_name: 'Ananya Ghosh',
    username: 'ananyaghosh',
    tagline: 'Biotech PhD exploring AI + genomics',
    bio: 'PhD in genomics from IISc. Curious about applying ML to accelerate drug discovery. Looking for engineers who want to build in biotech.',
    location: 'Kolkata, India',
    brings: ['builder', 'professional'],
    interest_topics: ['biotech', 'ai'],
    style: 'academic, curious, deep-thinking, connects biology with tech',
    photo_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face',
    education: { institution: 'IISc Bangalore', degree: 'PhD', field: 'Genomics', start_year: 2019, end_year: 2024, is_current: false },
    skills: ['Genomics', 'Bioinformatics', 'Python', 'Machine Learning', 'R'],
  },
]

const POST_PROMPTS: Record<string, string[]> = {
  build_log: [
    'Write a short build log about what you shipped today. 1-2 specific things. Be concrete about the tech or process.',
    'Share a technical problem you solved today. Explain the fix briefly.',
    'Talk about a bug that took forever to find. Be specific.',
    'Share a small win from today - a feature shipped, a metric improved.',
    'Post an update on your current project. What did you build this week?',
  ],
  idea: [
    'Share an idea you cannot stop thinking about. Be specific. 2-3 sentences.',
    'Post a hot take about your industry or field.',
    'Share an observation about how builders/founders work.',
    'What is one thing everyone in your field is wrong about?',
  ],
  discussion: [
    'Ask an honest question to the DSRT community about building or shipping.',
    'Share a thought that starts a discussion. Be specific to your domain.',
    'Post a lesson you learned this week from your work.',
    'Share a book, article, or podcast that changed how you think.',
  ],
  looking_for: [
    'Post that you are looking for a specific collaborator. Be VERY specific about the skill and project.',
    'Ask for feedback on something you are building. Describe it briefly.',
    'Ask for recommendations from the community.',
  ],
  milestone: [
    'Share a milestone you just hit. Include numbers if possible.',
    'Celebrate a small win you had this week.',
  ],
}

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase env' }, { status: 500 })
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
    bots_updated: 0,
    posts_created: 0,
    errors: [] as string[],
  }

  // Ensure bots + full profiles
  for (const p of BOT_PERSONAS) {
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id, avatar_url')
        .eq('username', p.username)
        .maybeSingle()

      let userId: string

      if (existing) {
        userId = existing.id
        // Update avatar if it's still the old cartoon
        if (!existing.avatar_url?.includes('unsplash')) {
          await supabase
            .from('users')
            .update({
              avatar_url: p.photo_url,
              bio: p.bio,
              tagline: p.tagline,
            })
            .eq('id', userId)
          stats.bots_updated++
        }
      } else {
        const { data: authUser, error: authError } =
          await supabase.auth.admin.createUser({
            email: p.email,
            password: `Bot${Date.now()}${Math.random().toString(36).slice(2, 8)}!`,
            email_confirm: true,
            user_metadata: { full_name: p.full_name },
          })

        if (authError || !authUser.user) {
          stats.errors.push(`Bot auth: ${p.username}`)
          continue
        }

        await new Promise((r) => setTimeout(r, 400))
        userId = authUser.user.id

        await supabase
          .from('users')
          .update({
            username: p.username,
            full_name: p.full_name,
            tagline: p.tagline,
            bio: p.bio,
            location: p.location,
            brings: p.brings,
            interest_topics: p.interest_topics,
            avatar_url: p.photo_url,
            is_bot: true,
            onboarding_complete: true,
          })
          .eq('id', userId)

        // Add education
        await supabase.from('user_education').insert({
          user_id: userId,
          institution_name: p.education.institution,
          degree: p.education.degree,
          field: p.education.field,
          start_year: p.education.start_year,
          end_year: p.education.end_year,
          is_current: p.education.is_current,
        })

        // Add skills — find matching skills
        for (const skillName of p.skills) {
          const { data: skill } = await supabase
            .from('skills')
            .select('id')
            .ilike('name', skillName)
            .maybeSingle()
          if (skill) {
            await supabase.from('user_skills').insert({
              user_id: userId,
              skill_id: skill.id,
              level: 'strong',
            })
          }
        }

        stats.bots_created++
      }
    } catch (err: any) {
      stats.errors.push(`Bot ${p.username}: ${err.message?.slice(0, 40)}`)
    }
  }

  // Generate posts
  for (let i = 0; i < count; i++) {
    try {
      const persona = BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)]
      const postTypes = Object.keys(POST_PROMPTS)
      const postType = postTypes[Math.floor(Math.random() * postTypes.length)]
      const prompts = POST_PROMPTS[postType]
      const prompt = prompts[Math.floor(Math.random() * prompts.length)]

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are ${persona.full_name}, ${persona.tagline}. About you: ${persona.bio}. Style: ${persona.style}. You post on DSRT (a professional network for builders). Write like a real human. Do NOT use hashtags. Do NOT sign the post. Just write the content directly. Keep it 2-4 sentences unless the topic needs more.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.95,
        max_tokens: 350,
      })

      const content = completion.choices[0].message.content?.trim()
      if (!content) continue

      const { data: bot } = await supabase
        .from('users')
        .select('id')
        .eq('username', persona.username)
        .single()

      if (!bot) continue

      await supabase.from('posts').insert({
        user_id: bot.id,
        type: postType,
        content,
        visibility: 'global',
      })

      stats.posts_created++
      await new Promise((r) => setTimeout(r, 500))
    } catch (err: any) {
      stats.errors.push(`Post: ${err.message?.slice(0, 40)}`)
    }
  }

  return NextResponse.json({ success: true, ...stats })
}