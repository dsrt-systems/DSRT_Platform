import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DEFAULT_BANNERS = [
  {
    id: 'b1',
    title: 'Share Your Experiments',
    image_url: '/banners/team-up-1.png',
    cta_route: '/projects/create',
  },
  {
    id: 'b2',
    title: 'Build with COCO AI',
    image_url: '/banners/coco-bg.png',
    cta_route: '/coco',
  },
  {
    id: 'b3',
    title: 'Find Technical Collaborators',
    image_url: '/banners/team-up-2.png',
    cta_route: '/looking-for',
  },
  {
    id: 'b4',
    title: 'Start a DSRT Project',
    image_url: '/banners/create-project-bg.png',
    cta_route: '/projects/create',
  },
]

export async function GET() {
  const supabase = await createClient()

  try {
    const { data: dbBanners } = await supabase
      .from('project_explore_banners')
      .select('id, title, image_url, cta_route')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (dbBanners && dbBanners.length > 0) {
      return NextResponse.json({ banners: dbBanners })
    }

    return NextResponse.json({ banners: DEFAULT_BANNERS })
  } catch {
    return NextResponse.json({ banners: DEFAULT_BANNERS })
  }
}