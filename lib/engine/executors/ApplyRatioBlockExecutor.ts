import { BlockExecutor } from "./BlockExecutor";
import { Context, Subject } from "@/types/domain";
import { BLOCK_TYPE } from "@/types/block-types";

export class ApplyRatioBlockExecutor extends BlockExecutor {
    
    public override readonly type: number = BLOCK_TYPE.RATIO;
    public override readonly name: string = "Ratio";

    private ratio: number;
    private scoreType: string | null;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.ratio = Number(bodyRowCells[0]?.[0]) || 0;
        this.scoreType = bodyRowCells[0]?.[1] || null;
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        if (this.scoreType == 'finalScore') {
            ctx.finalScore = ctx.finalScore * (this.ratio / 100);
          } else {
            subjects.forEach(subject => {
              if (subject.filtered_block_id > 0) {
                return;
              }
              const inputValue = subject[this.scoreType as keyof Subject];
              const outputValue = (inputValue as number) * (this.ratio / 100);
              subject[this.scoreType as keyof Subject] = outputValue as unknown as never;
            });
          }
        return { ctx, subjects };
    }
}