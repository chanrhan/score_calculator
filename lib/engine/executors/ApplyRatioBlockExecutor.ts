import { BlockExecutor } from "./BlockExecutor";
import { Context, Subject } from "@/types/domain";
import { BLOCK_TYPE } from "@/types/block-types";

export class ApplyRatioBlockExecutor extends BlockExecutor {
    
    public override readonly type: number = BLOCK_TYPE.RATIO;
    public override readonly name: string = "Ratio";

    private variableScope: number;
    private ratio: number;
    private input_prop: string | null;

    constructor(blockId: number, caseIndex: number, headerData: any, bodyData: any) {
        super(blockId, caseIndex);
        this.variableScope = Number(headerData?.var_scope) || 0;
        this.ratio = Number(bodyData?.ratio) || 0;
        this.input_prop = bodyData?.input_prop || 'finalScore';
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        if (this.variableScope == 0) {
            // Subject (과목) 범위
            if (this.input_prop) {
                subjects.forEach(subject => {
                    if (subject.filtered_block_id > 0) {
                        return;
                    }
                    const inputValue = this.getSubjectProperty(subject, this.input_prop as string);
                    const outputValue = (Number(inputValue) || 0) * (this.ratio / 100);
                    subject[this.input_prop as keyof Subject] = outputValue as unknown as never;
                });
            }
        } else if (this.variableScope == 1) {
            // Context (학생) 범위
            if (this.input_prop == 'finalScore') {
                ctx.finalScore = ctx.finalScore * (this.ratio / 100);
            } else if (this.input_prop) {
                const inputValue = this.getContextProperty(ctx, this.input_prop);
                const outputValue = (Number(inputValue) || 0) * (this.ratio / 100);
                this.setContextProperty(ctx, subjects, this.input_prop, outputValue);
            }
        }
        return { ctx, subjects };
    }
}