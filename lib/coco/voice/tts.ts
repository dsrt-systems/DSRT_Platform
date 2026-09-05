// ============================================================
// lib/coco/voice/tts.ts
// Native SpeechSynthesis wrapper — zero-cost text-to-speech.
// ============================================================

'use client'

let ttsEnabled = true
let currentUtterance: SpeechSynthesisUtterance | null = null
let voicesCache: SpeechSynthesisVoice[] = []

export type TTSState = 'idle' | 'speaking' | 'error'

let stateListeners = new Set<(s: TTSState) => void>()
let currentState: TTSState = 'idle'

function setState(s: TTSState) {
  currentState = s
  stateListeners.forEach((l) => l(s))
}

export function getTTSState(): TTSState {
  return currentState
}

export function subscribeTTSState(fn: (s: TTSState) => void): () => void {
  stateListeners.add(fn)
  return () => stateListeners.delete(fn)
}

export function setTTSEnabled(enabled: boolean) {
  ttsEnabled = enabled
  if (!enabled) stopTTS()
}

export function isTTSSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isTTSSupported()) return []
  if (voicesCache.length > 0) return voicesCache

  return new Promise((resolve) => {
    const attempt = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) {
        voicesCache = v
        resolve(v)
      } else {
        setTimeout(attempt, 120)
      }
    }
    window.speechSynthesis.onvoiceschanged = () => {
      voicesCache = window.speechSynthesis.getVoices()
      resolve(voicesCache)
    }
    attempt()
  })
}

async function pickVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await loadVoices()
  if (voices.length === 0) return null

  // Preference order — warm, natural English voices when available
  const prefs = [
    /Samantha/i,
    /Google US English/i,
    /Microsoft Aria/i,
    /Microsoft Jenny/i,
    /Microsoft Zira/i,
    /Karen/i,
    /Serena/i,
    /^en-US/i,
    /^en-GB/i,
    /^en/i,
  ]

  for (const pref of prefs) {
    const match = voices.find((v) => pref.test(v.name) || pref.test(v.lang))
    if (match) return match
  }
  return voices[0]
}

/**
 * Strip markdown so TTS reads clean text.
 */
function cleanForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[source:[^\]]+\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function speakText(text: string): Promise<void> {
  if (!ttsEnabled || !isTTSSupported()) return
  const clean = cleanForSpeech(text)
  if (!clean) return

  stopTTS()

  const utter = new SpeechSynthesisUtterance(clean)
  const voice = await pickVoice()
  if (voice) utter.voice = voice
  utter.rate = 1.0
  utter.pitch = 1.02
  utter.volume = 1.0

  utter.onstart = () => setState('speaking')
  utter.onend = () => {
    if (currentUtterance === utter) {
      currentUtterance = null
      setState('idle')
    }
  }
  utter.onerror = () => {
    if (currentUtterance === utter) {
      currentUtterance = null
      setState('error')
      setTimeout(() => setState('idle'), 800)
    }
  }

  currentUtterance = utter
  try {
    window.speechSynthesis.speak(utter)
  } catch {
    setState('idle')
  }
}

export function stopTTS() {
  if (!isTTSSupported()) return
  try {
    window.speechSynthesis.cancel()
  } catch {}
  currentUtterance = null
  setState('idle')
}