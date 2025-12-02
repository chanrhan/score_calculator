'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, Menu as MenuIcon, Layers } from 'lucide-react'
import styles from './layout.module.css'

interface SettingsLayoutProps {
  children: React.ReactNode
}

type NavItem = {
  label: string
  href: string
  Icon: React.ComponentType<any>
}

const NAV_ITEMS: NavItem[] = [
  { label: '데이터 업로드', href: '/settings/data-upload', Icon: Upload },
  { label: '토큰 관리', href: '/settings/token-menus', Icon: MenuIcon },
  { label: '블록 관리', href: '/settings/block-data', Icon: Layers },
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>설정</div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`} aria-current={isActive ? 'page' : undefined}>
                <Icon className={styles.navIcon} />
                <span className={styles.navLabel}>{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  )
}


