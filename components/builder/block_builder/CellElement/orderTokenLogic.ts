export function normalizeOrderTokenValue(value: unknown): [string | null, string | null] {
  if (!Array.isArray(value)) return [null, null]
  const first = value.length > 0 ? (value[0] ?? null) : null
  const second = value.length > 1 ? (value[1] ?? null) : null
  return [first, second]
}

export function getTokenMenuItemsByKey<T extends { key: string; items: any[] }>(tokenMenus: T[] = [], key: string) {
  const tm = tokenMenus.find((m) => m.key === key)
  return tm ? tm.items ?? [] : []
}


