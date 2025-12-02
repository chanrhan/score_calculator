import { prisma } from '@/lib/prisma';

export type PipelineVariableRow = {
  univ_id: string;
  pipeline_id: bigint | number;
  variable_name: string;
  created_at?: Date;
  updated_at?: Date;
};

export class PipelineVariablesService {
  static async list(univId: string, pipelineId: number): Promise<PipelineVariableRow[]> {
    const rows = await (prisma as any).pipeline_variable.findMany({
      where: { univ_id: univId, pipeline_id: BigInt(pipelineId) },
      orderBy: { variable_name: 'asc' },
    });
    return rows as unknown as PipelineVariableRow[];
  }

  static async create({ univId, pipelineId, name }: { univId: string; pipelineId: number; name: string }): Promise<PipelineVariableRow> {
    const trimmed = (name ?? '').trim();
    if (!trimmed) {
      const err: any = new Error('Name required');
      err.code = 'VALIDATION';
      throw err;
    }
    // Allow any Unicode letters/digits plus underscore and hyphen, length 1~50
    // if (!/^[\p{L}\p{N}_-]{1,50}$/u.test(trimmed)) {
    //   const err: any = new Error('Invalid name');
    //   err.code = 'VALIDATION';
    //   throw err;
    // }

    // Unique per (pipeline_id, variable_name)
    const exists = await (prisma as any).pipeline_variable.findUnique({
      where: { pipeline_id_variable_name: { pipeline_id: BigInt(pipelineId), variable_name: trimmed } },
    });
    if (exists) {
      const err: any = new Error('Duplicate name');
      err.code = 'DUPLICATE';
      throw err;
    }

    const created = await (prisma as any).pipeline_variable.create({
      data: {
        univ_id: univId,
        pipeline_id: BigInt(pipelineId),
        variable_name: trimmed,
      },
    });
    return created as unknown as PipelineVariableRow;
  }
}


