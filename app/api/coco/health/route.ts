// ============================================================
// app/api/coco/health/route.ts
// ============================================================

import { NextResponse } from 'next/server'
import { probeGroq } from '@/lib/coco/gateway/providers/groq'
import { isOpenAIConfigured } from '@/lib/coco/gateway/providers/openai'
import { COCO_GROQ_CASCADE, COCO_GROQ_MODELS } from '@/lib/coco/gateway/models'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY
  const hasGroq = Boolean(groqKey && groqKey.trim().length > 0)
  const hasOpenAI = isOpenAIConfigured()

  const probe = hasGroq
    ? await probeGroq()
    : { ok: false, detail: 'GROQ_API_KEY missing' }

  return NextResponse.json({
    status: probe.ok ? 'healthy' : hasOpenAI ? 'degraded' : 'unhealthy',
    env: {
      has_groq_key: hasGroq,
      groq_key_preview: hasGroq ? `${groqKey!.slice(0, 7)}...` : null,
      has_openai_key: hasOpenAI,
      backup_keys: [
        Boolean(process.env.GROQ_API_KEY_BACKUP_1),
        Boolean(process.env.GROQ_API_KEY_BACKUP_2),
      ],
    },
    models: {
      configured: COCO_GROQ_MODELS,
      cascade: COCO_GROQ_CASCADE,
    },
    groq_test: probe,
    timestamp: new Date().toISOString(),
  })
}