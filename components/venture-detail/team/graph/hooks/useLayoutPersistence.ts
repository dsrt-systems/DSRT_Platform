'use client'

import { useCallback, useRef } from 'react'
import type { Node } from '@xyflow/react'

export function useLayoutPersistence(slug: string) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const saveLayout = useCallback(
    (nodes: Node[], immediate = false) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      const persist = async () => {
        const layouts = nodes.map(n => ({
          position_id: n.id,
          x: n.position.x,
          y: n.position.y,
        }))

        try {
          await fetch(`/api/ventures/${slug}/team/layout`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layouts })
          })
        } catch (e) {
          console.error('Layout persistence failed:', e)
        }
      }

      if (immediate) {
        persist()
      } else {
        timeoutRef.current = setTimeout(persist, 1000)
      }
    },
    [slug]
  )

  return { saveLayout }
}