"use client"

import Header from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'
import styles from './main-layout.module.css'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className={styles.container}>
      {/* 상단 헤더 */}
      <Header />
      
      {/* 메인 콘텐츠 영역 */}
      <div className={styles.main}>
        {children}
      </div>
      
      {/* Toast 알림 */}
      <Toaster />
    </div>
  )
}
