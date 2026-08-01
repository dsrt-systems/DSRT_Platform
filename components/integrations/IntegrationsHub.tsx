'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Github, Linkedin, Twitter, Youtube, Instagram, Figma, Rocket, Music, ShieldCheck, Info, RefreshCw, Check, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RepoPicker } from './RepoPicker'

interface IntegrationsHubProps {
  integrations: any[]
  trackedRepos: any[]
}

const providers = [
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    color: 'from-gray-700 to-gray-900',
    description: 'Sync your code contributions, commits, and repo activity',
    audience: 'Developers, Engineers, Technical Founders',
    tracked: ['Commit frequency', 'Repository stats', 'Contribution graph', 'Language breakdown'],
    notTracked: ['Your code', 'Private files', 'Issue content'],
    available: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'from-blue-600 to-blue-800',
    description: 'Import work history, skills, and professional network',
    audience: 'All professionals across every industry',
    tracked: ['Work history', 'Skills endorsements', 'Company connections', 'Certifications'],
    notTracked: ['Private messages', 'Full connection list', 'Salary info'],
    available: false,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'from-black to-gray-800',
    description: 'Track your public voice and thought leadership metrics',
    audience: 'Thinkers, writers, communicators in any field',
    tracked: ['Post frequency', 'Engagement metrics', 'Topics tweeted'],
    notTracked: ['DMs', 'Private lists', 'Blocked accounts'],
    available: false,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'from-red-600 to-red-800',
    description: 'Track your content creation and audience growth',
    audience: 'Creators, educators, researchers publishing video',
    tracked: ['Videos published', 'View counts', 'Subscriber growth', 'Content categories'],
    notTracked: ['Video content', 'Comment content', 'Watch history'],
    available: false,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'from-pink-500 to-purple-600',
    description: 'Track your visual portfolio and creative work',
    audience: 'Designers, artists, photographers, chefs, creators',
    tracked: ['Post frequency', 'Engagement rate', 'Content categories'],
    notTracked: ['DMs', 'Stories after 24h', 'Followers list'],
    available: false,
  },
  {
    id: 'behance',
    name: 'Behance',
    icon: Figma,
    color: 'from-blue-500 to-indigo-700',
    description: 'Showcase your design portfolio automatically',
    audience: 'Designers, illustrators, creative professionals',
    tracked: ['Projects published', 'Views, appreciations', 'Skills tagged'],
    notTracked: ['Client work marked private'],
    available: false,
  },
  {
    id: 'producthunt',
    name: 'Product Hunt',
    icon: Rocket,
    color: 'from-orange-500 to-red-500',
    description: 'Track your product launches and community impact',
    audience: 'Makers, founders, product creators',
    tracked: ['Launches', 'Upvotes received', 'Comments'],
    notTracked: ['Private drafts'],
    available: false,
  },
  {
    id: 'spotify',
    name: 'Spotify for Artists',
    icon: Music,
    color: 'from-green-500 to-emerald-700',
    description: 'Track your music, podcasts, and audio content',
    audience: 'Musicians, podcasters, audio creators',
    tracked: ['Releases', 'Play counts', 'Listener demographics (aggregate)'],
    notTracked: ['Individual listener data'],
    available: false,
  },
]

export function IntegrationsHub({ integrations, trackedRepos }: IntegrationsHubProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)
  const [showRepoPicker, setShowRepoPicker] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const connectedMap = new Map(integrations.map(i => [i.provider, i]))

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'github_connected') {
      toast.success('GitHub connected successfully', {
        description: 'Choose which repositories to track.',
      })
      setTimeout(() => setShowRepoPicker(true), 500)
    }

    if (error) {
      toast.error('Connection failed', {
        description: error.replace(/_/g, ' '),
      })
    }
  }, [searchParams])

  const handleConnect = (providerId: string) => {
    if (providerId === 'github') {
      window.location.href = '/api/integrations/github/connect'
    } else {
      toast.info(`${providerId} integration coming soon`)
    }
  }

  const handleDisconnect = async (providerId: string) => {
    if (!confirm(`Disconnect ${providerId}? All tracked data will be removed.`)) return

    const res = await fetch(`/api/integrations/${providerId}/disconnect`, {
      method: 'POST',
    })

    if (res.ok) {
      toast.success(`${providerId} disconnected`)
      router.refresh()
    } else {
      toast.error('Failed to disconnect')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/integrations/github/sync', {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        toast.success(`Synced ${data.synced} commits`, {
          description: 'Your build analytics are updated.',
        })
        router.refresh()
      } else {
        toast.error('Sync failed', { description: data.error })
      }
    } catch (err) {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your digital identity across platforms. DSRT becomes your central hub.
        </p>
      </div>

      {/* Privacy Manifesto Card */}
      <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Privacy-First Integration</p>
            <p className="text-xs text-muted-foreground mt-1">
              We analyze <strong className="text-foreground">behavior and metadata</strong>, never content.
              We look at HOW you build, not WHAT you build.
            </p>
            <Link 
              href="/settings/privacy" 
              className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1 mt-2"
            >
              Read full privacy policy
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="space-y-3">
        {providers.map((provider) => {
          const Icon = provider.icon
          const connected = connectedMap.get(provider.id)
          const isExpanded = expandedProvider === provider.id

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border rounded-xl overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                    provider.color
                  )}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{provider.name}</p>
                      {connected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-medium rounded-md">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                      {!provider.available && !connected && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {provider.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                      For: {provider.audience}
                    </p>
                    {connected && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Connected as <strong>@{connected.provider_username}</strong>
                        {connected.last_synced_at && (
                          <> · Last synced {new Date(connected.last_synced_at).toLocaleString()}</>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                    {connected ? (
                      <>
                        {provider.id === 'github' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowRepoPicker(true)}
                            >
                              Manage Repos ({trackedRepos.length})
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSync}
                              disabled={syncing}
                            >
                              <RefreshCw className={cn('w-3 h-3 mr-1', syncing && 'animate-spin')} />
                              {syncing ? 'Syncing...' : 'Sync Now'}
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDisconnect(provider.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(provider.id)}
                        disabled={!provider.available}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t space-y-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-green-500 mb-1.5">
                        ✓ What we track
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.tracked.map(item => (
                          <span key={item} className="text-[11px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-500 mb-1.5">
                        ✗ What we NEVER access
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.notTracked.map(item => (
                          <span key={item} className="text-[11px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {showRepoPicker && connectedMap.has('github') && (
        <RepoPicker
          onClose={() => {
            setShowRepoPicker(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}