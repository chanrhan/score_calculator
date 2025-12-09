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

    constructor(blockId: number, caseIndex: number, headerData: any, bodyData: any) {
        super(blockId, caseIndex);
        this.variableScope = Number(headerData?.var_scope) || 0;
        this.conditions = bodyData?.exprs || [];
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
        if (this.variableScope == 0) {
            // Subject (과목) 범위
            const isConditionEqualToFilteredId = this.leftValue == 'filtered_block_id';
            subjects = subjects.filter(subject => {
                if(!isConditionEqualToFilteredId && subject.filtered_block_id > 0) {
                    return false;
                }
                let finalExpr = '';
                for(let i = 0; i < this.conditions.length; i++){
                    const expr = this.getConditionExpr(ctx, subject, i);
                    finalExpr += expr;
                }
                const result = evalExpr(finalExpr, { ctx, subjects, current: subject });
                calcLog(`        🔧 expr: [${finalExpr}] = ${result}`);
                if(result === true) {
                    if(isConditionEqualToFilteredId) {
                        subject.filtered_block_id = 0;
                    }
                    return true;
                }else{
                    return false;
                }
            });
        }

        if (this.variableScope == 1) {
            // Context (학생) 범위
            let leftValueValue = this.getContextProperty(ctx, this.leftValue as string);
            let finalExpr = '';
            for(let i = 0; i < this.conditions.length; i++){
                const expr = this.getConditionExpr(ctx, subjects[0], i);
                finalExpr += expr;
            }
            const result = evalExpr(finalExpr, { ctx, subjects });
            calcLog(`        🔧 expr: [${finalExpr}] = ${result}`);
            return { ctx, subjects: result ? subjects : [] };
        }
        return { ctx, subjects };
    }

    private getConditionExpr(ctx: Context, subject: Subject, index: number): string {
        const condition = this.conditions[index];
        let exprStartIndex = 0;
        if(index > 0){
            exprStartIndex = 1;
        }
        let leftValue = null;
        if(this.variableScope == 0){
            // Subject (과목) 범위
            leftValue = this.getSubjectProperty(subject, condition[exprStartIndex]);
        }else{
            // Context (학생) 범위
            leftValue = this.getContextProperty(ctx, condition[exprStartIndex]);
            leftValue = this.getSubjectProperty(subject, condition[exprStartIndex]);
        }
        const operator = condition[exprStartIndex + 1];
        const rightValue = condition[exprStartIndex + 2];
        const processedLeftValue = this.formatValueForExpr(leftValue);
        const processedRightValue = this.processRightValue(rightValue, ctx);

        if(index == 0){
            return `${processedLeftValue} ${operator} ${processedRightValue}`;
        }else{
            const logicalOperator = condition[0];
            return ` ${logicalOperator} (${processedLeftValue} ${operator} ${processedRightValue})`;
        }
    }
}       