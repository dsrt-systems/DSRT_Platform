// ============================================================
// lib/coco/context/security.ts
// Sanitize + validate client-provided context hints.
// The client is UNTRUSTED. This module strips anything dangerous.
// ============================================================

import type { CocoClientContextHint, UiStateContext } from '@/types/coco'

const MAX_ROUTE_LENGTH = 500
const MAX_PAGE_LENGTH = 100
const MAX_ENTITY_ID_LENGTH = 100
const MAX_COMPONENT_ID_LENGTH = 200
const MAX_UI_STATE_KEYS = 30
const MAX_UI_STATE_VALUE_LENGTH = 500
const MAX_SELECTED_OPTIONS = 20

const ALLOWED_ENTITY_TYPES = new Set([
  'user',
  'project',
  'venture',
  'community',
  'post',
  'mail_thread',
  'opportunity',
  'organization',
  'event',
  'application',
])

/**
 * Sanitize the raw client hint.
 * Returns a normalized hint or throws if fundamentally malformed.
 */
export function sanitizeClientHint(raw: unknown): CocoClientContextHint {
  if (!raw || typeof raw !== 'object') {
    throw new Error('COCO_CONTEXT_INVALID: hint must be an object')
  }

  const hint = raw as Record<string, unknown>

  // --- route (required, string, bounded) ---
  const route = typeof hint.route === 'string'
    ? hint.route.slice(0, MAX_ROUTE_LENGTH)
    : '/'

  // --- page (required, string, bounded) ---
  const page = typeof hint.page === 'string'
    ? hint.page.slice(0, MAX_PAGE_LENGTH).replace(/[^a-z0-9_\-.]/gi, '')
    : 'unknown'

  // --- entity (optional) ---
  let entity: CocoClientContextHint['entity'] | undefined
  if (hint.entity && typeof hint.entity === 'object') {
    const e = hint.entity as Record<string, unknown>
    const type = typeof e.type === 'string' ? e.type : ''
    const id = typeof e.id === 'string' ? e.id.slice(0, MAX_ENTITY_ID_LENGTH) : ''

    if (ALLOWED_ENTITY_TYPES.has(type) && id.length > 0) {
      entity = { type, id }
    }
  }

  // --- component (optional) ---
  let component: CocoClientContextHint['component'] | undefined
  if (hint.component && typeof hint.component === 'object') {
    const c = hint.component as Record<string, unknown>
    const registry_id = typeof c.registry_id === 'string'
      ? c.registry_id.slice(0, MAX_COMPONENT_ID_LENGTH).replace(/[^a-z0-9_\-.]/gi, '')
      : ''

    if (registry_id.length > 0) {
      component = {
        registry_id,
        instance_id: typeof c.instance_id === 'string'
          ? c.instance_id.slice(0, MAX_COMPONENT_ID_LENGTH)
          : undefined,
      }
    }
  }

  // --- ui_state (optional, heavily bounded) ---
  const ui_state = sanitizeUiState(hint.ui_state)

  return { route, page, entity, component, ui_state }
}

function sanitizeUiState(raw: unknown): UiStateContext | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const src = raw as Record<string, unknown>

  const result: UiStateContext = {}

  // selected_options
  if (Array.isArray(src.selected_options)) {
    result.selected_options = src.selected_options
      .slice(0, MAX_SELECTED_OPTIONS)
      .filter((v): v is string => typeof v === 'string')
      .map(v => v.slice(0, MAX_UI_STATE_VALUE_LENGTH))
  }

  // form_values — bounded to 30 keys, primitives only
  if (src.form_values && typeof src.form_values === 'object') {
    const entries = Object.entries(src.form_values as Record<string, unknown>).slice(0, MAX_UI_STATE_KEYS)
    const clean: Record<string, string | number | boolean | null> = {}
    for (const [k, v] of entries) {
      const key = k.slice(0, 100).replace(/[^a-z0-9_\-.]/gi, '')
      if (!key) continue

      if (v === null) clean[key] = null
      else if (typeof v === 'boolean') clean[key] = v
      else if (typeof v === 'number' && Number.isFinite(v)) clean[key] = v
      else if (typeof v === 'string') clean[key] = v.slice(0, MAX_UI_STATE_VALUE_LENGTH)
      // else: dropped
    }
    result.form_values = clean
  }

  if (typeof src.active_tab === 'string') {
    result.active_tab = src.active_tab.slice(0, 100)
  }

  if (typeof src.modal_open === 'string' || src.modal_open === null) {
    result.modal_open = src.modal_open as string | null
  }

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Strip prompt-injection patterns from user-visible strings that will end up
 * in the context envelope. Applied to entity summaries, not to user's own message.
 */
export function stripInjectionMarkers(text: string): string {
  if (!text) return ''
  return text
    // Common injection scaffolds
    .replace(/\bignore (all )?(previous|prior|above) instructions?\b/gi, '[filtered]')
    .replace(/\byou are now\b/gi, '[filtered]')
    .replace(/\bsystem:\s*/gi, '[filtered]:')
    .replace(/\b\[system\]\b/gi, '[filtered]')
    // Fence markers
    .replace(/```system[\s\S]*?```/gi, '[filtered]')
}