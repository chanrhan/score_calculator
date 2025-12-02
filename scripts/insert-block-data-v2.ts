import { PrismaClient } from '@prisma/client'
import { BLOCK_TYPES } from '../types/block-structure'

const prisma = new PrismaClient()

// block-structure.ts의 BLOCK_TYPES를 기반으로 한 블록 데이터
const blockDataConfigs = [
  {
    block_type: 'division',
    block_name: '구분 블록',
    data: {
      skipPolicy: 'skip_empty_case',
      spec: {
        rows: [
          { type: 'default', values: ['기본'] }, // Header 행
          { type: 'body', values: [''] }        // Body 행 (최소 1개)
        ]
      },
      cases: []
    }
  },
  {
    block_type: 'function',
    block_name: '함수 블록',
    data: {
      caseId: 0,
      funcType: 'apply_subject',
      params: {
        mode: 'include',
        groups: [],
        organizationNames: []
      }
    }
  },
  {
    block_type: 'condition',
    block_name: '조건 블록',
    data: {
      expr: 'true',
      thenChain: []
    }
  },
  {
    block_type: 'aggregation',
    block_name: '집계 블록',
    data: {
      agg: 'AVG',
      target: 'subject.score.final'
    }
  },
  {
    block_type: 'variable',
    block_name: '변수 블록',
    data: {
      name: 'var1',
      scope: 'pipeline',
      overwrite: 'allow'
    }
  },
  {
    block_type: 'finalize',
    block_name: '완료 블록',
    data: {
      mode: 'snapshot'
    }
  }
]

