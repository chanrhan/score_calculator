// utils/blockToDbConverter.ts
// FlowBlock 데이터를 Prisma 스키마 형식으로 변환하는 유틸리티

import { FlowBlock, FlowCell, CellElement } from '@/types/block-structure'
import { BLOCK_TYPE } from '@/types/block-types'

// Prisma 스키마 타입 정의
export interface DbBlockData {
  // blocks 테이블
  block: {
    id?: number // auto-increment
    component_id: number
    name: string
    kind: string
    in_type: string
    out_type: string
    position_in_component: number
    is_in_case: boolean
  }
  
  // 특화 블록 테이블들
  division_block?: {
    block_id: number
    spec_json: any
    skip_policy: string
    division_cases: {
      case_key: string
      criteria_json: any
      is_implicit: boolean
      position_in_div: number
    }[]
  }
  
  function_block?: {
    block_id: number
    case_id: number
    func_type: string
    params_json: any
  }
  
  condition_block?: {
    block_id: number
    expr_dsl: string
    has_else: boolean
  }
  
  aggregation_block?: {
    block_id: number
    agg_fn: string
    target_expr: string
    filter_expr?: string
    output_name?: string
  }
  
  variable_block?: {
    block_id: number
    var_name: string
    scope: string
    overwrite_policy: string
  }
}

// Cell의 모든 elements에서 설정값 추출 (기존 방식 - 디버깅용)
// 현재 FlowBlock 구조와 맞지 않아 주석 처리
/*
function extractCellValues(cells: FlowCell[][]): Record<string, any> {
  const values: Record<string, any> = {}
  
  cells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      cell.elements.forEach((element, elementIndex) => {
        const key = `row${rowIndex}_col${colIndex}_elem${elementIndex}`
        
        switch (element.element_type) {
          case 'Token':
            values[`${key}_token`] = {
              type: 'Token',
              items: element.items,
              value: element.value,
              visible: element.visible,
              optional: element.optional
            }
            break
            
          case 'Text':
            values[`${key}_text`] = {
              type: 'Text',
              content: element.content,
              visible: element.visible,
              optional: element.optional
            }
            break
            
          case 'Formula':
            values[`${key}_formula`] = {
              type: 'Formula',
              value: element.value,
              visible: element.visible,
              optional: element.optional
            }
            break
            
          case 'InputField':
            values[`${key}_input`] = {
              type: 'InputField',
              content: element.content,
              visible: element.visible,
              optional: element.optional
            }
            break
            
          case 'Table':
            values[`${key}_table`] = {
              type: 'Table',
              init_rows: element.init_rows,
              init_cols: element.init_cols,
              input_type: element.input_type,
              input_option: element.input_option,
              output_type: element.output_type,
              value: element.value,
              visible: element.visible,
              optional: element.optional
            }
            break
        }
      })
    })
  })
  
  return values
}
*/

