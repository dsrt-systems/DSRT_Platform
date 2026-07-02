import { NextResponse } from 'next/server'

// Seed initial editorial posts (call this once after deployment)
// Visit: http://localhost:3000/api/editorial/seed
export async function GET() {
  const results = []

  // Generate 20 posts (will rotate through sectors)
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/editorial/generate`,
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET || ''}`,
          },
        }
      )
      const data = await res.json()
      results.push(data)
      // Delay to respect API rate limits
      await new Promise((r) => setTimeout(r, 1500))
    } catch (err) {
      console.error('Seed error:', err)
    }
  }

  return NextResponse.json({
    success: true,
    iterations: results.length,
    results,
  })
}