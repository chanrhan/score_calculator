'use client'

import { useUniversity } from '@/store/useUniversity'
import BlockDataManager from '@/components/pipeline-settings/BlockDataManager'
import styles from './page.module.css'

export default function SettingsBlockDataPage() {
  const { selectedUnivId } = useUniversity()
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>블록 관리</h1>
      <p className={styles.subtitle}>블록 타입별 기본 설정 데이터를 관리합니다.</p>
      {!selectedUnivId ? (
        <div className={styles.notice}>사이드바에서 대학교를 선택해주세요.</div>
      ) : (
        <BlockDataManager univId={selectedUnivId} />
      )}
    </div>
  )
}


