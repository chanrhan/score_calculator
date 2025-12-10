'use client'

import * as React from 'react'
import { usePipelineVariables } from '@/store/usePipelineVariables'
import { CONTEXT_ATTRIBUTES, SUBJECT_ATTRIBUTES } from '@/lib/utils/scope-attributes'
import { ChevronRight, ChevronLeft, Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import styles from './VariableListPanel.module.css'

interface VariableListPanelProps {
  pipelineId?: number
  univId?: string
}

export const VariableListPanel: React.FC<VariableListPanelProps> = ({ pipelineId, univId }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const { variablesByName, load, getByScope, create, update, delete: deleteVariable } = usePipelineVariables()
  const [editingVariable, setEditingVariable] = React.useState<{ name: string; scope: '0' | '1' } | null>(null)
  const [editingValue, setEditingValue] = React.useState('')
  const [addingVariable, setAddingVariable] = React.useState<'0' | '1' | null>(null)
  const [newVariableName, setNewVariableName] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState(false)

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

  // 변수 편집 시작
  const handleStartEdit = (variableName: string, scope: '0' | '1') => {
    setEditingVariable({ name: variableName, scope })
    setEditingValue(variableName)
  }

  // 변수 편집 취소
  const handleCancelEdit = () => {
    setEditingVariable(null)
    setEditingValue('')
  }

  // 변수 편집 저장
  const handleSaveEdit = async () => {
    if (!univId || !pipelineId || !editingVariable) return
    
    const trimmed = editingValue.trim()
    if (!trimmed) {
      toast.error('변수 이름을 입력해주세요.')
      return
    }

    if (trimmed === editingVariable.name) {
      handleCancelEdit()
      return
    }

    setIsProcessing(true)
    try {
      const result = await update(univId, pipelineId, editingVariable.name, trimmed)
      if (result.success) {
        toast.success('변수 이름이 수정되었습니다.')
        handleCancelEdit()
      } else {
        toast.error(result.error || '변수 이름 수정에 실패했습니다.')
      }
    } catch (error) {
      toast.error('변수 이름 수정 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  // 변수 삭제
  const handleDelete = async (variableName: string) => {
    if (!univId || !pipelineId) return
    
    if (!confirm(`변수 "${variableName}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    setIsProcessing(true)
    try {
      const result = await deleteVariable(univId, pipelineId, variableName)
      if (result.success) {
        toast.success('변수가 삭제되었습니다.')
      } else {
        toast.error(result.error || '변수 삭제에 실패했습니다.')
      }
    } catch (error) {
      toast.error('변수 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  // 변수 추가 시작
  const handleStartAdd = (scope: '0' | '1') => {
    setAddingVariable(scope)
    setNewVariableName('')
  }

  // 변수 추가 취소
  const handleCancelAdd = () => {
    setAddingVariable(null)
    setNewVariableName('')
  }

  // 변수 추가 저장
  const handleSaveAdd = async () => {
    if (!univId || !pipelineId || !addingVariable) return
    
    const trimmed = newVariableName.trim()
    if (!trimmed) {
      toast.error('변수 이름을 입력해주세요.')
      return
    }

    setIsProcessing(true)
    try {
      const result = await create(univId, pipelineId, trimmed, addingVariable)
      if (result.success) {
        toast.success('변수가 추가되었습니다.')
        handleCancelAdd()
      } else {
        toast.error(result.error || '변수 추가에 실패했습니다.')
      }
    } catch (error) {
      toast.error('변수 추가 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          className={styles.toggleButton}
          onClick={() => setIsOpen(true)}
          title="변수 목록 열기"
        >
          <ChevronRight className={styles.icon} />
        </button>
      )}
      {isOpen && (
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
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>학생</h4>
            <button
              className={styles.addButton}
              onClick={() => handleStartAdd('0')}
              disabled={isProcessing || !univId || !pipelineId}
              title="변수 추가"
            >
              <Plus className={styles.addIcon} />
            </button>
          </div>
          <ul className={styles.variableList}>
            {CONTEXT_ATTRIBUTES.map((attr) => (
              <li key={attr.key} className={styles.variableItem}>
                {attr.label}
              </li>
            ))}
            {addingVariable === '0' && (
              <li className={styles.variableItemEdit}>
                <input
                  type="text"
                  value={newVariableName}
                  onChange={(e) => setNewVariableName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveAdd()
                    if (e.key === 'Escape') handleCancelAdd()
                  }}
                  className={styles.editInput}
                  placeholder="변수 이름 입력"
                  autoFocus
                />
                <button
                  className={styles.iconButton}
                  onClick={handleSaveAdd}
                  disabled={isProcessing}
                  title="저장"
                >
                  <Check className={styles.icon} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={handleCancelAdd}
                  disabled={isProcessing}
                  title="취소"
                >
                  <X className={styles.icon} />
                </button>
              </li>
            )}
            {studentVariables.map((variable) => (
              <li
                key={variable.variable_name}
                className={styles.variableItemCustom}
              >
                {editingVariable?.name === variable.variable_name && editingVariable?.scope === '0' ? (
                  <div className={styles.variableItemEdit}>
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className={styles.editInput}
                      autoFocus
                    />
                    <button
                      className={styles.iconButton}
                      onClick={handleSaveEdit}
                      disabled={isProcessing}
                      title="저장"
                    >
                      <Check className={styles.icon} />
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={handleCancelEdit}
                      disabled={isProcessing}
                      title="취소"
                    >
                      <X className={styles.icon} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={styles.variableName}>
                      {variable.variable_name}
                    </span>
                    <div className={styles.variableActions}>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleStartEdit(variable.variable_name, '0')}
                        disabled={isProcessing}
                        title="편집"
                      >
                        <Pencil className={styles.icon} />
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleDelete(variable.variable_name)}
                        disabled={isProcessing}
                        title="삭제"
                      >
                        <Trash2 className={styles.icon} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* 과목 (Subject) 섹션 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>과목</h4>
            <button
              className={styles.addButton}
              onClick={() => handleStartAdd('1')}
              disabled={isProcessing || !univId || !pipelineId}
              title="변수 추가"
            >
              <Plus className={styles.addIcon} />
            </button>
          </div>
          <ul className={styles.variableList}>
            {SUBJECT_ATTRIBUTES.map((attr) => (
              <li key={attr.key} className={styles.variableItem}>
                {attr.label}
              </li>
            ))}
            {addingVariable === '1' && (
              <li className={styles.variableItemEdit}>
                <input
                  type="text"
                  value={newVariableName}
                  onChange={(e) => setNewVariableName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveAdd()
                    if (e.key === 'Escape') handleCancelAdd()
                  }}
                  className={styles.editInput}
                  placeholder="변수 이름 입력"
                  autoFocus
                />
                <button
                  className={styles.iconButton}
                  onClick={handleSaveAdd}
                  disabled={isProcessing}
                  title="저장"
                >
                  <Check className={styles.icon} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={handleCancelAdd}
                  disabled={isProcessing}
                  title="취소"
                >
                  <X className={styles.icon} />
                </button>
              </li>
            )}
            {subjectVariables.map((variable) => (
              <li
                key={variable.variable_name}
                className={styles.variableItemCustom}
              >
                {editingVariable?.name === variable.variable_name && editingVariable?.scope === '1' ? (
                  <div className={styles.variableItemEdit}>
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className={styles.editInput}
                      autoFocus
                    />
                    <button
                      className={styles.iconButton}
                      onClick={handleSaveEdit}
                      disabled={isProcessing}
                      title="저장"
                    >
                      <Check className={styles.icon} />
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={handleCancelEdit}
                      disabled={isProcessing}
                      title="취소"
                    >
                      <X className={styles.icon} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={styles.variableName}>
                      {variable.variable_name}
                    </span>
                    <div className={styles.variableActions}>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleStartEdit(variable.variable_name, '1')}
                        disabled={isProcessing}
                        title="편집"
                      >
                        <Pencil className={styles.icon} />
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleDelete(variable.variable_name)}
                        disabled={isProcessing}
                        title="삭제"
                      >
                        <Trash2 className={styles.icon} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
        </div>
      )}
    </>
  )
}

