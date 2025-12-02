'use client'

import { useState } from 'react'
import FileUpload from '@/components/file-upload'
import styles from './page.module.css'

export default function SettingsStudentsUploadPage() {
  const [message, setMessage] = useState<string>('')

  const handleFileUpload = async (file: File) => {
    setMessage('업로드를 시작합니다...')
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

      setMessage('업로드가 완료되었습니다!')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '업로드 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>학생부 데이터 업로드</h1>
      <p className={styles.subtitle}>.db3 파일을 업로드하여 학생부 데이터를 등록합니다.</p>
      <div className={styles.card}>
        <FileUpload onFileUpload={handleFileUpload} />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  )
}


