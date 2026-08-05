'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  Users, UserPlus, Handshake, Heart, MagnifyingGlass, X,
  MapPin, Sparkle, Check, Clock, ArrowRight,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'

export function MyNetworkPage({ currentUser }: any) {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'suggested' | 'connections' | 'following' | 'followers' | 'pending'>('suggested')
  const [data, setData] = useState<any>({
    following: [], followers: [], connections: [],
    pending_sent: [], pending_received: [], suggested: [],
    counts: { following: 0, followers: 0, connections: 0, pending: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/my-network')
    const d = await res.json()
    setData(d)
    setLoading(false)
  }

  const handleConnect = async (userId: string) => {
    setConnectedIds(prev => new Set(prev).add(userId))
    const res = await fetch('/api/community/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: userId }),
    })
    if (res.ok) toast.success('Connection request sent')
    else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
      setConnectedIds(prev => { const n = new Set(prev); n.delete(userId); return n })
    }
  }

  const handleAccept = async (connectionId: string) => {
    await fetch('/api/invitations/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitation_type: 'connection', invitation_id: connectionId, action: 'accept' }),
    })
    toast.success('Connection accepted')
    load()
  }

  const tabs = [
    { id: 'suggested', label: 'Suggested', count: data.suggested.length, icon: Sparkle },
    { id: 'connections', label: 'Connections', count: data.counts.connections, icon: Handshake },
    { id: 'following', label: 'Following', count: data.counts.following, icon: Heart },
    { id: 'followers', label: 'Followers', count: data.counts.followers, icon: Users },
    { id: 'pending', label: 'Pending', count: data.counts.pending, icon: Clock },
  ]

  const currentList = (() => {
    if (activeTab === 'suggested') return data.suggested
    if (activeTab === 'connections') return data.connections
    if (activeTab === 'following') return data.following
    if (activeTab === 'followers') return data.followers
    if (activeTab === 'pending') return [...(data.pending_received || []).map((p: any) => ({ ...p.requester, _type: 'received', _connId: p.id })), ...(data.pending_sent || []).map((p: any) => ({ ...p.recipient, _type: 'sent', _connId: p.id }))]
    return []
  })()

  const filtered = search
    ? currentList.filter((p: any) => p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.tagline?.toLowerCase().includes(search.toLowerCase()))
    : currentList

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div className="bg-card border rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-500" weight="fill" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">My Network</h1>
            <p className="text-sm text-muted-foreground">
              {data.counts.connections} connections · {data.counts.following} following · {data.counts.followers} followers
            </p>
          </div>
          <Link href="/community">
            <Button size="sm" variant="outline"><UserPlus className="w-4 h-4 mr-1" /> Find People</Button>
          </Link>
        </div>
      </div>

      <div className="bg-card border rounded-2xl px-4 py-2.5 flex items-center gap-2">
        <MagnifyingGlass className="w-4 h-4 text-muted-foreground flex-shrink-0" weight="bold" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your network..." className="flex-1 bg-transparent border-0 focus:outline-none text-sm" />
        {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-muted-foreground" weight="bold" /></button>}
      </div>

      <div className="flex gap-1 border-b overflow-x-auto scrollbar-hide">
        {tabs.map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              <Icon className="w-4 h-4" weight={isActive ? 'fill' : 'regular'} />
              {t.label}
              {t.count > 0 && (
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold', isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-muted/30 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center">
          <Users className="w-14 h-14 mx-auto text-muted-foreground/30 mb-3" weight="duotone" />
          <h3 className="font-bold">{search ? 'No matches' : activeTab === 'suggested' ? 'Complete your profile to see suggestions' : 'No one here yet'}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'suggested' ? 'Add skills and interests to get personalized recommendations' : 'Start connecting with builders'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p: any, i: number) => (
            <PersonCard
              key={p.id || i}
              person={p}
              index={i}
              tab={activeTab}
              onConnect={() => handleConnect(p.id)}
              onAccept={p._connId ? () => handleAccept(p._connId) : undefined}
              isConnecting={connectedIds.has(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PersonCard({ person, index, tab, onConnect, onAccept, isConnecting }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-card border rounded-2xl p-4 hover:border-primary/40 transition-all"
    >
      <div className="flex items-start gap-3">
        <Link href={`/profile/${person.username}`}>
          <Avatar className="w-12 h-12">
            <AvatarImage src={person.avatar_url} />
            <AvatarFallback className="text-sm">{person.full_name?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <Link href={`/profile/${person.username}`} className="text-sm font-bold truncate hover:underline">{person.full_name}</Link>
            {person.match_score && (
              <span className="text-[10px] text-green-500 font-bold flex-shrink-0">{person.match_score}%</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{person.tagline || 'Builder'}</p>
          {person.location && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-2.5 h-2.5" weight="duotone" />{person.location}
            </p>
          )}
          {person.match_reason && (
            <p className="text-[10px] text-blue-500 font-medium mt-1">{person.match_reason}</p>
          )}
          {Array.isArray(person.brings) && person.brings.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {person.brings.slice(0, 2).map((b: string) => (
                <span key={b} className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium capitalize">{b}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t flex gap-2">
        <Link href={`/profile/${person.username}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">View Profile</Button>
        </Link>
        {tab === 'suggested' && (
          <Button
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? <><Check className="w-3 h-3 mr-1" /> Sent</> : <><UserPlus className="w-3 h-3 mr-1" /> Connect</>}
          </Button>
        )}
        {person._type === 'received' && onAccept && (
          <Button size="sm" className="flex-1 h-7 text-xs" onClick={onAccept}>
            <Check className="w-3 h-3 mr-1" /> Accept
          </Button>
        )}
        {person._type === 'sent' && (
          <Button size="sm" variant="secondary" disabled className="flex-1 h-7 text-xs">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Button>
        )}
      </div>
    </motion.div>
  )
}