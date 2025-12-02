"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  BookOpen, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Database,
  FileText,
  Upload
} from "lucide-react"
import styles from "./page.module.css"

interface DashboardStats {
  hasData: boolean
  studentCount: number
  subjectCount: number
  builderCount?: number
  uploadCount?: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    hasData: false,
    studentCount: 0,
    subjectCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('통계 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statCards = [
    {
      title: "등록된 학생",
      value: stats.studentCount.toLocaleString(),
      description: "학생부에 등록된 총 학생 수",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "등록된 과목",
      value: stats.subjectCount.toLocaleString(),
      description: "학생부에 등록된 총 과목 수",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "계산 프로젝트",
      value: "0",
      description: "생성된 성적 계산 프로젝트",
      icon: Settings,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "업로드 횟수",
      value: "0",
      description: "총 데이터 업로드 횟수",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>대시보드</h1>
        <p className={styles.subtitle}>
          데이터 업로드 현황과 성적 계산 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 통계 카드들 */}
      <div className={styles.statsGrid}>
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className={styles.card}>
              <CardHeader className={styles.cardHeader}>
                <div className={styles.cardHeaderFlex}>
                  <CardTitle className={styles.cardTitle}>
                    {card.title}
                  </CardTitle>
                  <div className={`${styles.iconContainer} ${
                    card.color === "text-blue-600" ? styles.iconContainerBlue :
                    card.color === "text-green-600" ? styles.iconContainerGreen :
                    card.color === "text-purple-600" ? styles.iconContainerPurple :
                    styles.iconContainerOrange
                  }`}>
                    <Icon className={`${styles.icon} ${
                      card.color === "text-blue-600" ? styles.iconBlue :
                      card.color === "text-green-600" ? styles.iconGreen :
                      card.color === "text-purple-600" ? styles.iconPurple :
                      styles.iconOrange
                    }`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className={styles.cardContent}>
                <div className={styles.value}>{card.value}</div>
                <p className={styles.description}>
                  {card.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 상태 알림 */}
      <div className={styles.statusGrid}>
        {/* 데이터 상태 */}
        <Card className={styles.card}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardHeaderFlex}>
              <Database className={styles.icon} />
              데이터 상태
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            {stats.hasData ? (
              <Alert className={styles.alert}>
                <div className={styles.alertFlex}>
                  <CheckCircle className={styles.alertIcon} />
                  <AlertDescription className={styles.alertDescription}>
                    학생부 데이터가 정상적으로 등록되어 있습니다.
                  </AlertDescription>
                </div>
              </Alert>
            ) : (
              <Alert className={styles.alert}>
                <div className={styles.alertFlex}>
                  <AlertCircle className={styles.alertIcon} />
                  <AlertDescription className={styles.alertDescription}>
                    아직 학생부 데이터가 등록되지 않았습니다. 
                    <a href="/upload" className={styles.link}>
                      데이터 업로드
                    </a>
                    페이지에서 데이터를 업로드해주세요.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 계산 상태 */}
        <Card className={styles.card}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardHeaderFlex}>
              <Settings className={styles.icon} />
              계산 상태
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <Alert className={styles.alert}>
              <div className={styles.alertFlex}>
                <AlertCircle className={styles.alertIcon} />
                <AlertDescription className={styles.alertDescription}>
                  성적 계산 기능이 준비 중입니다.
                </AlertDescription>
              </div>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle>빠른 액션</CardTitle>
          <CardDescription>
            자주 사용하는 기능에 빠르게 접근하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          <div className={styles.quickActionsGrid}>
            <a 
              href="/upload" 
              className={styles.actionLink}
            >
              <Upload className={styles.actionIcon} />
              <div className={styles.actionContent}>
                <div className={styles.actionTitle}>데이터 업로드</div>
                <div className={styles.actionSubtitle}>학생부 및 전형 데이터 업로드</div>
              </div>
            </a>
            <div className={`${styles.actionLink} ${styles.actionLinkDisabled}`}>
              <Settings className={styles.actionIconDisabled} />
              <div className={styles.actionContent}>
                <div className={styles.actionTitleDisabled}>계산기 (준비중)</div>
                <div className={styles.actionSubtitleDisabled}>성적 계산 기능</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
