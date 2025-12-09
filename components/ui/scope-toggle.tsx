'use client'

import * as React from 'react'
import styles from './scope-toggle.module.css'

interface ScopeToggleProps {
  value: '0' | '1' // '0': 과목, '1': 학생
  onChange: (value: '0' | '1') => void
  disabled?: boolean
}

export const ScopeToggle: React.FC<ScopeToggleProps> = ({ value, onChange, disabled = false }) => {
  const handleToggle = () => {
    if (disabled) return
    onChange(value === '0' ? '1' : '0')
  }

  return (
    <button
      type="button"
      className={`${styles.toggle} ${value === '1' ? styles.toggleActive : ''} ${disabled ? styles.toggleDisabled : ''}`}
      onClick={handleToggle}
      disabled={disabled}
      title={value === '0' ? '과목 범위 (클릭하여 학생 범위로 전환)' : '학생 범위 (클릭하여 과목 범위로 전환)'}
    >
      <span className={styles.toggleLabel}>{value === '0' ? '과목' : '학생'}</span>
      <span className={styles.toggleSwitch}>
        <span className={styles.toggleThumb} />
      </span>
    </button>
  )
}

