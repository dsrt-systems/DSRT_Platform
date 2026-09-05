// ============================================================
// lib/coco/actions/manager.ts
// Manages the state machine for tool actions (coco_action_runs).
// ============================================================

import { adminClient } from '@/lib/supabase/admin'
import type { 
  UUID, 
  ActionRunId, 
  CocoToolCall, 
  CocoActionStatus,
  CocoToolResult 
} from '@/types/coco'

interface CreateActionRunParams {
  userId: UUID
  conversationId: UUID
  messageId: UUID
  toolCall: CocoToolCall
  toolVersion: string
  riskLevel: string
  requiresConfirmation: boolean
  summary: string
}

/**
 * Step 1: Model proposed a tool call. We record it.
 */
export async function createActionRun(params: CreateActionRunParams): Promise<ActionRunId> {
  const status: CocoActionStatus = params.requiresConfirmation 
    ? 'awaiting_confirmation' 
    : 'authorized' // Skip confirmation phase if low risk

  const { data, error } = await adminClient
    .from('coco_action_runs')
    .insert({
      user_id: params.userId,
      conversation_id: params.conversationId,
      proposing_message_id: params.messageId,
      tool_name: params.toolCall.tool_name,
      tool_version: params.toolVersion,
      risk_level: params.riskLevel,
      status,
      proposed_call: params.toolCall as any,
      summary: params.summary,
      idempotency_key: params.toolCall.idempotency_key || null,
      expires_at: params.requiresConfirmation ? new Date(Date.now() + 5 * 60000).toISOString() : null // 5 min TTL
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create action run: ${error.message}`)
  return data.id
}

/**
 * Step 2: User clicked "Execute" on the UI.
 */
export async function authorizeActionRun(actionId: ActionRunId, userId: UUID): Promise<boolean> {
  const { data, error } = await adminClient
    .from('coco_action_runs')
    .update({ 
      status: 'authorized',
      confirmed: true,
      confirmed_at: new Date().toISOString()
    })
    .eq('id', actionId)
    .eq('user_id', userId)
    .eq('status', 'awaiting_confirmation')
    .select('id')
    .maybeSingle()

  if (error) console.error('[COCO Actions] Auth error:', error)
  return !!data
}

/**
 * Step 3: Executor picks it up and marks it 'executing'.
 */
export async function startActionRun(actionId: ActionRunId): Promise<void> {
  await adminClient
    .from('coco_action_runs')
    .update({ 
      status: 'executing',
      started_at: new Date().toISOString()
    })
    .eq('id', actionId)
    .in('status', ['authorized'])
}

/**
 * Step 4: Execution finished (success or fail).
 */
export async function resolveActionRun(
  actionId: ActionRunId, 
  result: CocoToolResult
): Promise<void> {
  const status: CocoActionStatus = result.success ? 'completed' : 'failed'

  await adminClient
    .from('coco_action_runs')
    .update({
      status,
      result: result as any,
      error: result.error as any,
      completed_at: new Date().toISOString(),
      verification: result.verified !== undefined ? { passed: result.verified } : null
    })
    .eq('id', actionId)
}

/**
 * User explicitly clicked "Cancel" on the UI.
 */
export async function cancelActionRun(actionId: ActionRunId, userId: UUID): Promise<void> {
  await adminClient
    .from('coco_action_runs')
    .update({ status: 'cancelled' })
    .eq('id', actionId)
    .eq('user_id', userId)
    .eq('status', 'awaiting_confirmation')
}