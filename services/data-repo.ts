import { prisma } from '@/lib/prisma'

export type AdmissionUpsertRow = { univ_id: string; code: string; name: string }
export type UnitUpsertRow = { univ_id: string; code: string; name: string }
export type TokenItemUpsertRow = { univ_id: string; code: string; name: string }

// 데이터 정제 함수 - UTF-8 인코딩 문제 해결
function sanitizeString(value: any): string {
  if (value === null || value === undefined) return ''
  
  let str = String(value)
  
  // null 바이트(0x00) 제거
  str = str.replace(/\0/g, '')
  
  // 기타 제어 문자 제거 (탭, 개행, 캐리지 리턴은 유지)
  str = str.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // 앞뒤 공백 제거
  str = str.trim()
  
  return str
}

export const dataRepo = {
  /**
   * 토큰 메뉴 항목 업서트
   * - 존재하지 않으면 해당 메뉴를 생성한 뒤, 항목을 추가
   * - 동일 value(=code)가 존재하면 label(=name)만 업데이트
   */
  async upsertTokenItems(menuKey: 'admission_code' | 'major_code' | 'organization_code', rows: TokenItemUpsertRow[]): Promise<void> {
    if (rows.length === 0) return
    // univ_id 별로 그룹핑하여 order 계산/메뉴 보장
    const rowsByUniv: Record<string, TokenItemUpsertRow[]> = rows.reduce((acc, row) => {
      acc[row.univ_id] = acc[row.univ_id] || []
      acc[row.univ_id].push(row)
      return acc
    }, {} as Record<string, TokenItemUpsertRow[]>)

    for (const [univ_id, univRows] of Object.entries(rowsByUniv)) {
      // 메뉴 존재 보장 (없으면 생성)
      const existingMenu = await prisma.token_menu.findUnique({
        where: { univ_id_key: { univ_id, key: menuKey } },
      })
      if (!existingMenu) {
        await prisma.token_menu.create({
          data: { univ_id, key: menuKey, name: menuKey, scope: 0 },
        })
      }

      // 일괄 처리
      for (const r of univRows) {
        // 특수 문자(* 등)는 패딩하지 않음
        const sanitizedCode = sanitizeString(String(r.code))
        const value = /^[0-9]+$/.test(sanitizedCode) 
          ? sanitizedCode.padStart(2, '0') 
          : sanitizedCode
        const label = sanitizeString(r.name)

        const existingItem = await prisma.token_menu_item.findFirst({
          where: { univ_id, menu_key: menuKey, value },
        })

        if (existingItem) {
          await prisma.token_menu_item.update({
            where: {
              univ_id_menu_key_order: {
                univ_id,
                menu_key: menuKey,
                order: existingItem.order,
              },
            },
            data: { label },
          })
        } else {
          const lastItem = await prisma.token_menu_item.findFirst({
            where: { univ_id, menu_key: menuKey },
            orderBy: { order: 'desc' },
          })
          const nextOrder = lastItem ? lastItem.order + 1 : 1
          await prisma.token_menu_item.create({
            data: {
              univ_id,
              menu_key: menuKey,
              order: nextOrder,
              label,
              value,
            },
          })
        }
      }
    }
  },

  async upsertAdmissions(rows: AdmissionUpsertRow[]): Promise<void> {
    if (rows.length === 0) return
    // 데이터 정제 및 코드는 2자리 제약. 패딩 보정 (특수 문자는 제외)
    const normalized = rows.map(r => {
      const sanitizedCode = sanitizeString(String(r.code))
      const code = /^[0-9]+$/.test(sanitizedCode) 
        ? sanitizedCode.padStart(2, '0') 
        : sanitizedCode
      return {
        ...r, 
        code,
        name: sanitizeString(r.name)
      }
    })
    await prisma.$transaction(
      normalized.map((r) =>
        prisma.admission.upsert({
          where: { univ_id_code: { univ_id: r.univ_id, code: r.code } },
          create: { univ_id: r.univ_id, code: r.code, name: r.name },
          update: { name: r.name },
        })
      )
    )
  },

  async upsertUnits(rows: UnitUpsertRow[]): Promise<void> {
    if (rows.length === 0) return
    // 데이터 정제 및 코드는 2자리 제약. 패딩 보정 (특수 문자는 제외)
    const normalized = rows.map(r => {
      const sanitizedCode = sanitizeString(String(r.code))
      const code = /^[0-9]+$/.test(sanitizedCode) 
        ? sanitizedCode.padStart(2, '0') 
        : sanitizedCode
      return {
        ...r, 
        code,
        name: sanitizeString(r.name)
      }
    })
    await prisma.$transaction(
      normalized.map((r) =>
        prisma.major.upsert({
          where: { univ_id_code: { univ_id: r.univ_id, code: r.code } },
          create: { univ_id: r.univ_id, code: r.code, name: r.name },
          update: { name: r.name },
        })
      )
    )
  },

  async upsertCurricula(rows: { univ_id: string; organization_code: string; organization_name: string; subject_code: string; subject_name: string; course_code: string; subject_group?: string }[]): Promise<void> {
    if (rows.length === 0) return
    // 데이터 정제
    const sanitized = rows.map(r => ({
      univ_id: sanitizeString(r.univ_id),
      organization_code: sanitizeString(r.organization_code),
      organization_name: sanitizeString(r.organization_name),
      subject_code: sanitizeString(r.subject_code),
      subject_name: sanitizeString(r.subject_name),
      course_code: sanitizeString(r.course_code),
      subject_group: r.subject_group ? sanitizeString(r.subject_group) : null,
    }))
    
    await prisma.$transaction(
      sanitized.map((r) =>
        (prisma as any).subject_organization.upsert({
          where: {
            univ_id_organization_code_subject_code_course_code: {
              univ_id: r.univ_id,
              organization_code: r.organization_code,
              subject_code: r.subject_code,
              course_code: r.course_code,
            },
          },
          create: {
            univ_id: r.univ_id,
            organization_code: r.organization_code,
            organization_name: r.organization_name,
            subject_code: r.subject_code,
            subject_name: r.subject_name,
            course_code: r.course_code,
            subject_group: r.subject_group ?? undefined,
          },
          update: {
            subject_name: r.subject_name,
            subject_group: r.subject_group ?? undefined,
          },
        })
      )
    )
  },

  async upsertSubjectSeparations(rows: { univ_id: string; subject_name: string; subject_code?: string | null; subject_separation_code: string }[]): Promise<void> {
    if (rows.length === 0) return
    const sanitized = rows.map(r => ({
      univ_id: sanitizeString(r.univ_id),
      subject_name: sanitizeString(r.subject_name),
      subject_code: r.subject_code ? sanitizeString(r.subject_code) : null,
      subject_separation_code: sanitizeString(r.subject_separation_code),
    }))
    await prisma.$transaction(
      sanitized.map(r =>
        (prisma as any).subject_separation.upsert({
          where: { univ_id_subject_name: { univ_id: r.univ_id, subject_name: r.subject_name } },
          create: {
            univ_id: r.univ_id,
            subject_name: r.subject_name,
            subject_code: r.subject_code ?? undefined,
            subject_separation_code: r.subject_separation_code,
          },
          update: {
            subject_code: r.subject_code ?? undefined,
            subject_separation_code: r.subject_separation_code,
          },
        })
      )
    )
  },
}


