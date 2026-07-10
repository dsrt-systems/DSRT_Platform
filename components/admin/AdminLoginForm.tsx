'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'unauthorized'
      ? 'You are not authorized to access the admin area.'
      : null
  )

  const handleLogin = async () => {
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('admin_role')
        .eq('id', data.user.id)
        .single()

      if (
        !profile?.admin_role ||
        !['dsrt_super_admin', 'dsrt_hackathon_admin', 'community_hackathon_admin'].includes(
          profile.admin_role
        )
      ) {
        setError('This account does not have admin access.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      router.push('/admin/hackathons')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="admin-email" className="text-white/80">
          Admin Email
        </Label>
        <Input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@dsrtai.com"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password" className="text-white/80">
          Password
        </Label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLogin()
          }}
        />
      </div>

      <Button
        onClick={handleLogin}
        disabled={loading || !email || !password}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          'Access Admin Panel'
        )}
      </Button>
    </div>
  )
}