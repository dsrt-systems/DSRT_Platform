'use client'

import { useState, useEffect } from 'react'
import { Lock, Plus, Shield, Key, Download, Upload, FileText, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { generateDocKey, encryptContent, decryptContent, getUserKey, exportUserKey, importUserKey } from '@/lib/encryption'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function EncryptedVault() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string>('')
  const [docs, setDocs] = useState<any[]>([])
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [decryptedContent, setDecryptedContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        loadDocs()
      }
    }
    init()
  }, [])

  const loadDocs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/encrypted-docs')
      const data = await res.json()
      setDocs(data.docs || [])
    } catch (err) {
      toast.error('Failed to load docs')
    } finally {
      setLoading(false)
    }
  }

  const openDoc = async (doc: any) => {
    setSelectedDoc(doc)
    setEditing(false)
    
    try {
      const res = await fetch(`/api/encrypted-docs/${doc.id}`)
      const data = await res.json()
      
      if (data.doc) {
        const userKey = getUserKey(userId)
        const decrypted = await decryptContent(
          data.doc.encrypted_content,
          data.doc.iv,
          userKey
        )
        setDecryptedContent(decrypted)
        setContent(decrypted)
        setTitle(data.doc.title)
      }
    } catch (err) {
      toast.error('Failed to decrypt. Your encryption key may have changed.')
      console.error(err)
    }
  }

  const createNew = () => {
    setSelectedDoc(null)
    setEditing(true)
    setTitle('')
    setContent('')
    setDecryptedContent('')
  }

  const save = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content required')
      return
    }

    setSaving(true)
    try {
      const userKey = getUserKey(userId)
      const { encrypted, iv } = await encryptContent(content, userKey)

      if (selectedDoc) {
        // Update
        const res = await fetch(`/api/encrypted-docs/${selectedDoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, encrypted_content: encrypted, iv }),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success('Document updated')
      } else {
        // Create
        const res = await fetch('/api/encrypted-docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, encrypted_content: encrypted, iv }),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success('Document created')
      }

      setEditing(false)
      loadDocs()
    } catch (err) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const deleteDoc = async () => {
    if (!selectedDoc || !confirm('Delete this document permanently?')) return

    const res = await fetch(`/api/encrypted-docs/${selectedDoc.id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      toast.success('Document deleted')
      setSelectedDoc(null)
      loadDocs()
    } else {
      toast.error('Failed to delete')
    }
  }

  const exportKey = () => {
    const key = exportUserKey(userId)
    if (!key) return

    const blob = new Blob([JSON.stringify({ 
      version: 1,
      user_id: userId,
      key,
      exported_at: new Date().toISOString(),
      warning: 'Keep this file secure. Anyone with this key can decrypt your documents.',
    }, null, 2)], { type: 'application/json' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dsrt-vault-key-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Key exported. Keep it safe!')
  }

  const importKey = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.key && data.user_id === userId) {
          importUserKey(userId, data.key)
          toast.success('Key imported. Reloading vault...')
          setTimeout(() => window.location.reload(), 1000)
        } else {
          toast.error('Invalid key file for this user')
        }
      } catch {
        toast.error('Failed to import key')
      }
    }
    input.click()
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Lock className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Encrypted Vault</h1>
            <p className="text-xs text-muted-foreground">
              Your private notes, encrypted with your key only
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowKeyModal(true)}>
            <Key className="w-4 h-4 mr-1" />
            Manage Key
          </Button>
          <Button size="sm" onClick={createNew}>
            <Plus className="w-4 h-4 mr-1" />
            New Note
          </Button>
        </div>
      </div>

      {/* Security notice */}
      <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">End-to-End Encrypted</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your notes are encrypted on your device using AES-256. DSRT servers only store 
            encrypted data. If you lose your key, your notes cannot be recovered.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Docs list */}
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Documents ({docs.length})
            </p>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-5 h-5 mx-auto text-muted-foreground animate-spin" />
              </div>
            ) : docs.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No documents yet</p>
              </div>
            ) : (
              docs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => openDoc(doc)}
                  className={cn(
                    'w-full p-3 text-left hover:bg-muted/30 transition-colors',
                    selectedDoc?.id === doc.id && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Lock className="w-3 h-3 text-purple-500 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="md:col-span-2 bg-card border rounded-2xl overflow-hidden">
          {!selectedDoc && !editing ? (
            <div className="p-12 text-center">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select or create a document</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {editing ? (
                <>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Document title..."
                    className="text-lg font-bold border-0 focus-visible:ring-0 px-0"
                  />
                  <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Start typing... Your content is encrypted on your device."
                    rows={20}
                    className="border-0 focus-visible:ring-0 px-0 resize-none"
                  />
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button variant="outline" onClick={() => {
                      setEditing(false)
                      if (selectedDoc) setContent(decryptedContent)
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={save} disabled={saving}>
                      {saving ? 'Encrypting...' : 'Save'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-bold">{selectedDoc.title}</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={deleteDoc}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Last updated {formatDistanceToNow(new Date(selectedDoc.updated_at), { addSuffix: true })}
                  </p>
                  <div className="pt-3 border-t">
                    <p className="text-sm whitespace-pre-wrap">{decryptedContent}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Key management modal */}
      <AnimatePresence>
        {showKeyModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowKeyModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
            >
              <div className="bg-card border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold">Encryption Key</h3>
                    <p className="text-xs text-muted-foreground">
                      Backup or import your device key
                    </p>
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Important:</strong> Your key is stored only on this device. 
                    If you clear browser data or use another device, you cannot decrypt 
                    your notes without importing this key.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={exportKey}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Key (Backup)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={importKey}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Key (From Backup)
                  </Button>
                </div>

                <Button className="w-full" onClick={() => setShowKeyModal(false)}>
                  Done
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}