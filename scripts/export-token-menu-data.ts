import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface TokenMenuItem {
  order: number
  label: string
  value: string
}

interface TokenMenu {
  key: string
  name: string
  items: TokenMenuItem[]
}

async function exportTokenMenuData() {
  try {
    // scope가 1인 공통 메뉴만 가져오기 (블록에서 사용되는 메뉴)
    const tokenMenus = await prisma.token_menu.findMany({
      where: {
        scope: 1 // 공통 메뉴
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: {
        key: 'asc'
      }
    })

    if (tokenMenus.length === 0) {
      console.log('⚠️  공통 token_menu 데이터가 없습니다.')
      return
    }

    // 데이터 변환
    const menus: TokenMenu[] = tokenMenus.map(menu => ({
      key: menu.key,
      name: menu.name,
      items: menu.items.map(item => ({
        order: item.order,
        label: item.label,
        value: item.value
      }))
    }))

    // TypeScript 파일 생성
    const outputPath = path.join(process.cwd(), 'lib', 'data', 'token-menus.ts')
    const outputDir = path.dirname(outputPath)
    
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 파일 내용 생성
    let content = `// lib/data/token-menus.ts
// token_menu 데이터 상수 정의
// 이 파일은 scripts/export-token-menu-data.ts 스크립트로 자동 생성됩니다.

export interface TokenMenuItem {
  order: number
  label: string
  value: string
}

export interface TokenMenu {
  key: string
  name: string
  items: TokenMenuItem[]
}

`

    // 각 메뉴를 개별 상수로 export
    menus.forEach(menu => {
      const constName = menu.key.toUpperCase().replace(/-/g, '_')
      content += `export const ${constName}_MENU: TokenMenu = {\n`
      content += `  key: '${menu.key}',\n`
      content += `  name: '${menu.name}',\n`
      content += `  items: [\n`
      menu.items.forEach(item => {
        content += `    { order: ${item.order}, label: '${item.label}', value: '${item.value}' },\n`
      })
      content += `  ]\n`
      content += `} as const\n\n`
    })

    // 모든 메뉴를 객체로 묶은 상수
    content += `// 모든 메뉴를 키로 접근할 수 있는 객체\n`
    content += `export const TOKEN_MENUS = {\n`
    menus.forEach(menu => {
      const constName = menu.key.toUpperCase().replace(/-/g, '_')
      content += `  ${menu.key}: ${constName}_MENU,\n`
    })
    content += `} as const\n\n`

    // 키로 메뉴를 찾는 헬퍼 함수
    content += `// 키로 메뉴를 찾는 헬퍼 함수\n`
    content += `export function getTokenMenu(key: string): TokenMenu | undefined {\n`
    content += `  return TOKEN_MENUS[key as keyof typeof TOKEN_MENUS]\n`
    content += `}\n\n`

    // 모든 메뉴 배열
    content += `// 모든 메뉴 배열\n`
    content += `export const ALL_TOKEN_MENUS: readonly TokenMenu[] = [\n`
    menus.forEach(menu => {
      const constName = menu.key.toUpperCase().replace(/-/g, '_')
      content += `  ${constName}_MENU,\n`
    })
    content += `] as const\n`

    // 파일 쓰기
    fs.writeFileSync(outputPath, content, 'utf-8')
    
    console.log(`✅ token_menu 데이터를 ${outputPath}에 성공적으로 내보냈습니다.`)
    console.log(`   총 ${menus.length}개의 메뉴가 생성되었습니다.`)
    
  } catch (error) {
    console.error('❌ token_menu 데이터 내보내기 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
exportTokenMenuData()

