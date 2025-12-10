import * as React from 'react'
import { List } from '@/components/builder/block_builder/CellElement/List'
import { createListElement } from '@/lib/blocks/modules/common/elementHelpers'

interface AdmissionCodeCellProps {
  cellData: Record<string, any>
  onChange: (key: string, value: any) => void
  readOnly?: boolean
}

export const AdmissionCodeCell: React.FC<AdmissionCodeCellProps> = ({
  cellData,
  onChange,
  readOnly = false,
}) => {
  const codes = Array.isArray(cellData.codes) ? cellData.codes : []
  const excludeCodes = Array.isArray(cellData.exclude_codes) ? cellData.exclude_codes : []
  // TopSubject와 동일한 패턴: properties.use_order처럼 직접 읽기
  const isExcludeEnabled = cellData.exclude === true

  // TopSubject와 동일한 패턴: 체크박스 클릭 핸들러
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!readOnly && onChange) {
      const newValue = !isExcludeEnabled
      onChange('exclude', newValue)
      // 체크박스가 해제되면 exclude_codes도 초기화
      if (!newValue) {
        onChange('exclude_codes', [])
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <List
        element={createListElement({
          item_type: 'Token',
          menu_key: 'admission_code',
          value: codes,
          optional: false,
          visible: true,
        })}
        onChange={(value) => {
          if (!readOnly) {
            onChange('codes', Array.isArray(value) ? value : [])
          }
        }}
      />
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          cursor: readOnly ? 'not-allowed' : 'pointer',
          marginTop: '2px'
        }}
        onClick={handleCheckboxClick}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
      >
        <div 
          style={{
            width: '12px',
            height: '12px',
            border: '1.5px solid #333',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isExcludeEnabled ? '#333' : 'transparent',
            cursor: readOnly ? 'not-allowed' : 'pointer',
            flexShrink: 0
          }}
          onClick={handleCheckboxClick}
        >
          {isExcludeEnabled && (
            <svg 
              width="8" 
              height="8" 
              viewBox="0 0 10 10" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: 'white' }}
            >
              <path 
                d="M8.33334 2.5L3.75001 7.08333L1.66667 5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <span style={{ fontSize: '12px', userSelect: 'none', lineHeight: '1.2' }}>
          제외할 전형 추가
        </span>
      </div>
      {isExcludeEnabled && (
        <List
          element={createListElement({
            item_type: 'Token',
            menu_key: 'admission_code',
            value: excludeCodes,
            optional: false,
            visible: true,
          })}
          onChange={(value) => {
            if (!readOnly) {
              onChange('exclude_codes', Array.isArray(value) ? value : [])
            }
          }}
        />
      )}
    </div>
  )
}

