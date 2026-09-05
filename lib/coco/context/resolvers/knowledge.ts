// ============================================================
// lib/coco/context/resolvers/knowledge.ts
// L6 — Retrieved knowledge (RAG).
// STUB for v0.1. Wired for Phase 9 when Qdrant/embeddings arrive.
// ============================================================

import type { KnowledgeContext } from '@/types/coco'

export async function resolveKnowledge(
  _query: string,
  _entityType?: string
): Promise<KnowledgeContext | undefined> {
  // v0.1: no external knowledge base wired yet.
  // When Phase 9 lands, this will:
  //   1. Embed the query using the model gateway
  //   2. Query Qdrant / pgvector for top-K snippets
  //   3. Return them with source + trust='retrieved'
  return undefined
}