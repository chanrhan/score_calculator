import { BlockExecutor } from "./BlockExecutor";
import { Context, Subject } from "@/types/domain";
import { BLOCK_TYPE } from "@/types/block-types";

export class ApplyRatioBlockExecutor extends BlockExecutor {
    
    public override readonly type: number = BLOCK_TYPE.RATIO;
    public override readonly name: string = "Ratio";

    private ratio: number;
    private input_prop: string | null;

    constructor(blockId: number, caseIndex: number, headerData: any, bodyData: any) {
        super(blockId, caseIndex);
        this.ratio = Number(bodyData?.ratio) || 0;
        this.input_prop = bodyData?.input_prop || 'finalScore';
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        if (this.input_prop == 'finalScore') {
            ctx.finalScore = ctx.finalScore * (this.ratio / 100);
          } else {
            subjects.forEach(subject => {
              if (subject.filtered_block_id > 0) {
                return;
              }
              const inputValue = subject[this.input_prop as keyof Subject];
              const outputValue = (inputValue as number) * (this.ratio / 100);
              subject[this.input_prop as keyof Subject] = outputValue as unknown as never;
            });
          }
        return { ctx, subjects };
    }
}