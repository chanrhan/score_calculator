'use client'

import * as React from 'react'

/**
 * 헤더/바디 그리드의 열 너비를 동기화하기 위한 훅.
 * 루트 엘리먼트 하위의 모든 [data-col] 요소를 스캔하여
 * 각 열 인덱스별 최대 너비(px)를 계산하고 CSS 변수 --col-i 로 설정한다.
 */
export function useGridColumnSync(rootRef: React.RefObject<HTMLElement>) {
  const rafRef = React.useRef<number | null>(null)

  const measure = React.useCallback(() => {
    if (!rootRef.current) return
    const host = rootRef.current
    const nodes = host.querySelectorAll<HTMLElement>('[data-col]')
    const widthByCol = new Map<number, number>()

    nodes.forEach((el) => {
      const idx = Number(el.dataset.col)
      if (Number.isNaN(idx)) return
      const rect = el.getBoundingClientRect()
      const w = Math.ceil(rect.width)
      const prev = widthByCol.get(idx) ?? 0
      if (w > prev) widthByCol.set(idx, w)
    })

    widthByCol.forEach((w, idx) => {
      host.style.setProperty(`--col-${idx}`, `${w}px`)
    })
  }, [rootRef])

  const schedule = React.useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      measure()
    })
  }, [measure])

  React.useEffect(() => {
    if (!rootRef.current) return
    const host = rootRef.current
    const ro = new ResizeObserver(() => schedule())
    ro.observe(host)
    host.querySelectorAll<HTMLElement>('[data-col]').forEach((el) => ro.observe(el))
    schedule()
    return () => {
      ro.disconnect()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [rootRef, schedule])

  return { schedule }
}


