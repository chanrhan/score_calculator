// app/api/components/load/route.ts
// ComponentGrid 로드 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { 
  loadComponentGridFromDb, 
  loadAllComponentGridsFromDb 
} from '@/lib/adapters/componentGridDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    const componentId = searchParams.get('componentId');
    
    if (!pipelineId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'pipelineId parameter is required' 
        },
        { status: 400 }
      );
    }
    
    const pipelineIdNum = parseInt(pipelineId);
    if (isNaN(pipelineIdNum) || pipelineIdNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid pipelineId' 
        },
        { status: 400 }
      );
    }
    
    // 특정 ComponentGrid 로드
    if (componentId) {
      const componentIdNum = parseInt(componentId);
      if (isNaN(componentIdNum) || componentIdNum <= 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid componentId' 
          },
          { status: 400 }
        );
      }
      
      const componentData = await loadComponentGridFromDb(pipelineIdNum, componentIdNum);
      
      if (!componentData) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'ComponentGrid not found' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'ComponentGrid loaded successfully',
        data: componentData
      });
    }
    
    // 파이프라인의 모든 ComponentGrid 로드
    const allComponents = await loadAllComponentGridsFromDb(pipelineIdNum);
    
    return NextResponse.json({
      success: true,
      message: `Loaded ${allComponents.length} ComponentGrids`,
      data: {
        pipelineId: pipelineIdNum,
        components: allComponents,
        metadata: {
          componentCount: allComponents.length,
          totalBlockCount: allComponents.reduce((sum, comp) => sum + comp.blocks.length, 0),
          divisionBlockCount: allComponents.reduce((sum, comp) => 
            sum + comp.blocks.filter(block => block.block_type === 1).length, 0 // BLOCK_TYPE.DIVISION = 1
          )
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Load ComponentGrid API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}