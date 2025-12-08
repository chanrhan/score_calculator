// app/api/components/save/route.ts
// ComponentGrid 저장 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { saveComponentGridToDb, ComponentGridSaveData, upsertAllComponentGrids } from '@/lib/adapters/componentGridDb';
import type { FlowBlock } from '@/types/block-structure';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// 요청 데이터 검증 스키마
const SaveComponentRequestSchema = z.object({
  pipelineId: z.number().int().positive(),
  componentId: z.number().int().positive(), 
  order: z.number().int().min(0),
  name: z.string().optional(),
  blocks: z.array(z.any()), // FlowBlock 배열 - 실제 구조는 복잡하므로 any 사용
  hierarchicalDataMap: z.record(z.string(), z.array(z.any())).optional() // HierarchicalCell 맵 (JSON 키는 문자열)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 요청 데이터 검증
    const validatedData = SaveComponentRequestSchema.parse(body);
    
    // DB에 저장
    await saveComponentGridToDb({
      pipelineId: validatedData.pipelineId,
      componentId: validatedData.componentId,
      order: validatedData.order,
      name: validatedData.name,
      blocks: validatedData.blocks,
      hierarchicalDataMap: validatedData.hierarchicalDataMap
    });
    
    return NextResponse.json({ 
      success: true,
      message: `ComponentGrid saved successfully`,
      data: {
        pipelineId: validatedData.pipelineId,
        componentId: validatedData.componentId,
        blockCount: validatedData.blocks.length
      }
    });
    
  } catch (error) {
    console.error('❌ Save ComponentGrid API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request data',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
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

// 일괄 저장 (여러 ComponentGrid 한번에 저장)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // 증분 업서트용 스키마: id는 optional
    const FlowBlockSchema = z.object({}).passthrough();
    const ComponentSchema = z.object({
      id: z.number().int().positive().optional(),
      order: z.number().int().min(0),
      name: z.string().optional(),
      x: z.number().int().optional(),
      y: z.number().int().optional(),
      blocks: z.array(FlowBlockSchema),
      hierarchicalDataMap: z.record(z.string(), z.array(z.any())).optional(),
      divisionHead: z.object({
        header: z.array(z.object({ division_type: z.string() })),
        body: z.array(z.array(z.record(z.string(), z.any()))),
        isActive: z.boolean(),
      }).optional(),
    });
    const BatchUpsertSchema = z.object({
      pipelineId: z.number().int().positive(),
      components: z.array(ComponentSchema)
    });

    const validated = BatchUpsertSchema.parse(body);

    // 파이프라인 존재 확인 (FK 위반 방지)
    const prisma = new PrismaClient();
    const pipeline = await prisma.pipelines.findUnique({ where: { id: BigInt(validated.pipelineId) } });
    if (!pipeline) {
      return NextResponse.json(
        { success: false, message: `Pipeline ${validated.pipelineId} not found` },
        { status: 400 }
      );
    }

    const componentsPayload = (validated.components as unknown) as Array<{
      id?: number;
      order: number;
      name?: string;
      x?: number;
      y?: number;
      blocks: FlowBlock[];
      hierarchicalDataMap?: Record<string, any[]>; // 문자열 키로 변경
      divisionHead?: {
        header: Array<{ division_type: string }>;
        body: Array<Array<Record<string, any>>>;
        isActive: boolean;
      };
    }>;

    const result = await upsertAllComponentGrids(validated.pipelineId, componentsPayload);

    return NextResponse.json({
      success: true,
      message: 'Upsert completed',
      ...result,
    });
    
  } catch (error) {
    console.error('❌ Batch Save ComponentGrid API Error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation errors:', error.errors);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request data',
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }
    
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