"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Upload, 
  Settings,
  Workflow,
  BarChart3,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUniversity } from '@/store/useUniversity'
import styles from './header.module.css'

const menuItems = [
  {
    title: '대시보드',
    href: '/',
    icon: LayoutDashboard,
    description: '데이터 현황 및 통계'
  },
  // {
  //   title: '데이터 업로드',
  //   href: '/settings/data-upload',
  //   icon: Upload,
  //   description: '학생부 및 편제 데이터 업로드'
  // },
  {
    title: '파이프라인',
    href: '/pipelines',
    icon: Workflow,
    description: '성적 계산 파이프라인 관리'
  },
  {
    title: '성적 결과',
    href: '/grade-results',
    icon: BarChart3,
    description: '성적 계산 결과 조회'
  },
  {
    title: '설정',
    href: '/settings',
    icon: Settings,
    description: '데이터 업로드, 토큰/블록 관리'
  }
]

export default function Header() {
  const pathname = usePathname()
  const { universities, selectedUnivId, setSelectedUnivId, loadUniversities, addUniversity } = useUniversity()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUnivName, setNewUnivName] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadUniversities()
  }, [loadUniversities])

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.headerContent}>
            {/* 로고/제목 */}
            <div className={styles.logo}>
              <h1 className={styles.logoTitle}>진학 프로젝트</h1>
            </div>

            {/* 데스크톱 네비게이션 */}
            <nav className={styles.desktopNav}>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      styles.navLink,
                      isActive ? styles.navLinkActive : styles.navLinkInactive
                    )}
                    title={item.title}
                  >
                    <Icon 
                      size={20} 
                      className={cn(
                        styles.navIcon,
                        isActive ? styles.navIconActive : styles.navIconInactive
                      )} 
                    />
                    {/* 툴팁 */}
                    <div className={styles.tooltip}>
                      {item.title}
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* 우측 영역: 대학교 선택 + 모바일 메뉴 */}
            <div className={styles.headerRight}>
              {/* 대학교 선택 드롭다운 */}
              <div>
                <select
                  className={styles.universitySelect}
                  value={selectedUnivId}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '__ADD__') {
                      setShowAddModal(true)
                      setSelectedUnivId('')
                    } else {
                      setSelectedUnivId(v)
                    }
                  }}
                >
                  <option value="">대학교 선택</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                  <option value="__ADD__">+ 대학교 추가</option>
                </select>
              </div>

              {/* 모바일 메뉴 버튼 */}
              <button
                className={styles.mobileMenuButton}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuContent}>
              {/* 모바일 대학교 선택 */}
              <div className={styles.mobileUniversitySection}>
                <label className={styles.mobileUniversityLabel}>대학교 선택</label>
                <select
                  className={styles.mobileUniversitySelect}
                  value={selectedUnivId}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '__ADD__') {
                      setShowAddModal(true)
                      setSelectedUnivId('')
                    } else {
                      setSelectedUnivId(v)
                    }
                  }}
                >
                  <option value="">대학교 선택</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                  <option value="__ADD__">+ 대학교 추가</option>
                </select>
              </div>

              {/* 모바일 네비게이션 */}
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      styles.mobileNavLink,
                      isActive ? styles.mobileNavLinkActive : styles.mobileNavLinkInactive
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon 
                      size={20} 
                      className={cn(
                        styles.mobileNavIcon,
                        isActive ? styles.mobileNavIconActive : styles.mobileNavIconInactive
                      )} 
                    />
                    <span className={styles.mobileNavText}>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* 대학교 추가 모달 */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>대학교 추가</h2>
            <input
              className={styles.modalInput}
              placeholder="대학교명을 입력하세요"
              value={newUnivName}
              onChange={(e) => setNewUnivName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newUnivName.trim()) {
                  e.preventDefault()
                  document.getElementById('add-university-btn')?.click()
                }
              }}
            />
            <div className={styles.modalActions}>
              <button 
                className={`${styles.modalButton} ${styles.modalButtonCancel}`}
                onClick={() => { 
                  setShowAddModal(false) 
                  setNewUnivName('') 
                }}
              >
                취소
              </button>
              <button
                id="add-university-btn"
                className={`${styles.modalButton} ${styles.modalButtonSubmit}`}
                disabled={!newUnivName.trim()}
                onClick={async () => {
                  try {
                    await addUniversity(newUnivName.trim())
                    setShowAddModal(false)
                    setNewUnivName('')
                  } catch (e) {
                    alert('대학교 추가에 실패했습니다.')
                  }
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
