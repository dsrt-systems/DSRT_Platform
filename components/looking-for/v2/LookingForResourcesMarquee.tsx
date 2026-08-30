'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, ArrowSquareOut, Star, BookmarkSimple, Compass } from '@phosphor-icons/react'

export interface ResourceItem {
  id: string
  title: string
  provider: string
  category: string
  url: string
  description?: string
  is_hidden_gem?: boolean
}

const LOOKING_FOR_RESOURCES: ResourceItem[] = [
  {
    id: 'lf-res-1',
    title: 'How to Get Rich (Without Getting Lucky)',
    provider: 'Naval Ravikant',
    category: 'FOUNDER & CAREER',
    url: 'https://nav.al/rich',
    description: 'Building leverage, specific knowledge, and judgment without relying on luck.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-2',
    title: 'YC Co-Founder Matching Engine',
    provider: 'Y Combinator',
    category: 'HIRING & COFOUNDER',
    url: 'https://www.ycombinator.com/cofounder-matching',
    description: 'The canonical algorithm for finding technical and business cofounders globally.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-3',
    title: 'The Mom Test: How to Talk to Users & Cofounders',
    provider: 'Rob Fitzpatrick',
    category: 'VALIDATION & FIT',
    url: 'https://www.momtestbook.com',
    description: 'How to communicate and validate ideas when everyone is trying not to hurt your feelings.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-4',
    title: 'Free Legal Forms & Contractor Agreements',
    provider: 'Cooley GO',
    category: 'LEGAL & CONTRACTS',
    url: 'https://www.cooleygo.com/documents/',
    description: 'Vetted non-disclosure, advisor, independent contractor, and offer letter templates.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-5',
    title: 'Amp It Up: High-Velocity Execution & Hiring',
    provider: 'Frank Slootman',
    category: 'HIRING & TEAMS',
    url: 'https://www.snowflake.com/blog/amp-it-up/',
    description: 'How Snowflake’s CEO raises standards, speeds up decisions, and hires elite contributors.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-6',
    title: 'The 90-Day Onboarding Playbook',
    provider: 'First Round Review',
    category: 'TEAM MANAGEMENT',
    url: 'https://review.firstround.com',
    description: 'A structured blueprint to integrate new engineers and product leads in record time.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-7',
    title: 'The Founder’s Dilemmas: Equity Splits & Control',
    provider: 'Noam Wasserman (Harvard)',
    category: 'COFOUNDER & EQUITY',
    url: 'https://www.hbs.edu',
    description: 'Data-backed research on cofounder equity splits, vesting schedules, and avoiding early breakup.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-8',
    title: 'Pricing Creativity: Value-Based Freelance Rates',
    provider: 'Chris Do / The Futur',
    category: 'FREELANCING',
    url: 'https://thefutur.com',
    description: 'How designers, developers, and consultants price work based on value instead of hours.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-9',
    title: 'Anonymous Technical Mock Interviews',
    provider: 'interviewing.io',
    category: 'INTERVIEWING',
    url: 'https://interviewing.io',
    description: 'Practice real system design and coding interviews with senior silicon valley engineers.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-10',
    title: 'Engineering & Product Compensation Engine',
    provider: 'Levels.fyi',
    category: 'SALARY & BENCHMARKS',
    url: 'https://www.levels.fyi',
    description: 'Real-time verified salary, equity, and hourly rate benchmarks across tech roles.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-11',
    title: 'Read.cv Builder Profiles',
    provider: 'Read.cv',
    category: 'PROOF OF WORK',
    url: 'https://read.cv',
    description: 'Minimalist, proof-of-work profiles tailored for engineers, designers, and researchers.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-12',
    title: 'Radical Candor: Direct Feedback Without Friction',
    provider: 'Kim Scott',
    category: 'TEAM MANAGEMENT',
    url: 'https://www.radicalcandor.com',
    description: 'How to give direct, actionable feedback to teammates without damaging psychological safety.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-13',
    title: 'Clerky Legal Framework for Founding Teams',
    provider: 'Clerky',
    category: 'LEGAL & CONTRACTS',
    url: 'https://www.clerky.com',
    description: 'Flawless legal paperwork for founding teams, NDAs, IP assignment, and contractor agreements.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-14',
    title: 'Bonsai Freelance Contracts & Scope Generators',
    provider: 'HelloBonsai',
    category: 'FREELANCING',
    url: 'https://www.hellobonsai.com',
    description: 'Vetted freelance contracts, milestone invoices, and scope-of-work agreement builders.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-15',
    title: 'MicroMentor Free Founder Network',
    provider: 'MicroMentor',
    category: 'MENTORSHIP',
    url: 'https://www.micromentor.org',
    description: 'Free, 1-on-1 mentorship connecting early builders with experienced industry operators.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-16',
    title: 'Reforge Career & Growth Ladders',
    provider: 'Reforge',
    category: 'CAREER & GROWTH',
    url: 'https://www.reforge.com',
    description: 'Deep dives on career advancement, retention loops, and product-led growth frameworks.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-17',
    title: 'A.Team Elite Builder Pods',
    provider: 'A.Team',
    category: 'TEAM FORMATION',
    url: 'https://www.a.team',
    description: 'Forming elite cloud teams and high-impact product pods for ambitious builds.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-18',
    title: 'Holloway Guide to Equity & Compensation',
    provider: 'Holloway',
    category: 'EQUITY & SALARY',
    url: 'https://www.holloway.com/g/equity-compensation',
    description: 'The definitive guide to stock options, vesting schedules, dilution, and offer letters.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-19',
    title: 'Peerlist Proof-of-Work Directory',
    provider: 'Peerlist',
    category: 'PROOF OF WORK',
    url: 'https://peerlist.io',
    description: 'Professional social network based on real projects, GitHub activity, and design drops.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-20',
    title: 'Lenny’s Hiring & Interview Playbook',
    provider: 'Lenny Rachitsky',
    category: 'HIRING & TEAMS',
    url: 'https://www.lennysnewsletter.com',
    description: 'Battle-tested question banks, scorecards, and hiring funnels for PMs and engineers.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-21',
    title: 'Contra Commission-Free Freelance OS',
    provider: 'Contra',
    category: 'FREELANCING',
    url: 'https://contra.com',
    description: 'Showcase work, manage independent contracts, and get paid with zero platform fees.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-22',
    title: 'Demand Curve Hiring & Growth Playbooks',
    provider: 'Demand Curve',
    category: 'HIRING & GROWTH',
    url: 'https://www.demandcurve.com',
    description: 'Tactical acquisition, candidate outreach, and growth strategies for early startups.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-23',
    title: 'Key Values Engineering Culture Matcher',
    provider: 'Key Values',
    category: 'CULTURE & FIT',
    url: 'https://www.keyvalues.com',
    description: 'Find engineering team matches based on real operational values and work styles.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-24',
    title: 'Basecamp Shape Up: Fixed Time, Variable Scope',
    provider: 'Basecamp',
    category: 'PROJECT WORKFLOW',
    url: 'https://basecamp.com/shapeup',
    description: 'Stop doing Scrum. Shape work into 6-week cycles with clear boundaries.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-25',
    title: 'Stripe Atlas Founder & Contractor Guide',
    provider: 'Stripe Atlas',
    category: 'LEGAL & CONTRACTS',
    url: 'https://stripe.com/atlas/guides',
    description: 'Incorporation, founder stock issuance, IP assignment, and compliant hiring.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-26',
    title: 'YC Co-Founder Equity Split Matrix',
    provider: 'Y Combinator',
    category: 'COFOUNDER & EQUITY',
    url: 'https://www.ycombinator.com/library/5x-how-to-split-equity-among-co-founders',
    description: 'Why equal cofounder equity splits build long-term alignment, and how to structure them.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-27',
    title: 'Remote.com Global Hiring & Contractor Guide',
    provider: 'Remote.com',
    category: 'REMOTE WORK',
    url: 'https://remote.com/resources',
    description: 'Compliant international contractor vs employee classification across 150+ countries.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-28',
    title: 'Carta Cap Table & Dilution Simulator',
    provider: 'Carta',
    category: 'EQUITY & SALARY',
    url: 'https://carta.com',
    description: 'Simulating option pools, vesting schedules, and dilution before offering equity.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-29',
    title: 'Deel Global Contractor Compliance OS',
    provider: 'Deel',
    category: 'REMOTE WORK',
    url: 'https://www.deel.com',
    description: 'Global contractor agreements, local tax compliance, and automated payouts.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-30',
    title: 'Do Things That Don’t Scale',
    provider: 'Paul Graham',
    category: 'FOUNDER & CAREER',
    url: 'https://paulgraham.com/ds.html',
    description: 'Why manual recruiting and direct hands-on onboarding beats early automation every time.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-31',
    title: 'Stanford CS183: Recruiting & Culture',
    provider: 'Sam Altman / Stanford',
    category: 'HIRING & TEAMS',
    url: 'https://startupclass.samaltman.com',
    description: 'How to recruit your first 10 teammates, evaluate mission fit, and build culture.',
    is_hidden_gem: true,
  },
  {
    id: 'lf-res-32',
    title: 'Loom Async Communication Briefs',
    provider: 'Loom',
    category: 'REMOTE WORK',
    url: 'https://www.loom.com/blog',
    description: 'Replacing unnecessary status meetings with asynchronous video briefs for remote teams.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-33',
    title: 'Notion Hiring & Applicant Tracking OS',
    provider: 'Notion',
    category: 'HIRING & TEMPLATES',
    url: 'https://www.notion.so/templates/category/hr-people',
    description: 'Free candidate pipeline databases, interview scorecards, and onboarding hubs.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-34',
    title: 'Wellfound Salary & Equity Analytics',
    provider: 'Wellfound (AngelList Talent)',
    category: 'SALARY & BENCHMARKS',
    url: 'https://wellfound.com/salaries',
    description: 'Role-based salary, equity, and remote flexibility benchmarks for startup roles.',
    is_hidden_gem: false,
  },
  {
    id: 'lf-res-35',
    title: 'The Co-Founder Alignment Framework',
    provider: 'Founders Future',
    category: 'COFOUNDER & EQUITY',
    url: 'https://www.foundersfuture.com',
    description: '50 pre-incorporation alignment questions every founding team must answer before teaming up.',
    is_hidden_gem: true,
  },
]