// block-structure.ts의 BLOCK_TYPES를 기반으로 한 상세 블록 데이터
const detailedBlockConfigs = [
  {
    block_type: 'ApplySubject',
    block_name: '반영교과',
    data: {
      name: 'ApplySubject',
      color: 'blue',
      col_editable: false,
      headers: [
        [
          {
            elements: [
              { element_type: 'Text', optional: false, visible: true, content: '반영교과' },
              {
                element_type: 'Token',
                optional: false,
                visible: true,
                items: [
                  { name: '포함', var: 'include' },
                  { name: '제외', var: 'exclude' },
                ],
                value: 'include',
              },
            ],
          },
        ],
      ],
      body: [
        [
          {
            elements: [
              {
                element_type: 'Token',
                optional: false,
                visible: true,
                items: [], // subjectGroup 목록(DB 주입)
                value: null,
              },
            ],
          },
        ],
      ],
    }
  },
  {
    block_type: 'ApplyTerm',
    block_name: '반영학기',
    data: {
      name: 'ApplyTerm',
      color: 'blue',
      col_editable: false,
      headers: [
        [
          {
            elements: [
              { element_type: 'Text', optional: false, visible: true, content: '반영학기' },
              {
                element_type: 'Token',
                optional: false,
                visible: true,
                items: [
                  { name: '포함', var: 'include' },
                  { name: '제외', var: 'exclude' },
                ],
                value: 'include',
              },
            ],
          },
        ],
      ],
      body: [
        [
          {
            elements: [
              { element_type: 'Text', optional: false, visible: true, content: '학기 선택' },
              { element_type: 'Token', optional: false, visible: true, items: [{ name: '1-1 ON', var: '1-1:on' }, { name: '1-1 OFF', var: '1-1:off' }], value: '1-1:on' },
              { element_type: 'Token', optional: false, visible: true, items: [{ name: '1-2 ON', var: '1-2:on' }, { name: '1-2 OFF', var: '1-2:off' }], value: '1-2:on' },
              { element_type: 'Token', optional: false, visible: true, items: [{ name: '2-1 ON', var: '2-1:on' }, { name: '2-1 OFF', var: '2-1:off' }], value: '2-1:on' },
              { element_type: 'Token', optional: false, visible: true, items: [{ name: '2-2 ON', var: '2-2:on' }, { name: '2-2 OFF', var: '2-2:off' }], value: '2-2:on' },
              { element_type: 'Token', optional: false, visible: true, items: [{ name: '3-1 ON', var: '3-1:on' }, { name: '3-1 OFF', var: '3-1:off' }], value: '3-1:on' },
              { element_type: 'Token', optional: false, visible: true, items: [{ name: '3-2 ON', var: '3-2:on' }, { name: '3-2 OFF', var: '3-2:off' }], value: '3-2:on' },
              {
                element_type: 'Token',
                optional: true,
                visible: true,
                items: [
                  { name: '우수 1학기', var: 'top:1' }, { name: '우수 2학기', var: 'top:2' },
                  { name: '우수 3학기', var: 'top:3' }, { name: '우수 4학기', var: 'top:4' },
                  { name: '우수 5학기', var: 'top:5' }, { name: '우수 6학기', var: 'top:6' },
                ],
                value: null,
              },
            ],
          },
        ],
      ],
    }
  },
  {
    block_type: 'TopSubject',
    block_name: '우수 N 과목',
    data: {
      name: 'TopSubject',
      color: 'blue',
      col_editable: false,
      headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '우수 N 과목' }] }]],
      body: [
        [
          {
            elements: [
              { element_type: 'Token', optional: true, visible: true, items: [{ name: '전체', var: 'overall' }, { name: '교과군별', var: 'perGroup' }], value: 'overall' },
              { element_type: 'Token', optional: false, visible: true, items: [{ name: '1', var: '1' }, { name: '2', var: '2' }, { name: '3', var: '3' }, { name: '5', var: '5' }, { name: '10', var: '10' }], value: '3' },
            ],
          },
        ],
      ],
    }
  },
  {
    block_type: 'SubjectGroupRatio',
    block_name: '교과군별 반영비율',
    data: {
      name: 'SubjectGroupRatio',
      color: 'blue',
      col_editable: true,
      headers: [
        [
          {
            elements: [
              { element_type: 'Token', optional: false, visible: true, items: [], value: null }, // subjectGroup(DB 주입)
            ],
          },
        ],
      ],
      body: [
        [
          {
            elements: [
              {
                element_type: 'Token',
                optional: false,
                visible: true,
                items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }],
                value: '100',
              },
            ],
          },
        ],
      ],
    }
  },
  {
    block_type: 'SeparationRatio',
    block_name: '분류 비율',
    data: {
      name: 'SeparationRatio',
      color: 'blue',
      col_editable: false,
      headers: [
        [
          { elements: [{ element_type: 'Text', optional: false, visible: true, content: '일반교과' }] },
          { elements: [{ element_type: 'Text', optional: false, visible: true, content: '진로선택과목' }] },
          { elements: [{ element_type: 'Text', optional: false, visible: true, content: '예체능교과' }] },
        ],
      ],
      body: [
        [
          { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
          { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
          { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
        ],
      ],
    }
  },
  {
    block_type: 'GradeRatio',
    block_name: '학년별 반영비율',
    data: {
      name: 'GradeRatio',
      color: 'blue',
      col_editable: false,
      headers: [
        [
          { elements: [{ element_type: 'Text', optional: false, visible: true, content: '1학년' }] },
          { elements: [{ element_type: 'Text', optional: false, visible: true, content: '2학년' }] },
          { elements: [{ element_type: 'Text', optional: false, visible: true, content: '3학년' }] },
        ],
      ],
      body: [
        [
          { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
          { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
          { elements: [{ element_type: 'Token', optional: false, visible: true, items: [{ name: '0', var: '0' }, { name: '25', var: '25' }, { name: '50', var: '50' }, { name: '75', var: '75' }, { name: '100', var: '100' }], value: '100' }] },
        ],
      ],
    }
  },
  {
    block_type: 'ScoreMap',
    block_name: '배점표',
    data: {
      name: 'ScoreMap',
      color: 'blue',
      col_editable: false,
      headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '배점표' }] }]],
      body: [
        [
          {
            elements: [
              { element_type: 'Token', optional: false, visible: true, items: [
                { name: '석차등급', var: 'rankingGrade' }, { name: '성취도등급', var: 'achievement' },
                { name: '평어등급', var: 'assessment' }, { name: '원점수', var: 'originalScore' }, { name: '배점', var: 'score' }
              ], value: 'originalScore' },
              { element_type: 'Token', optional: false, visible: true, items: [{ name: '일치', var: 'exact' }, { name: '범위', var: 'range' }], value: 'range' },
              { element_type: 'Text', optional: false, visible: true, content: '→' },
              { element_type: 'Token', optional: false, visible: true, items: [
                { name: '석차등급', var: 'rankingGrade' }, { name: '성취도등급', var: 'achievement' },
                { name: '평어등급', var: 'assessment' }, { name: '원점수', var: 'originalScore' }, { name: '배점', var: 'score' }
              ], value: 'score' },
              { element_type: 'Token', optional: false, visible: true, items: [{ name: '일치', var: 'exact' }, { name: '범위', var: 'range' }], value: 'exact' },
              {
                element_type: 'Table',
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
      ],
    }
  },
  {
    block_type: 'Formula',
    block_name: '수식',
    data: {
      name: 'Formula',
      color: 'blue',
      col_editable: false,
      headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '수식' }] }]],
      body: [
        [
          { elements: [{ element_type: 'Formula', optional: false, visible: true, value: '' }] },
        ],
      ],
    }
  },
  {
    block_type: 'Variable',
    block_name: '변수',
    data: {
      name: 'Variable',
      color: 'red',
      col_editable: false,
      headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '변수' }] }]],
      body: [
        [
          {
            elements: [
              { element_type: 'InputField', optional: false, visible: true, content: 'varName' }, // 변수명
              { element_type: 'Formula', optional: false, visible: true, value: '' },            // 저장할 DSL 값
            ],
          },
        ],
      ],
    }
  },
  {
    block_type: 'Condition',
    block_name: '조건',
    data: {
      name: 'Condition',
      color: 'purple',
      col_editable: false,
      headers: [[{ elements: [{ element_type: 'Text', optional: false, visible: true, content: '조건' }] }]],
      body: [
        [
          { elements: [{ element_type: 'Formula', optional: false, visible: true, value: '' }] },
        ],
      ],
    }
  },
  {
    block_type: 'Division',
    block_name: '구분',
    data: {
      name: 'Division',
      color: 'purple',
      col_editable: true,
      headers: [
        [
          {
            elements: [
              {
                element_type: 'Token',
                optional: false,
                visible: true,
                items: [
                  { name: '성별', var: 'gender' },
                  { name: '계열', var: 'track' },
                  { name: '학과', var: 'department' },
                  { name: '지역', var: 'region' },
                  { name: '학교유형', var: 'school_type' },
                  { name: '졸업년도', var: 'grad_year' },
                ],
                value: 'gender',
              },
            ],
          },
        ],
      ],
      body: [
        [
          {
            elements: [
              {
                element_type: 'Token',
                optional: false,
                visible: true,
                items: [
                  // 성별
                  { name: '남자', var: 'male' },
                  { name: '여자', var: 'female' },
                  // 계열
                  { name: '인문계', var: 'humanities' },
                  { name: '자연계', var: 'science' },
                  { name: '예체능', var: 'arts' },
                  // 학과
                  { name: '문과', var: 'liberal_arts' },
                  { name: '이과', var: 'science_major' },
                  { name: '예술', var: 'art' },
                  { name: '체육', var: 'sports' },
                  // 지역
                  { name: '서울', var: 'seoul' },
                  { name: '경기', var: 'gyeonggi' },
                  { name: '인천', var: 'incheon' },
                  { name: '기타', var: 'others' },
                  // 학교유형
                  { name: '일반고', var: 'general' },
                  { name: '특목고', var: 'special' },
                  { name: '자사고', var: 'private' },
                  { name: '특성화고', var: 'vocational' },
                  // 졸업년도
                  { name: '2023', var: '2023' },
                  { name: '2024', var: '2024' },
                  { name: '2025', var: '2025' },
                ],
                value: 'male',
              },
            ],
          },
        ],
      ],
    }
  }
]

