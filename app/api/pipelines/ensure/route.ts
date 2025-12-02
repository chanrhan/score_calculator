import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const EnsureSchema = z.object({
  univId: z.string().length(3),
  configName: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = EnsureSchema.parse({
      ...body,
      univId: String(body.univId).trim(),
      configName: String(body.configName).trim(),
      name: String(body.name).trim(),
      version: String(body.version).trim(),
    });

    // 수동 upsert (트랜잭션): 중복 생성 방지 보강
    const pipeline = await prisma.$transaction(async (tx) => {
      const existing = await tx.pipelines.findFirst({
        where: { univ_id: validated.univId, config_name: validated.configName } as any,
        select: { id: true, univ_id: true, config_name: true, name: true, version: true } as any,
      } as any);
      if (existing) {
        return await tx.pipelines.update({
          where: { univ_id_config_name: { univ_id: validated.univId, config_name: validated.configName } } as any,
          data: { name: validated.name, version: validated.version } as any,
          select: { id: true, univ_id: true, config_name: true, name: true, version: true } as any,
        } as any);
      }
      return await tx.pipelines.create({
        data: {
          univ_id: validated.univId,
          config_name: validated.configName,
          name: validated.name,
          version: validated.version,
        } as any,
        select: { id: true, univ_id: true, config_name: true, name: true, version: true } as any,
      } as any);
    });

    // BigInt -> number 변환하여 JSON 직렬화 오류 방지
    const p: any = pipeline as any;
    const data = {
      id: Number(p.id),
      univId: p.univ_id,
      configName: p.config_name,
      name: p.name,
      version: p.version,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('❌ Ensure pipeline API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


