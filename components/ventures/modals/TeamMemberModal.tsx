'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import Cropper from 'react-easy-crop'
import { X, ZoomIn, ZoomOut, Upload, Check, Crown, Bell } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

async function getCroppedImg(imageSrc: string, pixelCrop: any, rotation = 0): Promise<Blob> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
    image.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  canvas.width = 400
  canvas.height = 400
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, 400, 400
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas empty'))
    }, 'image/jpeg', 0.92)
  })
}

interface TeamMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ventureId: string
  member?: any
  onSaved: (member: any, isEdit: boolean) => void
}

export function TeamMemberModal({ open, onOpenChange, ventureId, member, onSaved }: TeamMemberModalProps) {
  const supabase = createClient()
  const isEdit = !!member

  const [name, setName] = useState(member?.name || '')
  const [role, setRole] = useState(member?.role || '')
  const [title, setTitle] = useState(member?.title || '')
  const [linkedinUrl, setLinkedinUrl] = useState(member?.linkedin_url || '')
  const [twitterUrl, setTwitterUrl] = useState(member?.twitter_url || '')
  const [isFounder, setIsFounder] = useState(member?.is_founder || false)
  const [canViewNotifications, setCanViewNotifications] = useState(member?.can_view_notifications || false)
  const [joinedDate, setJoinedDate] = useState(member?.joined_date || new Date().toISOString().split('T')[0])
  const [avatarUrl, setAvatarUrl] = useState(member?.avatar_url || '')
  
  // Cropping
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(member?.avatar_url || null)
  
  const [saving, setSaving] = useState(false)

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDrop: (files) => {
      const file = files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          setAvatarSrc(reader.result as string)
          setShowCropper(true)
        }
        reader.readAsDataURL(file)
      }
    },
  })

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const applyCrop = async () => {
    if (!avatarSrc || !croppedAreaPixels) return
    const blob = await getCroppedImg(avatarSrc, croppedAreaPixels)
    setCroppedBlob(blob)
    setAvatarPreview(URL.createObjectURL(blob))
    setShowCropper(false)
    toast.success('Photo cropped')
  }

  const uploadAvatar = async (): Promise<string> => {
    if (!croppedBlob) return avatarUrl
    
    const path = `${ventureId}/team-${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('ventures')
      .upload(path, croppedBlob, { upsert: true, contentType: 'image/jpeg' })
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage.from('ventures').getPublicUrl(path)
    return publicUrl
  }

  const handleSave = async () => {
    if (!name.trim() || !role.trim()) {
      toast.error('Name and role are required')
      return
    }

    setSaving(true)

    try {
      let finalAvatarUrl = avatarUrl
      if (croppedBlob) {
        finalAvatarUrl = await uploadAvatar()
      }

      const data: any = {
        venture_id: ventureId,
        name: name.trim(),
        role: role.trim(),
        title: title.trim() || null,
        avatar_url: finalAvatarUrl || null,
        linkedin_url: linkedinUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        is_founder: isFounder,
        can_view_notifications: canViewNotifications,
        joined_date: joinedDate,
      }

      let result
      if (isEdit) {
        result = await supabase
          .from('venture_team_members')
          .update(data)
          .eq('id', member.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('venture_team_members')
          .insert(data)
          .select()
          .single()
      }

      if (result.error) throw result.error

      toast.success(isEdit ? 'Team member updated' : 'Team member added')
      onSaved(result.data, isEdit)
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-3">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                    />
                    <button
                      onClick={() => {
                        setAvatarPreview(null)
                        setCroppedBlob(null)
                        setAvatarUrl('')
                      }}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" weight="bold" />
                    </button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50"
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-4 h-4 text-muted-foreground" weight="duotone" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload a photo (max 5MB)
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jisu Mondal"
                autoFocus
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Founder, CEO, CTO, Designer, etc."
              />
            </div>

            {/* Title/Description */}
            <div className="space-y-2">
              <Label htmlFor="title">Title / Short Bio (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Building the future of AI"
                maxLength={100}
              />
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input
                  id="twitter"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="twitter.com/..."
                />
              </div>
            </div>

            {/* Joined Date */}
            <div className="space-y-2">
              <Label htmlFor="joined">Joined Date</Label>
              <Input
                id="joined"
                type="date"
                value={joinedDate}
                onChange={(e) => setJoinedDate(e.target.value)}
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={isFounder}
                  onChange={(e) => setIsFounder(e.target.checked)}
                  className="w-4 h-4"
                />
                <Crown className="w-4 h-4 text-yellow-500" weight="fill" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Founder / Co-Founder</p>
                  <p className="text-[10px] text-muted-foreground">
                    Show a founder crown badge on their profile
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={canViewNotifications}
                  onChange={(e) => setCanViewNotifications(e.target.checked)}
                  className="w-4 h-4"
                />
                <Bell className="w-4 h-4 text-blue-500" weight="fill" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Can View Notifications</p>
                  <p className="text-[10px] text-muted-foreground">
                    Allow this member to see connection requests and messages
                  </p>
                </div>
              </label>
            </div>

            {/* Info about notifications */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Note:</span> The Notifications tab is only visible to the owner and team members you grant access to. This includes connection requests, messages, and important updates.
              </p>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !name.trim() || !role.trim()} className="flex-1">
                {saving ? 'Saving...' : (isEdit ? 'Update' : 'Add Member')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cropper */}
      <AnimatePresence>
        {showCropper && avatarSrc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[60] px-4"
            >
              <div className="bg-card border rounded-2xl overflow-hidden">
                <div className="p-3 border-b flex items-center justify-between">
                  <p className="font-bold text-sm">Crop Photo</p>
                  <button onClick={() => setShowCropper(false)} className="p-1 hover:bg-muted rounded">
                    <X className="w-4 h-4" weight="bold" />
                  </button>
                </div>
                <div className="relative w-full bg-black" style={{ height: '300px' }}>
                  <Cropper
                    image={avatarSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="p-3 space-y-2 border-t">
                  <div className="flex items-center gap-2">
                    <ZoomOut className="w-3 h-3 text-muted-foreground" weight="duotone" />
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <ZoomIn className="w-3 h-3 text-muted-foreground" weight="duotone" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowCropper(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={applyCrop} className="flex-1">
                      <Check className="w-3 h-3 mr-1" weight="bold" />
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}