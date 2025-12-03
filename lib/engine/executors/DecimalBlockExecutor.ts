import { CalculationLog, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { ceil, floor, round, truncate } from "@/lib/utils/mathUtils";
import { BLOCK_TYPE } from "@/types/block-types";
import { calcLog } from "@/lib/utils/calcLogger";
import { CalculationLogManager } from "./CalculationLogManager";

export class DecimalBlockExecutor extends BlockExecutor {
  public override readonly type: number = BLOCK_TYPE.DECIMAL;
  public override readonly name: string = "Decimal";

  private variableScope: number;
  private scoreType: string | null;
  private decimalPlaces: number;
  private option: number;

  constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
    super(blockId, caseIndex);
    this.variableScope = headerRowCells[0]?.[1] || 0;
    this.scoreType = bodyRowCells[0]?.[0] || null;
    this.decimalPlaces = Number(bodyRowCells[0]?.[2]) || 0;
    this.option = Number(bodyRowCells[0]?.[4]) || 0;
  }
  public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
    const logManager = new CalculationLogManager();
    let log: CalculationLog;

    if (this.decimalPlaces == 0) {
      return { ctx, subjects };
    }
    if (this.variableScope == 0) {
      const inputValue = Number(this.getContextProperty(ctx, this.scoreType as string))
      const result = this.performDecimalOperation(inputValue);
      calcLog(`        🔧 ${this.scoreType} : ${inputValue} -> ${result}`);
      this.setContextProperty(ctx, subjects, this.scoreType as string, result);
    } else if (this.variableScope == 1) {
      subjects.forEach(subject => {
        const inputValue = Number(this.getSubjectProperty(subject, this.scoreType as string))
        const result = this.performDecimalOperation(inputValue);
        calcLog(`        🔧 ${this.scoreType} : ${inputValue} -> ${result}`);
        subject[this.scoreType as keyof Subject] = result as unknown as never;
        log = {
          input_key: this.scoreType,
          input: inputValue,
          output_key: this.scoreType,
          output: result
        };
        logManager.addLog(subject.seqNumber, log);
      });
      logManager.saveToSnapshot(subjects, this.blockId, this.caseIndex, BLOCK_TYPE.DECIMAL);
    }
    return { ctx, subjects };
  }

  private performDecimalOperation(result: number): number {
    if (this.option == 0) {
      return round(result, this.decimalPlaces);
    } else if (this.option == 1) {
      return ceil(result, this.decimalPlaces);
    } else if (this.option == 2) {
      return floor(result, this.decimalPlaces);
    } else if (this.option == 3) {
      return truncate(result, this.decimalPlaces);
    }
    return result;
  }
}