// 현재 FlowBlock 구조와 맞지 않아 주석 처리
/*
// ApplySubject 블록 params_json 추출
function extractApplySubjectParams(block: FlowBlock): any {
  const headerTokens = block.type.headers[0]?.[0]?.elements?.filter(e => e.element_type === 'Token') as any[]
  const bodyTokens = block.type.body[0]?.[0]?.elements?.filter(e => e.element_type === 'Token') as any[]
  
  return {
    operation: headerTokens?.[0]?.value || 'include', // 포함/제외
    subject_groups: bodyTokens?.[0]?.items || [] // DB에서 주입된 교과군 목록
  }
}

// ApplyTerm 블록 params_json 추출
function extractApplyTermParams(block: FlowBlock): any {
  const headerTokens = block.type.headers[0]?.[0]?.elements?.filter(e => e.element_type === 'Token') as any[]
  const bodyElements = block.type.body[0]?.[0]?.elements || []
  
  const result: any = {
    operation: headerTokens?.[0]?.value || 'include'
  }
  
  // 학기별 ON/OFF 설정 (1-1 ~ 3-2)
  const terms: Record<string, string> = {}
  const termTokens = bodyElements.filter(e => e.element_type === 'Token') as any[]
  
  termTokens.forEach((token) => {
    const value = token.value
    if (value && value.includes(':')) {
      const [term, status] = value.split(':')
      terms[term] = status
    }
  })
  
  result.terms = terms
  
  // 우수 N학기 설정 (optional)
  const topTermToken = termTokens.find((token: any) => 
    token.optional === true && token.value && token.value.includes('top:')
  )
  if (topTermToken) {
    result.top_terms = topTermToken.value.split(':')[1]
  }
  
  return result
}

// TopSubject 블록 params_json 추출
function extractTopSubjectParams(block: FlowBlock): any {
  const bodyElements = block.type.body[0]?.[0]?.elements || []
  const tokens = bodyElements.filter(e => e.element_type === 'Token') as any[]
  
  return {
    scope: tokens.find(t => t.optional === true)?.value || 'overall', // 전체/교과군별
    count: tokens.find(t => t.optional === false)?.value || '3' // 우수 과목 개수
  }
}

// SubjectGroupRatio 블록 params_json 추출 (동적 열)
function extractSubjectGroupRatioParams(block: FlowBlock): any {
  const ratios: any[] = []
  const headers = block.type.headers[0] || []
  const bodyRow = block.type.body[0] || []
  
  headers.forEach((headerCell, colIndex) => {
    const headerToken = headerCell.elements?.find(e => e.element_type === 'Token') as any
    const bodyToken = bodyRow[colIndex]?.elements?.find(e => e.element_type === 'Token') as any
    
    if (headerToken && bodyToken) {
      ratios.push({
        subject_group: headerToken.value || headerToken.items?.[0]?.var,
        ratio: bodyToken.value || '100'
      })
    }
  })
  
  return { ratios }
}

// SeparationRatio 블록 params_json 추출
function extractSeparationRatioParams(block: FlowBlock): any {
  const bodyRow = block.type.body[0] || []
  
  return {
    general_ratio: bodyRow[0]?.elements?.find(e => e.element_type === 'Token')?.value || '100',
    career_ratio: bodyRow[1]?.elements?.find(e => e.element_type === 'Token')?.value || '100', 
    arts_ratio: bodyRow[2]?.elements?.find(e => e.element_type === 'Token')?.value || '100'
  }
}

// GradeRatio 블록 params_json 추출
function extractGradeRatioParams(block: FlowBlock): any {
  const bodyRow = block.type.body[0] || []
  
  return {
    grade1_ratio: bodyRow[0]?.elements?.find(e => e.element_type === 'Token')?.value || '100',
    grade2_ratio: bodyRow[1]?.elements?.find(e => e.element_type === 'Token')?.value || '100',
    grade3_ratio: bodyRow[2]?.elements?.find(e => e.element_type === 'Token')?.value || '100'
  }
}

// ScoreMap 블록 params_json 추출
function extractScoreMapParams(block: FlowBlock): any {
  const bodyElements = block.type.body[0]?.[0]?.elements || []
  const tokens = bodyElements.filter(e => e.element_type === 'Token') as any[]
  const tableElement = bodyElements.find(e => e.element_type === 'Table') as any
  
  return {
    input: {
      type: tokens[0]?.value || 'originalScore',
      match_type: tokens[1]?.value || 'range'
    },
    output: {
      type: tokens[2]?.value || 'score',
      match_type: tokens[3]?.value || 'exact'
    },
    mapping_table: {
      rows: tableElement?.init_rows || 2,
      cols: tableElement?.init_cols || 3,
      input_type: tableElement?.input_type || '원점수',
      input_option: tableElement?.input_option || 'range',
      output_type: tableElement?.output_type || '배점',
      values: tableElement?.value || [[], []]
    }
  }
}
*/

// Division 블록 params_json 추출 (현재 FlowBlock 구조와 맞지 않아 주석 처리)
/*
function extractDivisionParams(block: FlowBlock): any {
  
  // 현재 FlowBlock 구조: header_cells, body_cells
  const headerCells = block.header_cells || []
  const bodyCells = block.body_cells || []
  
  if (headerCells.length === 0) {
    return {
      division_type: 'gender',
      cases: [],
      headers: []
    }
  }
  
  // 헤더에서 첫 번째 셀의 값들을 추출
  const headers = headerCells.map((headerCell, index) => ({
    value: headerCell?.[0] || '',
    visible: true,
    menu_key: 'division_criteria',
    optional: false,
    element_type: 'Token'
  }))
  
  const divisionType = headers[0]?.value || 'gender'
  
  // body에서 동적으로 추가된 케이스들 추출
  const cases: any[] = []
  const bodyColumns = bodyCells[0] || []
  
  bodyColumns.forEach((cell, colIndex) => {
    // body_cells는 any[][][] 구조이므로 첫 번째 값 사용
    const cellValue = cell?.[0] || ''
    if (cellValue) {
      cases.push({
        case_key: cellValue,
        case_name: cellValue,
        criteria: `${divisionType} = '${cellValue}'`
      })
    }
  })
  
  return {
    division_type: divisionType,
    headers: headers,
    cases: cases.length > 0 ? cases : [{
      case_key: 'default',
      case_name: '기본',
      criteria: 'true'
    }]
  }
}
*/

