import { AnyBlock, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { evalExpr } from "@/lib/dsl/eval";
import { calcLog } from "@/lib/utils/calcLogger";
import { replaceHashPatternsWithValues } from "@/lib/utils/stringPattern";
import { extractHashPatternContents } from "@/lib/utils/stringPattern";
import { BLOCK_TYPE } from "@/types/block-types";

export class ConditionBlockExecutor extends BlockExecutor {

    public override readonly type: number = BLOCK_TYPE.CONDITION;
    public override readonly name: string = "Condition";

    private variableScope: number;
    private conditions: Array<Array<string>>;
    private leftValue: string | null;
    private operator: string | null;
    private rightValue: string | null;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.variableScope = headerRowCells[0]?.[1] || 0;
        this.conditions = bodyRowCells[0]?.[0] || [];
        this.leftValue = this.conditions?.[0]?.[0] || null;
        this.operator = this.conditions?.[0]?.[1] || null;
        this.rightValue = this.conditions?.[0]?.[2] || null;
    }

    private formatValueForExpr(value: any): string {
        if (value === null || value === undefined) {
            return '0';
        }
        
        // 불리언 값 처리
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        
        // 숫자인 경우 그대로 반환
        if (typeof value === 'number') {
            return String(value);
        }
        
        // 문자열인 경우
        if (typeof value === 'string') {
            // 이미 문자열 리터럴로 감싸져 있는지 확인
            if ((value.startsWith("'") && value.endsWith("'")) || 
                (value.startsWith('"') && value.endsWith('"'))) {
                return value;
            }
            
            // 숫자로 변환 가능한지 확인
            const numValue = Number(value);
            if (!isNaN(numValue) && value.trim() === String(numValue)) {
                return String(numValue);
            }
            
            // 문자열 리터럴로 감싸기 (작은따옴표 이스케이프 처리)
            const escaped = value.replace(/'/g, "\\'");
            return `'${escaped}'`;
        }
        
        // 기타 타입은 문자열로 변환
        const str = String(value);
        const escaped = str.replace(/'/g, "\\'");
        return `'${escaped}'`;
    }

    private processRightValue(rightValue: string | null, ctx: Context, subject?: Subject): string {
        if (!rightValue) return '';
        
        // #{...} 패턴이 있는 경우 치환
        const vars = extractHashPatternContents(rightValue);
        if (vars.length > 0) {
            const values: any[] = vars.map(v => {
                let prop;
                if (subject) {
                    prop = this.getSubjectProperty(subject, v);
                } else {
                    prop = this.getContextProperty(ctx, v);
                }
                if(!prop || prop == 'null' || prop == 'undefined') return '0';
                return prop;
            });
            rightValue = replaceHashPatternsWithValues(rightValue, ...values);
        }
        
        // 값 포맷팅
        return this.formatValueForExpr(rightValue);
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        let leftValueValue = this.getContextProperty(ctx, this.leftValue as string);

        if (this.variableScope == 0) {
            const processedLeftValue = this.formatValueForExpr(leftValueValue);
            const processedRightValue = this.processRightValue(this.rightValue, ctx);
            const expr = `${processedLeftValue} ${this.operator} ${processedRightValue}`;
            const result = evalExpr(expr, { ctx, subjects });
            calcLog(`        🔧 expr: [${expr}] = ${result}`);
            return { ctx, subjects: result ? subjects : [] };
        }

        if (this.variableScope == 1) {
            const isConditionEqualToFilteredId = this.leftValue == 'filtered_block_id';
            subjects = subjects.filter(subject => {
                const leftValueValue = subject[this.leftValue as keyof Subject];
                
                const processedLeftValue = this.formatValueForExpr(leftValueValue);
                const processedRightValue = this.processRightValue(this.rightValue, ctx, subject);
                const expr = `${processedLeftValue} ${this.operator} ${processedRightValue}`;
                const result = evalExpr(expr, { ctx, subjects, current: subject });
                if(isConditionEqualToFilteredId && result === true) {
                    subject.filtered_block_id = 0;
                }
                calcLog(`        🔧 expr: [${expr}] = ${result}`);

                return result === true;
            });
        }
        return { ctx, subjects };
    }
}       