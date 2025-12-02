import { Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { ceil, floor, round, truncate } from "@/lib/utils/mathUtils";
import { BLOCK_TYPE } from "@/types/block-types";

export class DecimalBlockExecutor extends BlockExecutor {
    public override readonly type: number = BLOCK_TYPE.DECIMAL;
    public override readonly name: string = "Decimal";

    private scoreType: string | null;
    private decimalPlaces : number;
    private option: number;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.scoreType = bodyRowCells[0]?.[0] || null;
        this.decimalPlaces = Number(bodyRowCells[0]?.[2]) || 0;
        this.option = Number(bodyRowCells[0]?.[4]) || 0;
    }
    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        if (this.decimalPlaces == 0) {
            return { ctx, subjects };
          }
          let score = ctx[this.scoreType as keyof Context];
          if (score == null) {
            score = Number(ctx.vars.get(this.scoreType as string)) || 0;
          } else {
            score = Number(score);
          }
      
          if (this.option == 0) {
            score = round(score, this.decimalPlaces);
          } else if (this.option == 1) {
            score = ceil(score, this.decimalPlaces);
          } else if (this.option == 2) {
            score = floor(score, this.decimalPlaces);
          }else if (this.option == 3) {
            score = truncate(score, this.decimalPlaces);
          }
      
          // console.log(`before: ${ctx[scoreType as keyof Context]}, after(${floatFix}, ${fixAction}): ${score}`);
      
          this.setContextProperty(ctx, subjects, this.scoreType as string, score);
        return { ctx, subjects };
    }
}