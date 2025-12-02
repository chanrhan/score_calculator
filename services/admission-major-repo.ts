import { prisma } from '@/lib/prisma'

export type AdmissionRow = { code: string; name: string }
export type MajorRow = { code: string; name: string }

export async function findAdmissionsByUniv(univId: string): Promise<AdmissionRow[]> {
  if (!univId) return []
  const rows = await prisma.admission.findMany({
    where: { univ_id: univId },
    orderBy: [{ code: 'asc' }],
    select: { code: true, name: true },
  })
  return rows
}

export async function findMajorsByUniv(univId: string): Promise<MajorRow[]> {
  if (!univId) return []
  const rows = await prisma.major.findMany({
    where: { univ_id: univId },
    orderBy: [{ code: 'asc' }],
    select: { code: true, name: true },
  })
  return rows
}
