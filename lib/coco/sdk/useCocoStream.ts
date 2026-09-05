// ============================================================
// lib/coco/sdk/useCocoStream.ts
// Handles SSE + client-side Action Bridge (spec §61).
// ============================================================

'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { CocoStreamEvent, ConversationId } from '@/types/coco'
import type { CocoUiMessage, CocoLifecycleState } from './types'
import { getCocoContext } from './context-registry'

export function useCocoStream() {
  const router = useRouter()
  const [messages, setMessages] = useState<CocoUiMessage[]>([])
  const [state, setState] = useState<CocoLifecycleState>('idle')
  const [conversationId, setConversationId] = useState<ConversationId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /**
   * ACTION BRIDGE (§61): consumes structured tool outputs
   * and executes them against the browser (router.push, focus, custom events, etc.)
   */
  const executeClientAction = useCallback(
    (output: any) => {
      if (!output || typeof output !== 'object') return

      const action = output.action
      const route = output.route || output.path

      // Navigation handler with safety check & micro-delay so stream text renders first
      if (action === 'client_navigate' || (route && typeof route === 'string' && route.startsWith('/'))) {
        const target = String(route)
        if (target.startsWith('/')) {
          setTimeout(() => router.push(target), 50)
        }
        return
      }

      // UI Form Autofill
      if (action === 'client_ui_fill') {
        const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[data-coco-field="${output.field_id}"]`
        )
        if (field) {
          const proto =
            field.tagName === 'TEXTAREA'
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype
          Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(field, output.value)
          field.dispatchEvent(new Event('input', { bubbles: true }))
          field.focus()
        }
        return
      }

      // UI Option Select
      if (action === 'client_ui_select') {
        window.dispatchEvent(
          new CustomEvent('coco:select', {
            detail: {
              componentId: output.component_id,
              optionKey: output.option_key,
            },
          })
        )
      }
    },
    [router]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      if (state !== 'idle') return

      setError(null)
      setState('sending')

      const userMsg: CocoUiMessage = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: { kind: 'text', text },
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])

      const assistantMsg: CocoUiMessage = {
        id: `local-a-${Date.now()}`,
        role: 'assistant',
        content: { kind: 'text', text: '' },
        createdAt: Date.now(),
        streaming: true,
      }
      setMessages((prev) => [...prev, assistantMsg])

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch('/api/coco/messages/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            text,
            context_hint: getCocoContext(),
          }),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error(`Stream failed: ${response.status}`)
        }

        setState('streaming')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const part of parts) {
            if (!part.startsWith('data: ')) continue
            const jsonStr = part.slice(6)
            try {
              const event: CocoStreamEvent = JSON.parse(jsonStr)

              // ── Handle incoming stream events ──
              switch (event.event) {
                case 'stream.start':
                  setConversationId(event.data.conversation_id)
                  break

                case 'message.delta':
                  accumulated += event.data.text
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: { kind: 'text', text: accumulated } }
                        : m
                    )
                  )
                  break

                case 'action.proposed':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? {
                            ...m,
                            pendingAction: {
                              actionRunId: event.data.action_run_id,
                              toolName: event.data.tool_name,
                              summary: event.data.summary,
                              status: event.data.requires_confirmation
                                ? 'pending'
                                : 'executing',
                            },
                          }
                        : m
                    )
                  )
                  break

                case 'action.confirmation_required':
                  setState('awaiting_confirmation')
                  break

                case 'action.completed':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.pendingAction?.actionRunId === event.data.action_run_id
                        ? {
                            ...m,
                            pendingAction: {
                              ...m.pendingAction!,
                              status: 'completed',
                            },
                          }
                        : m
                    )
                  )
                  break

                case 'action.failed':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.pendingAction?.actionRunId === event.data.action_run_id
                        ? {
                            ...m,
                            pendingAction: {
                              ...m.pendingAction!,
                              status: 'failed',
                            },
                          }
                        : m
                    )
                  )
                  break

                // ── ACTION BRIDGE EVENT ──
                case 'action.client_bridge':
                  executeClientAction(event.data.output)
                  break

                case 'error':
                  setError(event.data.message)
                  setState('error')
                  break

                case 'stream.end':
                case 'tool.started':
                case 'tool.completed':
                case 'message.completed':
                  // Handled by stream lifecycle or UI rendering
                  break
              }
            } catch {
              console.warn('[COCO SDK] Failed to parse event:', jsonStr)
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, streaming: false } : m))
        )
        setState('idle')
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setState('idle')
        } else {
          setError(err.message)
          setState('error')
        }
      }
    },
    [state, conversationId, executeClientAction]
  )

  const confirmAction = useCallback(
    async (actionRunId: string) => {
      setState('executing')
      setMessages((prev) =>
        prev.map((m) =>
          m.pendingAction?.actionRunId === actionRunId
            ? { ...m, pendingAction: { ...m.pendingAction!, status: 'executing' } }
            : m
        )
      )

      try {
        const res = await fetch(`/api/coco/actions/${actionRunId}/confirm`, {
          method: 'POST',
        })
        const json = await res.json()

        // ACTION BRIDGE: execute client action upon confirmation resolution
        if (json.data?.result?.output) {
          executeClientAction(json.data.result.output)
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.pendingAction?.actionRunId === actionRunId
              ? {
                  ...m,
                  pendingAction: {
                    ...m.pendingAction!,
                    status: json.data?.success ? 'completed' : 'failed',
                  },
                }
              : m
          )
        )
        setState('idle')
      } catch (err: any) {
        setError(err.message)
        setState('error')
      }
    },
    [executeClientAction]
  )

  const cancelAction = useCallback(async (actionRunId: string) => {
    try {
      await fetch(`/api/coco/actions/${actionRunId}/cancel`, { method: 'POST' })
      setMessages((prev) =>
        prev.map((m) =>
          m.pendingAction?.actionRunId === actionRunId
            ? { ...m, pendingAction: { ...m.pendingAction!, status: 'cancelled' } }
            : m
        )
      )
      setState('idle')
    } catch {
      // ignore
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setState('idle')
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setState('idle')
    setError(null)
  }, [])

  return {
    messages,
    state,
    error,
    conversationId,
    sendMessage,
    confirmAction,
    cancelAction,
    stop,
    reset,
    executeClientAction,
  }
}