import { NextRequest, NextResponse } from 'next/server'
import { validateAdmissionsRows, validateUnitsRows, validateCurriculaRows } from '@/application/data/validateRows'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { resource: string } }) {
  try {
    const resource = params.resource as 'admissions' | 'units' | 'curricula'
    const body = await req.json()
    const rows = Array.isArray(body?.rows) ? body.rows : []

    let result
    if (resource === 'admissions') result = validateAdmissionsRows(rows)
    else if (resource === 'units') result = validateUnitsRows(rows)
    else if (resource === 'curricula') result = validateCurriculaRows(rows)
    else return NextResponse.json({ ok: false, error: 'unknown resource' }, { status: 400 })

    return NextResponse.json({ ok: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'validate failed' }, { status: 500 })
  }
}


