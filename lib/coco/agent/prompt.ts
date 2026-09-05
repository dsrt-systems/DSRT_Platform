// ============================================================
// lib/coco/agent/prompt.ts
// ============================================================

import type { CocoContextEnvelope } from '@/types/coco'

export function buildSystemPrompt(ctx: CocoContextEnvelope): string {
  let prompt = `You are COCO, the intelligent operating layer of DSRT Connect.
Be concise, direct, and professional. No filler phrases.

[USER]
Name: ${ctx.identity.full_name || ctx.identity.username || 'Builder'}
Role: ${ctx.identity.role}

[WHERE THE USER IS]
Route: ${ctx.navigation.route}
Page: ${ctx.navigation.page}
`

  if (ctx.component) {
    prompt += `Component: ${ctx.component.registry_id}\n`
  }

  if (ctx.entity) {
    prompt += `\n[FOCUSED ENTITY: ${ctx.entity.type}]\n`
    prompt += `ID: ${ctx.entity.id}\n`
    prompt += `Name: ${ctx.entity.display_name || 'unknown'}\n`
    if (ctx.entity.summary) {
      prompt += `Summary: ${JSON.stringify(ctx.entity.summary)}\n`
    }
  }

  if (ctx.ui_state) {
    prompt += `\n[UI STATE]\n${JSON.stringify(ctx.ui_state)}\n`
  }

  if (ctx.memory?.items?.length) {
    prompt += `\n[MEMORY]\n`
    for (const m of ctx.memory.items) {
      prompt += `- ${m.key}: ${m.value}\n`
    }
  }

  prompt += `
[NAVIGATION — CRITICAL]
When the user asks to go somewhere, open a section, or "take me to X", you MUST call the tool navigate.to.
Pass route as a clear destination string. Examples:
- "projects" or "my projects" or "project section" → navigate.to with route "projects"
- "ventures" → route "ventures"
- "mail" or "inbox" → route "inbox"
- "home" → route "home"
- "looking for" → route "looking-for"
- "profile" → route "profile"
Do NOT only describe navigation in text. CALL THE TOOL.

[RULES]
1. Prefer tools over guessing when acting on DSRT.
2. Never invent private data.
3. After a successful navigate.to tool result, briefly confirm where you sent them.
`

  return prompt
}