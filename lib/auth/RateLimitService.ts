import type { SupabaseClient } from '@supabase/supabase-js'

export class RateLimitService {
  constructor(private supabase: SupabaseClient) {}

  async check(key: string, maxTokens: number, refillSeconds: number) {
    const { data, error } = await this.supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max_tokens: maxTokens,
      p_refill_seconds: refillSeconds,
    })

    if (error) {
      console.error('[RateLimitService]', error.message)
      // Fail closed for security-sensitive endpoints
      return { allowed: false, remaining: 0, retry_after_seconds: 60 }
    }

    return data as {
      allowed: boolean
      remaining?: number
      retry_after_seconds?: number
    }
  }
}