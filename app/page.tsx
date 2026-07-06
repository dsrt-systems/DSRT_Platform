// app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingHero } from '@/components/public/LandingHero'
import { PrinciplesSection } from '@/components/public/PrinciplesSection'
import { CoreArchitectureSection } from '@/components/public/CoreArchitectureSection'
import { MotionSection } from '@/components/public/MotionSection'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicNav } from '@/components/public/PublicNav'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function Root() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_complete) {
      redirect('/feed')
    } else {
      redirect('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,rgba(30,60,120,0.3)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(10,30,80,0.4)_0%,transparent_60%)]" />
        <StarsBg />
      </div>

      <PublicNav />

      <main className="relative">
        <LandingHero />
        <PrinciplesSection />
        <CoreArchitectureSection />
        <MotionSection />
        <PublicFooter />
      </main>
    </div>
  )
}

function StarsBg() {
  const stars = Array.from({ length: 150 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.2,
  }))

  return (
    <div className="absolute inset-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  )
}