import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CalculationSettingsService } from '@/services/calculation-settings.service';

const PutSchema = z.object({
  isConditional: z.boolean(),
  admissionCodes: z.string().optional().default(''),
  unitCodes: z.string().optional().default(''),
  gradYearStart: z.number().int().min(1900).max(9999).nullable().optional(),
  gradYearEnd: z.number().int().min(1900).max(9999).nullable().optional(),
}).refine((d) => {
  if (d.gradYearStart == null || d.gradYearEnd == null) return true;
  return d.gradYearStart <= d.gradYearEnd;
}, { message: 'gradYearStart must be <= gradYearEnd' });

export async function GET(
  _request: NextRequest,
  { params }: { params: { pipelineId: string } }
) {
  try {
    const pipelineId = Number(params.pipelineId);
    if (!Number.isFinite(pipelineId)) {
      return NextResponse.json({ success: false, message: 'Invalid pipelineId' }, { status: 400 });
    }
    const data = await CalculationSettingsService.getByPipelineId(pipelineId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET calculation-settings error', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { pipelineId: string } }
) {
  try {
    const pipelineId = Number(params.pipelineId);
    if (!Number.isFinite(pipelineId)) {
      return NextResponse.json({ success: false, message: 'Invalid pipelineId' }, { status: 400 });
    }
    const body = await request.json();
    const parsed = PutSchema.parse(body);

    const saved = await CalculationSettingsService.upsertByPipelineId(pipelineId, {
      isConditional: parsed.isConditional,
      admissionCodes: (parsed.admissionCodes || '').trim(),
      unitCodes: (parsed.unitCodes || '').trim(),
      gradYearStart: parsed.gradYearStart ?? null,
      gradYearEnd: parsed.gradYearEnd ?? null,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, message: 'Invalid request', errors: error.errors }, { status: 400 });
    }
    console.error('PUT calculation-settings error', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}


