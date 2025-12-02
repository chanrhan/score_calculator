'use client'

import * as React from 'react'
import type { BlockKind } from '@/types/domain'

export type CellType = 'text' | 'number' | 'select' | 'tokens' | 'dsl' | 'ratio' | 'readonly'

export type CellSchema<T = any> = {
  id: string
  type: CellType
  placeholder?: string
  options?: string[]
  minWidth?: number
  minHeight?: number
  validate?: (v: T) => string | null
}

export type BlockSchema = {
  kind: BlockKind
  title: string
  rows: number
  cols: number
  cells: CellSchema[]
}

// 간단 캐시 및 확장 포인트. 실제 스키마는 도메인 정의에 맞춰 구성 가능
const schemaCache = new Map<BlockKind, BlockSchema>()

export function useBlockSchema(kind: BlockKind) {
  const [schema, setSchema] = React.useState<BlockSchema | null>(() => schemaCache.get(kind) ?? null)

  React.useEffect(() => {
    if (schemaCache.has(kind)) {
      setSchema(schemaCache.get(kind)!)
      return
    }
    // 기본 스키마 프리셋(초기 버전). 추후 domain/data/schemas.ts 연계로 대체 가능
    let built: BlockSchema
    switch (kind) {
      case 'division':
        built = {
          kind,
          title: '구분',
          rows: 3,
          cols: 4,
          cells: Array.from({ length: 3 * 4 }, (_, i) => ({ id: `c${i}`, type: 'text' })),
        }
        break
      case 'function':
        built = {
          kind,
          title: '함수',
          rows: 2,
          cols: 2,
          cells: Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, type: 'text' })),
        }
        break
      case 'condition':
        built = {
          kind,
          title: '조건',
          rows: 1,
          cols: 2,
          cells: [
            { id: 'expr', type: 'dsl', placeholder: 'expr' },
            { id: 'note', type: 'text', placeholder: 'note' },
          ],
        }
        break
      case 'aggregation':
        built = {
          kind,
          title: '집계',
          rows: 2,
          cols: 2,
          cells: Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, type: 'text' })),
        }
        break
      case 'variable':
        built = {
          kind,
          title: '변수',
          rows: 1,
          cols: 2,
          cells: [
            { id: 'name', type: 'text', placeholder: 'name' },
            { id: 'scope', type: 'select', options: ['component', 'pipeline'] },
          ],
        }
        break
      case 'finalize':
        built = {
          kind,
          title: '마무리',
          rows: 1,
          cols: 1,
          cells: [{ id: 'mode', type: 'select', options: ['snapshot', 'terminate'] }],
        }
        break
      default:
        built = { kind, title: '블록', rows: 1, cols: 1, cells: [{ id: 'c0', type: 'text' }] }
    }
    schemaCache.set(kind, built)
    setSchema(built)
  }, [kind])

  return schema
}


