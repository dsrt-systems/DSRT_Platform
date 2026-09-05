// ============================================================
// lib/coco/agent/intent-router.ts
// Uses the FAST model tier to classify request complexity.
// ============================================================

import { executeModelRequest } from '@/lib/coco/gateway'
import type { CocoModelRequest, CocoTaskClass } from '@/types/coco'

export async function classifyIntent(
  userMessage: string,
  userId: string,
  conversationId: string,
  requestId: string
): Promise<CocoTaskClass> {
  // If it's short and generic, it might not need tools
  const req: CocoModelRequest = {
    tier: 'FAST',
    task_class: 'A_DETERMINISTIC',
    user_id: userId,
    conversation_id: conversationId,
    request_id: requestId,
    temperature: 0.1,
    max_tokens: 20,
    messages: [
      {
        role: 'system',
        content: `Classify the user's request into exactly one of these categories:
- A_DETERMINISTIC (e.g. "go to my projects", "open mail")
- B_RETRIEVAL (e.g. "what are the rules for banners?")
- C_GENERATION (e.g. "rewrite this paragraph", "hello")
- E_AGENTIC (e.g. "find developers and draft an email", "delete my project")
Reply with ONLY the exact string of the category.`
      },
      { role: 'user', content: userMessage }
    ]
  }

  try {
    const res = await executeModelRequest(req)
    const text = res.content.trim().toUpperCase()
    
    if (text.includes('A_DETERMINISTIC')) return 'A_DETERMINISTIC'
    if (text.includes('B_RETRIEVAL')) return 'B_RETRIEVAL'
    if (text.includes('E_AGENTIC')) return 'E_AGENTIC'
    
    return 'C_GENERATION'
  } catch (err) {
    // Default to Generation if classification fails
    return 'C_GENERATION'
  }
}