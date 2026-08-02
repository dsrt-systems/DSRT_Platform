'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { STAGES } from '@/lib/config/sectors'
import { 
  CaretLeft, 
  CheckCircle,
  UserPlus,
  ChatCircle,
  ShareNetwork,
  DotsThree,
  MapPin,
  Users,
  Plus,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { VentureOverview } from './VentureOverview'
import { VentureSidebar } from './VentureSidebar'
import { VentureUpdates } from './VentureUpdates'
import { VentureNotifications } from './VentureNotifications'
import { GrowthOverview } from './GrowthOverview'
import { ConnectionModal } from './modals/ConnectionModal'
import { toast } from 'sonner'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'traction', label: 'Traction' },
  { id: 'team', label: 'Team' },
  { id: 'product', label: 'Product' },
  { id: 'problem', label: 'Problem & Solution' },
  { id: 'technology', label: 'Technology' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'hiring', label: 'Hiring' },
  { id: 'investors', label: 'Investors' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'updates', label: 'Updates' },
  { id: 'documents', label: 'Documents' },
]

interface VentureDetailViewProps {
  venture: any
  isOwner: boolean
  currentUser: any
  teamMembers: any[]
  metrics: any[]
  updates: any[]
  lookingFor: any[]
  documents: any[]
}

export function VentureDetailView({
  venture: initialVenture,
  isOwner,
  currentUser,
  teamMembers: initialTeamMembers,
  metrics: initialMetrics,
  updates: initialUpdates,
  lookingFor: initialLookingFor,
  documents: initialDocuments,
}: VentureDetailViewProps) {
  const [venture, setVenture] = useState(initialVenture)
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers)
  const [metrics, setMetrics] = useState(initialMetrics)
  const [updates, setUpdates] = useState(initialUpdates)
  const [lookingFor, setLookingFor] = useState(initialLookingFor)
  const [documents, setDocuments] = useState(initialDocuments)
  const [activeTab, setActiveTab] = useState('overview')
  const [connectionModalOpen, setConnectionModalOpen] = useState(false)

  const stage = STAGES.find(s => s.id === venture.stage) || STAGES[0]

  const displayedTabs = isOwner ? [...tabs, { id: 'notifications', label: 'Notifications' }] : tabs

  const handleShare = async () => {
    const url = `${window.location.origin}/ventures/${venture.slug}`
    await navigator.clipboard.writeText(url)
    toast.success('Venture link copied to clipboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
        <Link
          href="/ventures"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <CaretLeft className="w-4 h-4" weight="bold" />
          Back to Ventures
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: Header */}
          <div>
            <div className="flex items-start gap-4">
              {venture.logo_url ? (
                <img
                  src={venture.logo_url}
                  alt={venture.name}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
                  {venture.name[0]?.toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border',
                    stage.color
                  )}>
                    {stage.label}
                  </span>
                  {venture.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/30">
                      <CheckCircle className="w-3 h-3" weight="fill" />
                      Verified
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {venture.name}
                </h1>

                {venture.tagline && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {venture.tagline}
                  </p>
                )}

                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {venture.industry && (
                    <span className="text-[10px] px-2 py-0.5 bg-muted rounded font-medium">
                      {venture.industry}
                    </span>
                  )}
                  {venture.sub_category && (
                    <span className="text-[10px] px-2 py-0.5 bg-muted rounded font-medium">
                      {venture.sub_category}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                  {venture.start_date && (
                    <span>
                      Founded {new Date(venture.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {venture.headquarters && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" weight="duotone" />
                      {venture.headquarters}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" weight="duotone" />
                    {teamMembers.length} {teamMembers.length === 1 ? 'Member' : 'Members'}
                  </span>
                  {venture.funding_stage && (
                    <span className="text-blue-500 font-medium">
                      {venture.funding_stage.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-5">
              {!isOwner && (
                <>
                  <Button size="sm">
                    <UserPlus className="w-3.5 h-3.5 mr-1" weight="bold" />
                    Follow
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setConnectionModalOpen(true)}
                  >
                    <ShareNetwork className="w-3.5 h-3.5 mr-1" weight="bold" />
                    Connect
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChatCircle className="w-3.5 h-3.5 mr-1" weight="bold" />
                    Message
                  </Button>
                </>
              )}
              {isOwner && (
                <span className="text-xs text-muted-foreground italic">
                  This is your venture. Click any section below to add details.
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <ShareNetwork className="w-3.5 h-3.5" weight="bold" />
              </Button>
              <Button variant="ghost" size="sm">
                <DotsThree className="w-4 h-4" weight="bold" />
              </Button>
            </div>
          </div>

          {/* Right: Sidebar */}
          <VentureSidebar
            venture={venture}
            metrics={metrics}
            lookingFor={lookingFor}
            updates={updates}
            teamMembers={teamMembers}
            isOwner={isOwner}
            onUpdate={setVenture}
            onLookingForUpdate={setLookingFor}
          />
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b overflow-x-auto sticky top-14 bg-background z-30">
          <div className="flex gap-1 min-w-max">
            {displayedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {tab.id === 'notifications' && isOwner && (
                  <span className="ml-1 text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    New
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6 pb-12">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <VentureOverview
                venture={venture}
                teamMembers={teamMembers}
                metrics={metrics}
                documents={documents}
                isOwner={isOwner}
                onUpdate={setVenture}
                onTeamUpdate={setTeamMembers}
                onMetricsUpdate={setMetrics}
                onDocumentsUpdate={setDocuments}
              />

              {/* Growth Overview - shown below overview grid */}
              <GrowthOverview venture={venture} metrics={metrics} />
            </div>
          )}

          {activeTab === 'updates' && (
            <VentureUpdates
              venture={venture}
              initialUpdates={updates}
              isOwner={isOwner}
            />
          )}

          {activeTab === 'notifications' && isOwner && (
            <VentureNotifications ventureId={venture.id} />
          )}

          {!['overview', 'updates', 'notifications'].includes(activeTab) && (
            <div className="bg-card border rounded-2xl p-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-blue-500" weight="bold" />
              </div>
              <h3 className="font-bold text-lg mb-2 capitalize">{activeTab} Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                We're building this section next. For now, focus on completing your Overview.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {venture.is_building_public && (
        <div className="border-t bg-gradient-to-br from-blue-500/5 to-purple-500/5 py-6 mt-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
            <p className="text-sm font-semibold">
              🌱 This venture is building in public with DSRT Connect
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All updates, metrics, and progress are transparently shared with the community.
            </p>
          </div>
        </div>
      )}

      {/* Connection Modal */}
      {connectionModalOpen && (
        <ConnectionModal
          open={connectionModalOpen}
          onOpenChange={setConnectionModalOpen}
          venture={venture}
          onSent={() => {}}
        />
      )}
    </div>
  )
}