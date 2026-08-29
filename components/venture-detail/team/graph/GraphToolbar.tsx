'use client'

import {
  ArrowsClockwise, ArrowsOutSimple, ArrowsInSimple,
  ArrowCounterClockwise, ArrowClockwise, MagnifyingGlass,
  TreeStructure, ArrowsHorizontal, Compass
} from '@phosphor-icons/react'
import type { LayoutMode } from './hooks/useAutoLayout'

interface Props {
  isOwner: boolean
  fullscreen: boolean
  onToggleFullscreen: () => void
  onAutoLayout: (mode: LayoutMode) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onFitView: () => void
}

export function GraphToolbar({
  isOwner, fullscreen, onToggleFullscreen,
  onAutoLayout, onUndo, onRedo, canUndo, canRedo, onFitView
}: Props) {
  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
      {/* Undo/Redo */}
      {isOwner && (
        <div className="flex items-center bg-[#121215]/90 backdrop-blur border border-white/[0.08] rounded-lg overflow-hidden shadow-lg">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={
              'p-2 transition-colors ' +
              (canUndo
                ? 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                : 'text-zinc-700 cursor-not-allowed')
            }
            title="Undo"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
          </button>
          <div className="w-px h-5 bg-white/[0.06]" />
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={
              'p-2 transition-colors ' +
              (canRedo
                ? 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                : 'text-zinc-700 cursor-not-allowed')
            }
            title="Redo"
          >
            <ArrowClockwise size={13} weight="bold" />
          </button>
        </div>
      )}

      {/* Auto-layout dropdown */}
      {isOwner && (
        <div className="relative group">
          <button
            className="flex items-center gap-1.5 bg-[#121215]/90 backdrop-blur border border-white/[0.08] text-[11.5px] font-semibold text-zinc-300 hover:text-white px-3 h-8 rounded-lg shadow-lg transition-colors"
            title="Auto-arrange"
          >
            <ArrowsClockwise size={13} />
            Auto Layout
          </button>

          <div className="absolute right-0 top-full mt-1 w-48 bg-[#121215] border border-white/[0.08] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1">
            <button
              onClick={() => onAutoLayout('hierarchy')}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-300 hover:text-white hover:bg-white/[0.04] text-left transition-colors"
            >
              <TreeStructure size={13} />
              Hierarchy
            </button>
            <button
              onClick={() => onAutoLayout('horizontal')}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-300 hover:text-white hover:bg-white/[0.04] text-left transition-colors"
            >
              <ArrowsHorizontal size={13} />
              Horizontal
            </button>
            <button
              onClick={() => onAutoLayout('radial')}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-300 hover:text-white hover:bg-white/[0.04] text-left transition-colors"
            >
              <Compass size={13} />
              Radial
            </button>
          </div>
        </div>
      )}

      {/* Fit view */}
      <button
        onClick={onFitView}
        className="bg-[#121215]/90 backdrop-blur border border-white/[0.08] text-zinc-300 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
        title="Fit to view"
      >
        <MagnifyingGlass size={13} weight="bold" />
      </button>

      {/* Fullscreen */}
      <button
        onClick={onToggleFullscreen}
        className="bg-[#121215]/90 backdrop-blur border border-white/[0.08] text-zinc-300 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
        title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {fullscreen ? <ArrowsInSimple size={13} weight="bold" /> : <ArrowsOutSimple size={13} weight="bold" />}
      </button>
    </div>
  )
}