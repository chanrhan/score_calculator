'use client'

import { useUniversity } from '@/store/useUniversity'
import TokenMenuManager from '@/components/pipeline-settings/TokenMenuManager'
import styles from './page.module.css'

export default function SettingsTokenMenusPage() {
  const { selectedUnivId } = useUniversity()
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>토큰 관리</h1>
      <p className={styles.subtitle}>드롭다운 토큰 메뉴와 항목을 관리합니다.</p>
      {!selectedUnivId ? (
        <div className={styles.notice}>사이드바에서 대학교를 선택해주세요.</div>
      ) : (
        <TokenMenuManager univId={selectedUnivId} />
      )}
    </div>
  )
}


