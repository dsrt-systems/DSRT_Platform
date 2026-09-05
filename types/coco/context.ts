// ============================================================
// types/coco/context.ts
// The Context Envelope — COCO's "world snapshot" per request.
// See COCO spec §8, §9.
// ============================================================

import type { UUID, Timestamp, CocoEntityRef, TrustLevel } from './primitives'
import type { CocoPermissionScope } from './permission'

/** L0 — Who is asking. */
export interface IdentityContext {
  user_id: UUID
  username?: string
  full_name?: string
  role: 'user' | 'admin' | 'system'
  is_verified: boolean
  onboarding_complete: boolean
}

/** L1 — Where the user currently is inside DSRT Connect. */
export interface NavigationContext {
  route: string                    // e.g. '/ventures/dsrt-robotics/assessment/3'
  page: string                     // logical page id, e.g. 'venture_assessment'
  /** Optional breadcrumb trail for the model to reason about depth. */
  breadcrumb?: string[]
}

/** L2 — The specific UI component currently in focus (if any). */
export interface ComponentContext {
  /** Registry ID, e.g. 'venture.assessment.question' */
  registry_id: string
  /** Local instance id, e.g. 'q7' */
  instance_id?: string
  /** Component capabilities the SDK exposed. */
  capabilities?: string[]
}

/** L3 — The primary DSRT entity the user is currently working with. */
export interface EntityContext extends CocoEntityRef {
  /**
   * A compact summary the context resolver assembles server-side.
   * NEVER trust the client to send the full entity payload.
   * Populated by resolvers in Phase 3.
   */
  summary?: Record<string, unknown>
}

/**
 * UI state COCO can safely observe.
 * Only semantic values, never raw DOM.
 */
export interface UiStateContext {
  selected_options?: string[]
  form_values?: Record<string, string | number | boolean | null>
  active_tab?: string
  modal_open?: string | null
}

/** L4 — Related entities pulled by the context compiler. */
export interface RelatedEntitiesContext {
  entities: CocoEntityRef[]
  /** Why each entity was included (for auditability). */
  reasons?: Record<string, string>
}

/** L5 — Relevant memory items surfaced for this turn. */
export interface MemoryContext {
  items: Array<{
    key: string
    value: string
    source: string
    confidence: number
  }>
}

/** L6 — Retrieved knowledge / documentation snippets. */
export interface KnowledgeContext {
  snippets: Array<{
    source: string                 // e.g. 'dsrt-docs/design/banners.md'
    content: string
    trust: TrustLevel              // typically 'retrieved'
    relevance_score?: number
  }>
}

/**
 * The Context Envelope.
 * Assembled server-side by the Context Compiler (Phase 3).
 * Passed to the Agent Runtime, never to the model directly.
 */
export interface CocoContextEnvelope {
  envelope_version: '1'
  snapshot_id: UUID
  created_at: Timestamp

  identity: IdentityContext
  navigation: NavigationContext
  component?: ComponentContext
  entity?: EntityContext
  ui_state?: UiStateContext
  related?: RelatedEntitiesContext
  memory?: MemoryContext
  knowledge?: KnowledgeContext

  /** Resolved server-side. Never trust client. */
  permissions: CocoPermissionScope[]

  /** Optional freshness hint per context slice. */
  freshness?: Partial<Record<
    'identity' | 'entity' | 'related' | 'memory' | 'knowledge',
    Timestamp
  >>
}

/**
 * The lightweight page-context payload the frontend SDK sends up.
 * The server does NOT trust this beyond navigation hints; it re-resolves entities.
 */
export interface CocoClientContextHint {
  route: string
  page: string
  entity?: {
    type: string
    id: string
  }
  component?: {
    registry_id: string
    instance_id?: string
  }
  ui_state?: UiStateContext
}