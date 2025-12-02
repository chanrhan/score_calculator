import type { FlowBlock, FlowCell } from '@/types/block-structure'
import { calculateBlockWidth } from '@/lib/grid/GridCalculator'
import { addColumnToBlock } from '@/lib/utils/blockColumnUtils'

// 바디 셀 기본값 생성: blockColumnUtils.ts의 createDefaultBodyCell과 동일한 정책을 따르기 위해
// 여기서는 block.type.name만으로 최소 기본 셀 구조를 구성한다.
function createDefaultBodyCell(block: FlowBlock): FlowCell {
  // 가장 단순한 기본 요소: Text 비어있는 셀
  return {
    elements: [
      {
        element_type: 'Text',
        optional: false,
        visible: true,
        content: '',
      } as any,
    ],
  }
}

function createDefaultBodyRow(block: FlowBlock): FlowCell[] {
  // 가능하면 블록의 첫 번째 바디 행을 프로토타입으로 사용하여 타입 맞는 셀을 채운다
  const prototypeRow = Array.isArray(block.type.body) && block.type.body.length > 0
    ? block.type.body[0]
    : null
  if (prototypeRow && prototypeRow.length > 0) {
    return JSON.parse(JSON.stringify(prototypeRow))
  }
  // 프로토타입이 없으면 열 수 기반으로 기본 텍스트 셀 생성
  const cols = Math.max(1, calculateBlockWidth(block))
  const row: FlowCell[] = []
  for (let i = 0; i < cols; i++) {
    row.push(createDefaultBodyCell(block))
  }
  return row
}

export function insertRowInBlockAt(block: FlowBlock, rowIndex: number): FlowBlock {
  const copy: FlowBlock = JSON.parse(JSON.stringify(block))

  // 현재 열 수를 헤더/바디 기준으로 계산
  const cols = Math.max(1, calculateBlockWidth(copy))

  // body가 비어 있으면 최소 1행 보장
  if (!Array.isArray(copy.type.body) || copy.type.body.length === 0) {
    copy.type.body = [createDefaultBodyRow(copy)]
  }

  // rowIndex 이전의 행이 부족하면 기본 행으로 패딩
  while (copy.type.body.length < rowIndex) {
    copy.type.body.push(createDefaultBodyRow(copy))
  }

  // 정확한 위치에 새 행 삽입
  copy.type.body.splice(rowIndex, 0, createDefaultBodyRow(copy))

  // 열 수 불일치가 있다면 맞춰준다
  copy.type.body = copy.type.body.map((row) => {
    if (row.length === cols) return row
    const filled = [...row]
    while (filled.length < cols) filled.push(createDefaultBodyCell(copy))
    if (filled.length > cols) filled.length = cols
    return filled
  })

  return copy
}

export function insertGlobalRowAcrossBlocks(blocks: FlowBlock[], rowIndex: number): FlowBlock[] {
  return blocks.map((b) => insertRowInBlockAt(b, rowIndex))
}


