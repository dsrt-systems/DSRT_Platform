import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  technology: { icon: 'Cpu', color: 'blue', label: 'Technology' },
  entrepreneurship: { icon: 'Rocket', color: 'orange', label: 'Entrepreneurship' },
  'ai/ml': { icon: 'Brain', color: 'purple', label: 'AI / ML' },
  ai: { icon: 'Brain', color: 'purple', label: 'AI / ML' },
  design: { icon: 'PaintBrush', color: 'pink', label: 'Design' },
  research: { icon: 'MagnifyingGlass', color: 'green', label: 'Research' },
  finance: { icon: 'CurrencyDollar', color: 'yellow', label: 'Finance' },
  healthtech: { icon: 'Heartbeat', color: 'red', label: 'HealthTech' },
  health: { icon: 'Heartbeat', color: 'red', label: 'HealthTech' },
  education: { icon: 'GraduationCap', color: 'cyan', label: 'Education' },
  business: { icon: 'Briefcase', color: 'gray', label: 'Business' },
  general: { icon: 'Users', color: 'blue', label: 'General' },
  club: { icon: 'Users', color: 'blue', label: 'Clubs' },
}

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_community_categories')
  if (error) return NextResponse.json({ categories: [], error: error.message })

  const enriched = (data || []).map((c: any) => {
    const key = (c.category || 'general').toLowerCase()
    const meta = CATEGORY_META[key] || CATEGORY_META.general
    return {
      slug: c.category,
      label: meta.label,
      icon: meta.icon,
      color: meta.color,
      community_count: c.community_count,
      member_count: c.member_count,
      is_trending: c.is_trending,
    }
  })

  return NextResponse.json({ categories: enriched })
}
