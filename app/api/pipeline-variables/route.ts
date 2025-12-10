import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PipelineVariablesService } from '@/services/pipeline-variables.service';

const PostSchema = z.object({
  universityId: z.string().length(3),
  pipelineId: z.union([z.number().int(), z.string().regex(/^\d+$/)]).transform((v) => Number(v)),
  name: z.string().min(1).max(50),
  scope: z.enum(['0', '1']).optional().default('0'), // '0': 학생, '1': 과목
});

const PutSchema = z.object({
  universityId: z.string().length(3),
  pipelineId: z.union([z.number().int(), z.string().regex(/^\d+$/)]).transform((v) => Number(v)),
  oldName: z.string().min(1).max(50),
  newName: z.string().min(1).max(50),
});

const DeleteSchema = z.object({
  universityId: z.string().length(3),
  pipelineId: z.union([z.number().int(), z.string().regex(/^\d+$/)]).transform((v) => Number(v)),
  variableName: z.string().min(1).max(50),
});

function toDTO(row: any) {
  return {
    univ_id: row.univ_id,
    pipeline_id: Number(row.pipeline_id),
    variable_name: row.variable_name,
    scope: row.scope || '0',
    // omit dates or convert as needed
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const univId = searchParams.get('universityId') || '';
    const pipelineId = Number(searchParams.get('pipelineId'));
    const scope = searchParams.get('scope') || undefined; // 선택적 필터링
    if (!univId || !Number.isFinite(pipelineId)) {
      return NextResponse.json({ success: false, message: 'universityId and pipelineId required' }, { status: 400 });
    }
    const list = await PipelineVariablesService.list(univId, pipelineId, scope);
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
    const created = await PipelineVariablesService.create({ 
      univId: parsed.universityId, 
      pipelineId: parsed.pipelineId, 
      name: parsed.name,
      scope: parsed.scope 
    });
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PutSchema.parse(body);
    const updated = await PipelineVariablesService.update({
      univId: parsed.universityId,
      pipelineId: parsed.pipelineId,
      oldName: parsed.oldName,
      newName: parsed.newName,
    });
    return NextResponse.json({ success: true, data: toDTO(updated) }, { status: 200 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, message: 'Invalid request', errors: error.errors }, { status: 400 });
    }
    if (error?.code === 'VALIDATION') {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    if (error?.code === 'NOT_FOUND') {
      return NextResponse.json({ success: false, message: error.message }, { status: 404 });
    }
    if (error?.code === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    if (error?.code === 'DUPLICATE') {
      return NextResponse.json({ success: false, message: 'Duplicate variable name' }, { status: 409 });
    }
    console.error('PUT /api/pipeline-variables error', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const univId = searchParams.get('universityId') || '';
    const pipelineId = Number(searchParams.get('pipelineId'));
    const variableName = searchParams.get('variableName') || '';
    
    if (!univId || !Number.isFinite(pipelineId) || !variableName) {
      return NextResponse.json({ success: false, message: 'universityId, pipelineId, and variableName required' }, { status: 400 });
    }

    const parsed = DeleteSchema.parse({ universityId: univId, pipelineId, variableName });
    await PipelineVariablesService.delete({
      univId: parsed.universityId,
      pipelineId: parsed.pipelineId,
      variableName: parsed.variableName,
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, message: 'Invalid request', errors: error.errors }, { status: 400 });
    }
    if (error?.code === 'NOT_FOUND') {
      return NextResponse.json({ success: false, message: error.message }, { status: 404 });
    }
    if (error?.code === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    console.error('DELETE /api/pipeline-variables error', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}


