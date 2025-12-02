import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { resource: string } }) {
  try {
    const resource = params.resource
    const univ_id = String(new URL(req.url).searchParams.get('univ_id') || '')
    if (!univ_id) return NextResponse.json({ ok: false, error: 'univ_id is required' }, { status: 400 })
    if (resource === 'admissions') {
      const menu = await prisma.token_menu.findFirst({ where: { key: 'admission_code', OR: [{ univ_id }, { scope: 1 }] }, include: { items: { orderBy: { order: 'asc' } } } })
      return NextResponse.json({ ok: true, data: menu?.items ?? [] })
    }
    if (resource === 'units') {
      const menu = await prisma.token_menu.findFirst({ where: { key: 'major_code', OR: [{ univ_id }, { scope: 1 }] }, include: { items: { orderBy: { order: 'asc' } } } })
      return NextResponse.json({ ok: true, data: menu?.items ?? [] })
    }
    if (resource === 'curricula') {
      // 편제는 subject_organization 기준으로 반환
      const rows = await prisma.subject_organization.findMany({
        where: { univ_id },
      })
      return NextResponse.json({ ok: true, data: rows })
    }
    if (resource === 'subject_separation') {
      const rows = await (prisma as any).subject_separation.findMany({ where: { univ_id } })
      return NextResponse.json({ ok: true, data: rows })
    }
    return NextResponse.json({ ok: false, error: 'unknown resource' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'fetch failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { resource: string } }) {
  try {
    const resource = params.resource
    const body = await req.json()
    const univ_id = String(body?.univ_id || '')
    if (!univ_id) return NextResponse.json({ ok: false, error: 'univ_id is required' }, { status: 400 })

    if (resource === 'admissions') {
      const order = Number(body?.order || 0)
      if (!order) return NextResponse.json({ ok: false, error: 'order is required' }, { status: 400 })
      await prisma.token_menu_item.delete({ where: { univ_id_menu_key_order: { univ_id, menu_key: 'admission_code', order } } })
      return NextResponse.json({ ok: true })
    }
    if (resource === 'units') {
      const order = Number(body?.order || 0)
      if (!order) return NextResponse.json({ ok: false, error: 'order is required' }, { status: 400 })
      await prisma.token_menu_item.delete({ where: { univ_id_menu_key_order: { univ_id, menu_key: 'major_code', order } } })
      return NextResponse.json({ ok: true })
    }
    if (resource === 'curricula') {
      // 편제 삭제: delete_all 플래그가 있으면 일괄 삭제, 아니면 단건 삭제
      const delete_all = Boolean(body?.delete_all)
      if (delete_all) {
        await prisma.subject_organization.deleteMany({ where: { univ_id } })
        return NextResponse.json({ ok: true })
      }

      const organization_code = String(body?.organization_code || '')
      const subject_code = String(body?.subject_code || '')
      const course_code = String(body?.course_code || '')
      if (!organization_code || !subject_code || !course_code) {
        return NextResponse.json({ ok: false, error: 'organization_code, subject_code, course_code are required (or set delete_all=true)' }, { status: 400 })
      }
      await prisma.subject_organization.delete({
        where: {
          univ_id_organization_code_subject_code_course_code: {
            univ_id,
            organization_code,
            subject_code,
            course_code,
          },
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (resource === 'subject_separation') {
      const delete_all = Boolean(body?.delete_all)
      if (delete_all) {
        await (prisma as any).subject_separation.deleteMany({ where: { univ_id } })
        return NextResponse.json({ ok: true })
      }
      const subject_name = String(body?.subject_name || '')
      if (!subject_name) return NextResponse.json({ ok: false, error: 'subject_name is required' }, { status: 400 })
      await (prisma as any).subject_separation.delete({ where: { univ_id_subject_name: { univ_id, subject_name } } })
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false, error: 'unknown resource' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'delete failed' }, { status: 500 })
  }
}


