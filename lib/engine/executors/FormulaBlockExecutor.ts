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

    private variableScope: number;
    private scoreType: string | null;
    private expr: string | null;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.variableScope = headerRowCells[0]?.[1] || 0;
        this.scoreType = bodyRowCells[0]?.[0] || null;
        this.expr = bodyRowCells[0]?.[2] || null;
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        const vars: string[] = extractHashPatternContents(this.expr as string);

        calcLog(`        🔧 org expr: (${this.expr})`);
        if(this.variableScope == 0) {
            // Context
            const values: any[] = vars.map(v => this.getContextProperty(ctx, v) || '0');
            const replacedExpr = replaceHashPatternsWithValues(this.expr as string, ...values);
            const v = evalExpr(replacedExpr, { ctx, subjects });
            this.setContextProperty(ctx, subjects, this.scoreType as string, v as unknown as never);
            calcLog(`        🔧 new expr: [${replacedExpr}] = ${v}`);
        } else if(this.variableScope == 1) {
            // for Each Subject
            subjects.forEach(subject => {
                const values: any[] = vars.map(v => this.getSubjectProperty(subject, v) || '0');
                const replacedExpr = replaceHashPatternsWithValues(this.expr as string, ...values);
                const v = evalExpr(replacedExpr, { ctx, subjects, current: subject });
                subject[this.scoreType as keyof Subject] = v as unknown as never;
                calcLog(`        🔧 new expr: [${replacedExpr}] = ${v}`);
            });
        } 


        return { ctx, subjects };
    }
}