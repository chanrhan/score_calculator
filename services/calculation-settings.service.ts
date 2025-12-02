import { prisma } from '@/lib/prisma';

export interface CalculationSettingsDTO {
  pipelineId: number;
  isConditional: boolean;
  admissionCodes: string;
  unitCodes: string;
  gradYearStart: number | null;
  gradYearEnd: number | null;
}

export class CalculationSettingsService {
  static async getByPipelineId(pipelineId: number): Promise<CalculationSettingsDTO> {
    const found = await prisma.calculation_settings.findUnique({
      where: { pipeline_id: BigInt(pipelineId) },
    } as any);

    if (!found) {
      return {
        pipelineId,
        isConditional: false,
        admissionCodes: '',
        unitCodes: '',
        gradYearStart: null,
        gradYearEnd: null,
      };
    }

    return {
      pipelineId,
      isConditional: Boolean(found.is_conditional),
      admissionCodes: found.admission_codes ?? '',
      unitCodes: found.unit_codes ?? '',
      gradYearStart: found.grad_year_start ?? null,
      gradYearEnd: found.grad_year_end ?? null,
    };
  }

  static async upsertByPipelineId(pipelineId: number, data: Omit<CalculationSettingsDTO, 'pipelineId'>): Promise<CalculationSettingsDTO> {
    const saved = await prisma.calculation_settings.upsert({
      where: { pipeline_id: BigInt(pipelineId) },
      update: {
        is_conditional: data.isConditional,
        admission_codes: data.admissionCodes || null,
        unit_codes: data.unitCodes || null,
        grad_year_start: data.gradYearStart ?? null,
        grad_year_end: data.gradYearEnd ?? null,
      },
      create: {
        pipeline_id: BigInt(pipelineId),
        is_conditional: data.isConditional,
        admission_codes: data.admissionCodes || null,
        unit_codes: data.unitCodes || null,
        grad_year_start: data.gradYearStart ?? null,
        grad_year_end: data.gradYearEnd ?? null,
      },
    } as any);

    return {
      pipelineId,
      isConditional: Boolean(saved.is_conditional),
      admissionCodes: saved.admission_codes ?? '',
      unitCodes: saved.unit_codes ?? '',
      gradYearStart: saved.grad_year_start ?? null,
      gradYearEnd: saved.grad_year_end ?? null,
    };
  }
}


