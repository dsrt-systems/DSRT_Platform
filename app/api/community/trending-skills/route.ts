import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  // Get most used skills in recent posts (last 30 days)
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('skills, tags')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .not('skills', 'is', null)

  // Count skill frequency
  const skillCounts: Record<string, number> = {}

  recentPosts?.forEach(post => {
    const allSkills = [...(post.skills || []), ...(post.tags || [])]
    allSkills.forEach(skill => {
      const normalized = skill.toLowerCase().trim()
      if (normalized.length > 1) {
        skillCounts[normalized] = (skillCounts[normalized] || 0) + 1
      }
    })
  })

  // Also get most added user skills recently
  const { data: recentUserSkills } = await supabase
    .from('user_skills')
    .select('skills(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  recentUserSkills?.forEach((us: any) => {
    const name = us.skills?.name?.toLowerCase().trim()
    if (name) {
      skillCounts[name] = (skillCounts[name] || 0) + 1
    }
  })

  // Sort and return top 15
  const trending = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }))

  return NextResponse.json({ skills: trending })
}