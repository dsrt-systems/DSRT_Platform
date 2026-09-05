// ============================================================
// app/api/coco/health/route.ts
// Health check route to verify COCO environment variables & models.
// ============================================================

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  const hasGroq = Boolean(groqKey && groqKey.trim().length > 0)
  const hasOpenAI = Boolean(openaiKey && openaiKey.trim().length > 0)

  let groqTestResult = 'Not tested'

  if (hasGroq) {
    try {
      const Groq = (await import('groq-sdk')).default
      const client = new Groq({ apiKey: groqKey })
      const res = await client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      })
      groqTestResult = `OK (${res.choices[0]?.message?.content || 'pong'})`
    } catch (err: any) {
      groqTestResult = `FAILED: ${err.message}`
    }
  }

  return NextResponse.json({
    status: hasGroq && !groqTestResult.startsWith('FAILED') ? 'healthy' : 'degraded',
    env: {
      has_groq_key: hasGroq,
      groq_key_preview: hasGroq ? `${groqKey!.slice(0, 7)}...` : null,
      has_openai_key: hasOpenAI,
    },
    groq_test: groqTestResult,
    timestamp: new Date().toISOString()
  })
}