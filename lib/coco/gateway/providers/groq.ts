// ============================================================
// lib/coco/gateway/providers/groq.ts
// Groq implementation with strict key rotation + proactive throttling + auto model fallback.
// ============================================================

import Groq from 'groq-sdk'
import type { CocoModelRequest, CocoModelResponse, CocoModelStreamChunk } from '@/types/coco'
import { recordSuccess, recordFailure } from '../circuit-breaker'
import { waitForCapacity } from '../rate-limiter'

const API_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_BACKUP_1,
  process.env.GROQ_API_KEY_BACKUP_2,
].filter(Boolean) as string[]

// Guaranteed active fallback model on Groq
const SAFE_FALLBACK_MODEL = 'llama-3.1-8b-instant'

let keyIndex = 0
const keyUsage = new Map<string, { count: number; resetAt: number }>()

function getBestKey(): string {
  if (API_KEYS.length === 0) throw new Error('No Groq API keys configured in environment variables')
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[keyIndex]
    keyIndex = (keyIndex + 1) % API_KEYS.length
    
    const usage = keyUsage.get(key)
    if (!usage || Date.now() > usage.resetAt) {
      if (usage) keyUsage.delete(key)
      return key
    }
    if (usage.count < 25) return key
  }
  throw new Error('All Groq keys rate limited locally. Retrying shortly.')
}

function trackUsage(key: string) {
  const usage = keyUsage.get(key) || { count: 0, resetAt: Date.now() + 60000 }
  usage.count++
  keyUsage.set(key, usage)
}

function buildBaseParams(req: CocoModelRequest, modelId: string) {
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

export async function executeGroq(req: CocoModelRequest, modelId: string): Promise<CocoModelResponse> {
  const key = getBestKey()
  const groq = new Groq({ apiKey: key })
  
  await waitForCapacity()
  trackUsage(key)

  const startTime = Date.now()
  let targetModel = modelId

  try {
    let response
    try {
      response = await groq.chat.completions.create({
        ...buildBaseParams(req, targetModel),
        stream: false
      })
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes('model_not_found') || err?.message?.includes('does not exist')) {
        console.warn(`[Groq Provider] Model ${targetModel} 404, falling back to ${SAFE_FALLBACK_MODEL}`)
        targetModel = SAFE_FALLBACK_MODEL
        response = await groq.chat.completions.create({
          ...buildBaseParams(req, targetModel),
          stream: false
        })
      } else {
        throw err
      }
    }

    recordSuccess('groq')
    
    const choice = response.choices[0]
    return {
      provider: 'groq',
      model_id: targetModel,
      content: choice.message?.content || '',
      tool_calls: choice.message?.tool_calls?.map(tc => ({
        call_id: tc.id,
        tool_name: tc.function.name,
        arguments: safeJsonParse(tc.function.arguments)
      })),
      finish_reason: choice.finish_reason as any,
      usage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      },
      latency_ms: Date.now() - startTime
    }
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.status === 503
    recordFailure('groq', isRateLimit)
    throw err
  }
}

export async function* streamGroq(req: CocoModelRequest, modelId: string): AsyncGenerator<CocoModelStreamChunk> {
  const key = getBestKey()
  const groq = new Groq({ apiKey: key })
  
  await waitForCapacity()
  trackUsage(key)

  let targetModel = modelId

  try {
    let stream
    try {
      stream = await groq.chat.completions.create({
        ...buildBaseParams(req, targetModel),
        stream: true
      })
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes('model_not_found') || err?.message?.includes('does not exist')) {
        console.warn(`[Groq Provider] Model ${targetModel} 404 in stream, falling back to ${SAFE_FALLBACK_MODEL}`)
        targetModel = SAFE_FALLBACK_MODEL
        stream = await groq.chat.completions.create({
          ...buildBaseParams(req, targetModel),
          stream: true
        })
      } else {
        throw err
      }
    }

    recordSuccess('groq')

    for await (const chunk of stream) {
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
  } catch (err: any) {
    recordFailure('groq', err.status === 429)
    yield { kind: 'error', code: 'COCO_MODEL_STREAM_FAILED', message: cleanErrorMessage(err?.message) }
  }
}

function safeJsonParse(str: string): Record<string, unknown> {
  try { return JSON.parse(str) } catch { return {} }
}

function cleanErrorMessage(msg?: string): string {
  if (!msg) return 'AI service temporarily unavailable. Please try again.'
  if (msg.includes('model_not_found') || msg.includes('404')) {
    return 'The requested AI model is updating. Retrying with backup model...'
  }
  return msg
}