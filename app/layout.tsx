import type { Metadata } from 'next'
import './globals.css'
import MainLayout from '@/components/layout/main-layout'

export const metadata: Metadata = {
  title: '진학 프로젝트',
  description: '대학별 교과성적 산출방법을 시각적으로 구성하고 관리합니다.',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}
