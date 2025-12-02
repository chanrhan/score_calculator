import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

// 시트 타입 감지 함수 (upload-all과 동일)
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

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ ok: false, error: 'multipart/form-data required' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const sheetInfo = []

    // 모든 시트 분석
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
      
      if (aoa.length === 0) {
        sheetInfo.push({
          name: sheetName,
          type: null,
          columns: [],
          rowCount: 0,
          sampleData: []
        })
        continue
      }
      
      const headerRow = Array.isArray(aoa[0]) ? aoa[0] : []
      const columns = headerRow.map((h: any) => String(h ?? '').trim())
      const dataRows = aoa.slice(1)
      
      // 시트 타입 감지
      const sheetType = detectSheetType(columns)
      
      // 샘플 데이터 (최대 3행)
      const sampleData = dataRows.slice(0, 3).map(row => {
        const obj: Record<string, any> = {}
        for (let i = 0; i < columns.length; i++) {
          obj[columns[i]] = row[i] ?? ''
        }
        return obj
      })
      
      sheetInfo.push({
        name: sheetName,
        type: sheetType,
        columns,
        rowCount: dataRows.length,
        sampleData
      })
    }

    return NextResponse.json({ 
      ok: true, 
      data: { 
        totalSheets: workbook.SheetNames.length,
        sheets: sheetInfo
      } 
    })
    
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'preview failed' }, { status: 500 })
  }
}
