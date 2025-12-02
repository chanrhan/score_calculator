import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const blockData = await prisma.block_data.findMany({ orderBy: { block_type: 'asc' } })
    return NextResponse.json(blockData)
  } catch (error) {
    console.error('Error fetching block data:', error)
    return NextResponse.json({ error: 'Failed to fetch block data' }, { status: 500 })
  }
}
