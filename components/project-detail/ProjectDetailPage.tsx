'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Info, Newspaper, UsersThree, BookOpen, Gear,
  Briefcase, ChatCircleText
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
import { ConnectComposer } from '@/components/inbox/ConnectComposer'
import { PermissionsPanel } from './applicants/PermissionsPanel'
import { OpportunitiesSection } from '@/components/looking-for/embed/OpportunitiesSection'

import { ProjectAnalyticsPanel } from './widgets/ProjectAnalyticsPanel'
import { ProjectTipsPanel } from './widgets/ProjectTipsPanel'
import { DsrtPage, DsrtTabs, DsrtSkeleton, DsrtLayoutWithRail } from '@/components/dsrt'

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
  const [connectOpen, setConnectOpen] = useState(false)
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

  useEffect(() => {
    if (!data?.project?.id) return
    const trackView = async () => {
      try {
        await fetch('/api/projects/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: data.project.id, source: 'direct' }),
        })
      } catch {}
    }
    trackView()
  }, [data?.project?.id, data?.is_owner])

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

  const onDeleteLink = async (id: string) => {
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

  const archiveProject = async () => {
    try {
      await fetch('/api/projects/' + slug, { method: 'DELETE' })
      router.push('/projects')
    } catch (e) { console.error(e) }
  }

  if (loading) {
    return (
      <DsrtPage width="wide">
        <DsrtSkeleton className="h-64 w-full mb-6 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <DsrtSkeleton className="h-96 w-full rounded-2xl" />
          <DsrtSkeleton className="h-96 w-full rounded-2xl" />
        </div>
      </DsrtPage>
    )
  }

  if (!data?.project) {
    return <DsrtPage width="default"><p className="text-[14px] text-white/50 text-center py-20">Project not found.</p></DsrtPage>
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
  if (links.length === 0) completionSuggestions.push('Links')
  if (team.length === 0) completionSuggestions.push('Team')

  const tabs: { value: string; label: string; badge?: number }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'updates', label: 'Updates' },
    { value: 'team', label: 'Team' },
    { value: 'reviews', label: 'Reviews' },
    { value: 'documentation', label: 'Documentation' },
  ]
  if (canViewApplicants || isOwner) {
    tabs.push({ value: 'applicants', label: 'Applicants', badge: pendingAppCount })
  }
  if (isOwner) tabs.push({ value: 'settings', label: 'Settings' })

  return (
    <DsrtPage width="wide" className="space-y-6">
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
        onCollaborate={() => setConnectOpen(true)}
        onUpdate={patchProject}
        onUploadMedia={(file, kind) => uploadMedia(file, kind)}
      />

      <OpportunitiesSection
        scope="project"
        slug={slug}
        title="Open Positions"
        emptyMessage={isOwner
          ? "You haven't posted any open positions yet. Create one from Looking For."
          : "No open positions on this project right now."}
        limit={4}
      />

      <DsrtLayoutWithRail
        railBreakpoint="lg"
        rail={
          <ProjectSidebar
            project={project}
            team={team}
            links={links}
            isOwner={isOwner}
            onAddMember={() => setAddMemberOpen(true)}
            onAddLink={addLink}
            onDeleteLink={onDeleteLink}
            onEditGlance={(field) => setGlanceField(field)}
          />
        }
      >
        <div className="space-y-6">
          {/* UPDATED: sticky top-[116px] md:top-[64px] */}
          <div className="sticky top-[116px] md:top-[64px] z-20 bg-[#05070D]/95 backdrop-blur-md pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <DsrtTabs
              variant="underline"
              tabs={tabs}
              activeValue={activeTab}
              onValueChange={setActiveTab}
            />
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <ProjectAnalyticsPanel slug={slug} isOwner={isOwner} />
              <ProjectTipsPanel stage={project.stage} projectType={project.project_type} domain={project.industry} isOwner={isOwner} />
              
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
            </div>
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
            <TeamStructureTab slug={slug} projectId={project.id} isOwner={isOwner} currentUserId={currentUserId} />
          )}

          {activeTab === 'reviews' && (
            <ProjectReviews slug={slug} projectId={project.id} currentUserId={currentUserId} isOwner={isOwner} isPublic={project.is_public} />
          )}

          {activeTab === 'documentation' && (
            <ProjectDocumentation slug={slug} project={project} isOwner={isOwner} />
          )}

          {activeTab === 'applicants' && (canViewApplicants || isOwner) && (
            <ApplicantsTab slug={slug} isOwner={isOwner} />
          )}

          {activeTab === 'settings' && isOwner && (
            <div className="space-y-5">
              <ProjectSettings slug={slug} project={project} onUpdate={patchProject} onArchive={archiveProject} />
              <PermissionsPanel slug={slug} />
            </div>
          )}
        </div>
      </DsrtLayoutWithRail>

      {addMemberOpen && (
        <AddMemberModal slug={slug} onClose={() => setAddMemberOpen(false)} onAdded={() => fetchDetail()} />
      )}

      {glanceField && (
        <GlanceEditModal
          field={glanceField}
          currentValue={glanceField ? (project as any)[glanceField] : null}
          onClose={() => setGlanceField(null)}
          onSave={async (patch) => { await patchProject(patch) }}
        />
      )}

      {connectOpen && (
        <ConnectComposer
          referenceType="project"
          referenceId={project.id}
          referenceName={project.name}
          referenceSlug={project.slug}
          onClose={() => setConnectOpen(false)}
          onSent={() => fetchDetail()}
        />
      )}
    </DsrtPage>
  )
}