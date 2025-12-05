import { getTokenMenu } from '@/lib/data/token-menus'

export function normalizeOrderTokenValue(value: unknown): [string | null, string | null] {
  if (!Array.isArray(value)) return [null, null]
  const first = value.length > 0 ? (value[0] ?? null) : null
  const second = value.length > 1 ? (value[1] ?? null) : null
  return [first, second]
}

export function getTokenMenuItemsByKey(key: string) {
  const menu = getTokenMenu(key)
  return menu ? menu.items ?? [] : []
}


