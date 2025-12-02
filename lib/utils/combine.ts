// /lib/utils/combine.ts
// 블록 결합 규칙 유틸리티

import type { BlockKind } from '@/types/domain'

/**
 * From → To 결합 가능 여부 판단
 * 규칙:
 * - Division → (직접 결합 불가; Division은 케이스 내부 우측 체인에서만 동작)
 * - Function → Function | Condition | Aggregation | Finalize
 * - Condition → Function | Condition | Aggregation | Variable | Finalize
 * - Aggregation → Condition | Variable | Finalize
 * - Variable → (끝)
 * - Finalize → (끝)
 */
export function canCombine(fromKind: BlockKind, toKind: BlockKind): boolean {
  if (fromKind === 'division') return false
  if (fromKind === 'function') {
    return toKind === 'function' || toKind === 'condition' || toKind === 'aggregation' || toKind === 'finalize'
  }
  if (fromKind === 'condition') {
    return (
      toKind === 'function' ||
      toKind === 'condition' ||
      toKind === 'aggregation' ||
      toKind === 'variable' ||
      toKind === 'finalize'
    )
  }
  if (fromKind === 'aggregation') {
    return toKind === 'condition' || toKind === 'variable' || toKind === 'finalize'
  }
  if (fromKind === 'variable') return false
  if (fromKind === 'finalize') return false
  return false
}

export type SnapSide = 'left' | 'right'

/**
 * 좌/우 절반 별 허용 여부 계산
 * - left: from → to
 * - right: to → from (오른쪽에 꽂으면 to 뒤에 from이 오므로 흐름은 to→from)
 */
export function computeSideAllowance(
  fromKind: BlockKind,
  toKind: BlockKind
): { allowLeft: boolean; allowRight: boolean } {
  return {
    allowLeft: canCombine(fromKind, toKind),
    allowRight: canCombine(toKind, fromKind),
  }
}


