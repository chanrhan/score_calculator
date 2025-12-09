'use client'

import * as React from 'react'
import { usePipelineVariables } from '@/store/usePipelineVariables'
import { CONTEXT_ATTRIBUTES, SUBJECT_ATTRIBUTES } from '@/lib/utils/scope-attributes'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import styles from './VariableListPanel.module.css'

interface VariableListPanelProps {
  pipelineId?: number
  univId?: string
}

export const VariableListPanel: React.FC<VariableListPanelProps> = ({ pipelineId, univId }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const { variablesByName, load, getByScope } = usePipelineVariables()

  // 파이프라인 변수 로드
  React.useEffect(() => {
    if (univId && pipelineId) {
      load(univId, pipelineId)
    }
  }, [univId, pipelineId, load])

  // scope별 변수 가져오기
  const studentVariables = React.useMemo(() => {
    return getByScope('0')
  }, [variablesByName.size, getByScope])

  const subjectVariables = React.useMemo(() => {
    return getByScope('1')
  }, [variablesByName.size, getByScope])

  if (!isOpen) {
    return (
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(true)}
        title="변수 목록 열기"
      >
        <ChevronRight className={styles.icon} />
      </button>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>사용 가능한 변수 목록</h3>
        <button
          className={styles.closeButton}
          onClick={() => setIsOpen(false)}
          title="변수 목록 닫기"
        >
          <ChevronLeft className={styles.icon} />
        </button>
      </div>

      <div className={styles.content}>
        {/* 학생 (Student) 섹션 */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>학생</h4>
          <ul className={styles.variableList}>
            {CONTEXT_ATTRIBUTES.map((attr) => (
              <li key={attr.key} className={styles.variableItem}>
                {attr.label}
              </li>
            ))}
            {studentVariables.map((variable) => (
              <li key={variable.variable_name} className={styles.variableItemCustom}>
                {'{'}{variable.variable_name}{'}'}
              </li>
            ))}
          </ul>
        </div>

        {/* 과목 (Subject) 섹션 */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>과목</h4>
          <ul className={styles.variableList}>
            {SUBJECT_ATTRIBUTES.map((attr) => (
              <li key={attr.key} className={styles.variableItem}>
                {attr.label}
              </li>
            ))}
            {subjectVariables.map((variable) => (
              <li key={variable.variable_name} className={styles.variableItemCustom}>
                {'{'}{variable.variable_name}{'}'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

