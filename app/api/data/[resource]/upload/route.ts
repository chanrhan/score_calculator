import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { ingestRows } from '@/application/data/ingest'
import { dataRepo } from '@/services/data-repo'

export const runtime = 'nodejs'

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

// 객체의 모든 문자열 값 정제
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

export async function POST(req: NextRequest, { params }: { params: { resource: string } }) {
  try {
    const resource = params.resource as 'admissions' | 'units' | 'curricula' | 'organizations'
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ ok: false, error: 'multipart/form-data required' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const univ_id = String(formData.get('univ_id') || '')
    if (!file) return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 })
    if (!univ_id) return NextResponse.json({ ok: false, error: 'univ_id is required' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // 시트 타입 감지 함수 - 헤더 컬럼명만으로 판단
    function detectSheetType(columns: string[]): 'admissions' | 'units' | 'curricula' | 'organizations' | 'subject_separation' | null {
      const normalizedColumns = columns.map(col => String(col).replace(/\s+/g, '').toLowerCase())
      // 과목구분 데이터 감지 - subject_separation_code 존재 시
      const hasSubjectSeparation = normalizedColumns.includes('subject_separation_code') || normalizedColumns.includes('과목구분코드') || normalizedColumns.includes('과목구분')
      
      // 전형 데이터 감지 - 헤더 컬럼명으로 판단
      const admissionKeywords = ['전형명', '전형코드', '전형 코드', '전형코 드']
      const hasAdmissionKeywords = admissionKeywords.some(keyword => 
        normalizedColumns.some(col => col.includes(keyword.replace(/\s+/g, '').toLowerCase()))
      )
      
      // 단위 데이터 감지 - 헤더 컬럼명으로 판단
      const unitKeywords = ['단위명', '단위코드', '단위 코드', '단위코 드']
      const hasUnitKeywords = unitKeywords.some(keyword => 
        normalizedColumns.some(col => col.includes(keyword.replace(/\s+/g, '').toLowerCase()))
      )
      
      // 조직(편제코드 목록) 감지: organization_code, organization_name이 있고 과목/교과 컬럼은 없음
      const hasOrgCode = normalizedColumns.includes('organization_code') || normalizedColumns.includes('편제코드') || normalizedColumns.includes('편제코드'.replace(/\s+/g, '').toLowerCase())
      const hasOrgName = normalizedColumns.includes('organization_name') || normalizedColumns.includes('편제명')
      const hasSubjectOrCourse = normalizedColumns.includes('subject_code') || normalizedColumns.includes('course_code') || normalizedColumns.includes('과목코드') || normalizedColumns.includes('교과코드')
      const isOrganizationsOnly = hasOrgCode && hasOrgName && !hasSubjectOrCourse

      // 편제 데이터 감지 - 헤더 컬럼명으로 판단
      const curriculaKeywords = ['편제코드', '편제 명', '편제명', '과목코드', '과목명', '교과코드', '과목 코드', '교과 코드', 'organization_code']
      const hasCurriculaKeywords = curriculaKeywords.some(keyword => 
        normalizedColumns.some(col => col.includes(keyword.replace(/\s+/g, '').toLowerCase()))
      )
      
      // 헤더 컬럼명으로만 판단
      if (hasAdmissionKeywords) return 'admissions'
      if (hasUnitKeywords) return 'units'
      if (hasSubjectSeparation) return 'subject_separation'
      if (isOrganizationsOnly) return 'organizations'
      if (hasCurriculaKeywords) return 'curricula'
      
      return null
    }

    const normalizeKey = (s: any) => String(s ?? '').replace(/\s+/g, '').toLowerCase()
    const pickFirst = (r: Record<string, any>, keys: string[]) => {
      for (const k of keys.map(normalizeKey)) {
        const v = r[k]
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
      }
      return undefined
    }

    const mapAdmissions = (r: any) => ({
      univ_id,
      code: sanitizeString(pickFirst(r, ['code', 'CODE', 'Code', '전형코드', '전형 코드', '전형코 드'])),
      name: sanitizeString(pickFirst(r, ['name', 'NAME', '전형명', '전형 명'])),
    })
    const mapUnits = (r: any) => ({
      univ_id,
      code: sanitizeString(pickFirst(r, ['code', 'CODE', '단위코드', '단위 코드', '단위코 드'])),
      name: sanitizeString(pickFirst(r, ['name', 'NAME', '단위명', '단위 명'])),
    })
    const mapCurricula = (r: any) => ({
      // 편제는 subject_organization의 5컬럼(+subject_group)으로 매핑
      univ_id,
      organization_code: sanitizeString(pickFirst(r, ['organization_code', 'code', '편제코드', '편제 코드'])),
      organization_name: sanitizeString(pickFirst(r, ['organization_name', 'name', '편제명', '편제 명'])),
      subject_code: sanitizeString(pickFirst(r, ['subject_code', '과목코드', '과목 코드', '과목코 드'])),
      subject_name: sanitizeString(pickFirst(r, ['subject_name', '과목명', '과목 명'])),
      course_code: sanitizeString(pickFirst(r, ['course_code', '교과코드', '교과 코드', '교과코 드'])),
      subject_group: sanitizeString(pickFirst(r, ['subject_group', '대학교과명'])),
    })
    const mapSubjectSeparations = (r: any) => ({
      univ_id,
      subject_name: sanitizeString(pickFirst(r, ['subject_name', '과목명', '과목 명'])),
      subject_code: sanitizeString(pickFirst(r, ['subject_code', '과목코드', '과목 코드', '과목코 드'])),
      subject_separation_code: sanitizeString(pickFirst(r, ['subject_separation_code', '과목구분코드', '과목 구분 코드', '과목구분'])),
    })
    const mapOrganizations = (r: any) => ({
      univ_id,
      code: sanitizeString(pickFirst(r, ['organization_code', 'code', '편제코드'])),
      name: sanitizeString(pickFirst(r, ['organization_name', 'name', '편제명'])),
    })

    let totalProcessed = 0
    let processedSheets: string[] = []
    let debugInfo: string[] = []
    let processedTypes: { [key: string]: number } = { admissions: 0, units: 0, curricula: 0, subject_separation: 0 }

    // 모든 시트에서 모든 데이터 타입 찾기 (선택된 탭과 무관)
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
      
      if (aoa.length === 0) {
        debugInfo.push(`${sheetName}: 빈 시트`)
        continue
      }
      
      const headerRow = Array.isArray(aoa[0]) ? aoa[0] : []
      const columns = headerRow.map((h: any) => String(h ?? '').trim())
      const dataRows = aoa.slice(1)
      
      debugInfo.push(`${sheetName}: 컬럼 [${columns.join(', ')}]`)
      
      // 시트 타입 감지 - 헤더 컬럼명만으로 판단
      const sheetType = detectSheetType(columns)
      
      debugInfo.push(`${sheetName}: 감지된 타입 = ${sheetType}`)
      
      // 감지된 타입이 없으면 건너뛰기
      if (!sheetType) {
        debugInfo.push(`${sheetName}: 감지된 타입 없음`)
        continue
      }
      
      debugInfo.push(`${sheetName}: ${sheetType} 데이터 처리 시작`)
      
      // 데이터 객체로 변환 및 정제
      const objects = dataRows.map((row) => {
        const obj: Record<string, any> = {}
        for (let i = 0; i < columns.length; i++) {
          obj[columns[i]] = sanitizeString(row[i] ?? '')
        }
        return sanitizeObject(obj)
      })

      const normalizedRows = objects.map((r) => {
        const obj: Record<string, any> = {}
        Object.keys(r).forEach((k) => {
          obj[normalizeKey(k)] = r[k]
        })
        return obj
      })

    let mapped: any[] = []
      if (sheetType === 'admissions') {
      mapped = normalizedRows.map(mapAdmissions)
        .filter(r => r.code && r.name)
        .map(r => ({ ...r, code: String(r.code).padStart(2, '0') }))
      } else if (sheetType === 'units') {
      mapped = normalizedRows.map(mapUnits)
        .filter(r => r.code && r.name)
        .map(r => ({ ...r, code: String(r.code).padStart(2, '0') }))
      } else if (sheetType === 'organizations') {
        mapped = normalizedRows.map(mapOrganizations)
          .filter(r => r.code && r.name)
          .map(r => ({ ...r, code: String(r.code).padStart(2, '0') }))
      } else if (sheetType === 'curricula') {
        mapped = normalizedRows.map(mapCurricula)
          .filter(r => r.organization_code && r.organization_name && r.subject_code && r.subject_name && r.course_code)
      } else if (sheetType === 'subject_separation') {
        mapped = normalizedRows.map(mapSubjectSeparations)
          .filter(r => r.subject_name && r.subject_separation_code)
      }

      debugInfo.push(`${sheetName}: 매핑된 데이터 ${mapped.length}건`)

      if (mapped.length > 0) {
        try {
          // 데이터 업로드
          const { dataRepo } = await import('@/services/data-repo')
          if (sheetType === 'admissions') {
            await dataRepo.upsertTokenItems('admission_code', mapped)
          } else if (sheetType === 'units') {
            await dataRepo.upsertTokenItems('major_code', mapped)
          } else if (sheetType === 'organizations') {
            await dataRepo.upsertTokenItems('organization_code', mapped)
          } else if (sheetType === 'curricula') {
            await dataRepo.upsertCurricula(mapped as any)
          } else if (sheetType === 'subject_separation') {
            await dataRepo.upsertSubjectSeparations(mapped as any)
          }
          
          totalProcessed += mapped.length
          processedSheets.push(sheetName)
          processedTypes[sheetType] += mapped.length
          debugInfo.push(`${sheetName}: ${sheetType} 데이터 업로드 완료 (${mapped.length}건)`)
        } catch (error: any) {
          console.error(`${sheetName} ${sheetType} 데이터 업로드 오류:`, error)
          
          // UTF-8 인코딩 오류인 경우 구체적인 메시지 제공
          if (error?.message?.includes('UTF8') || error?.message?.includes('0x00')) {
            debugInfo.push(`${sheetName}: UTF-8 인코딩 오류 - 데이터에 잘못된 문자가 포함되어 있습니다.`)
            throw new Error(`시트 "${sheetName}"의 ${sheetType} 데이터에 UTF-8 인코딩에 문제가 있는 문자가 포함되어 있습니다. 엑셀 파일을 다시 저장하거나 데이터를 확인해주세요.`)
          }
          
          // 기타 데이터베이스 오류
          if (error?.message?.includes('prisma') || error?.message?.includes('database')) {
            debugInfo.push(`${sheetName}: 데이터베이스 오류 - ${error.message}`)
            throw new Error(`시트 "${sheetName}"의 ${sheetType} 데이터 처리 중 데이터베이스 오류가 발생했습니다: ${error.message}`)
          }
          
          throw error
        }
      } else {
        debugInfo.push(`${sheetName}: 유효한 데이터 없음`)
      }
    }

    if (totalProcessed === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: `처리할 수 있는 데이터가 없습니다.\n\n디버그 정보:\n${debugInfo.join('\n')}` 
      }, { status: 400 })
    }

    // 처리된 데이터 타입별 요약 생성
    const processedTypesList = Object.entries(processedTypes)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${type === 'admissions' ? '전형' : type === 'units' ? '단위' : '편제'}: ${count}건`)
      .join(', ')

    return NextResponse.json({ 
      ok: true, 
      data: { 
        count: totalProcessed,
        sheets: processedSheets,
        message: `${processedSheets.join(', ')} 시트에서 총 ${totalProcessed}건의 데이터를 처리했습니다. (${processedTypesList})`,
        debug: debugInfo,
        processedTypes
      } 
    })
    
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'upload failed' }, { status: 500 })
  }
}


