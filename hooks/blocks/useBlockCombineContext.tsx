'use client'

import * as React from 'react'
import { useBlockCombine, type CombineState } from './useBlockCombine'

type BlockCombineContextType = {
  combineState: CombineState
  startCombine: (blockId: string) => void
  cancelCombine: () => void
  handleBlockClick: (blockId: string) => void
}

const BlockCombineContext = React.createContext<BlockCombineContextType | null>(null)

export function BlockCombineProvider({ children }: { children: React.ReactNode }) {
  const blockCombine = useBlockCombine()
  
  return (
    <BlockCombineContext.Provider value={blockCombine}>
      {children}
    </BlockCombineContext.Provider>
  )
}

export function useBlockCombineContext() {
  const context = React.useContext(BlockCombineContext)
  if (!context) {
    throw new Error('useBlockCombineContext must be used within BlockCombineProvider')
  }
  return context
}
