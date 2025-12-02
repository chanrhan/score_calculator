import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { resource: string } }) {
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
    const firstSheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[firstSheetName]

    // AOA로 읽어서 첫 행 전체를 컬럼명으로 사용 (0,0 포함)
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
    if (aoa.length === 0) {
      return NextResponse.json({ ok: true, data: { sheetName: firstSheetName, columns: [], sampleRows: [], rowCount: 0 } })
    }
    const headerRow = Array.isArray(aoa[0]) ? aoa[0] : []
    const columns = headerRow.map((h: any) => String(h ?? '').trim())
    const dataRows = aoa.slice(1)
    const objects = dataRows.map((row) => {
      const obj: Record<string, any> = {}
      for (let i = 0; i < columns.length; i++) {
        obj[columns[i]] = row[i] ?? ''
      }
      return obj
    })

    const sampleRows = objects.slice(0, 10)
    return NextResponse.json({ ok: true, data: { sheetName: firstSheetName, columns, sampleRows, rowCount: objects.length } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'parse failed' }, { status: 500 })
  }
}


