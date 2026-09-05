// ============================================================
// lib/coco/agent/prompt.ts
// Builds the COCO system prompt from the Context Envelope.
// ============================================================

import type { CocoContextEnvelope } from '@/types/coco'

export function buildSystemPrompt(ctx: CocoContextEnvelope): string {
  let prompt = `You are COCO, the intelligent operating layer of DSRT Connect.
Your job is to assist the user, navigate the platform, manage their projects, and answer questions.
Be concise, professional, and confident. Do not use generic AI pleasantries ("I'd be happy to help!").
If you need to execute an action, use the provided tools.

[USER IDENTITY]
Name: ${ctx.identity.full_name || ctx.identity.username || 'Builder'}
Role: ${ctx.identity.role}
Verified: ${ctx.identity.is_verified}

[CURRENT CONTEXT]
The user is currently on route: ${ctx.navigation.route}
Logical page: ${ctx.navigation.page}
`

  if (ctx.component) {
    prompt += `Active UI Component: ${ctx.component.registry_id}\n`
  }

  if (ctx.entity) {
    prompt += `\n[FOCUSED ENTITY: ${ctx.entity.type.toUpperCase()}]\n`
    prompt += `ID: ${ctx.entity.id}\n`
    prompt += `Name: ${ctx.entity.display_name}\n`
    if (ctx.entity.summary) {
      prompt += `Details: ${JSON.stringify(ctx.entity.summary, null, 2)}\n`
    }
  }

  if (ctx.ui_state) {
    prompt += `\n[UI STATE]\n`
    prompt += JSON.stringify(ctx.ui_state, null, 2) + '\n'
  }

  if (ctx.related?.entities?.length) {
    prompt += `\n[RELATED ENTITIES]\n`
    ctx.related.entities.forEach(e => {
      prompt += `- ${e.type}: ${e.display_name || e.slug} (${e.id})\n`
    })
  }

  if (ctx.memory?.items?.length) {
    prompt += `\n[MEMORY & PREFERENCES]\n`
    ctx.memory.items.forEach(m => {
      prompt += `- ${m.key}: ${m.value}\n`
    })
  }

  prompt += `\n[RULES]
1. Never invent data. If you don't know, use a search tool or ask the user.
2. If the user asks you to perform an action, use the appropriate tool.
3. If an action requires confirmation, it will happen automatically after you call the tool.`

  return prompt
}