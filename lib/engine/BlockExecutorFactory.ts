// lib/engine/blockExecutors.ts
// 블록 실행기 레지스트리 및 개별 블록 실행기들

import type { Context, Subject, TokenMenuStore, Snapshot, CalculationLog } from '@/types/domain';
import { evalExpr } from '../dsl/eval';
import { extractHashPatternContents, replaceHashPatterns, replaceHashPatternsWithValues } from '../utils/stringPattern';
import { BLOCK_TYPE, BLOCK_TYPE_MAP } from '@/types/block-types';
import { calcLog } from '@/lib/utils/calcLogger';
import { round, floor, ceil } from '../utils/mathUtils';
import { isEmpty } from '../utils/validationUtils';
import {BlockExecutor} from './executors/BlockExecutor';
import { SubjectGroupRatioBlockExecutor } from './executors/SubjectGroupRatioBlockExecutor';
import { TopSubjectBlockExecutor } from './executors/TopSubjectBlockExecutor';
import { ConditionBlockExecutor } from './executors/ConditionBlockExecutor';
import { AggregationBlockExecutor } from './executors/AggregationBlockExecutor';
import { ApplyTermBlockExecutor } from './executors/ApplyTermBlockExecutor';
import { ScoreTableBlockExecutor } from './executors/ScoreTableBlockExecutor';
import { SubjectSeparationBlockExecutor } from './executors/SubjectSeparationBlockExecutor';
import { ApplySubjectBlockExecutor } from './executors/ApplySubjectBlockExecutor';
import { GradeRatioBlockExecutor } from './executors/GradeRatioBlockExecutor';
import { FormulaBlockExecutor } from './executors/FormulaBlockExecutor';
import { DecimalBlockExecutor } from './executors/DecimalBlockExecutor';
import { ApplyRatioBlockExecutor } from './executors/ApplyRatioBlockExecutor';

/**
 * 블록 실행기 레지스트리
 * 각 블록 타입에 해당하는 실행기를 등록하고 조회
 */
export class BlockExecutorFactory {
  public static getExecutor(blockType: number, blockId: number, caseIndex: number, bodyData: any, headerData: any): BlockExecutor | null {
    switch (blockType) {
      case BLOCK_TYPE.APPLY_SUBJECT:
        return new ApplySubjectBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.GRADE_RATIO:
        return new GradeRatioBlockExecutor(blockId, caseIndex, headerData, bodyData);  
      case BLOCK_TYPE.APPLY_TERM:
        return new ApplyTermBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.TOP_SUBJECT:
        return new TopSubjectBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.SUBJECT_GROUP_RATIO:
        return new SubjectGroupRatioBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.SEPARATION_RATIO:
        return new SubjectSeparationBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.SCORE_MAP:
        return new ScoreTableBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.FORMULA:
        return new FormulaBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.VARIABLE:
        return null;
      case BLOCK_TYPE.CONDITION:
        return new ConditionBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.AGGREGATION:
        return new AggregationBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.RATIO:
        return new ApplyRatioBlockExecutor(blockId, caseIndex, headerData, bodyData);
      case BLOCK_TYPE.DECIMAL:
        return new DecimalBlockExecutor(blockId, caseIndex, headerData, bodyData);
      
      }
    return null;
  }
}
