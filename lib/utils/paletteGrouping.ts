// lib/utils/paletteGrouping.ts
// block_data를 팔레트 카테고리 구조로 그룹핑하는 순수 유틸 함수들

import type { BlockData } from '@/types/block-data'

export type PaletteItem = {
  blockType: number
  name: string
  color: string
}

export type Category = {
  title: string
  icon: string
  color: string
  items: PaletteItem[]
}

function inferGroupIcon(title: string): string {
  switch (title) {
    case '구분':
      return '📊'
    case '조건':
      return '🔍'
    case '변수':
      return '📝'
    default:
      return '⚙️'
  }
}

function inferGroupColorClass(title: string): string {
  switch (title) {
    case '구분':
      return 'bg-green-500'
    case '조건':
      return 'bg-purple-500'
    case '변수':
      return 'bg-pink-500'
    default:
      return 'bg-blue-500'
  }
}

function computeItemColorClass(_hex?: string | null): string {
  // 현재는 고정 파스텔 테마 사용 (Tailwind 정적 클래스)
  return 'bg-blue-100 border-blue-300 text-blue-800'
}

export function groupBlockDataToCategories(blockData: BlockData[]): Category[] {
  const categoryMap = new Map<string, Category>()

  for (const bd of blockData) {
    const title = (bd.group_name && bd.group_name.trim()) || '기타'
    if (!categoryMap.has(title)) {
      categoryMap.set(title, {
        title,
        icon: inferGroupIcon(title),
        color: inferGroupColorClass(title),
        items: []
      })
    }
    const category = categoryMap.get(title)!
    category.items.push({
      blockType: bd.block_type,
      name: bd.block_name,
      color: computeItemColorClass(bd.color)
    })
  }

  return Array.from(categoryMap.values())
}


