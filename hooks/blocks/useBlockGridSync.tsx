'use client'

import React from 'react'

export type GridSyncState = {
  cols: number
  headerRows: number
  bodyRows: number
}

export type BlockGridSyncContextType = {
  gridState: GridSyncState
  updateGrid: (newState: Partial<GridSyncState>) => void
  registerBlock: (blockId: string) => void
  unregisterBlock: (blockId: string) => void
  getBlockCount: () => number
}

const BlockGridSyncContext = React.createContext<BlockGridSyncContextType | null>(null)

export function BlockGridSyncProvider({ children }: { children: React.ReactNode }) {
  const [gridState, setGridState] = React.useState<GridSyncState>({
    cols: 4,
    headerRows: 1,
    bodyRows: 3
  })
  
  const [registeredBlocks, setRegisteredBlocks] = React.useState<Set<string>>(new Set())

  const updateGrid = React.useCallback((newState: Partial<GridSyncState>) => {
    setGridState(prev => ({ ...prev, ...newState }))
  }, [])

  const registerBlock = React.useCallback((blockId: string) => {
    setRegisteredBlocks(prev => new Set(prev).add(blockId))
  }, [])

  const unregisterBlock = React.useCallback((blockId: string) => {
    setRegisteredBlocks(prev => {
      const newSet = new Set(prev)
      newSet.delete(blockId)
      return newSet
    })
  }, [])

  const getBlockCount = React.useCallback(() => {
    return registeredBlocks.size
  }, [registeredBlocks])

  const contextValue = React.useMemo(() => ({
    gridState,
    updateGrid,
    registerBlock,
    unregisterBlock,
    getBlockCount
  }), [gridState, updateGrid, registerBlock, unregisterBlock, getBlockCount])

  return (
    <BlockGridSyncContext.Provider value={contextValue}>
      {children}
    </BlockGridSyncContext.Provider>
  )
}

export function useBlockGridSync(blockId?: string) {
  const context = React.useContext(BlockGridSyncContext)
  if (!context) {
    throw new Error('useBlockGridSync must be used within BlockGridSyncProvider')
  }

  React.useEffect(() => {
    if (blockId) {
      context.registerBlock(blockId)
      return () => context.unregisterBlock(blockId)
    }
  }, [blockId, context])

  return context
}

export function useDivisionLeafSync() {
  const { gridState, updateGrid } = useBlockGridSync()
  
  const updateLeafCount = React.useCallback((leafCount: number) => {
    if (leafCount !== gridState.cols) {
      updateGrid({ cols: leafCount })
    }
  }, [gridState.cols, updateGrid])

  return { 
    currentLeafCount: gridState.cols, 
    updateLeafCount 
  }
}

export function useGridColumnAdaptation() {
  const { gridState } = useBlockGridSync()
  
  return {
    adaptedCols: gridState.cols,
    adaptedHeaderRows: gridState.headerRows,
    adaptedBodyRows: gridState.bodyRows
  }
}
