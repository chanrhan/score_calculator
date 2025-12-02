import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PipelineVariablesService } from '@/services/pipeline-variables.service';

const PostSchema = z.object({
  universityId: z.string().length(3),
  pipelineId: z.union([z.number().int(), z.string().regex(/^\d+$/)]).transform((v) => Number(v)),
  name: z.string().min(1).max(50),
});

function toDTO(row: any) {
  return {
    univ_id: row.univ_id,
    pipeline_id: Number(row.pipeline_id),
    variable_name: row.variable_name,
    // omit dates or convert as needed
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const univId = searchParams.get('universityId') || '';
    const pipelineId = Number(searchParams.get('pipelineId'));
    if (!univId || !Number.isFinite(pipelineId)) {
      return NextResponse.json({ success: false, message: 'universityId and pipelineId required' }, { status: 400 });
    }
    const list = await PipelineVariablesService.list(univId, pipelineId);
    const data = list.map(toDTO);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('GET /api/pipeline-variables error', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PostSchema.parse(body);
    const created = await PipelineVariablesService.create({ univId: parsed.universityId, pipelineId: parsed.pipelineId, name: parsed.name });
    return NextResponse.json({ success: true, data: toDTO(created) }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, message: 'Invalid request', errors: error.errors }, { status: 400 });
    }
    if (error?.code === 'VALIDATION') {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    if (error?.code === 'DUPLICATE') {
      return NextResponse.json({ success: false, message: 'Duplicate variable name' }, { status: 409 });
    }
    console.error('POST /api/pipeline-variables error', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}


