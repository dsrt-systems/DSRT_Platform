// ============================================================
// lib/coco/gateway/providers/groq.ts
// Direct, zero-stall Groq provider with multi-model fallback cascade.
// ============================================================

import Groq from 'groq-sdk'
import type { CocoModelRequest, CocoModelResponse, CocoModelStreamChunk } from '@/types/coco'

const API_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_BACKUP_1,
  process.env.GROQ_API_KEY_BACKUP_2,
].filter((k): k is string => Boolean(k && k.trim().length > 0))

// Verified active models ordered by speed and availability
const GROQ_MODEL_CASCADE = [
  'llama-3.1-8b-instant',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
]

let keyIndex = 0
function getNextApiKey(): string {
  if (API_KEYS.length === 0) {
    throw new Error('GROQ_API_KEY is not configured in environment variables')
  }
  const key = API_KEYS[keyIndex % API_KEYS.length]
  keyIndex++
  return key
}

function buildParams(req: CocoModelRequest, modelId: string) {
  const tools = req.tools?.map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema as Record<string, unknown>
    }
  }))

  return {
    model: modelId,
    messages: req.messages as any,
    temperature: req.temperature ?? 0.7,
    max_tokens: req.max_tokens ?? 1024,
    tools: tools?.length ? tools : undefined,
    response_format: req.response_schema ? { type: 'json_object' as const } : undefined,
  }
}

function safeJsonParse(str: string): Record<string, unknown> {
  try { return JSON.parse(str) } catch { return {} }
}

export async function executeGroq(req: CocoModelRequest, preferredModel?: string): Promise<CocoModelResponse> {
  const apiKey = getNextApiKey()
  const groq = new Groq({ apiKey })
  const startTime = Date.now()

  const modelsToTry = preferredModel 
    ? [preferredModel, ...GROQ_MODEL_CASCADE.filter(m => m !== preferredModel)]
    : GROQ_MODEL_CASCADE

  let lastError: Error | null = null

  for (const modelId of modelsToTry) {
    try {
      const response = await groq.chat.completions.create({
        ...buildParams(req, modelId),
        stream: false
      })

      const choice = response.choices[0]
      return {
        provider: 'groq',
        model_id: modelId,
        content: choice?.message?.content || '',
        tool_calls: choice?.message?.tool_calls?.map(tc => ({
          call_id: tc.id,
          tool_name: tc.function.name,
          arguments: safeJsonParse(tc.function.arguments)
        })),
        finish_reason: (choice?.finish_reason as any) || 'stop',
        usage: {
          input_tokens: response.usage?.prompt_tokens || 0,
          output_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0
        },
        latency_ms: Date.now() - startTime
      }
    } catch (err: any) {
      console.warn(`[Groq] Model ${modelId} failed: ${err?.message}. Trying next model...`)
      lastError = err
    }
  }

  throw lastError || new Error('All Groq models failed')
}

export async function* streamGroq(req: CocoModelRequest, preferredModel?: string): AsyncGenerator<CocoModelStreamChunk> {
  const apiKey = getNextApiKey()
  const groq = new Groq({ apiKey })

  const modelsToTry = preferredModel 
    ? [preferredModel, ...GROQ_MODEL_CASCADE.filter(m => m !== preferredModel)]
    : GROQ_MODEL_CASCADE

  let streamSuccess = false
  let lastError: Error | null = null

  for (const modelId of modelsToTry) {
    try {
      const stream = await groq.chat.completions.create({
        ...buildParams(req, modelId),
        stream: true
      })

      for await (const chunk of stream) {
        streamSuccess = true
        const delta = chunk.choices[0]?.delta
        const finish_reason = chunk.choices[0]?.finish_reason

        if (delta?.content) {
          yield { kind: 'text', delta: delta.content }
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.function?.name) {
              yield { kind: 'tool_call_delta', call_id: tc.id || '', tool_name: tc.function.name }
            }
            if (tc.function?.arguments) {
              yield { kind: 'tool_call_delta', call_id: tc.id || '', arguments_delta: tc.function.arguments }
            }
          }
        }

        if (finish_reason) {
          yield { kind: 'finish', reason: finish_reason as any }
        }
      }

      if (streamSuccess) return
    } catch (err: any) {
      if (streamSuccess) {
        yield { kind: 'error', code: 'COCO_STREAM_INTERRUPTED', message: err?.message || 'Stream ended unexpectedly' }
        return
      }
      console.warn(`[Groq Stream] Model ${modelId} failed: ${err?.message}. Retrying next model...`)
      lastError = err
    }
  }

  yield {
    kind: 'error',
    code: 'COCO_MODEL_STREAM_FAILED',
    message: lastError?.message || 'Groq connection failed. Verify GROQ_API_KEY environment variable.'
  }
}