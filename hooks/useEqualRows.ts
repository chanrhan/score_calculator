'use client'

import * as React from 'react'

type RegistryEntry = { el: HTMLElement; group: string }

export function useEqualRows() {
  const registry = React.useRef<RegistryEntry[]>([])
  const ro = React.useRef<ResizeObserver>()

  if (!ro.current && typeof window !== 'undefined') {
    ro.current = new ResizeObserver(() => {
      sync()
    })
  }

  function sync() {
    const groups = new Map<string, HTMLElement[]>()
    for (const r of registry.current) {
      if (!groups.has(r.group)) groups.set(r.group, [])
      groups.get(r.group)!.push(r.el)
    }
    groups.forEach(els => {
      let max = 0
      for (const el of els) {
        el.style.minHeight = 'initial'
      }
      for (const el of els) {
        const h = el.clientHeight
        if (h > max) max = h
      }
      for (const el of els) {
        el.style.minHeight = `${max}px`
      }
    })
  }

  const refForGroup = React.useCallback((group: string) => (el: HTMLElement | null) => {
    if (!el) return
    registry.current.push({ el, group })
    ro.current?.observe(el)
    sync()
  }, [])

  const unregister = React.useCallback((el: HTMLElement) => {
    registry.current = registry.current.filter(r => r.el !== el)
    ro.current?.unobserve(el)
    sync()
  }, [])

  React.useEffect(() => () => {
    ro.current?.disconnect()
  }, [])

  return { refForGroup, unregister, sync }
}


