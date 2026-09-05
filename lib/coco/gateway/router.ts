// ============================================================
// lib/coco/gateway/router.ts
// Resolves Tiers to specific Providers/Models. Handles fallbacks.
// ============================================================

import type { CocoModelTier, CocoModelRequest, CocoModelResponse, CocoModelStreamChunk } from '@/types/coco'
import { isHealthy } from './circuit-breaker'
import { executeGroq, streamGroq } from './providers/groq'
import { executeOpenAI, streamOpenAI } from './providers/openai'

interface RouteTarget {
  provider: 'groq' | 'openai'
  modelId: string
}

function resolveRoute(tier: CocoModelTier, attempt: number = 0): RouteTarget {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY)

  switch (tier) {
    case 'FAST':
      if (attempt === 0 && isHealthy('groq')) return { provider: 'groq', modelId: 'llama-3.1-8b-instant' }
      if (attempt === 1 && hasOpenAI && isHealthy('openai')) return { provider: 'openai', modelId: 'gpt-4o-mini' }
      return { provider: 'groq', modelId: 'llama-3.1-8b-instant' }

    case 'GENERAL':
      if (attempt === 0 && isHealthy('groq')) return { provider: 'groq', modelId: 'llama-3.1-8b-instant' }
      if (attempt === 1 && isHealthy('groq')) return { provider: 'groq', modelId: 'mixtral-8x7b-32768' }
      if (hasOpenAI && isHealthy('openai')) return { provider: 'openai', modelId: 'gpt-4o-mini' }
      return { provider: 'groq', modelId: 'llama-3.1-8b-instant' }

    case 'REASONING':
      if (attempt === 0 && hasOpenAI && isHealthy('openai')) return { provider: 'openai', modelId: 'gpt-4o' }
      if (attempt === 0 && isHealthy('groq')) return { provider: 'groq', modelId: 'llama-3.1-8b-instant' }
      if (attempt === 1 && isHealthy('groq')) return { provider: 'groq', modelId: 'mixtral-8x7b-32768' }
      return { provider: 'groq', modelId: 'llama-3.1-8b-instant' }

    default:
      return { provider: 'groq', modelId: 'llama-3.1-8b-instant' }
  }
}

export async function routeExecution(req: CocoModelRequest): Promise<CocoModelResponse> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < 2; attempt++) {
    const route = resolveRoute(req.tier, attempt)
    try {
      if (route.provider === 'groq') return await executeGroq(req, route.modelId)
      if (route.provider === 'openai') return await executeOpenAI(req, route.modelId)
    } catch (err: any) {
      console.warn(`[COCO Router] Route ${route.provider}/${route.modelId} failed. Attempt ${attempt + 1}/2.`, err.message)
      lastError = err
    }
  }
  
  throw lastError || new Error('COCO_ALL_PROVIDERS_EXHAUSTED')
}

export async function* routeStream(req: CocoModelRequest): AsyncGenerator<CocoModelStreamChunk> {
  let streamSuccess = false
  
  for (let attempt = 0; attempt < 2; attempt++) {
    const route = resolveRoute(req.tier, attempt)
    try {
      const generator = route.provider === 'groq' 
        ? streamGroq(req, route.modelId) 
        : streamOpenAI(req, route.modelId)
      
      for await (const chunk of generator) {
        streamSuccess = true
        yield chunk
      }
      return
    } catch (err: any) {
      if (streamSuccess) {
        yield { kind: 'error', code: 'COCO_STREAM_INTERRUPTED', message: err.message }
        return
      }
      console.warn(`[COCO Router] Stream ${route.provider}/${route.modelId} failed. Retrying...`)
    }
  }
  
  yield { kind: 'error', code: 'COCO_ALL_PROVIDERS_EXHAUSTED', message: 'All AI models are currently busy. Please try again in a moment.' }
}