'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  CheckCircle, PencilSimple, Camera, Plus, ShieldCheck, X, Check,
  MapPin, GraduationCap, GlobeSimple, ChatCircle, Handshake,
  UserPlus, UserCheck, DotsThree, Sparkle, Trophy, Rocket, Code,
  Users, GitBranch, LinkedinLogo, TwitterLogo, GithubLogo, Link as LinkIcon,
  Clock, CaretRight, CaretLeft, Buildings, Star, Heart,
  Package, Briefcase, PushPin, ArrowRight, Compass, CurrencyDollar,
  Calendar, Trash, FileText, Video, Image as ImageIcon, DownloadSimple,
  Certificate, Medal, Newspaper,
} from '@phosphor-icons/react'
import { formatDistanceToNow, format } from 'date-fns'

const BADGE_ICON_MAP: Record<string, any> = {
  ShieldCheck, Rocket, GitBranch, Users, Trophy, Compass, CurrencyDollar, Star, Medal, Certificate,
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  blue:   { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', ring: 'ring-blue-500/40' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30', ring: 'ring-purple-500/40' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30', ring: 'ring-orange-500/40' },
  green:  { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', ring: 'ring-green-500/40' },
  pink:   { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/30', ring: 'ring-pink-500/40' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', ring: 'ring-yellow-500/40' },
  red:    { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', ring: 'ring-red-500/40' },
  cyan:   { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30', ring: 'ring-cyan-500/40' },
  gray:   { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/30', ring: 'ring-gray-500/40' },
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'ventures', label: 'Ventures' },
  { id: 'communities', label: 'Communities' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'network', label: 'Network' },
  { id: 'activity', label: 'Activity' },
  { id: 'about', label: 'About' },
]

interface BuilderProfileProps {
  profile: any
  isOwner: boolean
  badges: any[]
  education: any[]
  experience: any[]
  skills: any[]
  projects: any[]
  ventures: any[]
  communities: any[]
  activelyBuilding: any
  followerCount: number
  followingCount: number
  connectionCount: number
  isFollowing: boolean
  featuredItems: any[]
  achievements: any[]
  activityPosts: any[]
  currentUserId: string | null
  followerList: any[]
  followingList: any[]
}

export function BuilderProfile(props: BuilderProfileProps) {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState(props.profile)
  const [activeTab, setActiveTab] = useState('overview')
  const [isFollowing, setIsFollowing] = useState(props.isFollowing)
  const [followerCount, setFollowerCount] = useState(props.followerCount)
  const [followLoading, setFollowLoading] = useState(false)
  const [completion, setCompletion] = useState<{ percentage: number; checklist: any[] } | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)

  const [education, setEducation] = useState(props.education)
  const [experience, setExperience] = useState(props.experience)
  const [skills, setSkills] = useState(props.skills)
  const [achievements, setAchievements] = useState(props.achievements)
  const [portfolio, setPortfolio] = useState(props.featuredItems)

  useEffect(() => {
    if (!props.isOwner) return
    fetch('/api/profile/completion').then(r => r.json()).then(data => {
      if (data && data.percentage !== undefined) {
        setCompletion(data)
        setShowCompletion(!profile.profile_completion_dismissed && data.percentage < 100)
      }
    })
  }, [props.isOwner, profile.profile_completion_dismissed])

  const handleFollow = async () => {
    if (!props.currentUserId) { router.push('/login'); return }
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', props.currentUserId).eq('following_type', 'user').eq('following_id', profile.id)
      setIsFollowing(false)
      setFollowerCount(c => c - 1)
    } else {
      await supabase.from('follows').insert({ follower_id: props.currentUserId, following_type: 'user', following_id: profile.id })
      setIsFollowing(true)
      setFollowerCount(c => c + 1)
      toast.success(`Following ${profile.full_name}`)
    }
    setFollowLoading(false)
  }

  const handleMessage = () => {
    if (!props.currentUserId) { router.push('/login'); return }
    router.push(`/messages?user=${profile.id}`)
  }

  const dismissCompletion = async () => {
    setShowCompletion(false)
    await fetch('/api/profile/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_completion_dismissed: true }),
    })
  }

  const updateProfileField = async (field: string, value: any) => {
    const res = await fetch('/api/profile/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(data.user)
      toast.success('Updated')
    } else {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 space-y-4">
      {/* PROFILE COMPLETION BANNER */}
      <AnimatePresence>
        {showCompletion && completion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-4 relative"
          >
            <button onClick={dismissCompletion} className="absolute top-3 right-3 p-1 hover:bg-muted/50 rounded">
              <X className="w-4 h-4" weight="bold" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Sparkle className="w-5 h-5 text-blue-500" weight="fill" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{completion.percentage}% Complete</p>
                <p className="text-xs text-muted-foreground">Complete your profile to improve recommendations and visibility.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {completion.checklist.map((item: any) => (
                <span key={item.key} className={cn(
                  'text-[10px] px-2 py-1 rounded-md font-semibold flex items-center gap-1',
                  item.done ? 'bg-green-500/10 text-green-500' : 'bg-muted/40 text-muted-foreground'
                )}>
                  {item.done ? <Check className="w-3 h-3" weight="bold" /> : <Plus className="w-3 h-3" weight="bold" />}
                  {item.label}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP ACTION BUTTONS (Owner only) */}
      {props.isOwner && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" weight="bold" /> Get Verified
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" weight="bold" /> Add Sections
          </Button>
          <Button size="sm" onClick={() => router.push('/settings')}>
            <PencilSimple className="w-3.5 h-3.5 mr-1" weight="bold" /> Edit Profile
          </Button>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="relative h-48 group">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: profile.banner_url
                ? `url(${profile.banner_url})`
                : 'linear-gradient(135deg, #1e293b 0%, #4c1d95 50%, #831843 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          {props.isOwner && (
            <BannerUploader onUpdate={(url: string) => setProfile({ ...profile, banner_url: url })} />
          )}
        </div>

        <div className="p-6 -mt-16 relative">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-shrink-0">
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {profile.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {props.isOwner && <AvatarUploader onUpdate={(url: string) => setProfile({ ...profile, avatar_url: url })} />}
              <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
            </div>

            <div className="flex-1 min-w-0 pt-16 lg:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{profile.full_name}</h1>
                {profile.is_verified && <CheckCircle className="w-6 h-6 text-blue-500" weight="fill" />}
              </div>

              {profile.tagline && (
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                  {profile.brings?.[0] && (
                    <>
                      <span className="capitalize">{profile.brings[0]}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{profile.tagline}</span>
                  {profile.institution?.short_name && (
                    <>
                      <span>·</span>
                      <span className="text-blue-500 font-medium">{profile.institution.short_name}</span>
                    </>
                  )}
                </div>
              )}

              {profile.bio && (
                <p className="text-sm text-foreground mt-3 max-w-2xl leading-relaxed">{profile.bio}</p>
              )}

              <SocialLinks profile={profile} />

              {!props.isOwner && (
                <div className="flex flex-wrap gap-2 mt-5">
                  <Button onClick={handleFollow} disabled={followLoading} variant={isFollowing ? 'outline' : 'default'} size="sm">
                    {isFollowing ? <><UserCheck className="w-3.5 h-3.5 mr-1" weight="bold" /> Following</> : <><UserPlus className="w-3.5 h-3.5 mr-1" weight="bold" /> Follow</>}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleMessage}>
                    <ChatCircle className="w-3.5 h-3.5 mr-1" weight="bold" /> Message
                  </Button>
                  <Button variant="outline" size="sm"><Handshake className="w-3.5 h-3.5 mr-1" weight="bold" /> Collaborate</Button>
                  <Button variant="outline" size="sm"><Package className="w-3.5 h-3.5 mr-1" weight="bold" /> Invite to Project</Button>
                  <Button variant="ghost" size="sm"><DotsThree className="w-5 h-5" weight="bold" /></Button>
                </div>
              )}

              {/* Stats row */}
              <div className="flex gap-4 mt-4 text-xs">
                <button onClick={() => setActiveTab('network')} className="hover:underline">
                  <span className="font-bold">{followerCount}</span> <span className="text-muted-foreground">Followers</span>
                </button>
                <button onClick={() => setActiveTab('network')} className="hover:underline">
                  <span className="font-bold">{props.followingCount}</span> <span className="text-muted-foreground">Following</span>
                </button>
                <button onClick={() => setActiveTab('network')} className="hover:underline">
                  <span className="font-bold">{props.connectionCount}</span> <span className="text-muted-foreground">Connections</span>
                </button>
              </div>
            </div>

            <div className="lg:w-72 flex-shrink-0">
              <BadgesPanel badges={props.badges} />
            </div>
          </div>
        </div>

        <div className="border-t px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AboutMe profile={profile} isOwner={props.isOwner} onUpdate={updateProfileField} />
            <ActivelyBuilding activelyBuilding={props.activelyBuilding} isOwner={props.isOwner} projects={props.projects} ventures={props.ventures} onUpdate={(t: any, id: any) => { setProfile({ ...profile, actively_building_type: t, actively_building_id: id }); router.refresh() }} />
          </div>
          <ActivitySection posts={props.activityPosts} isOwner={props.isOwner} profile={profile} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FeaturedProjects projects={props.projects.filter((p: any) => p.is_featured)} isOwner={props.isOwner} allProjects={props.projects} onRefresh={() => router.refresh()} />
            <FeaturedVentures ventures={props.ventures.filter((v: any) => v.is_featured)} isOwner={props.isOwner} allVentures={props.ventures} onRefresh={() => router.refresh()} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ExperienceSection experience={experience} isOwner={props.isOwner} onChange={setExperience} />
            <SkillsSection skills={skills} isOwner={props.isOwner} onChange={setSkills} />
          </div>
          <EducationSection education={education} achievements={achievements} isOwner={props.isOwner} onChange={setEducation} />
        </>
      )}

      {activeTab === 'projects' && <ProjectsTab projects={props.projects} isOwner={props.isOwner} onRefresh={() => router.refresh()} />}
      {activeTab === 'ventures' && <VenturesTab ventures={props.ventures} isOwner={props.isOwner} onRefresh={() => router.refresh()} />}
      {activeTab === 'communities' && <CommunitiesTab communities={props.communities} />}
      {activeTab === 'portfolio' && <PortfolioTab items={portfolio} isOwner={props.isOwner} onChange={setPortfolio} />}
      {activeTab === 'achievements' && <AchievementsTab achievements={achievements} isOwner={props.isOwner} onChange={setAchievements} />}
      {activeTab === 'network' && <NetworkTab profile={profile} isOwner={props.isOwner} initialFollowers={props.followerList} initialFollowing={props.followingList} />}
      {activeTab === 'activity' && <ActivityTab posts={props.activityPosts} isOwner={props.isOwner} />}
      {activeTab === 'about' && <AboutTab profile={profile} education={education} experience={experience} skills={skills} isOwner={props.isOwner} onUpdate={updateProfileField} />}
    </div>
  )
}

// ============================================
// SUB COMPONENTS (existing from phase 1)
// ============================================
function SocialLinks({ profile }: any) {
  const links = [
    profile.github_url && { icon: GithubLogo, url: profile.github_url },
    profile.linkedin_url && { icon: LinkedinLogo, url: profile.linkedin_url },
    profile.twitter_url && { icon: TwitterLogo, url: profile.twitter_url },
    profile.website && { icon: GlobeSimple, url: profile.website },
  ].filter(Boolean)
  if (links.length === 0) return null
  return (
    <div className="flex gap-3 mt-3">
      {links.map((link: any, i: number) => {
        const Icon = link.icon
        return (
          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon className="w-5 h-5" weight="fill" />
          </a>
        )
      })}
    </div>
  )
}

function BadgesPanel({ badges }: { badges: any[] }) {
  return (
    <div className="bg-muted/20 border rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold">Badges</p>
        <button className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
          View all <CaretRight className="w-2.5 h-2.5" weight="bold" />
        </button>
      </div>
      {badges.length === 0 ? (
        <p className="text-[10px] text-muted-foreground text-center py-3">No badges yet</p>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {badges.slice(0, 5).map(b => {
            const Icon = BADGE_ICON_MAP[b.icon] || Star
            const colors = COLOR_MAP[b.color] || COLOR_MAP.purple
            return (
              <div key={b.id} className="flex flex-col items-center gap-1 group cursor-help" title={`${b.badge_label}${b.badge_sublabel ? ' — ' + b.badge_sublabel : ''}`}>
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border', colors.bg, colors.border)}>
                  <Icon className={cn('w-5 h-5', colors.text)} weight="fill" />
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold leading-tight">{b.badge_label}</p>
                  {b.badge_sublabel && <p className="text-[8px] text-muted-foreground leading-tight">{b.badge_sublabel}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AboutMe({ profile, isOwner, onUpdate }: any) {
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(profile.bio || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await onUpdate('bio', bio)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">About Me</h2>
        {isOwner && !editing && <button onClick={() => setEditing(true)} className="text-xs text-blue-500 hover:underline">Edit</button>}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="text-sm resize-none" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setBio(profile.bio || '') }}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      ) : (
        <>
          {profile.bio ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">{isOwner ? 'Add a bio to help others understand what you build' : 'No bio yet'}</p>
          )}
          <div className="mt-3 space-y-2 text-sm">
            {profile.institution && <div className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="w-4 h-4" weight="duotone" /><span>{profile.institution.short_name || profile.institution.name}</span></div>}
            {profile.location && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" weight="duotone" /><span>{profile.location}</span></div>}
            {Array.isArray(profile.languages) && profile.languages.length > 0 && <div className="flex items-center gap-2 text-muted-foreground"><GlobeSimple className="w-4 h-4" weight="duotone" /><span>{profile.languages.join(', ')}</span></div>}
            {profile.availability_hours && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" weight="duotone" /><span>Available · {profile.availability_hours} hrs/week</span></div>}
            {profile.open_to_collaboration && <div className="flex items-center gap-2 text-muted-foreground"><Handshake className="w-4 h-4" weight="duotone" /><span>Open to Collaboration</span></div>}
            {Array.isArray(profile.looking_for_opportunities) && profile.looking_for_opportunities.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2"><Sparkle className="w-3.5 h-3.5" weight="duotone" /> Looking for opportunities in</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.looking_for_opportunities.map((op: string) => (
                    <span key={op} className="text-[10px] px-2 py-0.5 bg-muted rounded font-medium">{op}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ActivelyBuilding({ activelyBuilding, isOwner, projects, ventures, onUpdate }: any) {
  const [selecting, setSelecting] = useState(false)
  const router = useRouter()

  const setActive = async (type: 'project' | 'venture', id: string | null) => {
    await fetch('/api/profile/actively-building', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: type, entity_id: id }),
    })
    onUpdate(type, id)
    toast.success(id ? 'Active work updated' : 'Cleared')
    setSelecting(false)
  }

  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Actively Building</h2>
        {isOwner && activelyBuilding && !selecting && <button onClick={() => setSelecting(true)} className="text-xs text-blue-500 hover:underline">Manage</button>}
      </div>

      {selecting && isOwner ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Select what you&apos;re actively building</p>
          {projects.length === 0 && ventures.length === 0 && <p className="text-xs text-muted-foreground italic">No projects or ventures yet</p>}
          {projects.map((p: any) => (
            <button key={p.id} onClick={() => setActive('project', p.id)} className="w-full text-left p-3 border rounded-lg hover:border-primary hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2"><Code className="w-4 h-4 text-purple-500" weight="fill" /><p className="text-sm font-semibold">{p.name}</p><span className="text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded font-bold ml-auto">PROJECT</span></div>
            </button>
          ))}
          {ventures.map((v: any) => (
            <button key={v.id} onClick={() => setActive('venture', v.id)} className="w-full text-left p-3 border rounded-lg hover:border-primary hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2"><Rocket className="w-4 h-4 text-orange-500" weight="fill" /><p className="text-sm font-semibold">{v.name}</p><span className="text-[10px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded font-bold ml-auto">VENTURE</span></div>
            </button>
          ))}
          <div className="flex gap-2 pt-2 border-t">
            {activelyBuilding && <Button variant="outline" size="sm" onClick={() => setActive(activelyBuilding.type, null)} className="flex-1">Clear</Button>}
            <Button variant="outline" size="sm" onClick={() => setSelecting(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      ) : activelyBuilding ? (
        <ActivelyBuildingCard data={activelyBuilding} isOwner={isOwner} />
      ) : (
        <div className="text-center py-8">
          <p className="text-sm font-semibold mb-1">You haven&apos;t selected anything.</p>
          <p className="text-xs text-muted-foreground mb-4">{isOwner ? 'Choose a project or venture you\'re actively building' : 'Not currently building anything specific'}</p>
          {isOwner && (
            <div className="flex gap-2 justify-center flex-wrap">
              {(projects.length > 0 || ventures.length > 0) && <Button size="sm" onClick={() => setSelecting(true)}>Select from existing</Button>}
              <Button size="sm" variant="outline" onClick={() => router.push('/projects/new')}>Create Project</Button>
              <Button size="sm" variant="outline" onClick={() => router.push('/ventures/new')}>Create Venture</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ActivelyBuildingCard({ data, isOwner }: any) {
  const isProject = data.type === 'project'
  const entity = data.entity
  const Icon = isProject ? Code : Rocket
  const color = isProject ? 'purple' : 'orange'
  const colors = COLOR_MAP[color]

  return (
    <div>
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.text)} weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{entity.name}</p>
            {entity.stage && <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold uppercase', colors.bg, colors.text)}>{entity.stage}</span>}
          </div>
          {entity.tagline && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{entity.tagline}</p>}
        </div>
      </div>
      {isProject && entity.progress_percent !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Progress</span><span className="font-bold">{entity.progress_percent}%</span></div>
          <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${entity.progress_percent}%` }} /></div>
        </div>
      )}
      <div className="flex gap-2">
        <Link href={isProject ? `/projects/${entity.slug}` : `/ventures/${entity.slug}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full h-8 text-xs">View {isProject ? 'Project' : 'Venture'}</Button>
        </Link>
        {!isOwner && <Button size="sm" className="flex-1 h-8 text-xs">Apply / Join</Button>}
      </div>
    </div>
  )
}

function ActivitySection({ posts, isOwner, profile }: any) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold">Activity</h2>
        <div className="flex items-center gap-2">
          {isOwner && <Button size="sm" className="h-7 text-xs"><PencilSimple className="w-3 h-3 mr-1" weight="bold" /> Create Post</Button>}
          <Link href={`/profile/${profile.username}?tab=activity`} className="text-xs text-blue-500 hover:underline">View all posts</Link>
        </div>
      </div>
      {posts.length === 0 ? (
        <div className="text-center py-8">
          <ChatCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" weight="duotone" />
          <p className="text-xs text-muted-foreground">{isOwner ? 'No posts yet — share your first update' : 'No activity yet'}</p>
        </div>
      ) : (
        <div className="relative">
          <button onClick={() => scroll('left')} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-muted"><CaretLeft className="w-3.5 h-3.5" weight="bold" /></button>
          <button onClick={() => scroll('right')} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-muted"><CaretRight className="w-3.5 h-3.5" weight="bold" /></button>
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {posts.map((post: any) => <ActivityPostCard key={post.id} post={post} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function ActivityPostCard({ post }: any) {
  const image = post.image_urls?.[0] || post.media_urls?.[0]
  return (
    <Link href={`/pulse/${post.id}`} className="flex-shrink-0 w-64 bg-card border rounded-xl overflow-hidden hover:border-primary/40 transition-colors block">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {post.is_pinned && <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><PushPin className="w-2.5 h-2.5" weight="fill" /> Pinned</span>}
          <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: false })} ago</span>
        </div>
        <p className="text-xs line-clamp-3 leading-relaxed">{post.title || post.content?.slice(0, 120)}</p>
        {image && <div className="mt-2 h-24 bg-muted rounded overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={image} alt="" className="w-full h-full object-cover" /></div>}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {post.like_count || 0}</span>
          <span className="flex items-center gap-0.5"><ChatCircle className="w-3 h-3" /> {post.comment_count || 0}</span>
        </div>
      </div>
    </Link>
  )
}

function FeaturedProjects({ projects, isOwner, allProjects, onRefresh }: any) {
  const router = useRouter()
  const [managing, setManaging] = useState(false)

  const toggleFeature = async (projectId: string, isFeatured: boolean) => {
    await fetch('/api/profile/feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: 'project', entity_id: projectId, is_featured: isFeatured }),
    })
    toast.success(isFeatured ? 'Added to featured' : 'Removed from featured')
    onRefresh()
  }

  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Featured Projects</h2>
        {isOwner && (projects.length > 0 || allProjects.length > 0) && <button onClick={() => setManaging(!managing)} className="text-xs text-blue-500 hover:underline">{managing ? 'Done' : 'Manage'}</button>}
      </div>

      {managing && allProjects.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-2">Toggle to feature (max 4)</p>
          {allProjects.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                {p.tagline && <p className="text-[10px] text-muted-foreground truncate">{p.tagline}</p>}
              </div>
              <Button size="sm" variant={p.is_featured ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => toggleFeature(p.id, !p.is_featured)}>
                {p.is_featured ? <><Check className="w-3 h-3 mr-1" weight="bold" /> Featured</> : 'Feature'}
              </Button>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0"><Code className="w-6 h-6 text-purple-500" weight="fill" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{isOwner ? "You haven't added any projects yet" : 'No featured projects'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add your projects to showcase what you&apos;re building.</p>
          </div>
          {isOwner && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              {allProjects.length > 0 && <Button size="sm" className="h-7 text-xs" onClick={() => setManaging(true)}><Plus className="w-3 h-3 mr-1" weight="bold" /> Add Project</Button>}
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push('/projects/new')}>Create Project <ArrowRight className="w-3 h-3 ml-1" weight="bold" /></Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {projects.slice(0, 4).map((p: any) => (
            <Link key={p.id} href={`/projects/${p.slug}`} className="p-3 border rounded-lg hover:border-primary/40 transition-colors">
              <p className="text-sm font-bold truncate">{p.name}</p>
              {p.tagline && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.tagline}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function FeaturedVentures({ ventures, isOwner, allVentures, onRefresh }: any) {
  const router = useRouter()
  const [managing, setManaging] = useState(false)

  const toggleFeature = async (ventureId: string, isFeatured: boolean) => {
    await fetch('/api/profile/feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: 'venture', entity_id: ventureId, is_featured: isFeatured }),
    })
    toast.success(isFeatured ? 'Added to featured' : 'Removed from featured')
    onRefresh()
  }

  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Featured Ventures</h2>
        {isOwner && (ventures.length > 0 || allVentures.length > 0) && <button onClick={() => setManaging(!managing)} className="text-xs text-blue-500 hover:underline">{managing ? 'Done' : 'Manage'}</button>}
      </div>

      {managing && allVentures.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {allVentures.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{v.name}</p>{v.tagline && <p className="text-[10px] text-muted-foreground truncate">{v.tagline}</p>}</div>
              <Button size="sm" variant={v.is_featured ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => toggleFeature(v.id, !v.is_featured)}>
                {v.is_featured ? <><Check className="w-3 h-3 mr-1" weight="bold" /> Featured</> : 'Feature'}
              </Button>
            </div>
          ))}
        </div>
      ) : ventures.length === 0 ? (
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0"><Rocket className="w-6 h-6 text-green-500" weight="fill" /></div>
          <div className="flex-1"><p className="text-sm font-semibold">{isOwner ? "You haven't added any ventures yet" : 'No featured ventures'}</p><p className="text-xs text-muted-foreground mt-0.5">Add your ventures to showcase what you&apos;re building.</p></div>
          {isOwner && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              {allVentures.length > 0 && <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600" onClick={() => setManaging(true)}><Plus className="w-3 h-3 mr-1" weight="bold" /> Add Venture</Button>}
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push('/ventures/new')}>Create Venture <ArrowRight className="w-3 h-3 ml-1" weight="bold" /></Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ventures.slice(0, 4).map((v: any) => (
            <Link key={v.id} href={`/ventures/${v.slug}`} className="p-3 border rounded-lg hover:border-primary/40 transition-colors">
              <p className="text-sm font-bold truncate">{v.name}</p>
              {v.tagline && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{v.tagline}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// EXPERIENCE SECTION (with editor)
// ============================================
function ExperienceSection({ experience, isOwner, onChange }: any) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this experience?')) return
    await fetch(`/api/profile/experience?id=${id}`, { method: 'DELETE' })
    onChange(experience.filter((e: any) => e.id !== id))
    toast.success('Deleted')
  }

  return (
    <>
      <div className="bg-card border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Experience</h2>
          {isOwner && <button onClick={() => { setEditingItem(null); setModalOpen(true) }} className="text-xs text-blue-500 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" weight="bold" /> Add</button>}
        </div>

        {experience.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            {isOwner ? 'Add your experience — internships, jobs, research, volunteer work' : 'No experience added'}
          </p>
        ) : (
          <div className="space-y-4">
            {experience.slice(0, 4).map((exp: any) => (
              <div key={exp.id} className="flex gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {exp.company_logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={exp.company_logo_url} alt={exp.company} className="w-full h-full object-cover" />
                  ) : (
                    <Briefcase className="w-5 h-5 text-muted-foreground" weight="duotone" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{exp.role}</p>
                    {exp.is_current && <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded font-bold uppercase">Current</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{exp.company}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {exp.start_date && format(new Date(exp.start_date), 'MMM yyyy')}
                    {' – '}
                    {exp.is_current ? 'Present' : (exp.end_date && format(new Date(exp.end_date), 'MMM yyyy'))}
                  </p>
                  {exp.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{exp.description}</p>}
                </div>
                {isOwner && (
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(exp); setModalOpen(true) }} className="p-1 hover:bg-muted rounded"><PencilSimple className="w-3.5 h-3.5" weight="regular" /></button>
                    <button onClick={() => handleDelete(exp.id)} className="p-1 hover:bg-red-500/10 text-red-500 rounded"><Trash className="w-3.5 h-3.5" weight="regular" /></button>
                  </div>
                )}
              </div>
            ))}
            {experience.length > 4 && <p className="text-xs text-blue-500 cursor-pointer hover:underline">View full experience →</p>}
          </div>
        )}
      </div>

      {modalOpen && (
        <ExperienceModal
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSave={(newItem: any) => {
            if (editingItem) {
              onChange(experience.map((e: any) => e.id === newItem.id ? newItem : e))
            } else {
              onChange([newItem, ...experience])
            }
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}

function ExperienceModal({ item, onClose, onSave }: any) {
  const [company, setCompany] = useState(item?.company || '')
  const [role, setRole] = useState(item?.role || '')
  const [employmentType, setEmploymentType] = useState(item?.employment_type || 'full-time')
  const [startDate, setStartDate] = useState(item?.start_date || '')
  const [endDate, setEndDate] = useState(item?.end_date || '')
  const [isCurrent, setIsCurrent] = useState(item?.is_current || false)
  const [description, setDescription] = useState(item?.description || '')
  const [location, setLocation] = useState(item?.location || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!company.trim() || !role.trim()) { toast.error('Company and role required'); return }
    setSaving(true)
    const payload = { company, role, employment_type: employmentType, start_date: startDate, end_date: isCurrent ? null : endDate, is_current: isCurrent, description, location }
    const res = await fetch('/api/profile/experience', {
      method: item ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item ? { ...payload, id: item.id } : payload),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSave(data.experience)
      toast.success(item ? 'Updated' : 'Added')
    } else {
      toast.error('Failed')
    }
  }

  return (
    <ModalShell title={item ? 'Edit Experience' : 'Add Experience'} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Company *</label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., IIT Delhi, Google, DSRT Connect" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Role *</label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., AI Research Intern, Founder" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Employment Type</label>
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-full h-9 text-sm bg-muted/40 border rounded-md px-2">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
              <option value="volunteer">Volunteer</option>
              <option value="contract">Contract</option>
              <option value="founder">Founder</option>
              <option value="research">Research</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Location</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isCurrent} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
          Currently working here
        </label>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="What did you accomplish? What skills did you use?" />
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

// ============================================
// SKILLS SECTION (with editor)
// ============================================
function SkillsSection({ skills, isOwner, onChange }: any) {
  const [modalOpen, setModalOpen] = useState(false)

  const grouped = skills.reduce((acc: any, s: any) => {
    const cat = s.skills?.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const handleDelete = async (id: string) => {
    await fetch(`/api/profile/skills?id=${id}`, { method: 'DELETE' })
    onChange(skills.filter((s: any) => s.id !== id))
    toast.success('Removed')
  }

  return (
    <>
      <div className="bg-card border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Skills</h2>
          {isOwner && <button onClick={() => setModalOpen(true)} className="text-xs text-blue-500 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" weight="bold" /> Add</button>}
        </div>

        {skills.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            {isOwner ? 'Add skills to help others find you' : 'No skills added'}
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([category, catSkills]: any) => (
              <div key={category}>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">{category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {catSkills.slice(0, 8).map((s: any) => (
                    <span key={s.id} className="text-[11px] px-2.5 py-1 bg-muted rounded font-medium flex items-center gap-1 group">
                      {s.skills?.name}
                      {isOwner && (
                        <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                          <X className="w-2.5 h-2.5" weight="bold" />
                        </button>
                      )}
                    </span>
                  ))}
                  {catSkills.length > 8 && <span className="text-[11px] px-2.5 py-1 bg-muted rounded font-bold text-muted-foreground">+{catSkills.length - 8}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <SkillModal
          onClose={() => setModalOpen(false)}
          onSave={(skill: any) => {
            onChange([...skills, skill])
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}

function SkillModal({ onClose, onSave }: any) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Technical')
  const [level, setLevel] = useState('intermediate')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) { toast.error('Skill name required'); return }
    setSaving(true)
    const res = await fetch('/api/profile/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, level }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSave(data.skill)
      toast.success('Skill added')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  return (
    <ModalShell title="Add Skill" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Skill Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Python, Product Strategy, Figma" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-9 text-sm bg-muted/40 border rounded-md px-2">
              <option value="Technical">Technical</option>
              <option value="Business">Business</option>
              <option value="Creative">Creative</option>
              <option value="Soft Skills">Soft Skills</option>
              <option value="Languages">Languages</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full h-9 text-sm bg-muted/40 border rounded-md px-2">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving} className="flex-1">{saving ? 'Adding...' : 'Add Skill'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

// ============================================
// EDUCATION SECTION (with editor)
// ============================================
function EducationSection({ education, achievements, isOwner, onChange }: any) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this education entry?')) return
    await fetch(`/api/profile/education?id=${id}`, { method: 'DELETE' })
    onChange(education.filter((e: any) => e.id !== id))
    toast.success('Deleted')
  }

  return (
    <>
      <div className="bg-card border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Education</h2>
          {isOwner && <button onClick={() => { setEditingItem(null); setModalOpen(true) }} className="text-xs text-blue-500 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" weight="bold" /> Add</button>}
        </div>

        {education.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">{isOwner ? 'Add your education' : 'No education added'}</p>
        ) : (
          <div className="space-y-4">
            {education.map((ed: any) => (
              <div key={ed.id} className="flex gap-3 group">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <GraduationCap className="w-5 h-5 text-red-600" weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{ed.institution_name}</p>
                  <p className="text-xs text-muted-foreground">{ed.degree}{ed.field ? ` in ${ed.field}` : ''}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{ed.start_year} – {ed.is_current ? 'Present' : ed.end_year}</p>
                  {ed.grade && <p className="text-[10px] text-muted-foreground mt-0.5">CGPA: {ed.grade}</p>}
                </div>
                {isOwner && (
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(ed); setModalOpen(true) }} className="p-1 hover:bg-muted rounded"><PencilSimple className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(ed.id)} className="p-1 hover:bg-red-500/10 text-red-500 rounded"><Trash className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {achievements.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">Achievements</p>
            <div className="space-y-2">
              {achievements.slice(0, 3).map((a: any) => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>{a.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <EducationModal
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSave={(newItem: any) => {
            if (editingItem) {
              onChange(education.map((e: any) => e.id === newItem.id ? newItem : e))
            } else {
              onChange([newItem, ...education])
            }
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}

function EducationModal({ item, onClose, onSave }: any) {
  const [institutionName, setInstitutionName] = useState(item?.institution_name || '')
  const [degree, setDegree] = useState(item?.degree || '')
  const [field, setField] = useState(item?.field || '')
  const [startYear, setStartYear] = useState(item?.start_year?.toString() || '')
  const [endYear, setEndYear] = useState(item?.end_year?.toString() || '')
  const [isCurrent, setIsCurrent] = useState(item?.is_current || false)
  const [grade, setGrade] = useState(item?.grade || '')
  const [activities, setActivities] = useState(item?.activities || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!institutionName.trim()) { toast.error('Institution name required'); return }
    setSaving(true)
    const payload = {
      institution_name: institutionName, degree, field,
      start_year: startYear ? parseInt(startYear) : null,
      end_year: isCurrent ? null : (endYear ? parseInt(endYear) : null),
      is_current: isCurrent, grade, activities,
    }
    const res = await fetch('/api/profile/education', {
      method: item ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item ? { ...payload, id: item.id } : payload),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSave(data.education)
      toast.success(item ? 'Updated' : 'Added')
    } else {
      toast.error('Failed')
    }
  }

  return (
    <ModalShell title={item ? 'Edit Education' : 'Add Education'} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Institution *</label>
          <Input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="e.g., IIT Delhi, Stanford University" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Degree</label>
            <Input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g., B.Tech" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Field</label>
            <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g., Electrical Engineering" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start Year</label>
            <Input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="2020" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">End Year</label>
            <Input type="number" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="2024" disabled={isCurrent} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
          Currently studying
        </label>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Grade (Optional)</label>
          <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g., 8.7/10 or 3.9 GPA" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Activities & Societies</label>
          <Textarea value={activities} onChange={(e) => setActivities(e.target.value)} rows={2} placeholder="Clubs, teams, research groups..." />
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

// ============================================
// PROJECTS TAB
// ============================================
function ProjectsTab({ projects, isOwner, onRefresh }: any) {
  const router = useRouter()

  const toggleFeature = async (projectId: string, isFeatured: boolean) => {
    await fetch('/api/profile/feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: 'project', entity_id: projectId, is_featured: isFeatured }),
    })
    onRefresh()
  }

  if (projects.length === 0) {
    return (
      <div className="bg-card border rounded-2xl p-12 text-center">
        <Code className="w-14 h-14 mx-auto text-purple-500/50 mb-3" weight="duotone" />
        <h3 className="font-bold">No projects yet</h3>
        <p className="text-sm text-muted-foreground mt-1">{isOwner ? 'Start building — create your first project' : 'This builder hasn\'t added projects yet'}</p>
        {isOwner && <Button size="sm" className="mt-4" onClick={() => router.push('/projects/new')}>Create Project</Button>}
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold">All Projects ({projects.length})</h2>
        {isOwner && <Button size="sm" onClick={() => router.push('/projects/new')}><Plus className="w-3.5 h-3.5 mr-1" weight="bold" /> New Project</Button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((p: any) => (
          <div key={p.id} className="border rounded-xl overflow-hidden hover:border-primary/40 transition-colors group">
            <Link href={`/projects/${p.slug}`} className="block">
              <div className="h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 relative">
                {p.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image_url} alt={p.name} className="w-full h-full object-cover" />
                )}
                {p.is_featured && (
                  <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 bg-yellow-500 text-white rounded font-bold flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5" weight="fill" /> FEATURED
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold truncate flex-1">{p.name}</p>
                  {p.stage && <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-500 rounded font-bold uppercase flex-shrink-0">{p.stage}</span>}
                </div>
                {p.tagline && <p className="text-[11px] text-muted-foreground line-clamp-2">{p.tagline}</p>}
                {Array.isArray(p.tech_stack) && p.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tech_stack.slice(0, 3).map((t: string) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
            {isOwner && (
              <div className="px-3 pb-3">
                <Button size="sm" variant={p.is_featured ? 'default' : 'outline'} className="w-full h-7 text-[11px]" onClick={() => toggleFeature(p.id, !p.is_featured)}>
                  {p.is_featured ? <><Star className="w-3 h-3 mr-1" weight="fill" /> Featured</> : 'Feature on profile'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// VENTURES TAB
// ============================================
function VenturesTab({ ventures, isOwner, onRefresh }: any) {
  const router = useRouter()

  const toggleFeature = async (id: string, isFeatured: boolean) => {
    await fetch('/api/profile/feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: 'venture', entity_id: id, is_featured: isFeatured }),
    })
    onRefresh()
  }

  if (ventures.length === 0) {
    return (
      <div className="bg-card border rounded-2xl p-12 text-center">
        <Rocket className="w-14 h-14 mx-auto text-orange-500/50 mb-3" weight="duotone" />
        <h3 className="font-bold">No ventures yet</h3>
        <p className="text-sm text-muted-foreground mt-1">{isOwner ? 'Launch your first venture' : 'This builder hasn\'t founded a venture yet'}</p>
        {isOwner && <Button size="sm" className="mt-4" onClick={() => router.push('/ventures/new')}>Create Venture</Button>}
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold">All Ventures ({ventures.length})</h2>
        {isOwner && <Button size="sm" onClick={() => router.push('/ventures/new')}><Plus className="w-3.5 h-3.5 mr-1" weight="bold" /> New Venture</Button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ventures.map((v: any) => (
          <div key={v.id} className="border rounded-xl overflow-hidden hover:border-primary/40 transition-colors group">
            <Link href={`/ventures/${v.slug}`} className="block p-4">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {v.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.logo_url} alt={v.name} className="w-full h-full object-cover" />
                  ) : (
                    <Rocket className="w-6 h-6 text-orange-500" weight="fill" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold">{v.name}</p>
                    {v.is_featured && <Star className="w-3 h-3 text-yellow-500" weight="fill" />}
                    {v.stage && <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded font-bold uppercase">{v.stage}</span>}
                  </div>
                  {v.tagline && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{v.tagline}</p>}
                  {v.industry && <p className="text-[10px] text-muted-foreground mt-1">{v.industry}</p>}
                </div>
              </div>
            </Link>
            {isOwner && (
              <div className="px-4 pb-4">
                <Button size="sm" variant={v.is_featured ? 'default' : 'outline'} className="w-full h-7 text-[11px]" onClick={() => toggleFeature(v.id, !v.is_featured)}>
                  {v.is_featured ? <><Star className="w-3 h-3 mr-1" weight="fill" /> Featured</> : 'Feature on profile'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// COMMUNITIES TAB
// ============================================
function CommunitiesTab({ communities }: any) {
  if (communities.length === 0) {
    return (
      <div className="bg-card border rounded-2xl p-12 text-center">
        <Users className="w-14 h-14 mx-auto text-blue-500/50 mb-3" weight="duotone" />
        <h3 className="font-bold">Not part of any communities yet</h3>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-2xl p-5">
      <h2 className="text-sm font-bold mb-4">Communities ({communities.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {communities.map((c: any) => (
          <Link key={c.id} href={`/community/${c.slug}`} className="border rounded-xl p-4 hover:border-primary/40 transition-colors flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {c.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.cover_url} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-6 h-6 text-blue-500" weight="fill" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1"><p className="text-sm font-bold truncate">{c.name}</p>{c.is_verified && <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" weight="fill" />}</div>
              <p className="text-[10px] text-muted-foreground">{c.member_count?.toLocaleString() || 0} members</p>
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block', c.role === 'owner' || c.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-muted text-muted-foreground')}>{c.role}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ============================================
// PORTFOLIO TAB
// ============================================
function PortfolioTab({ items, isOwner, onChange }: any) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    await fetch(`/api/profile/portfolio?id=${id}`, { method: 'DELETE' })
    onChange(items.filter((i: any) => i.id !== id))
    toast.success('Deleted')
  }

  return (
    <>
      <div className="bg-card border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Portfolio ({items.length})</h2>
          {isOwner && <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" weight="bold" /> Add Item</Button>}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-14 h-14 mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
            <p className="text-sm text-muted-foreground">{isOwner ? 'Add case studies, PDFs, videos, GitHub links, Figma files, research papers' : 'No portfolio items yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item: any) => (
              <div key={item.id} className="border rounded-xl overflow-hidden hover:border-primary/40 transition-colors group">
                {item.image_url && (
                  <div className="h-32 bg-muted overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-bold truncate">{item.title}</p>
                  {item.description && <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    {item.link_url && (
                      <a href={item.link_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Open
                      </a>
                    )}
                    {isOwner && (
                      <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <PortfolioModal
          onClose={() => setModalOpen(false)}
          onSave={(item: any) => {
            onChange([...items, item])
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}

function PortfolioModal({ onClose, onSave }: any) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState('showcase')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const res = await fetch('/api/profile/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, link_url: linkUrl, image_url: imageUrl, item_category: category, type: 'showcase' }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSave(data.item)
      toast.success('Portfolio item added')
    } else {
      toast.error('Failed')
    }
  }

  return (
    <ModalShell title="Add Portfolio Item" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., DSRT Connect case study" autoFocus />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Short description of the work" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-9 text-sm bg-muted/40 border rounded-md px-2">
            <option value="showcase">Showcase</option>
            <option value="case_study">Case Study</option>
            <option value="research">Research Paper</option>
            <option value="design">Design Work</option>
            <option value="video">Video</option>
            <option value="pdf">PDF Document</option>
            <option value="github">GitHub Repository</option>
            <option value="figma">Figma File</option>
            <option value="website">Website</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Link URL</label>
          <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Cover Image URL (optional)</label>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving} className="flex-1">{saving ? 'Adding...' : 'Add'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

// ============================================
// ACHIEVEMENTS TAB
// ============================================
function AchievementsTab({ achievements, isOwner, onChange }: any) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleDelete = async (id: string, source: string) => {
    if (source !== 'custom') { toast.error('Auto-generated achievements cannot be deleted'); return }
    if (!confirm('Delete?')) return
    await fetch(`/api/profile/achievements?id=${id}`, { method: 'DELETE' })
    onChange(achievements.filter((a: any) => a.id !== id))
    toast.success('Deleted')
  }

  return (
    <>
      <div className="bg-card border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Achievements ({achievements.length})</h2>
          {isOwner && <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" weight="bold" /> Add</Button>}
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-14 h-14 mx-auto text-yellow-500/50 mb-3" weight="duotone" />
            <p className="text-sm text-muted-foreground">{isOwner ? 'Awards, hackathons, certifications, publications' : 'No achievements yet'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 p-3 border rounded-xl hover:border-primary/40 transition-colors group">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', COLOR_MAP[a.color || 'yellow'].bg)}>
                  <Trophy className={cn('w-5 h-5', COLOR_MAP[a.color || 'yellow'].text)} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold">{a.title}</p>
                    {a.source === 'auto' && <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded font-bold uppercase">Auto</span>}
                    {a.category && <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-bold uppercase">{a.category}</span>}
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                  {a.issuer && <p className="text-[10px] text-muted-foreground mt-0.5">By {a.issuer}</p>}
                  {a.date_awarded && <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(a.date_awarded), 'MMM yyyy')}</p>}
                </div>
                {isOwner && a.source === 'custom' && (
                  <button onClick={() => handleDelete(a.id, a.source)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <AchievementModal
          onClose={() => setModalOpen(false)}
          onSave={(item: any) => {
            onChange([{ ...item, source: 'custom' }, ...achievements])
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}

function AchievementModal({ onClose, onSave }: any) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('award')
  const [issuer, setIssuer] = useState('')
  const [dateAwarded, setDateAwarded] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const res = await fetch('/api/profile/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, issuer, date_awarded: dateAwarded, url }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSave(data.achievement)
      toast.success('Achievement added')
    } else {
      toast.error('Failed')
    }
  }

  return (
    <ModalShell title="Add Achievement" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Smart India Hackathon 2024 – Winner" autoFocus />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-9 text-sm bg-muted/40 border rounded-md px-2">
            <option value="award">Award</option>
            <option value="hackathon">Hackathon</option>
            <option value="publication">Publication</option>
            <option value="certification">Certification</option>
            <option value="milestone">Milestone</option>
            <option value="custom">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Issuer / Organization</label>
          <Input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="e.g., Government of India" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date</label>
            <Input type="date" value={dateAwarded} onChange={(e) => setDateAwarded(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Link (optional)</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving} className="flex-1">{saving ? 'Adding...' : 'Add'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

// ============================================
// NETWORK TAB
// ============================================
function NetworkTab({ profile, isOwner, initialFollowers, initialFollowing }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'connections' | 'followers' | 'following' | 'communities'>('connections')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/profile/network?username=${profile.username}`)
      const d = await res.json()
      setData(d)
      setLoading(false)
    }
    load()
  }, [profile.username])

  const tabs = [
    { id: 'connections', label: 'Connections', count: data?.counts?.connections || 0 },
    { id: 'followers', label: 'Followers', count: data?.counts?.followers || 0 },
    { id: 'following', label: 'Following', count: data?.counts?.following || 0 },
    { id: 'communities', label: 'Communities', count: data?.counts?.communities || 0 },
  ]

  const current = data?.[activeSubTab] || []

  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex gap-1 border-b overflow-x-auto scrollbar-hide mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
              activeSubTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold', activeSubTab === t.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
      ) : current.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nothing here yet</p>
      ) : activeSubTab === 'communities' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {current.map((c: any) => (
            <Link key={c.id} href={`/community/${c.slug}`} className="border rounded-xl p-3 hover:border-primary/40 transition-colors flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-blue-500" weight="fill" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{c.name}</p><p className="text-[10px] text-muted-foreground">{c.member_count?.toLocaleString() || 0} members</p></div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {current.map((p: any) => (
            <Link key={p.id} href={`/profile/${p.username}`} className="border rounded-xl p-3 hover:border-primary/40 transition-colors flex items-center gap-3">
              <Avatar className="w-11 h-11"><AvatarImage src={p.avatar_url} /><AvatarFallback className="text-xs">{p.full_name?.[0]}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{p.full_name}</p><p className="text-[10px] text-muted-foreground truncate">{p.tagline || '@' + p.username}</p></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// ACTIVITY TAB
// ============================================
function ActivityTab({ posts, isOwner }: any) {
  if (posts.length === 0) {
    return (
      <div className="bg-card border rounded-2xl p-12 text-center">
        <ChatCircle className="w-14 h-14 mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
        <h3 className="font-bold">No posts yet</h3>
        {isOwner && <Button size="sm" className="mt-4">Create your first post</Button>}
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-2xl p-5">
      <h2 className="text-sm font-bold mb-4">All Posts ({posts.length})</h2>
      <div className="space-y-3">
        {posts.map((post: any) => (
          <Link key={post.id} href={`/pulse/${post.id}`} className="block border rounded-xl p-4 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              {post.is_pinned && <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><PushPin className="w-2.5 h-2.5" weight="fill" /> Pinned</span>}
              <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: false })} ago</span>
            </div>
            {post.title && <p className="text-sm font-bold mb-1">{post.title}</p>}
            <p className="text-xs text-muted-foreground line-clamp-3">{post.content}</p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.like_count || 0}</span>
              <span className="flex items-center gap-1"><ChatCircle className="w-3 h-3" /> {post.comment_count || 0}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ============================================
// ABOUT TAB
// ============================================
function AboutTab({ profile, education, experience, skills, isOwner, onUpdate }: any) {
  return (
    <div className="space-y-4">
      <AboutMe profile={profile} isOwner={isOwner} onUpdate={onUpdate} />
      <ExperienceSection experience={experience} isOwner={isOwner} onChange={() => {}} />
      <SkillsSection skills={skills} isOwner={isOwner} onChange={() => {}} />
      <EducationSection education={education} achievements={[]} isOwner={isOwner} onChange={() => {}} />
    </div>
  )
}

// ============================================
// SHARED MODAL SHELL
// ============================================
function ModalShell({ title, onClose, children }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}><X className="w-5 h-5" weight="bold" /></button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  )
}

// ============================================
// UPLOADERS
// ============================================
function AvatarUploader({ onUpdate }: any) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'avatar')
    const res = await fetch('/api/profile/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json()
      onUpdate(data.url)
      toast.success('Avatar updated')
    } else toast.error('Upload failed')
    setUploading(false)
  }

  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <button onClick={() => ref.current?.click()} disabled={uploading} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background shadow-lg hover:scale-110 transition-transform">
        <Camera className="w-4 h-4" weight="bold" />
      </button>
    </>
  )
}

function BannerUploader({ onUpdate }: any) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'banner')
    const res = await fetch('/api/profile/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json()
      onUpdate(data.url)
      toast.success('Banner updated')
    } else toast.error('Upload failed')
    setUploading(false)
  }

  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <button onClick={() => ref.current?.click()} disabled={uploading} className="absolute top-3 right-3 px-3 h-8 rounded-lg bg-black/40 text-white text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/60">
        <Camera className="w-3.5 h-3.5" weight="bold" /> Change Banner
      </button>
    </>
  )
}