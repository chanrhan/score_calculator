'use client'

import { useState, useEffect } from 'react'
import { useUniversity } from '@/store/useUniversity'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TokenMenuManager from '@/components/pipeline-settings/TokenMenuManager'
import BlockDataManager from '@/components/pipeline-settings/BlockDataManager'
import styles from './page.module.css'

export default function PipelineSettingsPage() {
  const { selectedUnivId } = useUniversity()
  const [activeTab, setActiveTab] = useState('token-menus')

  if (!selectedUnivId) {
    return (
      <div className={styles.noSelectionContainer}>
        <div className={styles.noSelectionContent}>
          <h2 className={styles.noSelectionTitle}>
            대학교를 선택해주세요
          </h2>
          <p className={styles.noSelectionDescription}>
            왼쪽 사이드바에서 대학교를 선택한 후 설정을 진행해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>파이프라인 설정</h1>
        <p className={styles.subtitle}>
          블록 설정 및 토큰 메뉴를 관리할 수 있습니다.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          <button 
            className={`${styles.tabsTrigger} ${activeTab === 'token-menus' ? styles.tabsTriggerActive : ''}`}
            onClick={() => setActiveTab('token-menus')}
          >
            토큰 메뉴 관리
          </button>
          <button 
            className={`${styles.tabsTrigger} ${activeTab === 'block-data' ? styles.tabsTriggerActive : ''}`}
            onClick={() => setActiveTab('block-data')}
          >
            블록 데이터 관리
          </button>
        </div>
        
        <div className={styles.tabsContent}>
          {activeTab === 'token-menus' && (
            <TokenMenuManager univId={selectedUnivId} />
          )}
          
          {activeTab === 'block-data' && (
            <BlockDataManager univId={selectedUnivId} />
          )}
        </div>
      </Tabs>
    </div>
  )
}
