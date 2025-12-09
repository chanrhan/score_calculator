import { CalculationLog, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { calcLog } from "@/lib/utils/calcLogger";
import { isEmpty } from "@/lib/utils/validationUtils";
import { CalculationLogManager } from "./CalculationLogManager";

export class ScoreTableBlockExecutor extends BlockExecutor {
    public override readonly type: number = 8;
    public override readonly name: string = "ScoreTable";

    private variableScope: number;
    private filterOption: number;
    private inputType: string;
    private inputRange: number;
    private outputType: string;
    private table: Array<Array<string>>;
    private matchedCount: number = 0;

    constructor(blockId: number, caseIndex: number, headerData: any, bodyData: any) {
        super(blockId, caseIndex);
        this.variableScope = Number(headerData?.var_scope) || 0;
        this.filterOption = 0; // filter_option은 instance에 없으므로 기본값 0
        this.inputType = bodyData?.input_prop || null;
        this.inputRange = -1; // input_range는 instance에 없으므로 기본값 -1
        this.outputType = bodyData?.output_prop || null;
        this.table = bodyData?.table || null;
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        const logManager = new CalculationLogManager();
        let inputValue: any = null;
        let log: CalculationLog;
        if(this.variableScope == 0) {
            inputValue = this.getContextProperty(ctx, this.inputType);
            log = {
                input_key: this.inputType,
                input: inputValue,
                output_key: this.outputType,
                output: null
            };
            const {matched, matchedValue} = this.mappingScore(inputValue);
            if(matched) {
                log.output = matchedValue;
                this.setContextProperty(ctx, subjects, this.outputType, matchedValue);
            }
            logManager.addContextLog(log);
            logManager.saveContextToSnapshot(ctx, this.blockId, this.caseIndex, 8);
        }else if(this.variableScope == 1) {
            subjects.forEach(subject => {
                inputValue = this.getSubjectProperty(subject, this.inputType);
                log = {
                    input_key: this.inputType,
                    input: inputValue,
                    output_key: this.outputType,
                    output: null
                };
                const {matched, matchedValue} = this.mappingScore(inputValue);
                if(matched) {
                    log.output = matchedValue;
                    subject[this.outputType as keyof Subject] = matchedValue as unknown as never;
                    // calcLog(`        ✅ save check : ${this.outputType} : ${subject[this.outputType as keyof Subject]}`);
                }else{
                    if (this.filterOption == 1) {
                        subject.filtered_block_id = this.blockId;
                    }
                }
                logManager.addLog(subject.seqNumber, log);
            });
            logManager.saveToSnapshot(subjects, this.blockId, this.caseIndex, 8);
        }

        calcLog(` 매핑된 과목들 : (${this.matchedCount}/${subjects.length})개`);
        calcLog(`필터링된 과목들 : ${subjects.filter(subject => subject.filtered_block_id > 0).length}개`);
        // calcLog(subjects.map(s => s.filtered_block_id));
        return { ctx, subjects };
    }

    private mappingScore(inputValue: any) : {matched: boolean, matchedValue: any} {
        if (isEmpty(inputValue)) {
            return {matched: false, matchedValue: "빈 값"};
        } else {
            let matched: boolean = false;
            let matchedValue : any = null;

            // 홀수 행(0, 2, 4, ...)을 입력 행으로, 바로 아래 짝수 행(1, 3, 5, ...)을 출력 행으로 사용
            for (let row = 0; row < this.table.length - 1; row += 2) {
                const inputRow = this.table[row];
                const outputRow = this.table[row + 1];
                
                if (!inputRow || !outputRow) {
                    continue;
                }

                for (let c = 0; c < inputRow.length; c++) {
                    const input = inputRow[c];
                    const output = outputRow[c];

                    if(!input || !output) {
                        continue;
                    }
                    
                    if (inputValue as number && this.inputRange == 1) {
                        const rangeInfo = this.parseRange(input);
                        if (rangeInfo) {
                            const { start, end, includeStart, includeEnd } = rangeInfo;
                            const numValue = Number(inputValue);
                            
                            // start가 -Infinity가 아니면 시작값 비교
                            const startMatch = start === -Infinity || (includeStart ? numValue >= start : numValue > start);
                            // end가 Infinity가 아니면 끝값 비교
                            const endMatch = end === Infinity || (includeEnd ? numValue <= end : numValue < end);
                            
                            if (startMatch && endMatch) {
                                matched = true;
                            }
                        }
                    } else if (this.inputRange == 0) {
                        if (inputValue == input) {
                            matched = true;
                        }
                        
                    }
                    if (matched) {
                        this.matchedCount++;
                        calcLog(`        ✅ ${inputValue} -> ${output}`);
                        matchedValue = output;
                        break;
                    }
                }
                
                if (matched) {
                    break;
                }
            }
            return {matched: matched, matchedValue: matchedValue};
        }
    }

    /**
     * 범위 문자열을 파싱하여 시작값, 끝값, 포함 여부를 반환
     * @param rangeStr 범위 문자열 
     *   - 양쪽 범위: "80-100", "[80-100]", "(80-100]", "[80-100)", "(80-100)"
     *   - 시작값만: "80-", "[80-", "(80-"
     *   - 끝값만: "-80", "-80]", "-80)"
     * @returns 파싱된 범위 정보 또는 null
     */
    private parseRange(rangeStr: string): { start: number; end: number; includeStart: boolean; includeEnd: boolean } | null {
        if (!rangeStr || typeof rangeStr !== 'string') {
            return null;
        }

        const trimmed = rangeStr.trim();
        
        // 양쪽 범위 - 괄호 형식: [80-100], (80-100], [80-100), (80-100)
        const bracketMatch = trimmed.match(/^([\[\(])(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)([\]\)])$/);
        if (bracketMatch) {
            const startBracket = bracketMatch[1];
            const start = parseFloat(bracketMatch[2]);
            const end = parseFloat(bracketMatch[3]);
            const endBracket = bracketMatch[4];
            
            return {
                start,
                end,
                includeStart: startBracket === '[',
                includeEnd: endBracket === ']'
            };
        }
        
        // 양쪽 범위 - 기존 형식: 80-100 (양 끝 포함이 기본값)
        const simpleMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
        if (simpleMatch) {
            const start = parseFloat(simpleMatch[1]);
            const end = parseFloat(simpleMatch[2]);
            
            return {
                start,
                end,
                includeStart: true,  // 기본값: 양 끝 포함
                includeEnd: true     // 기본값: 양 끝 포함
            };
        }
        
        // 시작값만 - 괄호 형식: [80-, (80-
        const startOnlyBracketMatch = trimmed.match(/^([\[\(])(\d+(?:\.\d+)?)\s*-\s*$/);
        if (startOnlyBracketMatch) {
            const startBracket = startOnlyBracketMatch[1];
            const start = parseFloat(startOnlyBracketMatch[2]);
            
            return {
                start,
                end: Infinity,
                includeStart: startBracket === '[',
                includeEnd: true  // end가 Infinity이므로 항상 true
            };
        }
        
        // 시작값만 - 기존 형식: 80- (80 이상)
        const startOnlyMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*-\s*$/);
        if (startOnlyMatch) {
            const start = parseFloat(startOnlyMatch[1]);
            
            return {
                start,
                end: Infinity,
                includeStart: true,  // 기본값: 포함
                includeEnd: true
            };
        }
        
        // 끝값만 - 괄호 형식: -80], -80)
        const endOnlyBracketMatch = trimmed.match(/^-\s*(\d+(?:\.\d+)?)([\]\)])$/);
        if (endOnlyBracketMatch) {
            const end = parseFloat(endOnlyBracketMatch[1]);
            const endBracket = endOnlyBracketMatch[2];
            
            return {
                start: -Infinity,
                end,
                includeStart: true,  // start가 -Infinity이므로 항상 true
                includeEnd: endBracket === ']'
            };
        }
        
        // 끝값만 - 기존 형식: -80 (80 이하)
        const endOnlyMatch = trimmed.match(/^-\s*(\d+(?:\.\d+)?)$/);
        if (endOnlyMatch) {
            const end = parseFloat(endOnlyMatch[1]);
            
            return {
                start: -Infinity,
                end,
                includeStart: true,
                includeEnd: true  // 기본값: 포함
            };
        }
        
        return null;
    }
}           