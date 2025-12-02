import { AnyBlock, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { evalExpr } from "@/lib/dsl/eval";
import { calcLog } from "@/lib/utils/calcLogger";
import { BLOCK_TYPE } from "@/types/block-types";

export class ConditionBlockExecutor extends BlockExecutor {

    public override readonly type: number = BLOCK_TYPE.CONDITION;
    public override readonly name: string = "Condition";

    private conditions: Array<Array<string>>;
    private leftValue: string | null;
    private operator: string | null;
    private rightValue: string | null;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.conditions = bodyRowCells[0]?.[0] || [];
        this.leftValue = this.conditions?.[0]?.[0] || null;
        this.operator = this.conditions?.[0]?.[1] || null;
        this.rightValue = this.conditions?.[0]?.[2] || null;
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        let leftValueValue = this.getContextProperty(ctx, this.leftValue as string);

        if (leftValueValue != null) {
            const expr = `${leftValueValue} ${this.operator} ${this.rightValue}`;
            calcLog('      🔧 Condition 블록 실행(ctx) - expr: ' + expr);
            const result = evalExpr(expr, { ctx, subjects });
            return { ctx, subjects: result ? subjects : [] };
        }

        if (subjects.length > 0 && subjects[0][this.leftValue as keyof Subject] != null) {
            subjects = subjects.filter(subject => {
                const leftValueValue = subject[this.leftValue as keyof Subject];
                const expr = `${leftValueValue} ${this.operator} ${this.rightValue}`;
                calcLog('      🔧 Condition 블록 실행(subjects) - expr: ' + expr);
                const result = evalExpr(expr, { ctx, subjects, current: subject });
                return result === true;
            });
        }
        return { ctx, subjects };
    }
}       