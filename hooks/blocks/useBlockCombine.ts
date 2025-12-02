'use client'

import { useState, useCallback } from 'react'

export type CombineState = {
  isCombineMode: boolean
  sourceBlockId: string | null
  targetBlockId: string | null
}

export function useBlockCombine() {
  const [combineState, setCombineState] = useState<CombineState>({
    isCombineMode: false,
    sourceBlockId: null,
    targetBlockId: null,
  })

  const startCombine = useCallback((blockId: string) => {
    setCombineState({
      isCombineMode: true,
      sourceBlockId: blockId,
      targetBlockId: null,
    })
  }, [])

  const selectTarget = useCallback((blockId: string) => {
    setCombineState(prev => ({
      ...prev,
      targetBlockId: blockId,
    }))
  }, [])

  const executeCombine = useCallback(() => {
    const { sourceBlockId, targetBlockId } = combineState
    if (sourceBlockId && targetBlockId && sourceBlockId !== targetBlockId) {
      // 여기서 실제 결합 로직을 실행
      
      // 결합 완료 후 상태 초기화
      setCombineState({
        isCombineMode: false,
        sourceBlockId: null,
        targetBlockId: null,
      })
      
      return { sourceBlockId, targetBlockId }
    }
    return null
  }, [combineState])

  const cancelCombine = useCallback(() => {
    setCombineState({
      isCombineMode: false,
      sourceBlockId: null,
      targetBlockId: null,
    })
  }, [])

  const handleBlockClick = useCallback((blockId: string) => {
    if (!combineState.isCombineMode) {
      // 결합 모드가 아닌 경우 결합 시작
      startCombine(blockId)
      return
    }

    if (combineState.sourceBlockId === blockId) {
      // 같은 블록을 다시 클릭하면 취소
      cancelCombine()
    } else {
      // 다른 블록을 클릭하면 타겟으로 설정하고 결합 실행
      selectTarget(blockId)
      executeCombine()
    }
  }, [combineState, startCombine, selectTarget, executeCombine, cancelCombine])

  return {
    combineState,
    startCombine,
    selectTarget,
    executeCombine,
    cancelCombine,
    handleBlockClick,
  }
}
