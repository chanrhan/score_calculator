import { prisma } from '@/lib/prisma';

export type PipelineVariableRow = {
  univ_id: string;
  pipeline_id: bigint | number;
  variable_name: string;
  scope: string; // '0': 학생(Student), '1': 과목(Subject)
  created_at?: Date;
  updated_at?: Date;
};

export class PipelineVariablesService {
  static async list(univId: string, pipelineId: number, scope?: string): Promise<PipelineVariableRow[]> {
    const where: any = { univ_id: univId, pipeline_id: BigInt(pipelineId) };
    if (scope !== undefined) {
      where.scope = scope;
    }
    const rows = await (prisma as any).pipeline_variable.findMany({
      where,
      orderBy: { variable_name: 'asc' },
    });
    return rows as unknown as PipelineVariableRow[];
  }

  static async create({ univId, pipelineId, name, scope = '0' }: { univId: string; pipelineId: number; name: string; scope?: string }): Promise<PipelineVariableRow> {
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

    // Validate scope
    if (scope !== '0' && scope !== '1') {
      const err: any = new Error('Invalid scope. Must be "0" (Student) or "1" (Subject)');
      err.code = 'VALIDATION';
      throw err;
    }

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
        scope: scope,
      },
    });
    return created as unknown as PipelineVariableRow;
  }
}