async function insertBlockData() {
  try {
    // 기존 데이터 삭제
    await prisma.block_data.deleteMany({})

    // 모든 대학교 조회
    const universities = await prisma.univ.findMany()
    
    if (universities.length === 0) {
      return
    }


    // 각 대학교에 대해 블록 데이터 삽입
    for (const univ of universities) {

      // 기본 블록 타입들 삽입
      for (const config of blockDataConfigs) {
        try {
          await prisma.block_data.create({
            data: {
              univ_id: univ.id,
              block_type: config.block_type,
              block_name: config.block_name,
              data: config.data
            }
          })
        } catch (error) {
        }
      }

      // 상세 블록 타입들 삽입
      for (const config of detailedBlockConfigs) {
        try {
          await prisma.block_data.create({
            data: {
              univ_id: univ.id,
              block_type: config.block_type,
              block_name: config.block_name,
              data: config.data
            }
          })
        } catch (error) {
        }
      }
    }

    
    // 삽입된 데이터 확인
    const totalCount = await prisma.block_data.count()

    // 삽입된 데이터 목록 출력
    const allData = await prisma.block_data.findMany({
      orderBy: [{ univ_id: 'asc' }, { block_type: 'asc' }]
    })
    

  } catch (error) {
    console.error('블록 데이터 삽입 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
insertBlockData()
