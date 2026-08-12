'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Info, Newspaper, UsersThree, BookOpen, Gear, ShareNetwork,
  BookmarkSimple, DotsThreeOutline, Certificate, Plus, Trash, ChatCircleText,
  Briefcase
} from '@phosphor-icons/react'
import { ProjectHeader } from './ProjectHeader'
import { ProjectSidebar } from './ProjectSidebar'
import { ProjectCompletion } from './ProjectCompletion'
import { ProjectAbout } from './ProjectAbout'
import { ProjectUpdates } from './ProjectUpdates'
import { ProjectReviews } from './ProjectReviews'
import { ProjectDocumentation } from './ProjectDocumentation'
import { ProjectSettings } from './ProjectSettings'
import { AddMemberModal } from './AddMemberModal'
import { GlanceEditModal } from './GlanceEditModal'
import { TeamStructureTab } from './team/TeamStructureTab'
import { ApplicantsTab } from './applicants/ApplicantsTab'
import { PermissionsPanel } from './applicants/PermissionsPanel'

interface Props { slug: string }

export function ProjectDetailPage({ slug }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('tab')
      if (t) return t
    }
    return 'overview'
  })
  const [showCompletion, setShowCompletion] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [pendingAppCount, setPendingAppCount] = useState(0)
  const [canViewApplicants, setCanViewApplicants] = useState(false)
  const [glanceField, setGlanceField] = useState<string | null>(null)
  const [images, setImages] = useState<any[]>([])

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch('/api/projects/' + slug)
      if (!res.ok) {
        if (res.status === 404) { router.push('/projects'); return }
        throw new Error('Failed to load')
      }
      const json = await res.json()
      setData(json)
      setImages(json.images || [])
      if (json?.project?.completion_dismissed) setShowCompletion(false)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [slug, router])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
    fetchDetail()
  }, [fetchDetail, supabase])

  // Poll pending applicants count every 30 seconds
  useEffect(() => {
    const fetchCount = () => {
      fetch('/api/projects/' + slug + '/applicants/count')
        .then(r => r.json())
        .then(j => {
          setPendingAppCount(j.count || 0)
          setCanViewApplicants(typeof j.count === 'number')
        })
        .catch(() => setCanViewApplicants(false))
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [slug])

  const patchProject = async (patch: Record<string, any>) => {
    try {
      const res = await fetch('/api/projects/' + slug, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Update failed')
      const json = await res.json()
      setData((prev: any) => ({ ...prev, project: { ...prev.project, ...json.project } }))
    } catch (e) { console.error('Patch error:', e) }
  }

  const uploadMedia = async (file: File, kind: 'logo' | 'cover' | 'gallery' | 'update'): Promise<string | null> => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', kind)
      const res = await fetch('/api/projects/' + slug + '/media-upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      return json.url
    } catch (e) {
      console.error('Upload error:', e)
      alert('Upload failed.')
      return null
    }
  }

  const toggleFollow = async () => {
    try {
      const res = await fetch('/api/projects/' + slug + '/follow', { method: 'POST' })
      const json = await res.json()
      setData((prev: any) => ({
        ...prev,
        is_following: json.following,
        project: { ...prev.project, follower_count: (prev.project.follower_count || 0) + (json.following ? 1 : -1) }
      }))
    } catch (e) { console.error(e) }
  }

  const addLink = async (type: string, url: string, label?: string) => {
    try {
      const res = await fetch('/api/projects/' + slug + '/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, url, label }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData((prev: any) => ({ ...prev, links: [...(prev.links || []), json.link] }))
    } catch (e: any) { alert(e?.message || 'Failed') }
  }

  const deleteLink = async (id: string) => {
    try {
      await fetch('/api/projects/' + slug + '/links?id=' + id, { method: 'DELETE' })
      setData((prev: any) => ({ ...prev, links: (prev.links || []).filter((l: any) => l.id !== id) }))
    } catch (e) { console.error(e) }
  }

  const dismissCompletion = async () => {
    setShowCompletion(false)
    await patchProject({ completion_dismissed: true })
  }

  const saveAbout = async (content: string) => {
    await patchProject({ about_content: content })
  }

  const addImage = async (url: string, type: string) => {
    try {
      const res = await fetch('/api/projects/' + slug + '/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setImages(prev => [...prev, json.image])
    } catch (e: any) { alert(e?.message || 'Failed') }
  }

  const deleteImage = async (id: string) => {
    try {
      await fetch('/api/projects/' + slug + '/images?id=' + id, { method: 'DELETE' })
      setImages(prev => prev.filter(i => i.id !== id))
    } catch (e) { console.error(e) }
  }

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return
    try {
      await fetch('/api/projects/' + slug + '/members?id=' + memberId, { method: 'DELETE' })
      setData((prev: any) => ({ ...prev, team: (prev.team || []).filter((m: any) => m.id !== memberId) }))
    } catch (e) { console.error(e) }
  }

  const archiveProject = async () => {
    try {
      await fetch('/api/projects/' + slug, { method: 'DELETE' })
      router.push('/projects')
    } catch (e) { console.error(e) }
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <Skeleton className="h-4 w-24 mb-3 bg-white/5" />
        <Skeleton className="h-[280px] w-full mb-5 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full bg-white/5 rounded-lg" />
            <Skeleton className="h-[300px] w-full bg-white/5 rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-[300px] bg-white/5 rounded-xl" />
            <Skeleton className="h-[220px] bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!data?.project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[14px] text-white/50">Project not found.</p>
      </div>
    )
  }

  const project = data.project
  const team = data.team || []
  const links = data.links || []
  const isOwner = data.is_owner
  const isFollowing = data.is_following

  const completionSuggestions: string[] = []
  if (!project.logo_url) completionSuggestions.push('Add logo')
  if (!project.cover_image_url) completionSuggestions.push('Add cover')
  if (!project.short_description) completionSuggestions.push('Description')
  if (!project.about_content || project.about_content.length < 50) completionSuggestions.push('About')
  if (!project.industry) completionSuggestions.push('Industry')
  if (!project.category || project.category.length < 3) completionSuggestions.push('Categories')
  if (links.length === 0) completionSuggestions.push('Links')
  if (team.length === 0) completionSuggestions.push('Team')

  // Build tabs (Applicants for owner + permitted, Settings for owner only)
  const tabs: { id: string; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'updates', label: 'Updates', icon: Newspaper },
    { id: 'team', label: 'Team', icon: UsersThree },
    { id: 'reviews', label: 'Reviews', icon: ChatCircleText },
    { id: 'documentation', label: 'Documentation', icon: BookOpen },
  ]
  if (canViewApplicants || isOwner) {
    tabs.push({ id: 'applicants', label: 'Applicants', icon: Briefcase, badge: pendingAppCount })
  }
  if (isOwner) tabs.push({ id: 'settings', label: 'Settings', icon: Gear })

  const glanceInitialValue = glanceField ? (project as any)[glanceField] : null

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 xl:pb-8">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">

        {isOwner && showCompletion && (project.completion_percent || 0) < 100 && (
          <ProjectCompletion
            percent={project.completion_percent || 0}
            onDismiss={dismissCompletion}
            suggestions={completionSuggestions}
          />
        )}

        <ProjectHeader
          project={project}
          isOwner={isOwner}
          isFollowing={isFollowing}
          onFollowToggle={toggleFollow}
          onMessage={() => alert('Messaging — coming soon')}
          onCollaborate={() => alert('Collaboration — coming soon')}
          onUpdate={patchProject}
          onUploadMedia={(file, kind) => uploadMedia(file, kind)}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mt-6">
          <div className="min-w-0">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-white/[0.08] mb-6">
              <div className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
                {tabs.map(t => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={
                        'px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ' +
                        (activeTab === t.id
                          ? 'text-white border-white'
                          : 'text-white/45 border-transparent hover:text-white/80')
                      }
                    >
                      <Icon size={15} weight={activeTab === t.id ? 'fill' : 'regular'} />
                      {t.label}
                      {t.badge && t.badge > 0 && (
                        <span className="ml-0.5 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {t.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-0.5 pb-2">
                <button className="w-8 h-8 rounded-md hover:bg-white/[0.05] text-white/50 hover:text-white flex items-center justify-center transition-colors" title="Share">
                  <ShareNetwork size={15} />
                </button>
                <button className="w-8 h-8 rounded-md hover:bg-white/[0.05] text-white/50 hover:text-white flex items-center justify-center transition-colors" title="Save">
                  <BookmarkSimple size={15} />
                </button>
                <button className="w-8 h-8 rounded-md hover:bg-white/[0.05] text-white/50 hover:text-white flex items-center justify-center transition-colors" title="More">
                  <DotsThreeOutline size={15} />
                </button>
              </div>
            </div>

            {activeTab === 'overview' && (
              <>
                <ProjectAbout
                  slug={slug}
                  aboutContent={project.about_content}
                  images={images}
                  isOwner={isOwner}
                  onSaveAbout={saveAbout}
                  onAddImage={addImage}
                  onDeleteImage={deleteImage}
                  onUploadFile={(file, kind) => uploadMedia(file, kind)}
                />
                <ProjectUpdates
                  slug={slug}
                  projectId={project.id}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                  onUploadFile={(file, kind) => uploadMedia(file, kind)}
                  projectStage={project.stage}
                  isMember={team.some((m: any) => m.user_id === currentUserId)}
                />
              </>
            )}

            {activeTab === 'updates' && (
              <ProjectUpdates
                slug={slug}
                projectId={project.id}
                isOwner={isOwner}
                currentUserId={currentUserId}
                onUploadFile={(file, kind) => uploadMedia(file, kind)}
                projectStage={project.stage}
                isMember={team.some((m: any) => m.user_id === currentUserId)}
              />
            )}

            {activeTab === 'team' && (
              <TeamStructureTab
                slug={slug}
                projectId={project.id}
                isOwner={isOwner}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'reviews' && (
              <ProjectReviews
                slug={slug}
                projectId={project.id}
                currentUserId={currentUserId}
                isOwner={isOwner}
                isPublic={project.is_public}
              />
            )}

            {activeTab === 'documentation' && (
              <ProjectDocumentation
                slug={slug}
                project={project}
                isOwner={isOwner}
              />
            )}

            {activeTab === 'applicants' && (canViewApplicants || isOwner) && (
              <ApplicantsTab slug={slug} isOwner={isOwner} />
            )}

            {activeTab === 'settings' && isOwner && (
              <div className="space-y-5">
                <ProjectSettings
                  slug={slug}
                  project={project}
                  onUpdate={patchProject}
                  onArchive={archiveProject}
                />
                <PermissionsPanel slug={slug} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <ProjectSidebar
              project={project}
              team={team}
              links={links}
              isOwner={isOwner}
              onAddMember={() => setAddMemberOpen(true)}
              onAddLink={addLink}
              onDeleteLink={deleteLink}
              onEditGlance={(field) => setGlanceField(field)}
            />
          </div>
        </div>
      </div>

      {addMemberOpen && (
        <AddMemberModal
          slug={slug}
          onClose={() => setAddMemberOpen(false)}
          onAdded={() => fetchDetail()}
        />
      )}

      {glanceField && (
        <GlanceEditModal
          field={glanceField}
          currentValue={glanceInitialValue}
          onClose={() => setGlanceField(null)}
          onSave={async (patch) => { await patchProject(patch) }}
        />
      )}
    </div>
  )
}
