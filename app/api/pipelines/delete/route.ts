import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const DeleteSchema = z.object({
  univId: z.string().length(3),
  configName: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { univId, configName } = DeleteSchema.parse(body);

    await prisma.pipelines.delete({
      where: { univ_id_config_name: { univ_id: univId, config_name: configName } } as any,
    } as any);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      );
    }
    // Prisma not found
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Pipeline not found' },
        { status: 404 }
      );
    }
    console.error('❌ Delete pipeline API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


