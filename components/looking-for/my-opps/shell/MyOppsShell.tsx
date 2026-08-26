'use client'

import { MyOppsHeader } from './MyOppsHeader'
import { MyOppsSubNav } from './MyOppsSubNav'

export function MyOppsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <MyOppsHeader />
        <div className="mt-6">
          <MyOppsSubNav />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}