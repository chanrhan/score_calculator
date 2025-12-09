'use client'

import * as React from 'react'
import { TableElement } from '@/types/block-structure'
import { Table } from './Table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Table2 } from 'lucide-react'
import styles from './TableModal.module.css'

interface TableModalProps {
  element: TableElement
  onChange?: (value: any) => void
  className?: string
  input_prop?: string
  output_prop?: string
}

export const TableModal: React.FC<TableModalProps> = ({ 
  element, 
  onChange, 
  className = '',
  input_prop,
  output_prop
}) => {
  const { optional, visible } = element
  const [open, setOpen] = React.useState(false)
  const [localElement, setLocalElement] = React.useState<TableElement>(element)
  const tableRef = React.useRef<{ getCurrentTableData: () => any[][] } | null>(null)
  
  // element prop이 변경되면 로컬 state도 업데이트
  React.useEffect(() => {
    setLocalElement(element)
  }, [element])

  // 모달이 닫힐 때 최종 상태 저장
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!newOpen && open) {
      // 모달이 닫힐 때 최종 상태 저장
      if (onChange) {
        if (tableRef.current) {
          // Table 컴포넌트에서 최신 tableData 가져오기
          try {
            const currentTableData = tableRef.current.getCurrentTableData()
            const finalElement = { ...localElement, value: currentTableData }
            console.log('Saving on close:', finalElement)
            onChange(finalElement)
          } catch (error) {
            console.error('Error getting current table data:', error)
            // 에러 발생 시 localElement 사용
            onChange(localElement)
          }
        } else {
          // tableRef가 없으면 localElement 사용
          console.log('Saving on close (no ref):', localElement)
          onChange(localElement)
        }
      }
    }
    setOpen(newOpen)
  }, [open, onChange, localElement])

  if (optional && !visible) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
          }}
          className={styles.tableButton}
        >
          <Table2 className={styles.buttonIcon} />
          <span className={styles.buttonText}>매핑 테이블 편집</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={styles.popoverContent}
        side="bottom"
        align="start"
        sideOffset={8}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className={styles.popoverHeader}>
          <span className={styles.popoverTitle}>테이블 편집</span>
        </div>
        <div className={styles.tableContainer}>
          <Table
            ref={tableRef}
            element={localElement}
            onChange={(newValue) => {
              // value만 변경하는 경우 - 로컬 state 업데이트
              const updatedElement = { ...localElement, value: newValue }
              setLocalElement(updatedElement)
              // 실시간으로도 저장
              onChange?.(updatedElement)
            }}
            onElementChange={(partialElement) => {
              // element 속성 변경 (range 등) - 로컬 state 업데이트
              console.log('onElementChange called in TableModal:', partialElement)
              const updatedElement = { ...localElement, ...partialElement }
              console.log('Updated element:', updatedElement)
              setLocalElement(updatedElement)
              // 실시간으로도 저장
              if (onChange) {
                console.log('Calling onChange with updated element')
                onChange(updatedElement)
              }
            }}
            input_prop={input_prop}
            output_prop={output_prop}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

