'use client'

import * as React from 'react'
import type { OrderTokenElement } from '@/types/block-structure'
import type { TokenMenu } from '@/types/block-data'
import { Token } from './Token'
import styles from './OrderToken.module.css'

interface OrderTokenProps {
  element: OrderTokenElement
  onChange?: (value: (string | null)[]) => void
  className?: string
  tokenMenus?: TokenMenu[]
}

// 리스트 형태의 값을 항상 [first, second] 구조로 정규화
function normalizeOrderTokenValue(value: any): [string | null, string | null] {
  if (!Array.isArray(value)) return [null, null]
  const first = value.length > 0 ? (value[0] ?? null) : null
  const second = value.length > 1 ? (value[1] ?? null) : null
  return [first, second]
}

export const OrderToken: React.FC<OrderTokenProps> = ({ element, onChange, className = '', tokenMenus = [] }) => {
  const { menu_key, menu_key2, optional, visible } = element
  const [first, second] = normalizeOrderTokenValue(element.value)

  if (optional && !visible) return null

  return (
    <div className={`${styles.group} ${className}`}>
      <Token
        element={{ type: 'Token', menu_key, value: first, optional: false, visible: true }}
        tokenMenus={tokenMenus}
        onChange={(v) => onChange?.([v, second])}
        autoFit
      />
      <Token
        element={{ type: 'Token', menu_key: menu_key2, value: second, optional: false, visible: true }}
        tokenMenus={tokenMenus}
        onChange={(v) => onChange?.([first, v])}
        autoFit
      />
    </div>
  )
}

export default OrderToken


