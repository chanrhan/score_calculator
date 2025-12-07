// /types/block-structure.ts
// 새로운 블록 구조 타입 정의 (리팩토링 문서 기반)

// Cell Element의 공통 속성
export interface CellElementBase {
  type: string
  optional: boolean // false이면 기본값으로 화면에서 숨겨짐
  visible: boolean  // 화면에 보여지는 여부
}

// Token Element
export interface TokenElement extends CellElementBase {
  type: 'Token'
  menu_key: string // token_menu 테이블의 key 참조
  value: string | null // 선택된 var 값
  // 파이프라인 변수 사용/저장 기능 플래그
  var_use?: boolean
  var_store?: boolean
}

// Text Element
export interface TextElement extends CellElementBase {
  type: 'Text'
  content: string // 텍스트 내용
}

// Table Element
export interface TableElement extends CellElementBase {
  type: 'Table'
  init_rows: number
  init_cols: number
  input_type: string
  input_option?: string // 옵션 (예: 'range')
  output_type: string
  value: any[][] // 테이블 값들
}

// Formula Element
export interface FormulaElement extends CellElementBase {
  type: 'Formula'
  menu_key: string
  value: string // DSL 수식
}

// InputField Element
export interface InputFieldElement extends CellElementBase {
  type: 'InputField'
  value: string // 자유 입력값
  inputType?: 'text' | 'number' // 입력 필드 타입 (기본값: 'text')
}

// SelectionInput Element (입력 + 토큰 선택)
export interface SelectionInputElement extends CellElementBase {
  type: 'SelectionInput'
  menu_key: string
  value: string
}

// OrderToken Element (두 개의 토큰을 한 셀에서 순서대로 선택)
export interface OrderTokenElement extends CellElementBase {
  type: 'OrderToken'
  menu_key: string
  menu_key2: string
  // 값은 리스트 형태를 유지. 인덱스 0 = 첫 번째 토큰, 1 = 두 번째 토큰
  value: (string | null)[]
}

// List Element
export interface ListElement extends CellElementBase {
  type: 'List'
  // 각 항목을 어떤 타입으로 렌더링할지 지정
  item_type: 'Token' | 'InputField' | 'Text' | 'Formula' | 'Table' | 'OrderToken'
  // Token 항목용으로 사용할 수 있는 메뉴 키(선택적)
  menu_key?: string
  menu_key2?: string
  // init_size?: number
  // 표시 및 저장 값 배열
  value: any[]
}

// ConditionChain Element
export type ConditionChainItemType =
  | { type: 'Token'; menu_key: string }
  | { type: 'Text'; content: string }
  | { type: 'InputField'; inputType?: 'text' | 'number' }
  | { type: 'Formula' }
  | { type: 'SelectionInput'; menu_key: string }

export interface ConditionChainElement extends CellElementBase {
  type: 'ConditionChain'
  // 각 요소(div 컨테이너) 내부에 가로로 나열할 셀 타입들
  item_type: ConditionChainItemType[]
  // 각 행(요소)의 값 배열. item_type와 동일한 길이, 인덱스 정렬
  value: any[][]
}

// 모든 Cell Element 타입의 유니온
export type CellElement = 
  | TokenElement
  | TextElement
  | TableElement
  | FormulaElement
  | InputFieldElement
  | SelectionInputElement
  | OrderTokenElement
  | ListElement
  | ConditionChainElement

// Cell 정의
export interface FlowCell {
  elements: CellElement[]
}

// Column 정의 (새로운 구조)
export interface FlowColumn {
  header: FlowCell
  rows: FlowCell[]
}

// 계층적 셀 구조 (구분 블록용)
export interface HierarchicalCell {
  elements: readonly CellElement[]
  children: readonly HierarchicalCell[]
}

// Block 정의
export interface FlowBlockType {
  name: string
  color?: string
  col_editable: boolean // 동적 열 추가/삭제 가능 여부
  cols?: FlowColumn[]   // 일반 블록용 열 구조
  header?: readonly CellElement[] // 구분 블록용 헤더
  children?: readonly HierarchicalCell[] // 구분 블록용 계층 구조
}


// 블록 인스턴스 (데이터)
export interface FlowBlock {
  block_id: number
  block_type: number
  header_cells: any[][]  // 각 헤더 셀의 values 배열
  body_cells: any[]  // 각 행의 각 셀의 values 배열
  col_types?: string[]   // 구분 블록의 열 타입 배열
}

