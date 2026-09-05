// ============================================================
// lib/coco/sdk/context-registry.ts
// In-memory registry that pages write to and COCO reads from.
// Uses a global singleton + listener pattern (no Zustand needed).
// ============================================================

'use client'

import type { CocoClientContextHint } from '@/types/coco'

type Listener = (hint: CocoClientContextHint) => void

let currentHint: CocoClientContextHint = {
  route: typeof window !== 'undefined' ? window.location.pathname : '/',
  page: 'unknown'
}
const listeners = new Set<Listener>()

export function setCocoContext(hint: Partial<CocoClientContextHint>) {
  currentHint = {
    ...currentHint,
    ...hint,
    route: hint.route || currentHint.route,
    page: hint.page || currentHint.page
  }
  listeners.forEach(l => l(currentHint))
}

export function getCocoContext(): CocoClientContextHint {
  return currentHint
}

export function subscribeCocoContext(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}