import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBlockData() {
  try {
    console.log('=== block_data 테이블 데이터 확인 ===')
    
    const blockData = await prisma.block_data.findMany({
      orderBy: [{ univ_id: 'asc' }, { block_type: 'asc' }]
    })
    
    console.log(`총 ${blockData.length}개의 레코드가 있습니다.`)
    
    // univ_id별로 그룹화
    const groupedByUniv = blockData.reduce((acc, item) => {
      if (!acc[item.univ_id]) {
        acc[item.univ_id] = []
      }
      acc[item.univ_id].push(item)
      return acc
    }, {} as Record<string, any[]>)
    
    console.log('\n=== univ_id별 데이터 분포 ===')
    Object.entries(groupedByUniv).forEach(([univId, items]) => {
      console.log(`univ_id: ${univId} - ${items.length}개 레코드`)
      items.forEach(item => {
        console.log(`  - block_type: ${item.block_type}, block_name: ${item.block_name}`)
      })
    })
    
    // block_type별로 그룹화
    const groupedByType = blockData.reduce((acc, item) => {
      if (!acc[item.block_type]) {
        acc[item.block_type] = []
      }
      acc[item.block_type].push(item)
      return acc
    }, {} as Record<number, any[]>)
    
    console.log('\n=== block_type별 데이터 분포 ===')
    Object.entries(groupedByType).forEach(([blockType, items]) => {
      console.log(`block_type: ${blockType} - ${items.length}개 레코드`)
      items.forEach(item => {
        console.log(`  - univ_id: ${item.univ_id}, block_name: ${item.block_name}`)
      })
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBlockData()
