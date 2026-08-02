'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  BookOpen, 
  Target, 
  Compass,
  Lightbulb,
  Rocket,
  Warning,
  PuzzlePiece,
  Money,
  ChartLineUp,
  Users,
  FilePdf,
  Plus,
  PencilSimple,
  Sparkle,
  ArrowRight,
  Wrench,
} from '@phosphor-icons/react'
import { EditTextModal } from './modals/EditTextModal'
import { BusinessModelModal } from './modals/BusinessModelModal'
import { TeamMemberModal } from './modals/TeamMemberModal'
import { MetricModal } from './modals/MetricModal'
import { MetricDataModal } from './modals/MetricDataModal'

interface VentureOverviewProps {
  venture: any
  teamMembers: any[]
  metrics: any[]
  documents: any[]
  isOwner: boolean
  onUpdate: (venture: any) => void
  onTeamUpdate: (team: any[]) => void
  onMetricsUpdate: (metrics: any[]) => void
  onDocumentsUpdate: (docs: any[]) => void
}

export function VentureOverview({
  venture,
  teamMembers,
  metrics,
  documents,
  isOwner,
  onUpdate,
  onTeamUpdate,
  onMetricsUpdate,
}: VentureOverviewProps) {
  // Text edit modal
  const [editModal, setEditModal] = useState<{ 
    open: boolean; 
    field: string; 
    label: string; 
    value: string; 
    multiline?: boolean; 
    maxLength?: number 
  } | null>(null)

  // Business model modal
  const [businessModelModalOpen, setBusinessModelModalOpen] = useState(false)

  // Team modals
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)

  // Metric modals
  const [metricModalOpen, setMetricModalOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<any>(null)
  const [metricDataModalOpen, setMetricDataModalOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<any>(null)

  const openEditor = (field: string, label: string, value: string, multiline = true, maxLength = 2000) => {
    setEditModal({ open: true, field, label, value: value || '', multiline, maxLength })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - 2 cols */}
      <div className="lg:col-span-2 space-y-6">
        {/* About Section */}
        <SectionCard
          icon={BookOpen}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          title={`About ${venture.name}`}
          isOwner={isOwner}
          isEmpty={!venture.description || venture.description.length < 50}
          emptyText="Tell the world your story"
          emptySubtext="Share a 2000-word description of what you do, who you serve, and why it matters"
          onAdd={() => openEditor('description', `About ${venture.name}`, venture.description, true, 2000)}
        >
          {venture.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {venture.description}
            </p>
          )}
        </SectionCard>

        {/* Mission | Vision | Why Now */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MiniSection
            icon={Target}
            iconColor="text-purple-500"
            iconBg="bg-purple-500/10"
            title="Mission"
            content={venture.mission}
            emptyText="Why you exist"
            isOwner={isOwner}
            onAdd={() => openEditor('mission', 'Mission', venture.mission, true, 500)}
          />
          <MiniSection
            icon={Compass}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-500/10"
            title="Vision"
            content={venture.vision}
            emptyText="Where you're going"
            isOwner={isOwner}
            onAdd={() => openEditor('vision', 'Vision', venture.vision, true, 500)}
          />
          <MiniSection
            icon={Lightbulb}
            iconColor="text-yellow-500"
            iconBg="bg-yellow-500/10"
            title="Why Now?"
            content={venture.why_now}
            emptyText="Why this timing matters"
            isOwner={isOwner}
            onAdd={() => openEditor('why_now', 'Why Now?', venture.why_now, true, 500)}
          />
        </div>

        {/* Problem & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SectionCard
            icon={Warning}
            iconColor="text-red-500"
            iconBg="bg-red-500/10"
            title="The Problem"
            isOwner={isOwner}
            isEmpty={!venture.problem}
            emptyText="What are you solving?"
            emptySubtext="Describe the pain point"
            onAdd={() => openEditor('problem', 'The Problem', venture.problem, true, 1000)}
          >
            {venture.problem && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {venture.problem}
              </p>
            )}
          </SectionCard>

          <SectionCard
            icon={PuzzlePiece}
            iconColor="text-green-500"
            iconBg="bg-green-500/10"
            title="Our Solution"
            isOwner={isOwner}
            isEmpty={!venture.solution}
            emptyText="How you're solving it"
            emptySubtext="Explain your approach"
            onAdd={() => openEditor('solution', 'Our Solution', venture.solution, true, 1000)}
          >
            {venture.solution && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {venture.solution}
              </p>
            )}
          </SectionCard>
        </div>

        {/* Business Model */}
        <SectionCard
          icon={Money}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          title="Business Model"
          isOwner={isOwner}
          isEmpty={!venture.business_model}
          emptyText="How do you make money?"
          emptySubtext="Select from 30+ business models"
          onAdd={() => setBusinessModelModalOpen(true)}
        >
          {venture.business_model && (
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm font-semibold capitalize">
                {venture.business_model.replace(/-/g, ' ')}
              </div>
              {venture.business_model_details && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  {venture.business_model_details}
                </p>
              )}
            </div>
          )}
        </SectionCard>

        {/* Pitch Deck Preview */}
        <SectionCard
          icon={FilePdf}
          iconColor="text-pink-500"
          iconBg="bg-pink-500/10"
          title="Pitch Deck"
          isOwner={isOwner}
          isEmpty={!venture.pitch_deck_url}
          emptyText="Upload your pitch deck"
          emptySubtext="PDF up to 20MB · Include problem, solution, market, team"
          onAdd={() => {}}
          topRight={venture.pitch_deck_url && (
            <a href={venture.pitch_deck_url} target="_blank" rel="noopener noreferrer" 
              className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              View Full Deck
              <ArrowRight className="w-3 h-3" weight="bold" />
            </a>
          )}
        >
          {venture.pitch_deck_url && (
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
              <FilePdf className="w-12 h-12 text-muted-foreground" weight="duotone" />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Right - 1 col */}
      <div className="space-y-6">
        {/* Key Metrics */}
        <SectionCard
          icon={ChartLineUp}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          title="Key Metrics"
          isOwner={isOwner}
          isEmpty={metrics.length === 0}
          emptyText="Track your growth"
          emptySubtext="Add MRR, users, retention & more"
          onAdd={() => {
            setEditingMetric(null)
            setMetricModalOpen(true)
          }}
          topRight={metrics.length > 0 && isOwner && (
            <button
              onClick={() => {
                setEditingMetric(null)
                setMetricModalOpen(true)
              }}
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              + Add
            </button>
          )}
        >
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {metrics.filter((m: any) => m.show_on_overview).slice(0, 4).map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (isOwner) {
                      setSelectedMetric(m)
                      setMetricDataModalOpen(true)
                    }
                  }}
                  className={cn(
                    'p-2.5 border rounded-lg text-left transition-all',
                    isOwner && 'hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
                  )}
                >
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    {m.name}
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {isOwner ? 'Click to add data' : '--'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Team */}
        <SectionCard
          icon={Users}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-500/10"
          title="Team"
          isOwner={isOwner}
          isEmpty={teamMembers.length === 0}
          emptyText="Add team members"
          emptySubtext="Show who's building"
          onAdd={() => {
            setEditingMember(null)
            setTeamModalOpen(true)
          }}
          topRight={teamMembers.length > 0 && isOwner && (
            <button
              onClick={() => {
                setEditingMember(null)
                setTeamModalOpen(true)
              }}
              className="text-xs text-blue-500 hover:underline"
            >
              + Add
            </button>
          )}
        >
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              {teamMembers.slice(0, 5).map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 group">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold truncate">{m.name}</p>
                      {m.is_founder && <Sparkle className="w-2.5 h-2.5 text-yellow-500" weight="fill" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{m.role}</p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => {
                        setEditingMember(m)
                        setTeamModalOpen(true)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-blue-500 text-[10px] hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Get Verified */}
        {isOwner && !venture.is_verified && (
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-2 mb-3">
              <Sparkle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" weight="fill" />
              <div>
                <p className="text-sm font-bold">Get Verified</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Verified ventures get a blue checkmark and priority in discovery
                </p>
              </div>
            </div>
            <Button size="sm" className="w-full">
              Start Verification
            </Button>
          </div>
        )}
      </div>

      {/* MODALS */}
      {editModal && (
        <EditTextModal
          open={editModal.open}
          onOpenChange={(open) => !open && setEditModal(null)}
          venture={venture}
          field={editModal.field}
          label={editModal.label}
          value={editModal.value}
          multiline={editModal.multiline}
          maxLength={editModal.maxLength}
          onSaved={(updated) => {
            onUpdate(updated)
            setEditModal(null)
          }}
        />
      )}

      {businessModelModalOpen && (
        <BusinessModelModal
          open={businessModelModalOpen}
          onOpenChange={setBusinessModelModalOpen}
          venture={venture}
          onSaved={(updated) => {
            onUpdate(updated)
            setBusinessModelModalOpen(false)
          }}
        />
      )}

      {teamModalOpen && (
        <TeamMemberModal
          open={teamModalOpen}
          onOpenChange={setTeamModalOpen}
          ventureId={venture.id}
          member={editingMember}
          onSaved={(m, isEdit) => {
            if (isEdit) {
              onTeamUpdate(teamMembers.map((tm) => tm.id === m.id ? m : tm))
            } else {
              onTeamUpdate([...teamMembers, m])
            }
            setTeamModalOpen(false)
            setEditingMember(null)
          }}
        />
      )}

      {metricModalOpen && (
        <MetricModal
          open={metricModalOpen}
          onOpenChange={setMetricModalOpen}
          ventureId={venture.id}
          metric={editingMetric}
          onSaved={(m, isEdit) => {
            if (isEdit) {
              onMetricsUpdate(metrics.map((met) => met.id === m.id ? m : met))
            } else {
              onMetricsUpdate([...metrics, m])
            }
            setMetricModalOpen(false)
            setEditingMetric(null)
          }}
        />
      )}

      {metricDataModalOpen && selectedMetric && (
        <MetricDataModal
          open={metricDataModalOpen}
          onOpenChange={setMetricDataModalOpen}
          metric={selectedMetric}
        />
      )}
    </div>
  )
}

// Section Card Component
function SectionCard({ 
  icon: Icon, iconColor, iconBg, title, isOwner, isEmpty, 
  emptyText, emptySubtext, onAdd, topRight, children 
}: any) {
  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
            <Icon className={cn('w-4 h-4', iconColor)} weight="fill" />
          </div>
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {topRight}
          {isOwner && !isEmpty && (
            <button
              onClick={onAdd}
              className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded"
            >
              <PencilSimple className="w-3.5 h-3.5" weight="duotone" />
            </button>
          )}
        </div>
      </div>

      {isEmpty ? (
        <PlaceholderPrompt
          isOwner={isOwner}
          emptyText={emptyText}
          emptySubtext={emptySubtext}
          onAdd={onAdd}
        />
      ) : (
        children
      )}
    </div>
  )
}

// Mini Section for Mission/Vision/Why Now
function MiniSection({ icon: Icon, iconColor, iconBg, title, content, emptyText, isOwner, onAdd }: any) {
  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-6 h-6 rounded flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-3 h-3', iconColor)} weight="fill" />
        </div>
        <h4 className="font-bold text-xs">{title}</h4>
      </div>

      {content ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {content}
        </p>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground/60 italic">
            {emptyText}
          </p>
          {isOwner && (
            <button
              onClick={onAdd}
              className="text-[10px] text-blue-500 hover:underline font-medium mt-2 flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5" weight="bold" />
              Add
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Placeholder Prompt
function PlaceholderPrompt({ isOwner, emptyText, emptySubtext, onAdd }: any) {
  if (!isOwner) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-muted-foreground italic">{emptyText}</p>
      </div>
    )
  }

  return (
    <motion.button
      whileHover={{ scale: 1.005 }}
      onClick={onAdd}
      className="w-full py-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
    >
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" weight="bold" />
        </div>
        <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
          {emptyText}
        </p>
        {emptySubtext && (
          <p className="text-[10px] text-muted-foreground/70">
            {emptySubtext}
          </p>
        )}
      </div>
    </motion.button>
  )
}