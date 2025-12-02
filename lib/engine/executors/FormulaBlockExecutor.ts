import { Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { calcLog } from "@/lib/utils/calcLogger";
import { evalExpr } from "@/lib/dsl/eval";
import { replaceHashPatternsWithValues } from "@/lib/utils/stringPattern";
import { extractHashPatternContents } from "@/lib/utils/stringPattern";
import { BLOCK_TYPE } from "@/types/block-types";

export class FormulaBlockExecutor extends BlockExecutor {
    public override readonly type: number = BLOCK_TYPE.FORMULA;
    public override readonly name: string = "Formula";

    private scoreType: string;
    private expr: string;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.scoreType = bodyRowCells[0]?.[0] || null;
        this.expr = bodyRowCells[0]?.[2] || null;
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        const vars: string[] = extractHashPatternContents(this.expr);
        const values: string[] = [];
        vars.forEach(v => {
            const value = this.getContextProperty(ctx, v);
            values.push(value);
        });

        const replacedExpr = replaceHashPatternsWithValues(this.expr, ...values);

        const v = evalExpr(replacedExpr, { ctx, subjects });
        this.setContextProperty(ctx, subjects, this.scoreType, v as unknown as never);
        calcLog(`expr: ${replacedExpr}, result: ${v}`);

        return { ctx, subjects };
    }
}