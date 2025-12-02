'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Save, Trash2, Edit, X, CheckCircle, XCircle } from 'lucide-react'
import { BLOCK_TYPE } from '@/types/block-types'
import { GROUP_TYPES, GroupType, COLOR_PALETTE } from '@/types/block-data'
import { stringifyJsonData as stringifyJson, parseJsonData } from '@/utils/blockDataJson'
import styles from './BlockDataManager.module.css'

interface BlockDataManagerProps {
  univId: string
}

interface BlockData {
  univ_id: string
  block_type: number
  block_name: string
  header_cell_type: any
  body_cell_type: any
  init_row: number
  init_col: number
  col_editable: boolean
  group_name?: string
  color?: string
  created_at: string
  updated_at: string
}

// 블록 타입 라벨 매핑
const BLOCK_TYPE_LABELS = {
  [BLOCK_TYPE.DIVISION]: '구분 블록',
  [BLOCK_TYPE.APPLY_SUBJECT]: '반영교과 블록',
  [BLOCK_TYPE.GRADE_RATIO]: '학년별 반영비율 블록',
  [BLOCK_TYPE.APPLY_TERM]: '반영학기 블록',
  [BLOCK_TYPE.TOP_SUBJECT]: '우수 N 과목 블록',
  [BLOCK_TYPE.SUBJECT_GROUP_RATIO]: '교과군별 반영비율 블록',
  [BLOCK_TYPE.SEPARATION_RATIO]: '과목구분별 반영비율 블록',
  [BLOCK_TYPE.SCORE_MAP]: '배점표 블록',
  [BLOCK_TYPE.FORMULA]: '수식 블록',
  [BLOCK_TYPE.VARIABLE]: '변수 블록',
  [BLOCK_TYPE.CONDITION]: '조건 블록',
  [BLOCK_TYPE.AGGREGATION]: '집계 블록',
} as const

