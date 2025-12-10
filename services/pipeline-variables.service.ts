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

  static async update({ univId, pipelineId, oldName, newName }: { univId: string; pipelineId: number; oldName: string; newName: string }): Promise<PipelineVariableRow> {
    const trimmed = (newName ?? '').trim();
    if (!trimmed) {
      const err: any = new Error('Name required');
      err.code = 'VALIDATION';
      throw err;
    }

    // 기존 변수 확인
    const existing = await (prisma as any).pipeline_variable.findUnique({
      where: { pipeline_id_variable_name: { pipeline_id: BigInt(pipelineId), variable_name: oldName } },
    });
    if (!existing) {
      const err: any = new Error('Variable not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    // univ_id 일치 확인
    if (existing.univ_id !== univId) {
      const err: any = new Error('Unauthorized');
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    // 이름이 변경되는 경우 중복 확인
    if (trimmed !== oldName) {
      const duplicate = await (prisma as any).pipeline_variable.findUnique({
        where: { pipeline_id_variable_name: { pipeline_id: BigInt(pipelineId), variable_name: trimmed } },
      });
      if (duplicate) {
        const err: any = new Error('Duplicate name');
        err.code = 'DUPLICATE';
        throw err;
      }
    }

    // 업데이트
    const updated = await (prisma as any).pipeline_variable.update({
      where: { pipeline_id_variable_name: { pipeline_id: BigInt(pipelineId), variable_name: oldName } },
      data: { variable_name: trimmed },
    });
    return updated as unknown as PipelineVariableRow;
  }

  static async delete({ univId, pipelineId, variableName }: { univId: string; pipelineId: number; variableName: string }): Promise<void> {
    // 기존 변수 확인
    const existing = await (prisma as any).pipeline_variable.findUnique({
      where: { pipeline_id_variable_name: { pipeline_id: BigInt(pipelineId), variable_name: variableName } },
    });
    if (!existing) {
      const err: any = new Error('Variable not found');
      err.code = 'NOT_FOUND';
      throw err;
    }

    // univ_id 일치 확인
    if (existing.univ_id !== univId) {
      const err: any = new Error('Unauthorized');
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    // 삭제
    await (prisma as any).pipeline_variable.delete({
      where: { pipeline_id_variable_name: { pipeline_id: BigInt(pipelineId), variable_name: variableName } },
    });
  }
}


