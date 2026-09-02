// ============================================================
// lib/kernel/context.ts
// RequestContext is created by the API layer for every request
// and passed down through domain services.
// ============================================================

import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UnauthenticatedError } from './errors'

export interface RequestContext {
  requestId: string
  traceId: string
  identityId: string | null
  sessionId: string | null
  ipHash: string | null
  userAgent: string | null
  timestamp: string
}

export interface AuthedRequestContext extends RequestContext {
  identityId: string
}

/**
 * Generate a stable, non-reversible hash of an IP for audit logs.
 * Never store raw IPs in DSRT audit records.
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.DSRT_IP_HASH_SALT || 'dsrt-default-salt'
  return createHash('sha256').update(salt + ip).digest('hex').slice(0, 24)
}

/**
 * Extract client IP from Next.js request headers.
 */
function extractIp(req: NextRequest | Request): string | null {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() ?? null
  return req.headers.get('x-real-ip') || null
}

/**
 * Build a RequestContext for an incoming API request.
 * Returns null identityId if unauthenticated.
 */
export async function buildRequestContext(
  req: NextRequest | Request
): Promise<RequestContext> {
  const requestId =
    req.headers.get('x-request-id') || cryptoRandomId()
  const traceId =
    req.headers.get('x-trace-id') || requestId
  const userAgent = req.headers.get('user-agent') || null
  const ipHash = hashIp(extractIp(req))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    requestId,
    traceId,
    identityId: user?.id ?? null,
    sessionId: null, // populated by session tracker later
    ipHash,
    userAgent,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Same as buildRequestContext but throws if unauthenticated.
 * Use this at the top of every protected API route.
 */
export async function requireAuthContext(
  req: NextRequest | Request
): Promise<AuthedRequestContext> {
  const ctx = await buildRequestContext(req)
  if (!ctx.identityId) {
    throw new UnauthenticatedError()
  }
  return ctx as AuthedRequestContext
}

function cryptoRandomId(): string {
  // Prefer Web Crypto UUID; fallback for older runtimes
  try {
    return crypto.randomUUID()
  } catch {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  }
}