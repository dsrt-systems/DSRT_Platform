'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: any
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
}: EditProfileModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState(profile.full_name || '')
  const [tagline, setTagline] = useState(profile.tagline || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [location, setLocation] = useState(profile.location || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [github, setGithub] = useState(profile.github_url || '')
  const [twitter, setTwitter] = useState(profile.twitter_url || '')
  const [linkedin, setLinkedin] = useState(profile.linkedin_url || '')

  const handleSave = async () => {
    setLoading(true)

    const { error } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim(),
        tagline: tagline.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        github_url: github.trim() || null,
        twitter_url: twitter.trim() || null,
        linkedin_url: linkedin.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setLoading(false)

    if (!error) {
      router.refresh()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="One line about you"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {tagline.length}/100
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Mumbai, India"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="github">GitHub URL</Label>
              <Input
                id="github"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter URL</Label>
              <Input
                id="twitter"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://twitter.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !fullName.trim()}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}