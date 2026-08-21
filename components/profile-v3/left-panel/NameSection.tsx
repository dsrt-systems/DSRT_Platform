'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle, Envelope, Copy } from '@phosphor-icons/react'
import { InlineEditableText } from '../shared/InlineEditableText'
import { cn } from '@/lib/utils'

interface NameSectionProps {
  fullName: string
  username: string
  isVerified: boolean
  isOwner: boolean
  onNameChange: (newName: string) => void
}

export function NameSection({
  fullName,
  username,
  isVerified,
  isOwner,
  onNameChange,
}: NameSectionProps) {
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const dsrtEmail = username ? `${username.toLowerCase().trim()}@dsrt.com` : null

  const handleSave = async (newName: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile/name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: newName }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save' }))
        throw new Error(err.error || 'Failed to save')
      }
      const data = await res.json()
      onNameChange(data.full_name)
      toast.success('Name updated')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update name')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const copyEmail = () => {
    if (!dsrtEmail) return
    navigator.clipboard.writeText(dsrtEmail)
    setCopied(true)
    toast.success('DSRT Email copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <InlineEditableText
          value={fullName || ''}
          onSave={handleSave}
          isOwner={isOwner}
          placeholder="Your name"
          className="text-[20px] font-bold text-white tracking-tight leading-tight"
          editClassName="text-[20px] font-bold text-white tracking-tight"
          maxLength={80}
        />
        {isVerified && (
          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" weight="fill" />
        )}
      </div>
      
      {username && (
        <div className="flex items-center gap-2">
          <p className="text-[13px] text-zinc-500 font-medium">@{username}</p>
          
          <span className="text-zinc-800">•</span>
          
          {/* Futuristic DSRT Email Badge */}
          <button 
            onClick={copyEmail}
            className={cn(
              "group flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all duration-200",
              copied 
                ? "bg-green-500/10 border-green-500/30 text-green-400" 
                : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40"
            )}
            title="Copy DSRT Mail address"
          >
            <Envelope className="w-3 h-3" weight={copied ? 'fill' : 'duotone'} />
            <span className="text-[10px] font-bold tracking-wide">
              {dsrtEmail}
            </span>
            <Copy className={cn(
              "w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5",
              copied ? "hidden" : "block"
            )} />
          </button>
        </div>
      )}
    </div>
  )
}