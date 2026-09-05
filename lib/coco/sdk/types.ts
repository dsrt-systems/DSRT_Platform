// ============================================================
// lib/coco/sdk/types.ts
// Client-side type helpers for the COCO SDK.
// ============================================================

import type { CocoClientContextHint, CocoMessageContent, ConversationId, MessageId, ActionRunId } from '@/types/coco'

export interface CocoUiMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: CocoMessageContent
  createdAt: number
  streaming?: boolean
  pendingAction?: {
    actionRunId: ActionRunId
    toolName: string
    summary: string
    status: 'pending' | 'confirming' | 'executing' | 'completed' | 'cancelled' | 'failed'
  }
}

export type CocoLifecycleState =
  | 'idle'
  | 'sending'
  | 'streaming'
  | 'awaiting_confirmation'
  | 'executing'
  | 'error'

export interface CocoContextRegistration {
  hint: CocoClientContextHint
}