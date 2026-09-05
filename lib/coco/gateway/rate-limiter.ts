// ============================================================
// lib/coco/gateway/rate-limiter.ts
// Proactive Token Bucket Rate Limiter.
// Prevents 429s by pausing requests before they hit the provider.
// ============================================================

// In-memory tracker (Swappable to Redis for multi-instance scaling)
const usage = {
  requestsThisMinute: 0,
  minuteWindowStart: Date.now()
}

// Groq Free Tier is 30 RPM. We set our hard ceiling to 25 RPM per key.
const MAX_RPM = 25 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Call this BEFORE sending a request to the provider.
 * If we are too hot, it will sleep and queue the request automatically.
 */
export async function waitForCapacity(): Promise<void> {
  const now = Date.now()

  // Reset the window if a minute has passed
  if (now - usage.minuteWindowStart > 60000) {
    usage.requestsThisMinute = 0
    usage.minuteWindowStart = now
  }

  // If we are about to hit the limit, pause this request
  if (usage.requestsThisMinute >= MAX_RPM) {
    const timeUntilReset = 60000 - (now - usage.minuteWindowStart)
    console.warn(`[COCO Throttle] Approaching provider limit. Delaying request for ${timeUntilReset}ms...`)
    
    // Wait until the minute rolls over
    await delay(timeUntilReset)
    
    // Recursive call to ensure capacity after waking up
    return waitForCapacity()
  }

  // Consume a token and proceed immediately
  usage.requestsThisMinute++
}