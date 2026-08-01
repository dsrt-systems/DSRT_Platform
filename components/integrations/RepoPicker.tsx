'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Lock, Star, GitFork, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RepoPickerProps {
  onClose: () => void
}

export function RepoPicker({ onClose }: RepoPickerProps) {
  const [repos, setRepos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/integrations/github/repos')
      .then(r => r.json())
      .then(data => {
        if (data.repos) setRepos(data.repos)
        else toast.error('Failed to load repos')
      })
      .catch(() => toast.error('Failed to load repos'))
      .finally(() => setLoading(false))
  }, [])

  const filteredRepos = repos.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const toggleTrack = async (repo: any) => {
    const key = `${repo.owner}/${repo.name}`
    setProcessing(key)

    if (repo.is_tracked) {
      // Untrack
      const res = await fetch(
        `/api/integrations/github/track?owner=${repo.owner}&name=${repo.name}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setRepos(prev => prev.map(r =>
          r.id === repo.id ? { ...r, is_tracked: false } : r
        ))
        toast.success(`Stopped tracking ${repo.name}`)
      } else {
        toast.error('Failed to untrack')
      }
    } else {
      // Track
      const res = await fetch('/api/integrations/github/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repo.owner,
          name: repo.name,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          defaultBranch: repo.default_branch,
          isPrivate: repo.private,
        }),
      })
      if (res.ok) {
        setRepos(prev => prev.map(r =>
          r.id === repo.id ? { ...r, is_tracked: true } : r
        ))
        toast.success(`Now tracking ${repo.name}`)
      } else {
        toast.error('Failed to track')
      }
    }

    setProcessing(null)
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Repositories to Track</DialogTitle>
          <p className="text-xs text-muted-foreground">
            We will sync commit metadata (frequency, patterns) — never your code.
          </p>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRepos.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              No repositories found
            </p>
          ) : (
            filteredRepos.map(repo => (
              <div
                key={repo.id}
                className={cn(
                  'p-3 border rounded-lg flex items-start gap-3',
                  repo.is_tracked && 'bg-primary/5 border-primary/30'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {repo.full_name}
                    </p>
                    {repo.private && (
                      <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      {repo.forks_count}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={repo.is_tracked ? 'outline' : 'default'}
                  onClick={() => toggleTrack(repo)}
                  disabled={processing === `${repo.owner}/${repo.name}`}
                >
                  {processing === `${repo.owner}/${repo.name}` ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : repo.is_tracked ? (
                    'Tracking'
                  ) : (
                    'Track'
                  )}
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            {repos.filter(r => r.is_tracked).length} of {repos.length} tracked
          </p>
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}