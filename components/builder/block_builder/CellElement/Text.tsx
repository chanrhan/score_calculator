'use client'

import * as React from 'react'
import { TextElement } from '@/types/block-structure'
import styles from './Text.module.css'

interface TextProps {
  element: TextElement
  className?: string
}

export const Text: React.FC<TextProps> = ({ element, className = '' }) => {
  const { content, optional, visible } = element
  // console.log('Text - content:', content);
  
  if (optional && !visible) {
    return null
  }
  
  return (
    <span className={`${styles.text} ${className}`}>
      {content}
    </span>
  )
}