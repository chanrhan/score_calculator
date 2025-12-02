'use client'

import FileUpload from '@/components/file-upload'
import { useEffect, useState } from 'react'
import { useUniversity } from '@/store/useUniversity'
import styles from './page.module.css'

type TokenTab = 'admissions' | 'units' | 'curricula' | 'subject_separation'

export default function SettingsDataUploadPage() {
  const { selectedUnivId } = useUniversity()
  const [studentMsg, setStudentMsg] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [newRow, setNewRow] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<TokenTab>('curricula')

  const handleStudentUpload = async (file: File) => {
    setStudentMsg('업로드를 시작합니다...')
    try {
      const maxSize = 3 * 1024 * 1024 * 1024
      if (file.size > maxSize) throw new Error('파일 크기가 3GB를 초과합니다.')
      if (!file.name.toLowerCase().endsWith('.db3')) throw new Error('.db3 파일만 업로드 가능합니다.')
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/upload', { method: 'POST', body: formData, signal: AbortSignal.timeout(30 * 60 * 1000) })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '파일 업로드에 실패했습니다.')
      }
      setStudentMsg('업로드가 완료되었습니다!')
    } catch (e) {
      setStudentMsg(e instanceof Error ? e.message : '업로드 중 오류가 발생했습니다.')
    }
  }

  // 데이터 탭: 전형/단위는 토큰, 편제는 테이블
  const resource: TokenTab = tab

  const loadCurricula = async () => {
    if (!selectedUnivId) return
    const res = await fetch(`/api/data/${resource}?univ_id=${selectedUnivId}`)
    const json = await res.json()
    if (json?.ok) {
      setRows(json.data)
      if (resource === 'curricula') {
        setColumns(['organization_code', 'organization_name', 'subject_code', 'subject_name', 'course_code', 'subject_group'])
      } else if (resource === 'subject_separation') {
        setColumns(['subject_name', 'subject_code', 'subject_separation_code'])
      }
    }
  }

  // 탭/대학 변경 시 데이터 로드
  useEffect(() => {
    const load = async () => {
      if (!selectedUnivId) return
      if (resource === 'admissions' || resource === 'units') {
        const menuKey = resource === 'admissions' ? 'admission_code' : 'major_code'
        const r = await fetch(`/api/token-menus/${selectedUnivId}/${menuKey}`)
        if (r.ok) {
          const data = await r.json()
          setRows(Array.isArray(data?.items) ? data.items : [])
          setColumns(['value', 'label'])
        }
      } else {
        // 편제/과목구분 테이블 데이터 표시
        await loadCurricula()
      }
    }
    load()
  }, [resource, selectedUnivId])

  const handleUploadExcel = async (file: File) => {
    if (!selectedUnivId) return alert('사이드바에서 대학교를 선택해주세요')
    const fd = new FormData()
    fd.set('file', file)
    fd.set('univ_id', selectedUnivId)
    // 전형/단위 업로드도 허용하여 토큰으로 반영
    const res = await fetch(`/api/data/${resource}/upload`, { method: 'POST', body: fd })
    const json = await res.json()
    if (!json?.ok) return alert(json?.error || '업로드 실패')
    if (resource === 'admissions' || resource === 'units') {
      const menuKey = resource === 'admissions' ? 'admission_code' : 'major_code'
      const r = await fetch(`/api/token-menus/${selectedUnivId}/${menuKey}`)
      if (r.ok) {
        const data = await r.json()
        setRows(Array.isArray(data?.items) ? data.items : [])
      }
    } else {
      await loadCurricula()
    }
  }

  const handleAddRow = async () => {
    if (!selectedUnivId) return alert('사이드바에서 대학교를 선택해주세요')
    if (resource === 'admissions' || resource === 'units') {
      if (!newRow.value || !newRow.label) return alert('코드와 이름을 입력해주세요')
      const menuKey = resource === 'admissions' ? 'admission_code' : 'major_code'
      const resp = await fetch(`/api/token-menu-items/${selectedUnivId}/${menuKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: newRow.value, label: newRow.label })
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        return alert(err?.error || '추가 실패')
      }
      setNewRow({})
      const r = await fetch(`/api/token-menus/${selectedUnivId}/${menuKey}`)
      if (r.ok) {
        const data = await r.json()
        setRows(Array.isArray(data?.items) ? data.items : [])
      }
      return
    } else if (resource === 'curricula') {
      // subject_organization 단일 행 추가
      const required = ['organization_code','organization_name','subject_code','subject_name','course_code']
      for (const k of required) if (!newRow[k]) return alert('모든 필드를 입력해주세요')
      const payload = [{
        organization_code: newRow.organization_code,
        organization_name: newRow.organization_name,
        subject_code: newRow.subject_code,
        subject_name: newRow.subject_name,
        course_code: newRow.course_code,
        subject_group: newRow.subject_group,
      }]
      const resp = await fetch(`/api/data/curricula/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: payload, univ_id: selectedUnivId }) })
      const json = await resp.json()
      if (!json?.ok) return alert(json?.error || '추가 실패')
      setNewRow({})
      await loadCurricula()
      return
    } else if (resource === 'subject_separation') {
      const required = ['subject_name','subject_separation_code']
      for (const k of required) if (!newRow[k]) return alert('모든 필드를 입력해주세요')
      const payload = [{
        subject_name: newRow.subject_name,
        subject_code: newRow.subject_code,
        subject_separation_code: newRow.subject_separation_code,
      }]
      const resp = await fetch(`/api/data/subject_separation/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: payload, univ_id: selectedUnivId }) })
      const json = await resp.json()
      if (!json?.ok) return alert(json?.error || '추가 실패')
      setNewRow({})
      await loadCurricula()
      return
    }
    // no-op
  }

  const handleDeleteRow = async (row: any) => {
    if (!selectedUnivId) return
    if (resource === 'admissions' || resource === 'units') {
      const menuKey = resource === 'admissions' ? 'admission_code' : 'major_code'
      await fetch(`/api/token-menu-items/${selectedUnivId}/${menuKey}/${row.order}`, { method: 'DELETE' })
      const r = await fetch(`/api/token-menus/${selectedUnivId}/${menuKey}`)
      if (r.ok) {
        const data = await r.json()
        setRows(Array.isArray(data?.items) ? data.items : [])
      }
      return
    } else if (resource === 'curricula') {
      await fetch(`/api/data/curricula`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ univ_id: selectedUnivId, organization_code: row.organization_code, subject_code: row.subject_code, course_code: row.course_code }) })
      await loadCurricula()
      return
    } else if (resource === 'subject_separation') {
      await fetch(`/api/data/subject_separation`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ univ_id: selectedUnivId, subject_name: row.subject_name }) })
      await loadCurricula()
      return
    }
    // no-op
  }

  const handleDeleteAll = async () => {
    if (!selectedUnivId) return alert('사이드바에서 대학교를 선택해주세요')
    if (!confirm('현재 탭의 데이터를 모두 삭제하시겠습니까?')) return
    try {
      if (resource === 'admissions' || resource === 'units') {
        const menuKey = resource === 'admissions' ? 'admission_code' : 'major_code'
        const res = await fetch(`/api/token-menu-items/${selectedUnivId}/${menuKey}`, { method: 'DELETE' })
        if (!res.ok) return alert('전체 삭제 실패')
        const r = await fetch(`/api/token-menus/${selectedUnivId}/${menuKey}`)
        if (r.ok) {
          const data = await r.json()
          setRows(Array.isArray(data?.items) ? data.items : [])
        }
      } else if (resource === 'curricula') {
        // 편제 일괄 삭제 (단일 API 호출)
        const res = await fetch(`/api/data/curricula`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ univ_id: selectedUnivId, delete_all: true }) })
        if (!res.ok) return alert('전체 삭제 실패')
        await loadCurricula()
      } else if (resource === 'subject_separation') {
        const res = await fetch(`/api/data/subject_separation`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ univ_id: selectedUnivId, delete_all: true }) })
        if (!res.ok) return alert('전체 삭제 실패')
        await loadCurricula()
      }
      alert('삭제가 완료되었습니다.')
    } catch (e) {
      alert('전체 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>데이터 업로드</h1>
      <p className={styles.subtitle}>좌측은 학생부(.db3), 우측은 전형/단위(토큰)/편제(엑셀).</p>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>학생부 데이터 업로드</h2>
          <FileUpload onFileUpload={handleStudentUpload} />
          {studentMsg && <p className={styles.message}>{studentMsg}</p>}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>전형/단위/편제 데이터</h2>
          <div className={styles.uploadRow}>
            <div style={{ display: 'inline-flex', gap: '6px', marginRight: '8px' }}>
              <button className={`${styles.addButton} ${tab === 'admissions' ? styles.tabActive : ''}`} onClick={() => setTab('admissions')}>전형</button>
              <button className={`${styles.addButton} ${tab === 'units' ? styles.tabActive : ''}`} onClick={() => setTab('units')}>단위</button>
              <button className={`${styles.addButton} ${tab === 'curricula' ? styles.tabActive : ''}`} onClick={() => setTab('curricula')}>편제</button>
              <button className={`${styles.addButton} ${tab === 'subject_separation' ? styles.tabActive : ''}`} onClick={() => setTab('subject_separation')}>과목구분</button>
            </div>
          </div>
          <div className={styles.uploadRow}>
            <label className={styles.uploadButton}>
              엑셀 업로드
              <input className={styles.uploadInput} type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files && handleUploadExcel(e.target.files[0])} />
            </label>
            <button className={styles.addButton} style={{ marginLeft: 8 }} onClick={handleDeleteAll} disabled={!selectedUnivId}>전체 삭제</button>
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
                    <button className={styles.addButton} onClick={handleAddRow} disabled={!selectedUnivId}>추가</button>
                  </td>
                </tr>
                {rows.map((r, idx) => (
                  <tr key={idx} className={styles.tableRow}>
                    {columns.map((c) => (
                      <td key={c} className={styles.tableCell}>{String(r[c])}</td>
                    ))}
                    <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                      <button className={styles.deleteButton} onClick={() => handleDeleteRow(r)} disabled={!selectedUnivId}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}


