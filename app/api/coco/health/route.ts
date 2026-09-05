import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const groqKey = process.env.GROQ_API_KEY
    const hasGroq = Boolean(groqKey && groqKey.trim())
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim())

    let groq_test: { ok: boolean; model?: string; detail: string } = {
      ok: false,
      detail: 'not_run',
    }

    if (hasGroq) {
      try {
        const { probeGroq } = await import('@/lib/coco/gateway/providers/groq')
        groq_test = await probeGroq()
      } catch (err: any) {
        groq_test = { ok: false, detail: err?.message || 'probe import/exec failed' }
      }
    } else {
      groq_test = { ok: false, detail: 'GROQ_API_KEY missing' }
    }

    let models: unknown = null
    try {
      const m = await import('@/lib/coco/gateway/models')
      models = { configured: m.COCO_GROQ_MODELS, cascade: m.COCO_GROQ_CASCADE }
    } catch {
      models = { error: 'models module missing' }
    }

    return NextResponse.json({
      status: groq_test.ok ? 'healthy' : hasOpenAI ? 'degraded' : 'unhealthy',
      env: {
        has_groq_key: hasGroq,
        groq_key_preview: hasGroq ? `${groqKey!.slice(0, 7)}...` : null,
        has_openai_key: hasOpenAI,
      },
      models,
      groq_test,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    // Never 500 hard without body
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: err?.message || 'health failed',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  }
}