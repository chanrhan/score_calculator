import { NextRequest, NextResponse } from 'next/server'
import { ingestRows } from '@/application/data/ingest'
import { dataRepo } from '@/services/data-repo'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { resource: string } }) {
  try {
    const resource = params.resource as 'admissions' | 'units' | 'curricula' | 'subject_separation'
    const body = await req.json()
    const rows = Array.isArray(body?.rows) ? body.rows : []
    const mode = (body?.mode ?? 'upsert') as 'upsert' | 'insert' | 'update'
    const univ_id = String(body?.univ_id ?? '')
    if (!univ_id) return NextResponse.json({ ok: false, error: 'univ_id is required' }, { status: 400 })

    // 간단 매핑: DB 업서트를 위한 최소 필드만 추출
    // 한글 헤더 공백 제거 매핑
    const normalizeKey = (s: any) => String(s ?? '').replace(/\s+/g, '').toLowerCase()
    const mapAdmissions = (r: any) => ({
      univ_id,
      code: r['code'] ?? r['전형코드'] ?? r['전형 코드'] ?? r['전형코 드'],
      name: r['name'] ?? r['전형명'] ?? r['전형 명'],
    })
    const mapUnits = (r: any) => ({
      univ_id,
      code: r['code'] ?? r['단위코드'] ?? r['단위 코드'] ?? r['단위코 드'],
      name: r['name'] ?? r['단위명'] ?? r['단위 명'],
    })
    const mapCurricula = (r: any) => ({
      univ_id,
      organization_code: r['organization_code'] ?? r['편제코드'] ?? r['편제 코드'],
      organization_name: r['organization_name'] ?? r['편제명'] ?? r['편제 명'],
      subject_code: r['subject_code'] ?? r['과목코드'] ?? r['과목 코드'] ?? r['과목코 드'],
      subject_name: r['subject_name'] ?? r['과목명'] ?? r['과목 명'],
      course_code: r['course_code'] ?? r['교과코드'] ?? r['교과 코드'] ?? r['교과코 드'],
    })
    const mapSubjectSeparations = (r: any) => ({
      univ_id,
      subject_name: r['subject_name'] ?? r['과목명'] ?? r['과목 명'],
      subject_code: r['subject_code'] ?? r['과목코드'] ?? r['과목 코드'] ?? r['과목코 드'],
      subject_separation_code: r['subject_separation_code'] ?? r['과목구분코드'] ?? r['과목 구분 코드'],
    })

    // 공백 무시 매칭을 위해 key를 정규화한 사본 생성
    const normalizedRows = rows.map((r: any) => {
      const obj: Record<string, any> = {}
      Object.keys(r).forEach((k) => {
        obj[normalizeKey(k)] = r[k]
      })
      return obj
    })

    let mapped = normalizedRows
    if (resource === 'admissions') mapped = normalizedRows.map(mapAdmissions).filter((r: any) => r.code && r.name)
    if (resource === 'units') mapped = normalizedRows.map(mapUnits).filter((r: any) => r.code && r.name)
    if (resource === 'curricula') mapped = normalizedRows
      .map((r: any) => ({
        univ_id,
        organization_code: r['organization_code'] ?? r['편제코드'] ?? r['편제 코드'] ?? r['code'],
        organization_name: r['organization_name'] ?? r['편제명'] ?? r['편제 명'] ?? r['name'],
        subject_code: r['subject_code'] ?? r['과목코드'] ?? r['과목 코드'] ?? r['과목코 드'],
        subject_name: r['subject_name'] ?? r['과목명'] ?? r['과목 명'],
        course_code: r['course_code'] ?? r['교과코드'] ?? r['교과 코드'] ?? r['교과코 드'],
        subject_group: r['subject_group'] ?? r['대학교과명'],
      }))
      .filter((r: any) => r.organization_code && r.organization_name && r.subject_code && r.subject_name && r.course_code)
    if (resource === 'subject_separation') mapped = normalizedRows
      .map(mapSubjectSeparations)
      .filter((r: any) => r.subject_name && r.subject_separation_code)

    if (resource === 'admissions') {
      await dataRepo.upsertTokenItems('admission_code', mapped as any)
      return NextResponse.json({ ok: true, data: { summary: { inserted: (mapped as any[]).length, updated: 0, skipped: 0 } } })
    }
    if (resource === 'units') {
      await dataRepo.upsertTokenItems('major_code', mapped as any)
      return NextResponse.json({ ok: true, data: { summary: { inserted: (mapped as any[]).length, updated: 0, skipped: 0 } } })
    }
    if (resource === 'curricula') {
      await dataRepo.upsertCurricula(mapped as any)
      return NextResponse.json({ ok: true, data: { summary: { inserted: (mapped as any[]).length, updated: 0, skipped: 0 } } })
    }
    if (resource === 'subject_separation') {
      await dataRepo.upsertSubjectSeparations(mapped as any)
      return NextResponse.json({ ok: true, data: { summary: { inserted: (mapped as any[]).length, updated: 0, skipped: 0 } } })
    }
    const summary = await ingestRows({ resource, rows: mapped, mode, repo: dataRepo, eventName: `data:${resource}` })
    return NextResponse.json({ ok: true, data: { summary } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'ingest failed' }, { status: 500 })
  }
}


