import { PrismaClient } from '@prisma/client'
import { BLOCK_TYPES } from '../types/block-structure'

const prisma = new PrismaClient()

// block-structure.ts의 BLOCK_TYPES를 기반으로 한 상세 블록 데이터
const detailedBlockConfigs = [
  {
    block_type: 'ApplySubject',
    block_name: '반영교과',
    data: BLOCK_TYPES.ApplySubject
  },
  {
    block_type: 'ApplyTerm',
    block_name: '반영학기',
    data: BLOCK_TYPES.ApplyTerm
  },
  {
    block_type: 'TopSubject',
    block_name: '우수 N 과목',
    data: BLOCK_TYPES.TopSubject
  },
  {
    block_type: 'SubjectGroupRatio',
    block_name: '교과군별 반영비율',
    data: BLOCK_TYPES.SubjectGroupRatio
  },
  {
    block_type: 'SeparationRatio',
    block_name: '분류 비율',
    data: BLOCK_TYPES.SeparationRatio
  },
  {
    block_type: 'GradeRatio',
    block_name: '학년별 반영비율',
    data: BLOCK_TYPES.GradeRatio
  },
  {
    block_type: 'ScoreMap',
    block_name: '배점표',
    data: BLOCK_TYPES.ScoreMap
  },
  {
    block_type: 'Formula',
    block_name: '수식',
    data: BLOCK_TYPES.Formula
  },
  {
    block_type: 'Variable',
    block_name: '변수',
    data: BLOCK_TYPES.Variable
  },
  {
    block_type: 'Condition',
    block_name: '조건',
    data: BLOCK_TYPES.Condition
  },
  {
    block_type: 'Division',
    block_name: '구분',
    data: BLOCK_TYPES.Division
  }
]

// 기본 블록 타입들 (기존 로직 유지)
const basicBlockConfigs = [
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
      for (const config of basicBlockConfigs) {
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

      // 상세 블록 타입들 삽입 (menu_key 기반)
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
    

    // menu_key 사용 현황 출력

  } catch (error) {
    console.error('블록 데이터 삽입 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
insertBlockData()
