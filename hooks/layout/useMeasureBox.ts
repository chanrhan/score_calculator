'use client'

import * as React from 'react'

export type MeasuredSize = { width: number; height: number }

/**
 * ResizeObserver 기반으로 자식 크기를 측정해 부모 컨테이너 스타일(width/height)을 계산합니다.
 * - scaleFactor: 기본 1.1 (110%)
 */
export function useMeasureBox(scaleFactor: number = 1) {
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const [contentSize, setContentSize] = React.useState<MeasuredSize>({ width: 0, height: 0 })

  React.useEffect(() => {
    if (!contentRef.current) return
    const el = contentRef.current

    // 지원 브라우저 가드
    if (typeof ResizeObserver === 'undefined') {
      const rect = el.getBoundingClientRect()
      setContentSize({ width: rect.width, height: rect.height })
      return
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect
        setContentSize({ width: cr.width, height: cr.height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scaledStyle: React.CSSProperties = React.useMemo(() => {
    const h = Math.max(0, Math.ceil(contentSize.height * scaleFactor))
    return { height: h }
  }, [contentSize, scaleFactor])

  return { contentRef, contentSize, scaledStyle }
}