// 미리 정의된 블록 타입들 (리팩토링 문서에서 가져옴)
export const BLOCK_TYPES = {
  ApplySubject: {
    name: 'ApplySubject',
    color: 'blue',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [
            { type: 'Text', optional: false, visible: true, content: '반영교과' },
            {
              type: 'Token',
              optional: false,
              visible: true,
              menu_key: 'include_exclude',
              value: 'include',
            },
          ],
        },
        rows: [
          {
            elements: [
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'subject_groups',
                value: null,
              },
            ],
          },
        ],
      },
    ],
  },

  ApplyTerm: {
    name: 'ApplyTerm',
    color: 'blue',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [
            { type: 'Text', optional: false, visible: true, content: '반영학기' },
            {
              type: 'Token',
              optional: false,
              visible: true,
              menu_key: 'include_exclude',
              value: 'include',
            },
          ],
        },
        rows: [
          {
            elements: [
              { type: 'Text', optional: false, visible: true, content: '학기 선택' },
              { type: 'Token', optional: false, visible: true, menu_key: 'term_1_1', value: '1-1:on' },
              { type: 'Token', optional: false, visible: true, menu_key: 'term_1_2', value: '1-2:on' },
              { type: 'Token', optional: false, visible: true, menu_key: 'term_2_1', value: '2-1:on' },
              { type: 'Token', optional: false, visible: true, menu_key: 'term_2_2', value: '2-2:on' },
              { type: 'Token', optional: false, visible: true, menu_key: 'term_3_1', value: '3-1:on' },
              { type: 'Token', optional: false, visible: true, menu_key: 'term_3_2', value: '3-2:on' },
              {
                type: 'Token',
                optional: true,
                visible: true,
                menu_key: 'top_terms',
                value: null,
              },
            ],
          },
        ],
      },
    ],
  },

  TopSubject: {
    name: 'TopSubject',
    color: 'blue',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '우수 N 과목' }]
        },
        rows: [
          {
            elements: [
              { type: 'Token', optional: true, visible: true, menu_key: 'top_subject_scope', value: 'overall' },
              { type: 'Token', optional: false, visible: true, menu_key: 'top_subject_count', value: '3' },
            ],
          },
        ],
      },
    ],
  },

  SubjectGroupRatio: {
    name: 'SubjectGroupRatio',
    color: 'blue',
    col_editable: true,
    cols: [
      {
        header: {
          elements: [
            { type: 'Token', optional: false, visible: true, menu_key: 'subject_groups', value: null }, // subjectGroup(DB 주입)
          ],
        },
        rows: [
          {
            elements: [
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'percentage_ratio',
                value: '100',
              },
            ],
          },
        ],
      },
    ],
  },

  SeparationRatio: {
    name: 'SeparationRatio',
    color: 'blue',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '일반교과' }]
        },
        rows: [
          {
            elements: [{ type: 'Token', optional: false, visible: true, menu_key: 'percentage_ratio', value: '100' }]
          },
        ],
      },
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '진로선택과목' }]
        },
        rows: [
          {
            elements: [{ type: 'Token', optional: false, visible: true, menu_key: 'percentage_ratio', value: '100' }]
          },
        ],
      },
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '예체능교과' }]
        },
        rows: [
          {
            elements: [{ type: 'Token', optional: false, visible: true, menu_key: 'percentage_ratio', value: '100' }]
          },
        ],
      },
    ],
  },

  GradeRatio: {
    name: 'GradeRatio',
    color: 'blue',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '1학년' }]
        },
        rows: [
          {
            elements: [{ type: 'Token', optional: false, visible: true, menu_key: 'percentage_ratio', value: '100' }]
          },
        ],
      },
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '2학년' }]
        },
        rows: [
          {
            elements: [{ type: 'Token', optional: false, visible: true, menu_key: 'percentage_ratio', value: '100' }]
          },
        ],
      },
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '3학년' }]
        },
        rows: [
          {
            elements: [{ type: 'Token', optional: false, visible: true, menu_key: 'percentage_ratio', value: '100' }]
          },
        ],
      },
    ],
  },

  ScoreMap: {
    name: 'ScoreMap',
    color: 'blue',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '배점표' }]
        },
        rows: [
          {
            elements: [
              { type: 'Token', optional: false, visible: true, menu_key: 'score_types', value: 'originalScore' },
              { type: 'Token', optional: false, visible: true, menu_key: 'match_types', value: 'range' },
              { type: 'Text', optional: false, visible: true, content: '→' },
              { type: 'Token', optional: false, visible: true, menu_key: 'score_types', value: 'score' },
              { type: 'Token', optional: false, visible: true, menu_key: 'match_types', value: 'exact' },
              {
                type: 'Table',
                optional: false,
                visible: true,
                init_rows: 2,
                init_cols: 3,
                input_type: '원점수',
                input_option: 'range',
                output_type: '배점',
                value: [[], []], // 1행 입력, 2행 출력
              },
            ],
          },
        ],
      },
    ],
  },

  Formula: {
    name: 'Formula',
    color: 'blue',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [
            { type: 'Text', optional: false, visible: true, content: '수식' },
            {
              type: 'Token',
              optional: false,
              visible: true,
              menu_key: 'variable_scope',
              value: '0', // 0: context, 1: subject
            },
          ],
        },
        rows: [
          {
            elements: [
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'score_types',
                value: 'finalScore', // scoreType
              },
              { type: 'Text', optional: false, visible: true, content: ' = ' },
              { type: 'Formula', optional: false, visible: true, value: '' }, // expr
            ],
          },
        ],
      },
    ],
  },

  Variable: {
    name: 'Variable',
    color: 'red',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '변수' }]
        },
        rows: [
          {
            elements: [
              { type: 'InputField', optional: false, visible: true, content: 'varName' }, // 변수명
              { type: 'Formula', optional: false, visible: true, value: '' },            // 저장할 DSL 값
            ],
          },
        ],
      },
    ],
  },

  Condition: {
    name: 'Condition',
    color: 'purple',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [
            { type: 'Text', optional: false, visible: true, content: '조건' },
            {
              type: 'Token',
              optional: false,
              visible: true,
              menu_key: 'variable_scope',
              value: '0', // 0: context, 1: subject
            },
          ],
        },
        rows: [
          {
            elements: [
              {
                type: 'ConditionChain',
                optional: false,
                visible: true,
                item_type: [
                  { type: 'Token', menu_key: 'score_types' },
                  { type: 'Token', menu_key: 'operators' },
                  { type: 'InputField' },
                ],
                value: [], // conditions: Array<Array<string>>
              },
            ],
          },
        ],
      },
    ],
  },

  Aggregation: {
    name: 'Aggregation',
    color: 'purple',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [
            { type: 'Text', optional: false, visible: true, content: '집계' },
            {
              type: 'Token',
              optional: false,
              visible: true,
              menu_key: 'variable_scope',
              value: '0', // 0: context, 1: subject
            },
          ],
        },
        rows: [
          {
            elements: [
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'score_types',
                value: 'finalScore', // inputType
              },
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'aggregation_functions',
                value: '0', // func: 0=이수단위 가중평균, 1=평균, 2=과목 개수, 3=합
              },
              { type: 'Text', optional: false, visible: true, content: '→' },
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'score_types',
                value: 'finalScore', // outputType
              },
            ],
          },
        ],
      },
    ],
  },

  Ratio: {
    name: 'Ratio',
    color: 'blue',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [{ type: 'Text', optional: false, visible: true, content: '반영비율' }]
        },
        rows: [
          {
            elements: [
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'percentage_ratio',
                value: '100', // ratio
              },
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'score_types',
                value: 'finalScore', // scoreType
              },
            ],
          },
        ],
      },
    ],
  },

  Decimal: {
    name: 'Decimal',
    color: 'blue',
    col_editable: false,
    cols: [
      {
        header: {
          elements: [
            { type: 'Text', optional: false, visible: true, content: '소수점 처리' },
            {
              type: 'Token',
              optional: false,
              visible: true,
              menu_key: 'variable_scope',
              value: '0', // 0: context, 1: subject
            },
          ],
        },
        rows: [
          {
            elements: [
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'score_types',
                value: 'finalScore', // scoreType
              },
              { type: 'Text', optional: false, visible: true, content: '소수점' },
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'decimal_places',
                value: '2', // decimalPlaces
              },
              { type: 'Text', optional: false, visible: true, content: '자리' },
              {
                type: 'Token',
                optional: false,
                visible: true,
                menu_key: 'decimal_options',
                value: '0', // option: 0=round, 1=ceil, 2=floor, 3=truncate
              },
            ],
          },
        ],
      },
    ],
  },
} as const

// 블록 타입에서 FlowBlockType으로 변환하는 유틸리티 함수
export function getBlockType(typeName: keyof typeof BLOCK_TYPES): FlowBlockType {
  return BLOCK_TYPES[typeName] as FlowBlockType
}