export function LookingForResourcesMarquee() {
  const [isPaused, setIsPaused] = useState(false)
  const [duplicated, setDuplicated] = useState<ResourceItem[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Loop pattern for uninterrupted scrolling
    setDuplicated([
      ...LOOKING_FOR_RESOURCES,
      ...LOOKING_FOR_RESOURCES,
      ...LOOKING_FOR_RESOURCES,
    ])
  }, [])

  useEffect(() => {
    fetch('/api/resources/save')
      .then((r) => (r.ok ? r.json() : { saved: [] }))
      .then((d) => {
        if (Array.isArray(d.saved)) {
          setSavedIds(new Set(d.saved.map((s: any) => s.resource_id || s)))
        }
      })
      .catch(() => {})
  }, [])

  const handleToggleSave = async (item: ResourceItem, wasSaved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (wasSaved) next.delete(item.id)
      else next.add(item.id)
      return next
    })

    try {
      await fetch('/api/resources/save', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: item.id, source_type: 'founder' }),
      })
      toast.success(
        wasSaved ? 'Removed from saved library' : 'Saved to your resources library'
      )
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev)
        if (wasSaved) next.add(item.id)
        else next.delete(item.id)
        return next
      })
      toast.error('Could not update saved status')
    }
  }

  return (
    <div className="mt-16 pt-10 border-t border-zinc-800/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#121215] border border-zinc-800/80 flex items-center justify-center shrink-0 shadow-inner">
            <Compass size={18} weight="fill" className="text-zinc-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-white tracking-tight">
                Collaborator & Career Hidden Gems
              </h2>
              <span className="h-5 px-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center">
                Curated
              </span>
            </div>
            <p className="text-[13px] text-zinc-500 mt-0.5">
              Hand-picked playbooks, legal templates, equity calculators, and career frameworks.
            </p>
          </div>
        </div>

        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          Explore library <ArrowRight size={12} weight="bold" />
        </Link>
      </div>

      {/* Marquee Band */}
      <div
        className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-[#121215] via-[#0e0e11] to-[#0a0a0c] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Soft edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-[#0a0a0c] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-[#0a0a0c] to-transparent pointer-events-none" />

        <div
          className="flex gap-4 py-2"
          style={{
            animation: `marquee-looking-for-scroll 110s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
            width: 'fit-content',
            willChange: 'transform',
          }}
        >
          {duplicated.map((item, idx) => {
            const isSaved = savedIds.has(item.id)
            return (
              <a
                key={`${item.id}-${idx}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group shrink-0 w-[310px] p-5 bg-[#141418]/90 hover:bg-[#18181d] border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-all block relative shadow-sm"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleToggleSave(item, isSaved)
                  }}
                  className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isSaved
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-transparent text-zinc-600 hover:bg-zinc-800 hover:text-white'
                  }`}
                  aria-label={isSaved ? 'Remove from saved' : 'Save'}
                >
                  <BookmarkSimple size={13} weight={isSaved ? 'fill' : 'regular'} />
                </button>

                <div className="flex items-center gap-2 mb-2.5 pr-8">
                  <span className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold truncate">
                    {item.category}
                  </span>
                  {item.is_hidden_gem && (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                      <Star size={9} weight="fill" /> Gem
                    </span>
                  )}
                </div>

                <h3 className="text-[13.5px] font-bold text-white group-hover:text-blue-300 transition-colors leading-snug mb-2 line-clamp-2 min-h-[38px]">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-[11.5px] text-zinc-400/90 leading-relaxed line-clamp-2 mb-4 min-h-[32px]">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-[11px]">
                  <span className="text-zinc-400 font-semibold truncate max-w-[200px]">
                    {item.provider}
                  </span>
                  <span className="inline-flex items-center gap-1 text-zinc-500 group-hover:text-white font-medium transition-colors">
                    Open <ArrowSquareOut size={11} />
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-looking-for-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  )
}