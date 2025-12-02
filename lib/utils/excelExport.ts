import * as XLSX from 'xlsx'

export interface GradeResultRowForExcel {
  identifyNumber: string
  finalScore: number
}

export function makeWorkbookBuffer(rows: GradeResultRowForExcel[]): Buffer {
  const header = ['identifyNumber', 'finalScore']
  const data = rows.map(r => [r.identifyNumber, r.finalScore])
  const aoa = [header, ...data]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'grade_results')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer
  return buf
}


