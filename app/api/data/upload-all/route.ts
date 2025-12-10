import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { ingestRows } from '@/application/data/ingest'
import { dataRepo } from '@/services/data-repo'

export const runtime = 'nodejs'

// 시트 타입 감지 함수
function detectSheetType(columns: string[]): 'admissions' | 'units' | 'curricula' | null {
  const normalizedColumns = columns.map(col => String(col).replace(/\s+/g, '').toLowerCase())
  
  // 전형 데이터 감지
  const admissionKeywords = ['전형명', '전형코드', '전형 코드', '전형코 드']
  const hasAdmissionKeywords = admissionKeywords.some(keyword => 
    normalizedColumns.some(col => col.includes(keyword.replace(/\s+/g, '').toLowerCase()))
  )
  
  // 단위 데이터 감지
  const unitKeywords = ['단위명', '단위코드', '단위 코드', '단위코 드']
  const hasUnitKeywords = unitKeywords.some(keyword => 
    normalizedColumns.some(col => col.includes(keyword.replace(/\s+/g, '').toLowerCase()))
  )
  
  // 편제 데이터 감지
  const curriculaKeywords = ['편제명', '과목코드', '과목명', '교과코드', '과목 코드', '교과 코드']
  const hasCurriculaKeywords = curriculaKeywords.some(keyword => 
    normalizedColumns.some(col => col.includes(keyword.replace(/\s+/g, '').toLowerCase()))
  )
  
  if (hasAdmissionKeywords) return 'admissions'
  if (hasUnitKeywords) return 'units'
  if (hasCurriculaKeywords) return 'curricula'
  
  return null
}

// 데이터 매핑 함수들
const normalizeKey = (s: any) => String(s ?? '').replace(/\s+/g, '').toLowerCase()

const pickFirst = (r: Record<string, any>, keys: string[]) => {
  for (const k of keys.map(normalizeKey)) {
    const v = r[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return undefined
}

const mapAdmissions = (r: any, univ_id: string) => ({
  univ_id,
  code: pickFirst(r, ['code', 'CODE', 'Code', '전형코드', '전형 코드', '전형코 드']),
  name: pickFirst(r, ['name', 'NAME', '전형명', '전형 명']),
})

const mapUnits = (r: any, univ_id: string) => ({
  univ_id,
  code: pickFirst(r, ['code', 'CODE', '단위코드', '단위 코드', '단위코 드']),
  name: pickFirst(r, ['name', 'NAME', '단위명', '단위 명']),
})

const mapCurricula = (r: any, univ_id: string) => ({
  univ_id,
  organization_name: pickFirst(r, ['organization_name', '편제명', '편제 명']),
  subject_code: pickFirst(r, ['subject_code', '과목코드', '과목 코드', '과목코 드']),
  subject_name: pickFirst(r, ['subject_name', '과목명', '과목 명']),
  course_code: pickFirst(r, ['course_code', '교과코드', '교과 코드', '교과코 드']),
  subject_group: pickFirst(r, ['subject_group', '대학교과명']),
})

export async function POST(req: NextRequest) {
  try {
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
    
    const results = {
      admissions: { count: 0, sheets: [] as string[] },
      units: { count: 0, sheets: [] as string[] },
      curricula: { count: 0, sheets: [] as string[] },
      unknown: { count: 0, sheets: [] as string[] }
    }

    // 처리할 시트가 있는지 확인
    let hasProcessableSheets = false

    // 모든 시트 처리
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
      
      if (aoa.length === 0) continue
      
      const headerRow = Array.isArray(aoa[0]) ? aoa[0] : []
      const columns = headerRow.map((h: any) => String(h ?? '').trim())
      const dataRows = aoa.slice(1)
      
      // 시트 타입 감지
      const sheetType = detectSheetType(columns)
      
      if (!sheetType) {
        results.unknown.sheets.push(sheetName)
        continue
      }
      
      hasProcessableSheets = true
      
      // 데이터 객체로 변환
      const objects = dataRows.map((row) => {
        const obj: Record<string, any> = {}
        for (let i = 0; i < columns.length; i++) {
          obj[columns[i]] = row[i] ?? ''
        }
        return obj
      })

      // 키 정규화
      const normalizedRows = objects.map((r) => {
        const obj: Record<string, any> = {}
        Object.keys(r).forEach((k) => {
          obj[normalizeKey(k)] = r[k]
        })
        return obj
      })

      // 데이터 매핑
      let mapped: any[] = []
      if (sheetType === 'admissions') {
        mapped = normalizedRows.map(r => mapAdmissions(r, univ_id))
          .filter(r => r.code && r.name)
          .map(r => {
            const codeStr = String(r.code)
            const code = /^[0-9]+$/.test(codeStr) ? codeStr.padStart(2, '0') : codeStr
            return { ...r, code }
          })
      } else if (sheetType === 'units') {
        mapped = normalizedRows.map(r => mapUnits(r, univ_id))
          .filter(r => r.code && r.name)
          .map(r => {
            const codeStr = String(r.code)
            const code = /^[0-9]+$/.test(codeStr) ? codeStr.padStart(2, '0') : codeStr
            return { ...r, code }
          })
      } else if (sheetType === 'curricula') {
        mapped = normalizedRows.map(r => mapCurricula(r, univ_id))
          .filter(r => r.organization_name && r.subject_code && r.subject_name && r.course_code)
      }

      // 유효성 검사
      if (sheetType === 'admissions' || sheetType === 'units') {
        const invalid = mapped.filter(r => String(r.code).length !== 2)
        if (invalid.length > 0) {
          return NextResponse.json({ 
            ok: false, 
            error: `${sheetName} 시트: 코드는 정확히 2자리여야 합니다 (예: 01, 02)` 
          }, { status: 400 })
        }
      }
      
      if (sheetType === 'curricula') {
        const invalid = mapped.filter(r => String(r.course_code).length !== 3)
        if (invalid.length > 0) {
          return NextResponse.json({ 
            ok: false, 
            error: `${sheetName} 시트: 교과코드는 정확히 3자리여야 합니다 (예: 101)` 
          }, { status: 400 })
        }
      }

      if (mapped.length > 0) {
        // 데이터 업로드
        const summary = await ingestRows({ 
          resource: sheetType, 
          rows: mapped, 
          mode: 'upsert', 
          repo: dataRepo, 
          eventName: `data:${sheetType}` 
        })
        
        results[sheetType].count += mapped.length
        results[sheetType].sheets.push(sheetName)
      }
    }

    // 처리할 시트가 없으면 에러 반환
    if (!hasProcessableSheets) {
      return NextResponse.json({ 
        ok: false, 
        error: '처리할 수 있는 시트가 없습니다. 전형/단위/편제 데이터가 포함된 시트를 확인해주세요.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      ok: true, 
      data: { 
        results,
        totalSheets: workbook.SheetNames.length,
        processedSheets: workbook.SheetNames.length - results.unknown.sheets.length
      } 
    })
    
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'upload failed' }, { status: 500 })
  }
}
