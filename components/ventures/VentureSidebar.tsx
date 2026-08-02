'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, 
  Info, 
  Plus, 
  Buildings,
  Users,
  Globe,
  Calendar,
  MapPin,
  Sparkle,
  Rocket,
  UserPlus,
  Lightbulb,
  Buildings as Building,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LookingForModal } from './modals/LookingForModal'

interface VentureSidebarProps {
  venture: any
  metrics: any[]
  lookingFor: any[]
  updates: any[]
  teamMembers: any[]
  isOwner: boolean
  onUpdate: (venture: any) => void
  onLookingForUpdate: (items: any[]) => void
}

export function VentureSidebar({ 
  venture, 
  lookingFor,
  updates,
  teamMembers,
  isOwner,
  onLookingForUpdate,
}: VentureSidebarProps) {
  const [lookingForModalOpen, setLookingForModalOpen] = useState(false)
  const [editingLookingFor, setEditingLookingFor] = useState<any>(null)

  // Calculate simple health score
  const healthScore = calculateSimpleHealth(venture, teamMembers)

  return (
    <div className="space-y-4">
      {/* Venture Health */}
      <div className="bg-card border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-red-500" weight="fill" />
            <p className="text-[10px] uppercase tracking-wider font-bold">
              Venture Health
            </p>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <Info className="w-3.5 h-3.5" weight="duotone" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <HealthRing score={healthScore.total} />
          <div className="flex-1 space-y-2">
            {healthScore.breakdown.map((item, i) => (
              <HealthBar key={i} label={item.label} value={item.value} color={item.color} />
            ))}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {healthScore.total >= 80 ? 'Excellent' : healthScore.total >= 60 ? 'Good' : healthScore.total >= 40 ? 'Fair' : 'Needs Work'}
          </p>
          <button className="text-[10px] text-blue-500 hover:underline">
            View Details →
          </button>
        </div>
      </div>

      {/* At a Glance */}
      <div className="bg-card border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkle className="w-3.5 h-3.5 text-yellow-500" weight="fill" />
          <p className="text-[10px] uppercase tracking-wider font-bold">
            At a Glance
          </p>
        </div>

        <div className="space-y-2.5">
          <GlanceRow label="Industry" value={venture.industry} icon={Building} />
          <GlanceRow label="Category" value={venture.sub_category} icon={Sparkle} />
          {venture.start_date && (
            <GlanceRow 
              label="Founded" 
              value={new Date(venture.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} 
              icon={Calendar} 
            />
          )}
          {venture.team_size && (
            <GlanceRow 
              label="Team Size" 
              value={venture.team_size.toString()} 
              icon={Users} 
            />
          )}
          {venture.headquarters && (
            <GlanceRow label="Headquarters" value={venture.headquarters} icon={MapPin} />
          )}
          {venture.website && (
            <GlanceRow 
              label="Website" 
              value={venture.website.replace(/^https?:\/\//, '')} 
              icon={Globe}
              href={venture.website}
            />
          )}
          {venture.funding_stage && (
            <GlanceRow 
              label="Status" 
              value={venture.funding_stage.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} 
              icon={Rocket} 
            />
          )}
          {venture.is_building_public && (
            <GlanceRow 
              label="Building" 
              value="In Public" 
              icon={Lightbulb}
              valueClass="text-blue-500 font-semibold"
            />
          )}
        </div>
      </div>

      {/* What We're Looking For */}
      <div className="bg-card border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5 text-green-500" weight="fill" />
            <p className="text-[10px] uppercase tracking-wider font-bold">
              What We're Looking For
            </p>
          </div>
          {isOwner && (
            <button 
              onClick={() => {
                setEditingLookingFor(null)
                setLookingForModalOpen(true)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-3.5 h-3.5" weight="bold" />
            </button>
          )}
        </div>

        {lookingFor.length === 0 ? (
          <PlaceholderSection
            isOwner={isOwner}
            emptyText="Nothing listed yet"
            actionText="Add what you need →"
            onClick={() => {
              setEditingLookingFor(null)
              setLookingForModalOpen(true)
            }}
          />
        ) : (
          <div className="space-y-2">
            {lookingFor.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-start gap-2 pb-2 border-b last:border-0 group">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight">{item.title}</p>
                  {item.amount && (
                    <p className="text-[10px] text-blue-500 font-semibold mt-0.5">{item.amount}</p>
                  )}
                </div>
                {item.count > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {item.count}
                  </span>
                )}
                {isOwner && (
                  <button
                    onClick={() => {
                      setEditingLookingFor(item)
                      setLookingForModalOpen(true)
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

        {!isOwner && lookingFor.length > 0 && (
          <Button size="sm" className="w-full mt-3">
            Connect with Us
          </Button>
        )}
      </div>

      {/* Recent Updates */}
      <div className="bg-card border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-wider font-bold">
              Recent Updates
            </p>
          </div>
          <button className="text-[10px] text-blue-500 hover:underline">
            All →
          </button>
        </div>

        {updates.length === 0 ? (
          <PlaceholderSection
            isOwner={isOwner}
            emptyText="No updates yet"
            actionText="Post first update →"
            onClick={() => {}}
          />
        ) : (
          <div className="space-y-2">
            {updates.slice(0, 3).map((update) => (
              <div key={update.id} className="pb-2 border-b last:border-0">
                <p className="text-xs font-medium leading-tight">{update.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(update.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Looking For Modal */}
      {lookingForModalOpen && (
        <LookingForModal
          open={lookingForModalOpen}
          onOpenChange={setLookingForModalOpen}
          ventureId={venture.id}
          item={editingLookingFor}
          onSaved={(item, isEdit) => {
            if (isEdit) {
              onLookingForUpdate(lookingFor.map((lf) => lf.id === item.id ? item : lf))
            } else {
              onLookingForUpdate([...lookingFor, item])
            }
            setLookingForModalOpen(false)
            setEditingLookingFor(null)
          }}
        />
      )}
    </div>
  )
}

// Health calculation
function calculateSimpleHealth(venture: any, teamMembers: any[]) {
  let vision = 0, team = 0, execution = 0, traction = 0, potential = 0

  // Vision & Idea (based on filled fields)
  if (venture.name) vision += 20
  if (venture.tagline) vision += 15
  if (venture.description) vision += 15
  if (venture.mission) vision += 15
  if (venture.vision) vision += 15
  if (venture.problem && venture.solution) vision += 20

  // Team
  team = Math.min(teamMembers.length * 20, 100)

  // Execution
  if (venture.business_model) execution += 20
  if (venture.headquarters) execution += 20
  if (venture.registration_type && venture.registration_type !== 'not-registered') execution += 30
  if (venture.website) execution += 30

  // Traction
  traction = venture.follower_count > 0 ? 50 : 20

  // Potential
  const stageScores: any = {
    'idea': 20, 'prototype': 30, 'mvp': 50, 'early-stage': 60,
    'growth': 80, 'scale': 90, 'established': 100
  }
  potential = stageScores[venture.stage] || 30

  const total = Math.round((vision + team + execution + traction + potential) / 5)

  return {
    total,
    breakdown: [
      { label: 'Vision & Idea', value: vision, color: 'bg-blue-500' },
      { label: 'Team', value: team, color: 'bg-purple-500' },
      { label: 'Execution', value: execution, color: 'bg-green-500' },
      { label: 'Traction', value: traction, color: 'bg-yellow-500' },
      { label: 'Potential', value: potential, color: 'bg-orange-500' },
    ]
  }
}

// Sub components
function HealthRing({ score }: { score: number }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const color = score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-blue-500' : score >= 40 ? 'stroke-yellow-500' : 'stroke-red-500'

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          strokeWidth="6"
          className="stroke-muted"
          fill="none"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          strokeWidth="6"
          className={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{score}</span>
        <span className="text-[8px] text-muted-foreground">/100</span>
      </div>
    </div>
  )
}

function HealthBar({ label, value, color }: any) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-16 text-muted-foreground truncate">{label}</span>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
      <span className="w-8 text-right font-bold tabular-nums">{value}%</span>
    </div>
  )
}

function GlanceRow({ label, value, icon: Icon, href, valueClass }: any) {
  if (!value) return null

  const content = (
    <div className="flex items-center justify-between gap-2 group">
      <div className="flex items-center gap-1.5 min-w-0">
        {Icon && <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" weight="duotone" />}
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span className={cn('text-[11px] font-medium truncate ml-2', valueClass)}>
        {value}
      </span>
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80">
        {content}
      </a>
    )
  }
  return content
}

function PlaceholderSection({ isOwner, emptyText, actionText, onClick }: any) {
  return (
    <div className="text-center py-4">
      <p className="text-xs text-muted-foreground italic">{emptyText}</p>
      {isOwner && (
        <button onClick={onClick} className="text-[11px] text-blue-500 hover:underline font-medium mt-1">
          {actionText}
        </button>
      )}
    </div>
  )
}