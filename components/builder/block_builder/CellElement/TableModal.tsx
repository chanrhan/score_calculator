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
  onChange?: (value: any[][]) => void
  className?: string
}

export const TableModal: React.FC<TableModalProps> = ({ 
  element, 
  onChange, 
  className = '' 
}) => {
  const { optional, visible } = element
  const [open, setOpen] = React.useState(false)

  if (optional && !visible) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            element={element}
            onChange={(newValue) => {
              onChange?.(newValue)
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

