import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DsrtLogo } from '@/components/ui/DsrtLogo'
import { ArrowRight, Mail } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function WelcomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, username, normalized_username, onboarding_complete')
    .eq('id', user.id)
    .single()

  // Ensure they actually finished onboarding
  if (!profile?.onboarding_complete) {
    redirect('/onboarding')
  }

  const dsrtEmail = `${profile.normalized_username}@dsrtai.com`
  const displayName = profile.full_name?.split(' ')[0] || profile.username

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
      {/* Premium Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111A30] via-[#050505] to-[#050505] opacity-80 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />

      {/* Elevated Header */}
      <header className="relative z-10 border-b border-white/[0.04] px-6 lg:px-12 h-20 flex items-center bg-[#050505]/80 backdrop-blur-md">
        <DsrtLogo size={32} showText />
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[500px] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-forwards">
          
          {/* Glassmorphic Elevated Card */}
          <div className="bg-[#0A0D14]/80 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-10 shadow-2xl relative overflow-hidden text-center">
            
            {/* Subtle top card glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#4F7CFF]/40 to-transparent" />

            <h1 className="text-[28px] font-semibold tracking-tight text-white leading-tight mb-3 mt-4">
              Your DSRT setup is complete.
            </h1>
            <p className="text-[15px] text-white/60 leading-relaxed mb-10">
              Welcome to the network, {displayName}. Your workspace and recommendations have been personalized.
            </p>

            {/* Identity Summary Box */}
            <div className="bg-[#050505] border border-white/10 rounded-2xl p-6 mb-10 text-left flex items-center gap-5 shadow-inner">
              <div className="w-14 h-14 rounded-full bg-[#4F7CFF]/10 border border-[#4F7CFF]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[20px] font-bold text-[#4F7CFF]">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold text-white truncate">
                  {profile.full_name}
                </p>
                <p className="text-[14px] text-white/50 font-mono mt-0.5 truncate">
                  @{profile.username}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[12px] font-medium text-emerald-400/90">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{dsrtEmail}</span>
                </div>
              </div>
            </div>

            <Link
              href="/home"
              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 bg-[#4F7CFF] hover:bg-[#3D6BF5] text-white text-[15px] font-bold shadow-[0_4px_20px_rgba(79,124,255,0.25)] hover:shadow-[0_4px_25px_rgba(79,124,255,0.4)]"
            >
              Enter DSRT Connect <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}