// 기존 Division 블록의 cases 생성 함수 (이제 extractDivisionParams로 대체됨)
// function createDivisionCases는 더 이상 사용하지 않음

// 블록 타입 번호를 이름으로 변환
function getBlockTypeName(blockType: number): string {
  switch (blockType) {
    case BLOCK_TYPE.DIVISION: return 'Division'
    case BLOCK_TYPE.APPLY_SUBJECT: return 'ApplySubject'
    case BLOCK_TYPE.GRADE_RATIO: return 'GradeRatio'
    case BLOCK_TYPE.APPLY_TERM: return 'ApplyTerm'
    case BLOCK_TYPE.TOP_SUBJECT: return 'TopSubject'
    case BLOCK_TYPE.SUBJECT_GROUP_RATIO: return 'SubjectGroupRatio'
    case BLOCK_TYPE.SEPARATION_RATIO: return 'SeparationRatio'
    case BLOCK_TYPE.SCORE_MAP: return 'ScoreMap'
    case BLOCK_TYPE.FORMULA: return 'Formula'
    case BLOCK_TYPE.VARIABLE: return 'Variable'
    case BLOCK_TYPE.CONDITION: return 'Condition'
    default: return 'Unknown'
  }
}

// FlowBlock을 DB 형식으로 변환 (실제 DB 구조에 맞게)
export function convertFlowBlockToDb(
  block: FlowBlock, 
  componentId: number = 1, 
  positionInComponent: number = 0
): any {
  
  // 실제 DB block 테이블 구조에 맞게 변환
  // componentGridDb.ts의 저장 로직과 동일하게 구성
  return {
    pipeline_id: BigInt(1), // 실제로는 파이프라인 ID를 받아야 함
    component_id: componentId,
    block_id: block.block_id,
    order: positionInComponent,
    block_type: block.block_type,
    header_cells: block.header_cells, // JSON으로 그대로 저장
    body_cells: block.body_cells,     // JSON으로 그대로 저장
    created_at: new Date()
  }
}

// 여러 블록을 일괄 변환
export function convertFlowBlocksToDb(
  blocks: FlowBlock[], 
  componentId: number = 1
): DbBlockData[] {
  return blocks.map((block, index) => 
    convertFlowBlockToDb(block, componentId, index)
  )
}

// 디버깅용 JSON 출력 함수
export function logBlockAsDbFormat(block: FlowBlock, componentId: number = 1, positionInComponent: number = 0): void {
  const dbData = convertFlowBlockToDb(block, componentId, positionInComponent)
  console.log('DB 삽입 데이터:', JSON.stringify(dbData, null, 2))
}

// 예시 블록 데이터들
export const exampleBlocks = {
  // Division 블록 예시
  division: {
    block_id: 1,
    block_type: 1, // BLOCK_TYPE.DIVISION
    header_cells: [
      ["성별"], // 첫 번째 헤더 셀
      ["지역"]  // 두 번째 헤더 셀
    ],
    body_cells: [
      [
        ["남", "여"], // 첫 번째 행: 성별 옵션들
        ["서울", "경기", "인천"] // 두 번째 행: 지역 옵션들
      ]
    ],
    col_types: ["gender", "region"]
  },

  // ApplySubject 블록 예시
  applySubject: {
    block_id: 2,
    block_type: 2, // BLOCK_TYPE.APPLY_SUBJECT
    header_cells: [
      ["포함교과군"]
    ],
    body_cells: [
      [
        ["국어", "수학", "영어"] // 포함할 교과군들
      ]
    ]
  },

  // GradeRatio 블록 예시
  gradeRatio: {
    block_id: 3,
    block_type: 3, // BLOCK_TYPE.GRADE_RATIO
    header_cells: [
      ["1학년", "2학년", "3학년"]
    ],
    body_cells: [
      [
        ["30", "30", "40"] // 각 학년별 반영비율
      ]
    ]
  },

  // ScoreMap 블록 예시
  scoreMap: {
    block_id: 4,
    block_type: 8, // BLOCK_TYPE.SCORE_MAP
    header_cells: [
      ["원점수", "배점"]
    ],
    body_cells: [
      [
        ["90-100", "100"], // 첫 번째 행
        ["80-89", "90"],   // 두 번째 행
        ["70-79", "80"]    // 세 번째 행
      ]
    ]
  }
}