export default function BlockDataManager({ univId }: BlockDataManagerProps) {
  const [blockDataList, setBlockDataList] = useState<BlockData[]>([])
  const [editingBlock, setEditingBlock] = useState<BlockData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedBlockType, setSelectedBlockType] = useState<number>(0)
  const [newBlockData, setNewBlockData] = useState({
    block_type: 0,
    block_name: '',
    group_name: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 메시지 표시 함수
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000) // 3초 후 자동 숨김
  }

  // 블록 데이터 로드
  const loadBlockData = async () => {
    try {
      const response = await fetch(`/api/block-data`)
      if (response.ok) {
        const data = await response.json()
        setBlockDataList(data)
      }
    } catch (error) {
      console.error('Error loading block data:', error)
    }
  }

  // 블록 데이터 생성
  const handleSaveBlockData = async () => {
    if (!newBlockData.block_type || !newBlockData.block_name) {
      return alert('블록 타입과 이름을 입력해주세요')
    }

    try {
      const response = await fetch(`/api/block-data/${newBlockData.block_type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_name: newBlockData.block_name,
          header_cell_type: {},
          body_cell_type: {},
          init_row: 1,
          init_col: 1,
          col_editable: true,
          group_name: newBlockData.group_name || null,
          color: '#ffffff'
        })
      })

      if (response.ok) {
        setNewBlockData({ block_type: 0, block_name: '', group_name: '' })
        loadBlockData()
        showMessage('success', '블록 데이터가 저장되었습니다.')
      } else {
        const error = await response.json()
        showMessage('error', error.error || '블록 데이터 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error saving block data:', error)
      showMessage('error', '블록 데이터 저장 중 오류가 발생했습니다.')
    }
  }

  // 블록 데이터 삭제
  const handleDeleteBlockData = async (blockType: string) => {
    if (!confirm('이 블록 데이터를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/block-data/${blockType}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadBlockData()
        showMessage('success', '블록 데이터가 삭제되었습니다.')
      } else {
        const error = await response.json()
        showMessage('error', error.error || '블록 데이터 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting block data:', error)
      showMessage('error', '블록 데이터 삭제 중 오류가 발생했습니다.')
    }
  }

  // 편집 모드 시작
  const startEditing = (blockData: BlockData) => {
    setEditingBlock({
      ...blockData,
      header_cell_type: stringifyJsonData(blockData.header_cell_type),
      body_cell_type: stringifyJsonData(blockData.body_cell_type)
    })
    setIsEditing(true)
  }

  // 편집 취소
  const cancelEditing = () => {
    setEditingBlock(null)
    setIsEditing(false)
  }

  // 편집된 데이터 저장
  const handleSaveEdit = async () => {
    if (!editingBlock) return

    try {
      // JSON 형식 검증 및 변환 (JSON5 지원)
      let headerCellType, bodyCellType
      try {
        headerCellType = parseJsonData(editingBlock.header_cell_type || '{}')
      } catch (error) {
        return alert('Header Cell Type이 유효한 JSON 형식이 아닙니다.')
      }
      
      try {
        bodyCellType = parseJsonData(editingBlock.body_cell_type || '{}')
      } catch (error) {
        return alert('Body Cell Type이 유효한 JSON 형식이 아닙니다.')
      }

      const response = await fetch(`/api/block-data/${editingBlock.block_type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_name: editingBlock.block_name,
          header_cell_type: headerCellType,
          body_cell_type: bodyCellType,
          init_row: editingBlock.init_row,
          init_col: editingBlock.init_col,
          col_editable: editingBlock.col_editable,
          group_name: editingBlock.group_name || null,
          color: editingBlock.color || null
        })
      })

      if (response.ok) {
        setEditingBlock(null)
        setIsEditing(false)
        loadBlockData()
        showMessage('success', '블록 데이터가 수정되었습니다.')
      } else {
        const error = await response.json()
        showMessage('error', error.error || '블록 데이터 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating block data:', error)
      showMessage('error', '블록 데이터 수정 중 오류가 발생했습니다.')
    }
  }

  const stringifyJsonData = (data: any) => stringifyJson(data)

  // Textarea에서 Tab 키 처리 (들여쓰기) + 자동 괄호 닫기
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    const value = target.value

    // Tab 키: 들여쓰기
    if (e.key === 'Tab') {
      e.preventDefault()
      const newValue = value.substring(0, start) + '    ' + value.substring(end)
      target.value = newValue
      target.selectionStart = target.selectionEnd = start + 4
      const event = new Event('input', { bubbles: true })
      target.dispatchEvent(event)
      return
    }

    // 자동 괄호 닫기
    const bracketPairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '(': ')',
      '"': '"',
      "'": "'"
    }

    if (bracketPairs[e.key]) {
      e.preventDefault()
      const closingChar = bracketPairs[e.key]
      
      // 선택 영역이 있으면 감싸기
      if (start !== end) {
        const selectedText = value.substring(start, end)
        const newValue = value.substring(0, start) + e.key + selectedText + closingChar + value.substring(end)
        target.value = newValue
        target.selectionStart = start + 1
        target.selectionEnd = end + 1
      } else {
        // 괄호 쌍 삽입
        const newValue = value.substring(0, start) + e.key + closingChar + value.substring(end)
        target.value = newValue
        target.selectionStart = target.selectionEnd = start + 1
      }
      
      const event = new Event('input', { bubbles: true })
      target.dispatchEvent(event)
      return
    }

    // Enter 키: 자동 들여쓰기
    if (e.key === 'Enter') {
      const lines = value.substring(0, start).split('\n')
      const currentLine = lines[lines.length - 1]
      const indent = currentLine.match(/^\s*/)?.[0] || ''
      
      // 이전 줄이 { 또는 [로 끝나면 추가 들여쓰기
      const trimmedLine = currentLine.trim()
      const extraIndent = (trimmedLine.endsWith('{') || trimmedLine.endsWith('[')) ? '    ' : ''
      
      e.preventDefault()
      const newValue = value.substring(0, start) + '\n' + indent + extraIndent + value.substring(end)
      target.value = newValue
      target.selectionStart = target.selectionEnd = start + 1 + indent.length + extraIndent.length
      
      const event = new Event('input', { bubbles: true })
      target.dispatchEvent(event)
      return
    }

    // Backspace: 빈 괄호 쌍 삭제
    if (e.key === 'Backspace' && start === end && start > 0) {
      const charBefore = value[start - 1]
      const charAfter = value[start]
      
      if (bracketPairs[charBefore] === charAfter) {
        e.preventDefault()
        const newValue = value.substring(0, start - 1) + value.substring(start + 1)
        target.value = newValue
        target.selectionStart = target.selectionEnd = start - 1
        
        const event = new Event('input', { bubbles: true })
        target.dispatchEvent(event)
      }
    }
  }

  // 선택된 블록 데이터 가져오기
  const selectedBlockData = blockDataList.find(block => block.block_type === selectedBlockType)

  useEffect(() => {
    loadBlockData()
  }, [])

  // 첫 번째 블록을 기본 선택으로 설정
  useEffect(() => {
    if (blockDataList.length > 0 && selectedBlockType === 0) {
      setSelectedBlockType(blockDataList[0].block_type)
    }
  }, [blockDataList, selectedBlockType])

  return (
    <div className={styles.splitContainer}>
      {/* 메시지 */}
      {message && (
        <div className={`${styles.message} ${
          message.type === 'success' ? styles.messageSuccess : styles.messageError
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className={styles.messageIcon} />
          ) : (
            <XCircle className={styles.messageIcon} />
          )}
          <span className={styles.messageText}>{message.text}</span>
        </div>
      )}
      {/* Left Panel */}
      <aside className={styles.leftPanel}>
        <div className={styles.leftHeader}>블록 목록</div>
        <div className={styles.addCard}>
          <div className={styles.addRow}>
            <Label htmlFor="new_block_type" className={styles.addLabel}>블록 타입 코드</Label>
            <Input
              id="new_block_type"
              type="number"
              className={styles.addInput}
              value={newBlockData.block_type || ''}
              onChange={(e) => setNewBlockData({ ...newBlockData, block_type: parseInt(e.target.value) || 0 })}
              placeholder="예: 1"
            />
          </div>
          <div className={styles.addRow}>
            <Label htmlFor="new_block_name" className={styles.addLabel}>블록명</Label>
            <Input
              id="new_block_name"
              className={styles.addInput}
              value={newBlockData.block_name}
              onChange={(e) => setNewBlockData({ ...newBlockData, block_name: e.target.value })}
              placeholder="예: 구분 블록"
            />
          </div>
          <div className={styles.addRow}>
            <Label className={styles.addLabel}>그룹명</Label>
            <Select
              value={newBlockData.group_name}
              onValueChange={(value) => setNewBlockData({ ...newBlockData, group_name: value })}
            >
              <SelectTrigger className={styles.addSelect}>
                <SelectValue placeholder="그룹 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(GROUP_TYPES).map((groupType) => (
                  <SelectItem key={groupType} value={groupType}>
                    {groupType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className={styles.addSubmit} onClick={handleSaveBlockData} disabled={!newBlockData.block_type || !newBlockData.block_name}>
            <Plus className="h-4 w-4 mr-1" /> 추가
          </Button>
        </div>
        <div className={styles.list}>
          {blockDataList.map((b) => (
            <button
              key={b.block_type}
              className={`${styles.listItem} ${selectedBlockType === b.block_type ? styles.listItemActive : ''}`}
              onClick={() => setSelectedBlockType(b.block_type)}
            >
              <div className={styles.listItemHeader}>
                <div className={styles.listItemTitle}>{b.block_name}</div>
                <div className={styles.listItemColor} style={{ backgroundColor: b.color || '#ffffff' }} />
              </div>
              <div className={styles.listItemMeta}>코드 {b.block_type} · {b.group_name || '미지정'}</div>
            </button>
          ))}
          {blockDataList.length === 0 && (
            <div className={styles.emptyMessage}>등록된 블록 데이터가 없습니다.</div>
          )}
        </div>
      </aside>

      {/* Right Panel */}
      <main className={styles.rightPanel}>
        <div className={styles.rightHeader}>
          <div>
            <div className={styles.rightTitle}>블록 상세 정보</div>
            <div className={styles.rightDesc}>선택한 블록의 속성과 셀 타입을 편집합니다.</div>
          </div>
          {selectedBlockData && !isEditing && (
            <div className={styles.selectedBlockActions}>
              <Button size="sm" variant="outline" onClick={() => startEditing(selectedBlockData)}>
                <Edit className="h-4 w-4 mr-1" /> 편집
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDeleteBlockData(selectedBlockData.block_type.toString())} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-1" /> 삭제
              </Button>
            </div>
          )}
        </div>

        {!selectedBlockData ? (
          <div className={styles.emptyDetail}>좌측에서 블록을 선택하세요.</div>
        ) : (
          isEditing && editingBlock?.block_type === selectedBlockData.block_type ? (
            <div className={styles.editForm}>
              <div className={styles.editFormRow}>
                <div className={styles.basicInfoRow}>
                  <div className={styles.basicInfoField}>
                    <span className={styles.basicInfoLabel}>블록 타입 코드</span>
                    <span className={styles.tokenReadonly}>{selectedBlockData.block_type}</span>
                  </div>
                  <div className={styles.basicInfoField}>
                    <Label className={styles.basicInfoLabel}>블록명</Label>
                    <Input className={styles.basicInfoInput} value={editingBlock.block_name} onChange={(e) => setEditingBlock({ ...editingBlock, block_name: e.target.value })} />
                  </div>
                  <div className={styles.basicInfoField}>
                    <Label className={styles.basicInfoLabel}>행 수</Label>
                    <Input type="number" min="1" className={styles.basicInfoInputSmall} value={editingBlock.init_row} onChange={(e) => setEditingBlock({ ...editingBlock, init_row: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className={styles.basicInfoField}>
                    <Label className={styles.basicInfoLabel}>열 수</Label>
                    <Input type="number" min="1" className={styles.basicInfoInputSmall} value={editingBlock.init_col} onChange={(e) => setEditingBlock({ ...editingBlock, init_col: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className={styles.basicInfoField}>
                    <input id={`edit_col_editable_${selectedBlockData.block_type}`} type="checkbox" checked={editingBlock.col_editable} onChange={(e) => setEditingBlock({ ...editingBlock, col_editable: e.target.checked })} className={styles.basicInfoCheckbox} />
                    <Label htmlFor={`edit_col_editable_${selectedBlockData.block_type}`} className={styles.basicInfoLabel}>열 편집 가능</Label>
                  </div>
                  <div className={styles.basicInfoField}>
                    <Label className={styles.basicInfoLabel}>그룹명</Label>
                    <Select value={editingBlock.group_name || ''} onValueChange={(value) => setEditingBlock({ ...editingBlock, group_name: value })}>
                      <SelectTrigger className={styles.basicInfoSelect}>
                        <SelectValue placeholder="그룹 유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(GROUP_TYPES).map((groupType) => (
                          <SelectItem key={groupType} value={groupType}>{groupType}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={styles.basicInfoField}>
                    <Label className={styles.basicInfoLabel}>컬러</Label>
                    <div className={styles.colorInputContainer}>
                      <div className={styles.colorPalette}>
                        {COLOR_PALETTE.map((color) => (
                          <button key={color} type="button" className={`${styles.colorSwatch} ${(editingBlock.color || '#ffffff') === color ? styles.colorSwatchSelected : ''}`} style={{ backgroundColor: color }} onClick={() => setEditingBlock({ ...editingBlock, color })} title={color} />
                        ))}
                      </div>
                      <div className={styles.colorInputRow}>
                        <Input type="color" className={styles.colorInput} value={editingBlock.color || '#ffffff'} onChange={(e) => setEditingBlock({ ...editingBlock, color: e.target.value })} />
                        <Input type="text" className={styles.colorTextInput} value={editingBlock.color || '#ffffff'} onChange={(e) => setEditingBlock({ ...editingBlock, color: e.target.value })} placeholder="#ffffff" />
                      </div>
                    </div>
                  </div>
                  <div className={styles.editFormActions}>
                    <Button size="sm" onClick={handleSaveEdit} className={styles.editButton}>
                      <Save className={styles.editIcon} /> 저장
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing} className={styles.editButton}>
                      <X className={styles.editIcon} /> 취소
                    </Button>
                  </div>
                </div>
              </div>
              <div className={styles.jsonGrid}>
                <div>
                  <Label htmlFor={`edit_header_cell_type_${selectedBlockData.block_type}`}>Header Cell Type (JSON)</Label>
                  <Textarea 
                    id={`edit_header_cell_type_${selectedBlockData.block_type}`} 
                    className={styles.jsonTextarea} 
                    rows={30} 
                    value={editingBlock.header_cell_type} 
                    onChange={(e) => { setEditingBlock({ ...editingBlock, header_cell_type: e.target.value }) }} 
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="Header Cell Type을 JSON 형식으로 입력하세요" 
                  />
                </div>
                <div>
                  <Label htmlFor={`edit_body_cell_type_${selectedBlockData.block_type}`}>Body Cell Type (JSON)</Label>
                  <Textarea 
                    id={`edit_body_cell_type_${selectedBlockData.block_type}`} 
                    className={styles.jsonTextarea} 
                    rows={30} 
                    value={editingBlock.body_cell_type} 
                    onChange={(e) => { setEditingBlock({ ...editingBlock, body_cell_type: e.target.value }) }} 
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="Body Cell Type을 JSON 형식으로 입력하세요" 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.displayInfo}>
              <div className={styles.displayInfoRow}>
                <div className={styles.displayInfoFields}>
                  <div className={styles.displayInfoField}>
                    <span className={styles.displayInfoLabel}>블록 타입:</span>
                    <span className={styles.displayInfoValue}>{selectedBlockData.block_type}</span>
                  </div>
                  <div className={styles.displayInfoField}>
                    <span className={styles.displayInfoLabel}>행 수:</span>
                    <span className={styles.displayInfoValue}>{selectedBlockData.init_row}</span>
                  </div>
                  <div className={styles.displayInfoField}>
                    <span className={styles.displayInfoLabel}>열 수:</span>
                    <span className={styles.displayInfoValue}>{selectedBlockData.init_col}</span>
                  </div>
                  <div className={styles.displayInfoField}>
                    <span className={styles.displayInfoLabel}>열 편집:</span>
                    <span className={`${styles.statusBadge} ${selectedBlockData.col_editable ? styles.statusBadgeEnabled : styles.statusBadgeDisabled}`}>
                      {selectedBlockData.col_editable ? '가능' : '불가능'}
                    </span>
                  </div>
                  <div className={styles.displayInfoField}>
                    <span className={styles.displayInfoLabel}>그룹 유형:</span>
                    <span className={styles.displayInfoValue}>{selectedBlockData.group_name || '미설정'}</span>
                  </div>
                  <div className={styles.displayInfoField}>
                    <span className={styles.displayInfoLabel}>컬러:</span>
                    <div className={styles.colorDisplay}>
                      <div className={styles.colorPreview} style={{ backgroundColor: selectedBlockData.color || '#ffffff' }} />
                      <span className={styles.displayInfoValue}>{selectedBlockData.color || '#ffffff'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.jsonDisplay}>
                <div>
                  <h5 className={styles.jsonDisplayTitle}>Header Cell Type</h5>
                  <div className={styles.jsonDisplayContent}>
                    <pre className={styles.jsonDisplayPre}>{stringifyJsonData(selectedBlockData.header_cell_type)}</pre>
                  </div>
                </div>
                <div>
                  <h5 className={styles.jsonDisplayTitle}>Body Cell Type</h5>
                  <div className={styles.jsonDisplayContent}>
                    <pre className={styles.jsonDisplayPre}>{stringifyJsonData(selectedBlockData.body_cell_type)}</pre>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  )
}
