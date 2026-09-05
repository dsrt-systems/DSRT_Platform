// ============================================================
// lib/coco/gateway/router.ts
// Direct gateway router. Fast, non-blocking, zero memory state lockouts.
// ============================================================

import type { CocoModelRequest, CocoModelResponse, CocoModelStreamChunk } from '@/types/coco'
import { executeGroq, streamGroq } from './providers/groq'
import { executeOpenAI, streamOpenAI, isOpenAIConfigured } from './providers/openai'

export async function routeExecution(req: CocoModelRequest): Promise<CocoModelResponse> {
  try {
    return await executeGroq(req, 'llama-3.1-8b-instant')
  } catch (groqErr: any) {
    if (isOpenAIConfigured()) {
      try {
        return await executeOpenAI(req, 'gpt-4o-mini')
      } catch (openaiErr: any) {
        throw new Error(`AI Providers Exhausted. Groq: ${groqErr.message} | OpenAI: ${openaiErr.message}`)
      }
    }
    throw groqErr
  }
}

export async function* routeStream(req: CocoModelRequest): AsyncGenerator<CocoModelStreamChunk> {
  let streamSuccess = false

  try {
    const stream = streamGroq(req, 'llama-3.1-8b-instant')
    for await (const chunk of stream) {
      if (chunk.kind !== 'error') streamSuccess = true
      yield chunk
    }
    if (streamSuccess) return
  } catch (err: any) {
    console.warn('[COCO Router] Groq stream failed:', err?.message)
  }

  // Fallback to OpenAI if configured
  if (isOpenAIConfigured()) {
    try {
      const stream = streamOpenAI(req, 'gpt-4o-mini')
      for await (const chunk of stream) {
        yield chunk
      }
      return
    } catch (err: any) {
      yield {
        kind: 'error',
        code: 'COCO_ALL_PROVIDERS_EXHAUSTED',
        message: `OpenAI Stream Error: ${err?.message}`
      }
      return
    }
  }

  yield {
    kind: 'error',
    code: 'COCO_ALL_PROVIDERS_EXHAUSTED',
    message: 'Could not connect to Groq. Please check your GROQ_API_KEY in Vercel environment variables.'
  }
}