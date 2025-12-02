'use client'

import { useEffect, useState } from 'react'
import { Upload, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUniversity } from '@/store/useUniversity'
import styles from './page.module.css'

type Resource = 'admissions' | 'units' | 'curricula'

export default function SettingsCurriculumUploadPage() {
  const { selectedUnivId } = useUniversity()
  const [resource, setResource] = useState<Resource>('admissions')
  const [rows, setRows] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [newRow, setNewRow] = useState<Record<string, string>>({})
  const [isUploadingExcel, setIsUploadingExcel] = useState(false)

  const handleUploadExcel = async (file: File) => {
    if (!selectedUnivId) return alert('사이드바에서 대학교를 선택해주세요')
    setIsUploadingExcel(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('univ_id', selectedUnivId)
      const res = await fetch(`/api/data/${resource}/upload`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!json?.ok) return alert(json?.error || '업로드 실패')
      const list = await fetch(`/api/data/${resource}?univ_id=${selectedUnivId}`).then(r => r.json())
      if (list?.ok) setRows(list.data)
    } finally {
      setIsUploadingExcel(false)
    }
  }

  const handleAddRow = async () => {
    if (!selectedUnivId) return alert('사이드바에서 대학교를 선택해주세요')
    let payload: any[] = []
    if (resource === 'admissions') {
      payload = [{ code: newRow.code, name: newRow.name }]
    } else if (resource === 'units') {
      payload = [{ code: newRow.code, name: newRow.name }]
    } else if (resource === 'curricula') {
      payload = [{ 
        organization_code: newRow.organization_code,
        organization_name: newRow.organization_name, 
        subject_code: newRow.subject_code, 
        subject_name: newRow.subject_name, 
        course_code: newRow.course_code,
        subject_group: newRow.subject_group,
      }]
    }
    await fetch(`/api/data/${resource}/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: payload, univ_id: selectedUnivId }) })
    setNewRow({})
    const res = await fetch(`/api/data/${resource}?univ_id=${selectedUnivId}`)
    const json = await res.json()
    if (json?.ok) setRows(json.data)
  }

  const handleDeleteRow = async (row: any) => {
    if (!selectedUnivId) return
    let body: any = { univ_id: selectedUnivId }
    if (resource === 'admissions' || resource === 'units') {
      body.code = row.code
    } else if (resource === 'curricula') {
      body.organization_code = row.organization_code
      body.subject_code = row.subject_code
      body.course_code = row.course_code
    }
    await fetch(`/api/data/${resource}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const res = await fetch(`/api/data/${resource}?univ_id=${selectedUnivId}`)
    const json = await res.json()
    if (json?.ok) setRows(json.data)
  }

  const handleDeleteAll = async () => {
    if (!selectedUnivId) return alert('사이드바에서 대학교를 선택해주세요')
    if (rows.length === 0) return alert('삭제할 데이터가 없습니다')
    if (!confirm(`현재 ${resource === 'admissions' ? '전형' : resource === 'units' ? '단위' : '편제'} 데이터 ${rows.length}건을 모두 삭제하시겠습니까?`)) return
    if (resource === 'admissions' || resource === 'units') {
      // 토큰 메뉴 일괄 삭제 전용 엔드포인트 (단일 호출)
      const menuKey = resource === 'admissions' ? 'admission_code' : 'major_code'
      await fetch(`/api/token-menu-items/${selectedUnivId}/${menuKey}`, { method: 'DELETE' })
    } else if (resource === 'curricula') {
      // 편제 일괄 삭제 (단일 호출)
      await fetch(`/api/data/${resource}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ univ_id: selectedUnivId, delete_all: true }) })
    }
    const res = await fetch(`/api/data/${resource}?univ_id=${selectedUnivId}`)
    const json = await res.json()
    if (json?.ok) setRows(json.data)
    alert(`${resource === 'admissions' ? '전형' : resource === 'units' ? '단위' : '편제'} 데이터 ${rows.length}건이 모두 삭제되었습니다.`)
  }

  useEffect(() => {
    const load = async () => {
      if (!selectedUnivId) return
      const res = await fetch(`/api/data/${resource}?univ_id=${selectedUnivId}`)
      const json = await res.json()
      if (json?.ok) {
        setRows(json.data)
        const cols = resource === 'curricula' ? ['organization_code', 'organization_name', 'subject_code', 'subject_name', 'course_code', 'subject_group'] : ['code', 'name']
        setColumns(cols)
      }
    }
    load()
  }, [resource, selectedUnivId])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>전형/단위/편제 데이터</h1>
      <p className={styles.subtitle}>전형, 단위, 편제 정보를 업로드하거나 직접 입력합니다.</p>

      <div className={styles.toolbar}>
        <div className={styles.segmented}>
          <button className={`${styles.segmentedItem} ${resource === 'admissions' ? styles.segmentedItemActive : ''}`} onClick={() => setResource('admissions')}>전형</button>
          <button className={`${styles.segmentedItem} ${resource === 'units' ? styles.segmentedItemActive : ''}`} onClick={() => setResource('units')}>단위</button>
          <button className={`${styles.segmentedItem} ${resource === 'curricula' ? styles.segmentedItemActive : ''}`} onClick={() => setResource('curricula')}>편제</button>
        </div>
        <label className={styles.uploadButton}>
          <Upload className={styles.uploadButtonIcon} />
          엑셀 업로드
          <input className={styles.uploadInput} type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files && handleUploadExcel(e.target.files[0])} />
        </label>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              {columns.map((c) => (
                <th key={c} className={styles.tableHeaderCell}>{c}</th>
              ))}
              <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellRight}`}>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.tableRow}>
              {columns.map((c) => (
                <td key={c} className={styles.tableCell}>
                  <input className={styles.input} value={newRow[c] || ''} onChange={e => setNewRow({ ...newRow, [c]: e.target.value })} placeholder={c} />
                </td>
              ))}
              <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                <Button size="sm" onClick={handleAddRow} disabled={!selectedUnivId}>
                  <Plus className={styles.buttonIcon} />
                </Button>
              </td>
            </tr>
            {rows.map((r, idx) => (
              <tr key={idx} className={styles.tableRow}>
                {columns.map((c) => (
                  <td key={c} className={styles.tableCell}>{String(r[c])}</td>
                ))}
                <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                  <button className={styles.deleteButton} onClick={() => handleDeleteRow(r)} disabled={!selectedUnivId}>
                    <X className={styles.deleteButtonIcon} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className={styles.deleteAllContainer}>
          <button className={styles.deleteAllButton} onClick={handleDeleteAll}>
            <Trash2 className={styles.deleteAllButtonIcon} />
            모두 삭제
          </button>
        </div>
      )}
    </div>
  )
}


