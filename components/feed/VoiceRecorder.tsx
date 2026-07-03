'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Mic, Square, Play, Trash2, Loader2 } from 'lucide-react'

interface VoiceRecorderProps {
  userId: string
  onUploaded: (url: string) => void
}

export function VoiceRecorder({ userId, onUploaded }: VoiceRecorderProps) {
  const supabase = createClient()
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch (err) {
      alert('Could not access microphone')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const uploadAudio = async () => {
    if (!audioUrl) return
    setUploading(true)

    const blob = await fetch(audioUrl).then((r) => r.blob())
    const path = `${userId}/${Date.now()}.webm`

    const { error } = await supabase.storage
      .from('post-media')
      .upload(path, blob, { contentType: 'audio/webm' })

    if (!error) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('post-media').getPublicUrl(path)
      onUploaded(publicUrl)
      setAudioUrl(null)
    }

    setUploading(false)
  }

  const remove = () => {
    setAudioUrl(null)
    setDuration(0)
  }

  return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
      {!audioUrl ? (
        <div className="flex items-center justify-between">
          <p className="text-sm">
            {recording ? `Recording... ${duration}s` : 'Record voice note'}
          </p>
          {recording ? (
            <Button size="sm" variant="destructive" onClick={stopRecording}>
              <Square className="w-3.5 h-3.5 mr-1" />
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={startRecording}>
              <Mic className="w-3.5 h-3.5 mr-1" />
              Record
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <audio src={audioUrl} controls className="w-full" />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={remove} className="flex-1">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Discard
            </Button>
            <Button
              size="sm"
              onClick={uploadAudio}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Attach to post'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}