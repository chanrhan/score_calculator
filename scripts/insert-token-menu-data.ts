import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// menu_key에 해당하는 token_menu 데이터 정의
const tokenMenuData = [
  {
    key: 'include_exclude',
    name: '포함/제외',
    description: '포함 또는 제외 선택',
    items: [
      { name: '포함', var: 'include' },
      { name: '제외', var: 'exclude' }
    ]
  },
  {
    key: 'percentage_ratio',
    name: '비율 선택',
    description: '0%부터 100%까지 25% 단위로 선택',
    items: [
      { name: '0%', var: '0' },
      { name: '25%', var: '25' },
      { name: '50%', var: '50' },
      { name: '75%', var: '75' },
      { name: '100%', var: '100' }
    ]
  },
  {
    key: 'subject_groups',
    name: '교과군',
    description: '교과군 목록 (DB에서 동적 로드)',
    items: [] // 빈 배열 - DB에서 동적으로 로드됨
  },
  {
    key: 'top_subject_scope',
    name: '우수과목 범위',
    description: '우수과목 선택 범위',
    items: [
      { name: '전체', var: 'overall' },
      { name: '교과군별', var: 'perGroup' }
    ]
  },
  {
    key: 'top_subject_count',
    name: '우수과목 개수',
    description: '선택할 우수과목의 개수',
    items: [
      { name: '1개', var: '1' },
      { name: '2개', var: '2' },
      { name: '3개', var: '3' },
      { name: '5개', var: '5' },
      { name: '10개', var: '10' }
    ]
  },
  {
    key: 'term_1_1',
    name: '1학년 1학기',
    description: '1학년 1학기 반영 여부',
    items: [
      { name: '1-1 ON', var: '1-1:on' },
      { name: '1-1 OFF', var: '1-1:off' }
    ]
  },
  {
    key: 'term_1_2',
    name: '1학년 2학기',
    description: '1학년 2학기 반영 여부',
    items: [
      { name: '1-2 ON', var: '1-2:on' },
      { name: '1-2 OFF', var: '1-2:off' }
    ]
  },
  {
    key: 'term_2_1',
    name: '2학년 1학기',
    description: '2학년 1학기 반영 여부',
    items: [
      { name: '2-1 ON', var: '2-1:on' },
      { name: '2-1 OFF', var: '2-1:off' }
    ]
  },
  {
    key: 'term_2_2',
    name: '2학년 2학기',
    description: '2학년 2학기 반영 여부',
    items: [
      { name: '2-2 ON', var: '2-2:on' },
      { name: '2-2 OFF', var: '2-2:off' }
    ]
  },
  {
    key: 'term_3_1',
    name: '3학년 1학기',
    description: '3학년 1학기 반영 여부',
    items: [
      { name: '3-1 ON', var: '3-1:on' },
      { name: '3-1 OFF', var: '3-1:off' }
    ]
  },
  {
    key: 'term_3_2',
    name: '3학년 2학기',
    description: '3학년 2학기 반영 여부',
    items: [
      { name: '3-2 ON', var: '3-2:on' },
      { name: '3-2 OFF', var: '3-2:off' }
    ]
  },
  {
    key: 'top_terms',
    name: '우수학기',
    description: '우수학기 선택',
    items: [
      { name: '우수 1학기', var: 'top:1' },
      { name: '우수 2학기', var: 'top:2' },
      { name: '우수 3학기', var: 'top:3' },
      { name: '우수 4학기', var: 'top:4' },
      { name: '우수 5학기', var: 'top:5' },
      { name: '우수 6학기', var: 'top:6' }
    ]
  },
  {
    key: 'score_types',
    name: '점수 유형',
    description: '석차등급, 성취도등급, 평어등급, 원점수, 배점',
    items: [
      { name: '석차등급', var: 'rankingGrade' },
      { name: '성취도등급', var: 'achievement' },
      { name: '평어등급', var: 'assessment' },
      { name: '원점수', var: 'originalScore' },
      { name: '배점', var: 'score' }
    ]
  },
  {
    key: 'match_types',
    name: '매칭 유형',
    description: '일치 또는 범위 매칭',
    items: [
      { name: '일치', var: 'exact' },
      { name: '범위', var: 'range' }
    ]
  },
  {
    key: 'division_criteria',
    name: '구분 기준',
    description: '학생 구분 기준 선택',
    items: [
      { name: '성별', var: 'gender' },
      { name: '계열', var: 'track' },
      { name: '학과', var: 'department' },
      { name: '지역', var: 'region' },
      { name: '학교유형', var: 'school_type' },
      { name: '졸업년도', var: 'grad_year' }
    ]
  },
  {
    key: 'division_values',
    name: '구분 값',
    description: '구분 기준에 따른 세부 값들',
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
      { name: '2025', var: '2025' }
    ]
  }
]

async function insertTokenMenuData() {
  try {
    // 기존 token_menu와 token_menu_item 데이터 삭제
    await prisma.token_menu_item.deleteMany({})
    await prisma.token_menu.deleteMany({})

    // 모든 대학교 조회
    const universities = await prisma.univ.findMany()
    
    if (universities.length === 0) {
      return
    }


    // 각 대학교에 대해 token_menu 데이터 삽입
    for (const univ of universities) {

      for (const menuData of tokenMenuData) {
        try {
          // token_menu 생성
          const tokenMenu = await prisma.token_menu.create({
            data: {
              univ_id: univ.id,
              key: menuData.key,
              name: menuData.name,
              scope: 1 // 블록에서 사용되는 메뉴 (1: block, 0: other)
            }
          })


          // token_menu_item 생성
          for (let i = 0; i < menuData.items.length; i++) {
            const item = menuData.items[i]
            await prisma.token_menu_item.create({
              data: {
                univ_id: univ.id,
                menu_key: menuData.key,
                order: i + 1,
                label: item.name,
                value: item.var
              }
            })
          }

          if (menuData.items.length > 0) {
          }

        } catch (error) {
        }
      }
    }

    
    // 삽입된 데이터 확인
    const menuCount = await prisma.token_menu.count()
    const itemCount = await prisma.token_menu_item.count()

    // 삽입된 메뉴 목록 출력
    const allMenus = await prisma.token_menu.findMany({
      orderBy: [{ univ_id: 'asc' }, { key: 'asc' }],
        include: {
          items: {
            orderBy: { order: 'asc' }
          }
        }
    })
    

  } catch (error) {
    console.error('token_menu 데이터 삽입 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
insertTokenMenuData()
