// ============================================================
// lib/coco/context/compiler.ts
// The Context Compiler — assembles CocoContextEnvelope from a client hint.
// See COCO spec §7–§9.
// ============================================================

import { randomUUID } from 'crypto'
import type {
  CocoClientContextHint,
  CocoContextEnvelope,
  UUID,
  ConversationId,
  Timestamp,
  CocoTaskClass,
} from '@/types/coco'

import { sanitizeClientHint } from './security'
import { resolveUserPermissions } from './permissions'
import { persistSnapshot } from './snapshot'
import { buildFreshnessMap } from './freshness'

import { resolveIdentity } from './resolvers/identity'
import { resolveNavigation } from './resolvers/navigation'
import { resolveComponent } from './resolvers/component'
import { resolveEntity } from './resolvers/entity'
import { resolveRelated } from './resolvers/related'
import { resolveMemory } from './resolvers/memory'
import { resolveKnowledge } from './resolvers/knowledge'
import { resolveUiState } from './resolvers/ui-state'

export interface CompileContextParams {
  userId: UUID
  conversationId?: ConversationId
  rawHint: unknown
  userMessage: string
  /** Guides how deep the compiler goes (avoid unnecessary fetches). */
  taskClass?: CocoTaskClass
  /** Whether to persist a snapshot (skip for dry-runs / preview). */
  persist?: boolean
}

export interface CompileContextResult {
  envelope: CocoContextEnvelope
  snapshotId: UUID | null
}

/**
 * The single entry point for building a context envelope.
 * The Agent Runtime (Phase 6) calls this before every model call.
 */
export async function compileContext(params: CompileContextParams): Promise<CompileContextResult> {
  const { userId, conversationId, rawHint, userMessage, taskClass = 'C_GENERATION', persist = true } = params

  // Step 1 — Sanitize the client hint (untrusted input boundary)
  const hint: CocoClientContextHint = sanitizeClientHint(rawHint)

  // Step 2 — Resolve identity + permissions in parallel (both cheap)
  const [identity, permSet] = await Promise.all([
    resolveIdentity(userId),
    resolveUserPermissions(userId),
  ])

  // Step 3 — Resolve navigation + component from sanitized hint (no DB)
  const navigation = resolveNavigation(hint)
  const component = resolveComponent(hint)
  const ui_state = resolveUiState(hint)

  // Step 4 — Resolve entity if a hint was provided
  const entity = hint.entity
    ? await resolveEntity({ type: hint.entity.type as any, id: hint.entity.id }, userId)
    : undefined

  // Step 5 — Depth control: only expand L4-L6 for reasoning/agentic tasks
  const needsDeepContext =
    taskClass === 'D_REASONING' ||
    taskClass === 'E_AGENTIC'

  const [related, memory, knowledge] = await Promise.all([
    needsDeepContext ? resolveRelated(entity, userId) : Promise.resolve(undefined),
    resolveMemory(userId, entity),
    needsDeepContext ? resolveKnowledge(userMessage, entity?.type) : Promise.resolve(undefined),
  ])

  // Step 6 — Assemble the envelope
  const now = new Date().toISOString() as Timestamp
  const snapshotId = randomUUID() as UUID

  const envelope: CocoContextEnvelope = {
    envelope_version: '1',
    snapshot_id: snapshotId,
    created_at: now,

    identity,
    navigation,
    component,
    entity,
    ui_state,
    related,
    memory,
    knowledge,

    permissions: permSet.scopes,
    freshness: buildFreshnessMap(),
  }

  // Step 7 — Persist snapshot (fire-and-forget style, but we await for FK integrity)
  let persistedId: UUID | null = null
  if (persist) {
    persistedId = await persistSnapshot(envelope, userId, conversationId)
  }

  return { envelope, snapshotId: persistedId || snapshotId }
}